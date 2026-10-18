import { readFile } from 'node:fs/promises';
import type { FastifyInstance, FastifyReply, FastifyRequest } from 'fastify';
import { setSessionCookie } from '../auth/guard.js';
import type { SessionStore } from '../auth/sessions.js';
import type { AppDatabase } from '../db/connection.js';
import type { Role } from '../db/schema.js';
import { logoPath, safeFileName } from '../finance/billing-routes.js';
import { renderDocument } from '../finance/pdf.js';
import { readSettings } from '../finance/settings.js';
import {
  activeLink,
  createShareLink,
  customerExists,
  EXPIRY_DAYS,
  listShareLinks,
  revokeShareLink,
  type ExpiryDays,
} from './links.js';
import type { ThumbnailService } from '../thumbnails/service.js';
import { overviewDocument, shareView } from './overview.js';

export interface ShareRouteDependencies {
  db: AppDatabase;
  dataDir: string;
  /** Thumbnails for the share page's lines (ScreenSharePage 1.9, GAP-079). */
  thumbnails: ThumbnailService;
  /** Origin for the link shown after creating it; else the request's own origin. */
  publicUrl: string | null;
  /** Requests per minute per IP address on the public endpoints. */
  rateLimit: number;
  /** A valid link mints a session with it (GAP-165). */
  sessions: SessionStore;
  now: () => Date;
}

const ADMIN: readonly Role[] = ['Admin'];
const UUID = { type: 'string', pattern: '^[0-9a-fA-F-]{36}$' } as const;

const createBody = {
  type: 'object',
  required: ['customer', 'label', 'expiresInDays'],
  additionalProperties: false,
  properties: {
    customer: { type: 'string', minLength: 1, maxLength: 255 },
    label: { type: 'string', minLength: 1, maxLength: 120 },
    expiresInDays: { anyOf: [{ type: 'null' }, { type: 'integer', enum: [...EXPIRY_DAYS] }] },
  },
} as const;

// Only "Alleen openstaand" can be chosen; anything else in the query is dropped.
const shareQuery = {
  type: 'object',
  properties: { onlyOpen: { type: 'boolean' } },
} as const;
const tokenParams = {
  type: 'object',
  required: ['token'],
  properties: { token: { type: 'string', maxLength: 128 } },
} as const;

const sharePrintParams = {
  type: 'object',
  required: ['token', 'printId'],
  properties: { token: { type: 'string', maxLength: 128 }, printId: UUID },
} as const;

/**
 * Deel-links (M8): Admins create, list and revoke links; a klant opens one
 * without signing in. Unknown, malformed, expired and revoked tokens all get
 * the same 404, and the public endpoints are rate-limited per IP address.
 */
