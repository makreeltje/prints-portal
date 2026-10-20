import type { FastifyInstance, FastifyReply, FastifyRequest } from 'fastify';
import { scopeAllows, sessionScope } from '../auth/access.js';
import { TAG_PALETTE, TagNameError, type TagPaletteKey } from '../core/tags.js';
import type { AppDatabase } from '../db/connection.js';
import type { Role } from '../db/schema.js';
import type { Indexer } from '../indexing/indexer.js';
import type { LiveEvent, RealtimeHub } from '../realtime/hub.js';
import type { ThumbnailService } from '../thumbnails/service.js';
import { REQUEST_STATES, parseRequestState } from '../finance/state.js';
import { sendPrintFile } from './files.js';
import { queue } from './queue.js';
import { createRequest, deleteRequest, linkRequest, RequestError } from './requests.js';
import {
  createTag,
  deleteCustomer,
  deletePrint,
  MAX_NOTE_LENGTH,
  PrintFieldError,
  setPrintNote,
  setPrintSource,
  deleteTag,
  listTags,
  restoreCustomer,
  restorePrint,
  setPrintTags,
  TagConflictError,
  UnknownTagError,
  updateTag,
} from './mutations.js';
import {
  customerOfPrint,
  getPrintDetail,
  listCustomers,
  listPrints,
  MAX_PAGE_SIZE,
  PRINT_SORTS,
  PRINT_STATUS_FILTERS,
  type PrintSort,
  type PrintStatusFilter,
} from './queries.js';

export interface PrintRouteDependencies {
  db: AppDatabase;
  printsRoot: string;
  indexer: Indexer;
  hub: RealtimeHub;
  thumbnails: ThumbnailService;
  now: () => Date;
}

/** Owner decisions (M5): Admins and Editors delete and tag; only Admins restore. */
const MANAGE: readonly Role[] = ['Admin', 'Editor'];
const ADMIN: readonly Role[] = ['Admin'];

const UUID_PARAM = { type: 'string', pattern: '^[0-9a-fA-F-]{36}$' } as const;

const idParams = {
  type: 'object',
  required: ['id'],
  properties: { id: UUID_PARAM },
} as const;
const folderParams = {
  type: 'object',
  required: ['folder'],
  properties: { folder: { type: 'string', minLength: 1, maxLength: 255 } },
} as const;
const tagBody = {
  type: 'object',
  additionalProperties: false,
  properties: {
    name: { type: 'string', minLength: 1, maxLength: 200 },
    // New colours are palette keys only (design system v1.3); null clears the colour.
    // A union, not anyOf: with type coercion anyOf would turn null into "".
    colour: { type: ['string', 'null'], enum: [...TAG_PALETTE, null] },
  },
} as const;

