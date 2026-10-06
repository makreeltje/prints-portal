import type { FastifyInstance, FastifyReply, FastifyRequest } from 'fastify';
import { customerScope, scopeAllows } from '../auth/access.js';
import { TAG_PALETTE, TagNameError, type TagPaletteKey } from '../core/tags.js';
import type { AppDatabase } from '../db/connection.js';
import type { Role } from '../db/schema.js';
import type { Indexer } from '../indexing/indexer.js';
import type { LiveEvent, RealtimeHub } from '../realtime/hub.js';
import type { ThumbnailService } from '../thumbnails/service.js';
import { sendPrintFile } from './files.js';
import {
  createTag,
  deleteCustomer,
  deletePrint,
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

const idParams = {
  type: 'object',
  required: ['id'],
  properties: { id: { type: 'string', pattern: '^[0-9a-fA-F-]{36}$' } },
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
    colour: { anyOf: [{ type: 'string', enum: TAG_PALETTE }, { type: 'null' }] },
  },
} as const;

export function registerPrintRoutes(app: FastifyInstance, deps: PrintRouteDependencies): void {
  const { db, hub, indexer, now } = deps;

  const sessionUser = (request: FastifyRequest) => {
    if (request.auth === null) throw new Error('session missing after guard');
    return request.auth.user;
  };
  const scopeOf = (request: FastifyRequest) => customerScope(db, sessionUser(request));
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

  // The 3D viewer's model: newest STL, else newest 3MF. Users may see it (owner decision).
  app.get<{ Params: { id: string } }>(
    '/api/prints/:id/model',
    { schema: { params: idParams } },
    async (request, reply) => {
      if ((await authorise(request, reply, request.params.id)) === null) return reply;
      const model = await db
        .selectFrom('print_assets')
        .select(['relative_path', 'file_name', 'type'])
        .where('print_record_id', '=', request.params.id)
        .where('type', 'in', ['stl', '3mf'])
        .orderBy('type', 'desc') // 'stl' before '3mf'
        .orderBy('last_write_utc', 'desc')
        .executeTakeFirst();
      if (model === undefined) return reply.code(404).send({ error: 'no_model' });
      return sendPrintFile(request, reply, deps.printsRoot, model.relative_path, {
        download: false,
        fileName: model.file_name,
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
  app.post<{ Body: { force?: boolean } | undefined }>(
    '/api/admin/reindex',
    {
      config: { auth: ADMIN },
      schema: {
        body: {
          anyOf: [
            {
              type: 'object',
              additionalProperties: false,
              properties: { force: { type: 'boolean' } },
            },
            { type: 'null' },
          ],
        },
      },
    },
    async (request, reply) => {
      const force = request.body?.force === true;
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