export function registerShareRoutes(app: FastifyInstance, deps: ShareRouteDependencies): void {
  const { db, now } = deps;
  const userId = (request: FastifyRequest) => {
    if (request.auth === null) throw new Error('session missing after guard');
    return request.auth.user.id;
  };
  const origin = (request: FastifyRequest) =>
    deps.publicUrl ?? `${request.protocol}://${request.host}`;

  async function readLogo(): Promise<Buffer | null> {
    try {
      return await readFile(logoPath(deps.dataDir));
    } catch {
      return null;
    }
  }

  // ------------------------------------------------------------------ admin

  app.get('/api/share-links', { config: { auth: ADMIN } }, async () => ({
    links: await listShareLinks(db, now()),
  }));

  app.post<{ Body: { customer: string; label: string; expiresInDays: ExpiryDays } }>(
    '/api/share-links',
    { config: { auth: ADMIN }, schema: { body: createBody } },
    async (request, reply) => {
      const label = request.body.label.trim();
      if (label === '') return reply.code(400).send({ error: 'label_required' });
      const { customer, expiresInDays } = request.body;
      if (!(await customerExists(db, customer))) {
        return reply.code(404).send({ error: 'not_found' });
      }
      const { link, token } = await createShareLink(
        db,
        { customer, label, expiresInDays, userId: userId(request) },
        now(),
      );
      // The only response that ever carries the token.
      return reply
        .code(201)
        .header('cache-control', 'no-store')
        .send({ link, token, url: `${origin(request)}/share/${token}` });
    },
  );

  app.post<{ Params: { id: string } }>(
    '/api/share-links/:id/revoke',
    {
      config: { auth: ADMIN },
      schema: { params: { type: 'object', required: ['id'], properties: { id: UUID } } },
    },
    async (request, reply) => {
      const revoked = await revokeShareLink(db, request.params.id, userId(request), now());
      if (!revoked) return reply.code(404).send({ error: 'not_found' });
      /*
        Whoever is inside right now goes out with it (GAP-165). `resolve`
        would refuse the next request anyway, because it re-reads the link —
        this makes the row go too, so a revoked link leaves nothing behind.
      */
      await deps.sessions.destroyForShareLink(request.params.id);
      return reply.code(204).send();
    },
  );

  // ----------------------------------------------------------------- public

  const publicConfig = {
    auth: 'public' as const,
    rateLimit: { max: deps.rateLimit, timeWindow: '1 minute' },
  };

  /** The same answer for every token that does not work. */
  const gone = (reply: FastifyReply) =>
    reply.code(404).header('cache-control', 'no-store').send({ error: 'not_found' });

  async function linkFor(token: string) {
    const link = await activeLink(db, token, now());
    // A klant whose prints were all deleted is gone as well.
    if (link === null || !(await customerExists(db, link.customer_folder))) return null;
    return link;
  }

  const privateHeaders = (reply: FastifyReply) =>
    reply.header('cache-control', 'private, no-store').header('x-robots-tag', 'noindex');

  /**
   * The link as a way in (GAP-165). A valid token mints an anonymous session
   * scoped to this one klant, so the visitor can use the portal's own screens
   * instead of one page.
   *
   * It gives no right the role User does not already have: no cost, no
   * notes, no other klant, and `/api/assets/:id/download` stays `MANAGE`, so
   * a visitor can look at a model and not take the file. The session dies
   * with its link, which `resolve` re-reads on every request.
   *
   * POST, not GET: a GET would hand a session to anything that follows a
   * link in a mail client or a chat preview.
   */
  app.post<{ Params: { token: string } }>(
    '/api/share/:token/session',
    { config: publicConfig, schema: { params: tokenParams } },
    async (request, reply) => {
      const link = await linkFor(request.params.token);
      if (link === null) return gone(reply);
      const session = await deps.sessions.createForShareLink(link.id);
      setSessionCookie(request, reply, session.token, session.expiresAt);
      return privateHeaders(reply).send({
        csrfToken: session.csrfToken,
        customer: link.customer_folder,
        expiresAt: link.expires_at,
      });
    },
  );

  app.get<{ Params: { token: string }; Querystring: { onlyOpen?: boolean } }>(
    '/api/share/:token',
    { config: publicConfig, schema: { params: tokenParams, querystring: shareQuery } },
    async (request, reply) => {
      const link = await linkFor(request.params.token);
      if (link === null) return gone(reply);
      const view = await shareView(db, link, {
        onlyOpen: request.query.onlyOpen ?? false,
        settings: await readSettings(db),
        hasLogo: (await readLogo()) !== null,
      });
      return privateHeaders(reply).send(view);
    },
  );

  /** "Download overzicht": the Overzicht PDF; none for a niet-factureren klant. */
  app.get<{ Params: { token: string }; Querystring: { onlyOpen?: boolean } }>(
    '/api/share/:token/overview.pdf',
    { config: publicConfig, schema: { params: tokenParams, querystring: shareQuery } },
    async (request, reply) => {
      const link = await linkFor(request.params.token);
      if (link === null) return gone(reply);
      const document = await overviewDocument(db, link, {
        onlyOpen: request.query.onlyOpen ?? false,
        settings: await readSettings(db),
        now: now(),
      });
      if (document === null) return gone(reply);
      const pdf = await renderDocument(document, { logo: await readLogo(), creationDate: now() });
      return privateHeaders(reply)
        .header('content-type', 'application/pdf')
        .header('x-content-type-options', 'nosniff')
        .header(
          'content-disposition',
          `attachment; filename="${safeFileName(['Overzicht', link.customer_folder, document.issuedOn])}"`,
        )
        .send(pdf);
    },
  );

  /**
   * A line's thumbnail. The print must belong to this link's klant, so a token
   * cannot be used to read any other klant's images (GAP-079).
   */
  app.get<{ Params: { token: string; printId: string } }>(
    '/api/share/:token/prints/:printId/thumbnail',
    { config: publicConfig, schema: { params: sharePrintParams } },
    async (request, reply) => {
      const link = await linkFor(request.params.token);
      if (link === null) return gone(reply);
      const print = await db
        .selectFrom('print_records')
        .select(['id'])
        .where('id', '=', request.params.printId)
        .where('customer_folder', '=', link.customer_folder)
        .where('deleted_at', 'is', null)
        .executeTakeFirst();
      if (print === undefined) return gone(reply);
      const thumbnail = await deps.thumbnails.get(request.params.printId);
      if (thumbnail === null) return gone(reply);
      reply.header('etag', thumbnail.etag);
      if (request.headers['if-none-match'] === thumbnail.etag) return reply.code(304).send();
      return privateHeaders(reply)
        .header('content-type', thumbnail.contentType)
        .header('x-content-type-options', 'nosniff')
        .send(thumbnail.data);
    },
  );

  /** The logo for the share page header. */
  app.get<{ Params: { token: string } }>(
    '/api/share/:token/logo',
    { config: publicConfig, schema: { params: tokenParams } },
    async (request, reply) => {
      const link = await linkFor(request.params.token);
      if (link === null) return gone(reply);
      const logo = await readLogo();
      if (logo === null) return gone(reply);
      return privateHeaders(reply)
        .header('content-type', 'image/png')
        .header('x-content-type-options', 'nosniff')
        .send(logo);
    },
  );
}