export function registerPrintRoutes(app: FastifyInstance, deps: PrintRouteDependencies): void {
  const { db, hub, indexer, now } = deps;

  const sessionUser = (request: FastifyRequest) => {
    if (request.auth === null) throw new Error('session missing after guard');
    return request.auth.user;
  };
  const scopeOf = (request: FastifyRequest) => {
    if (request.auth === null) throw new Error('session missing after guard');
    return sessionScope(db, request.auth);
  };
  const isAdmin = (request: FastifyRequest) => sessionUser(request).role === 'Admin';
  const broadcast = (type: LiveEvent['type'], printId: string, customerFolder: string) => {
    hub.broadcast({ type, printId, customerFolder });
  };

  /**
   * Loads the print and checks the caller may see its customer.
   * Unknown → 404; another customer's print → 403 (the UI shows the 403 page).
   */
  async function authorise(
    request: FastifyRequest,
    reply: FastifyReply,
    id: string,
  ): Promise<{ customerFolder: string } | null> {
    const print = await customerOfPrint(db, id);
    if (print === null || (print.status === 'deleted' && !isAdmin(request))) {
      await reply.code(404).send({ error: 'not_found' });
      return null;
    }
    if (!scopeAllows(await scopeOf(request), print.customerFolder)) {
      await reply.code(403).send({ error: 'no_access' });
      return null;
    }
    return print;
  }

  app.get<{ Querystring: { archived?: boolean; deleted?: boolean } }>(
    '/api/customers',
    {
      schema: {
        querystring: {
          type: 'object',
          properties: { archived: { type: 'boolean' }, deleted: { type: 'boolean' } },
        },
      },
    },
    async (request) => ({
      customers: await listCustomers(db, await scopeOf(request), {
        includeArchived: request.query.archived === true,
        includeDeleted: request.query.deleted === true && isAdmin(request),
        withMoney: sessionUser(request).role !== 'User',
      }),
    }),
  );

  app.get<{
    Querystring: {
      customer?: string;
      tag?: string[];
      q?: string;
      archived?: boolean;
      deleted?: boolean;
      offset?: number;
      limit?: number;
      sort?: PrintSort;
      status?: PrintStatusFilter;
    };
  }>(
    '/api/prints',
    {
      schema: {
        querystring: {
          type: 'object',
          properties: {
            customer: { type: 'string', maxLength: 255 },
            tag: { type: 'array', items: { type: 'string', maxLength: 36 }, maxItems: 20 },
            q: { type: 'string', maxLength: 200 },
            archived: { type: 'boolean' },
            deleted: { type: 'boolean' },
            offset: { type: 'integer', minimum: 0 },
            limit: { type: 'integer', minimum: 1, maximum: MAX_PAGE_SIZE },
            sort: { type: 'string', enum: [...PRINT_SORTS] },
            status: { type: 'string', enum: [...PRINT_STATUS_FILTERS] },
          },
        },
      },
    },
    async (request) => {
      const { query } = request;
      return listPrints(db, await scopeOf(request), {
        customer: query.customer,
        tagIds: query.tag,
        search: query.q,
        includeArchived: query.archived === true,
        includeDeleted: query.deleted === true && isAdmin(request),
        offset: query.offset,
        limit: query.limit,
        sort: query.sort,
        status: query.status,
        withCost: sessionUser(request).role !== 'User',
      });
    },
  );

  app.get<{ Params: { id: string } }>(
    '/api/prints/:id',
    { schema: { params: idParams } },
    async (request, reply) => {
      if ((await authorise(request, reply, request.params.id)) === null) return reply;
      const role = sessionUser(request).role;
      const detail = await getPrintDetail(db, request.params.id, {
        includeDeleted: role === 'Admin',
        // Users see name, price and status, thumbnail, model and tags; no files (owner decision).
        withAssets: role !== 'User',
      });
      if (detail === null) return reply.code(404).send({ error: 'not_found' });
      return detail;
    },
  );

  app.get<{ Params: { id: string } }>(
    '/api/prints/:id/thumbnail',
    { schema: { params: idParams } },
    async (request, reply) => {
      if ((await authorise(request, reply, request.params.id)) === null) return reply;
      const thumbnail = await deps.thumbnails.get(request.params.id);
      if (thumbnail === null) return reply.code(404).send({ error: 'no_thumbnail' });
      reply.header('etag', thumbnail.etag).header('cache-control', 'private, max-age=60');
      if (request.headers['if-none-match'] === thumbnail.etag) return reply.code(304).send();
      return reply.type(thumbnail.contentType).send(thumbnail.data);
    },
  );

  /**
   * The preview of one model file. The strip on a print detail draws these, so
   * two buttons of the same print no longer look identical: until now the only
   * picture was the print's own, one per print record, and every button in the
   * strip carried the same generic glyph (GAP-094).
   *
   * 404 is the ordinary answer, not an error: a model that cannot give a
   * picture keeps the type glyph.
   */
  app.get<{ Params: { id: string }; Querystring: { asset?: string } }>(
    '/api/prints/:id/model-thumbnail',
    {
      schema: {
        params: idParams,
        querystring: { type: 'object', properties: { asset: UUID_PARAM }, required: ['asset'] },
      },
    },
    async (request, reply) => {
      if ((await authorise(request, reply, request.params.id)) === null) return reply;
      const asset = request.query.asset ?? '';
      const thumbnail = await deps.thumbnails.getForAsset(request.params.id, asset);
      if (thumbnail === null) return reply.code(404).send({ error: 'no_thumbnail' });
      reply.header('etag', thumbnail.etag).header('cache-control', 'private, max-age=60');
      if (request.headers['if-none-match'] === thumbnail.etag) return reply.code(304).send();
      return reply.type(thumbnail.contentType).send(thumbnail.data);
    },
  );

  /**
   * The viewer's model. Without `asset` the first by file name, which is the
   * one the thumbnail is rendered from; with it, that model of this print
   * (ModelPicker 1.9, GAP-086). Users may see it (owner decision).
   */
  app.get<{ Params: { id: string }; Querystring: { asset?: string } }>(
    '/api/prints/:id/model',
    {
      schema: {
        params: idParams,
        querystring: { type: 'object', properties: { asset: UUID_PARAM } },
      },
    },
    async (request, reply) => {
      if ((await authorise(request, reply, request.params.id)) === null) return reply;
      let query = db
        .selectFrom('print_assets')
        .select(['relative_path', 'file_name', 'type'])
        .where('print_record_id', '=', request.params.id)
        .where('type', 'in', ['stl', '3mf']);
      query =
        request.query.asset === undefined
          ? query.orderBy('file_name')
          : query.where('id', '=', request.query.asset);
      const model = await query.executeTakeFirst();
      if (model === undefined) return reply.code(404).send({ error: 'no_model' });
      return sendPrintFile(request, reply, deps.printsRoot, model.relative_path, {
        download: false,
        fileName: model.file_name,
      });
    },
  );

  /**
   * The viewer's timelapse: that video of this print, played in place. Every
   * role that may see the print may watch it (GAP-175, the owner's answer);
   * `/api/assets/:id/download` stays MANAGE, so a klant watches the film of
   * their own print without being able to save anything from the folder.
   */
  app.get<{ Params: { id: string }; Querystring: { asset?: string } }>(
    '/api/prints/:id/video',
    {
      schema: {
        params: idParams,
        querystring: { type: 'object', properties: { asset: UUID_PARAM } },
      },
    },
    async (request, reply) => {
      if ((await authorise(request, reply, request.params.id)) === null) return reply;
      let query = db
        .selectFrom('print_assets')
        .select(['relative_path', 'file_name'])
        .where('print_record_id', '=', request.params.id)
        .where('type', '=', 'video');
      query =
        request.query.asset === undefined
          ? query.orderBy('file_name')
          : query.where('id', '=', request.query.asset);
      const video = await query.executeTakeFirst();
      if (video === undefined) return reply.code(404).send({ error: 'no_video' });
      return sendPrintFile(request, reply, deps.printsRoot, video.relative_path, {
        download: false,
        fileName: video.file_name,
      });
    },
  );

  app.get<{ Params: { id: string } }>(
    '/api/assets/:id/download',
    { config: { auth: MANAGE }, schema: { params: idParams } },
    async (request, reply) => {
      const asset = await db
        .selectFrom('print_assets')
        .select(['relative_path', 'file_name', 'print_record_id'])
        .where('id', '=', request.params.id)
        .executeTakeFirst();
      if (asset === undefined) return reply.code(404).send({ error: 'not_found' });
      if ((await authorise(request, reply, asset.print_record_id)) === null) return reply;
      return sendPrintFile(request, reply, deps.printsRoot, asset.relative_path, {
        download: true,
        fileName: asset.file_name,
      });
    },
  );

  app.delete<{ Params: { id: string } }>(
    '/api/prints/:id',
    { config: { auth: MANAGE }, schema: { params: idParams } },
    async (request, reply) => {
      if ((await authorise(request, reply, request.params.id)) === null) return reply;
      const deleted = await deletePrint(db, request.params.id, sessionUser(request).id, now());
      if (deleted === null) return reply.code(404).send({ error: 'not_found' });
      broadcast('print:deleted', request.params.id, deleted.customerFolder);
      return reply.code(204).send();
    },
  );

  app.post<{ Params: { id: string } }>(
    '/api/prints/:id/restore',
    { config: { auth: ADMIN }, schema: { params: idParams } },
    async (request, reply) => {
      const restored = await restorePrint(db, request.params.id, now());
      if (restored === null) return reply.code(404).send({ error: 'not_deleted' });
      // Re-index: archives it again when its folder is gone, refreshes it otherwise.
      await indexer.indexProject(restored);
      broadcast('print:updated', request.params.id, restored.customerFolder);
      return reply.code(204).send();
    },
  );

  app.delete<{ Params: { folder: string } }>(
    '/api/customers/:folder',
    { config: { auth: MANAGE }, schema: { params: folderParams } },
    async (request, reply) => {
      const { folder } = request.params;
      if (!scopeAllows(await scopeOf(request), folder)) {
        return reply.code(403).send({ error: 'no_access' });
      }
      const ids = await deleteCustomer(db, folder, sessionUser(request).id, now());
      if (ids.length === 0) return reply.code(404).send({ error: 'not_found' });
      for (const id of ids) broadcast('print:deleted', id, folder);
      return { deleted: ids.length };
    },
  );

  app.post<{ Params: { folder: string } }>(
    '/api/customers/:folder/restore',
    { config: { auth: ADMIN }, schema: { params: folderParams } },
    async (request, reply) => {
      const { folder } = request.params;
      const restored = await restoreCustomer(db, folder, now());
      if (restored.length === 0) return reply.code(404).send({ error: 'not_deleted' });
      for (const { id, projectFolder } of restored) {
        await indexer.indexProject({ customerFolder: folder, projectFolder });
        broadcast('print:updated', id, folder);
      }
      return { restored: restored.length };
    },
  );

  /**
   * "Bron" and "Notitie" (PrintSource, PrintNote). Both are fields on the
   * print record, so a request carries them before its folder exists.
   *
   * Clearing is saving null; neither has a remove route, because absence is a
   * value and not a separate act (GAP-138).
   */
  app.put<{ Params: { id: string }; Body: { url: string | null } }>(
    '/api/prints/:id/source',
    {
      config: { auth: MANAGE },
      schema: {
        params: idParams,
        body: {
          type: 'object',
          required: ['url'],
          properties: { url: { type: ['string', 'null'], maxLength: 2048 } },
        },
      },
    },
    async (request, reply) => {
      const url =
        request.body.url === null || request.body.url.trim() === ''
          ? null
          : request.body.url.trim();
      try {
        if (!(await setPrintSource(db, request.params.id, url, now()))) {
          return await reply.code(404).send({ error: 'not_found' });
        }
      } catch (error) {
        if (error instanceof PrintFieldError) {
          return reply.code(422).send({ error: error.message });
        }
        throw error;
      }
      broadcast('print:updated', request.params.id, '');
      return reply.code(204).send();
    },
  );

  app.put<{ Params: { id: string }; Body: { note: string | null } }>(
    '/api/prints/:id/note',
    {
      config: { auth: MANAGE },
      schema: {
        params: idParams,
        body: {
          type: 'object',
          required: ['note'],
          properties: { note: { type: ['string', 'null'], maxLength: MAX_NOTE_LENGTH } },
        },
      },
    },
    async (request, reply) => {
      const note =
        request.body.note === null || request.body.note.trim() === '' ? null : request.body.note;
      try {
        if (!(await setPrintNote(db, request.params.id, note, now()))) {
          return await reply.code(404).send({ error: 'not_found' });
        }
      } catch (error) {
        if (error instanceof PrintFieldError) {
          return reply.code(422).send({ error: error.message });
        }
        throw error;
      }
      broadcast('print:updated', request.params.id, '');
      return reply.code(204).send();
    },
  );

  /** Wachtrij: work asked for and not finished (ScreenQueue 2.10). */
  app.get('/api/queue', { config: { auth: MANAGE } }, async () => ({
    groups: await queue(db, now().toISOString()),
  }));

  /**
   * A request: a print asked for before any folder exists for it. The only
   * place besides the indexer that creates a record, which is why it is
   * marked `origin: 'request'` — see requests.ts.
   */
  app.post<{ Body: { customer: string; name: string; state?: string | null } }>(
    '/api/requests',
    {
      config: { auth: MANAGE },
      schema: {
        body: {
          type: 'object',
          required: ['customer', 'name'],
          properties: {
            customer: { type: 'string', minLength: 1, maxLength: 200 },
            name: { type: 'string', minLength: 1, maxLength: 200 },
            state: { type: ['string', 'null'], enum: [...REQUEST_STATES, null] },
          },
        },
      },
    },
    async (request, reply) => {
      try {
        const made = await createRequest(
          db,
          {
            customerFolder: request.body.customer,
            name: request.body.name,
            // A request with nothing said about it is "nog niet besloten":
            // that is what asking for something means before an answer.
            state: parseRequestState(request.body.state ?? null) ?? 'undecided',
          },
          now().toISOString(),
        );
        broadcast('print:updated', made.id, made.customer_folder);
        return await reply.code(201).send({ id: made.id });
      } catch (error) {
        if (error instanceof RequestError) {
          return reply.code(422).send({ error: error.message });
        }
        throw error;
      }
    },
  );

  /**
   * "Aanvraag verwijderen": the ending of a request that never got files
   * (ScreenQueue 2.14, GAP-159). The dialog that offers it is the only place a
   * fileless record appears, and the two other status values would leave it
   * alive here and absent from every screen.
   */
  app.delete<{ Params: { id: string } }>(
    '/api/requests/:id',
    { config: { auth: MANAGE }, schema: { params: idParams } },
    async (request, reply) => {
      const record = await customerOfPrint(db, request.params.id);
      try {
        await deleteRequest(db, request.params.id);
      } catch (error) {
        if (error instanceof RequestError) {
          return reply
            .code(error.message === 'not_found' ? 404 : 422)
            .send({ error: error.message });
        }
        throw error;
      }
      broadcast('print:deleted', request.params.id, record?.customerFolder ?? '');
      return reply.code(204).send();
    },
  );

  /** "Bestanden koppelen": the folder has appeared; point the request at it. */
  app.post<{ Params: { id: string }; Body: { printId: string } }>(
    '/api/requests/:id/link',
    {
      config: { auth: MANAGE },
      schema: {
        params: idParams,
        body: { type: 'object', required: ['printId'], properties: { printId: UUID_PARAM } },
      },
    },
    async (request, reply) => {
      try {
        await linkRequest(db, request.params.id, request.body.printId, now().toISOString());
      } catch (error) {
        if (error instanceof RequestError) {
          return reply.code(422).send({ error: error.message });
        }
        throw error;
      }
      await indexer.recalculateRecord(request.body.printId);
      broadcast('print:updated', request.body.printId, '');
      return reply.code(204).send();
    },
  );

  app.get('/api/tags', async () => ({ tags: await listTags(db) }));

  app.post<{ Body: { name: string; colour?: TagPaletteKey | null } }>(
    '/api/tags',
    {
      config: { auth: MANAGE },
      schema: { body: { ...tagBody, required: ['name'] } },
    },
    async (request, reply) => {
      try {
        return await reply.code(201).send(await createTag(db, request.body, now()));
      } catch (error) {
        return tagError(reply, error);
      }
    },
  );

  app.patch<{ Params: { id: string }; Body: { name?: string; colour?: TagPaletteKey | null } }>(
    '/api/tags/:id',
    { config: { auth: MANAGE }, schema: { params: idParams, body: tagBody } },
    async (request, reply) => {
      try {
        const tag = await updateTag(db, request.params.id, request.body);
        if (tag === null) return await reply.code(404).send({ error: 'not_found' });
        await broadcastTagged(db, request.params.id, broadcast);
        return tag;
      } catch (error) {
        return tagError(reply, error);
      }
    },
  );

  app.delete<{ Params: { id: string } }>(
    '/api/tags/:id',
    { config: { auth: MANAGE }, schema: { params: idParams } },
    async (request, reply) => {
      const prints = await deleteTag(db, request.params.id);
      if (prints === null) return reply.code(404).send({ error: 'not_found' });
      for (const print of prints) {
        const owner = await customerOfPrint(db, print);
        if (owner !== null) broadcast('print:updated', print, owner.customerFolder);
      }
      return reply.code(204).send();
    },
  );

  app.put<{ Params: { id: string }; Body: { tagIds: string[] } }>(
    '/api/prints/:id/tags',
    {
      config: { auth: MANAGE },
      schema: {
        params: idParams,
        body: {
          type: 'object',
          required: ['tagIds'],
          additionalProperties: false,
          properties: {
            tagIds: { type: 'array', maxItems: 50, items: { type: 'string', maxLength: 36 } },
          },
        },
      },
    },
    async (request, reply) => {
      const print = await authorise(request, reply, request.params.id);
      if (print === null) return reply;
      try {
        await setPrintTags(db, request.params.id, request.body.tagIds, now());
      } catch (error) {
        if (error instanceof UnknownTagError) {
          return reply.code(400).send({ error: 'unknown_tag' });
        }
        throw error;
      }
      broadcast('print:updated', request.params.id, print.customerFolder);
      return reply.code(204).send();
    },
  );

  // Full re-index of the prints folder (Instellingen, "Opnieuw indexeren").
  app.post<{ Body: { force?: boolean; wait?: boolean } | undefined }>(
    '/api/admin/reindex',
    {
      config: { auth: ADMIN },
      schema: {
        body: {
          anyOf: [
            {
              type: 'object',
              additionalProperties: false,
              properties: { force: { type: 'boolean' }, wait: { type: 'boolean' } },
            },
            { type: 'null' },
          ],
        },
      },
    },
    async (request, reply) => {
      const force = request.body?.force === true;
      // "Opnieuw indexeren" in Instellingen waits for the summary to say "Klaar.".
      if (request.body?.wait === true) {
        const summary = await indexer.indexAll(force);
        return reply.code(200).send({ started: true, summary });
      }
      indexer.indexAll(force).then(
        (summary) => {
          request.log.info({ summary, force }, 'reindex finished');
        },
        (error: unknown) => {
          request.log.error({ err: error }, 'reindex failed');
        },
      );
      return reply.code(202).send({ started: true });
    },
  );
}

async function broadcastTagged(
  db: AppDatabase,
  tagId: string,
  broadcast: (type: LiveEvent['type'], printId: string, customerFolder: string) => void,
): Promise<void> {
  const rows = await db
    .selectFrom('print_tags')
    .innerJoin('print_records', 'print_records.id', 'print_tags.print_record_id')
    .select(['print_records.id', 'print_records.customer_folder'])
    .where('print_tags.tag_id', '=', tagId)
    .execute();
  for (const row of rows) broadcast('print:updated', row.id, row.customer_folder);
}

function tagError(reply: FastifyReply, error: unknown): FastifyReply {
  if (error instanceof TagConflictError) return reply.code(409).send({ error: 'tag_exists' });
  if (error instanceof TagNameError) return reply.code(400).send({ error: 'invalid_tag_name' });
  throw error;
}
