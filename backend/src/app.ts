import { existsSync } from 'node:fs';
import path from 'node:path';
import fastifyCookie from '@fastify/cookie';
import fastifyCors from '@fastify/cors';
import fastifyRateLimit from '@fastify/rate-limit';
import fastifyStatic from '@fastify/static';
import fastifySwagger from '@fastify/swagger';
import fastifyWebsocket from '@fastify/websocket';
import Fastify, { type FastifyInstance, type FastifyServerOptions } from 'fastify';
import { registerAdminRoutes } from './auth/admin-routes.js';
import { registerAuthGuard } from './auth/guard.js';
import { registerOidcRoutes } from './auth/oidc.js';
import { registerAuthRoutes } from './auth/routes.js';
import { SessionStore } from './auth/sessions.js';
import type { AppConfig } from './config/config.js';
import type { AppDatabase } from './db/connection.js';
import { registerBillingRoutes } from './finance/billing-routes.js';
import { registerFinanceRoutes } from './finance/routes.js';
import { SpoolmanClient } from './finance/spoolman.js';
import { registerErrorHandler } from './core/error-handler.js';
import { redactUrl } from './core/log-redaction.js';
import { openapiOptions, registerOpenapiRoute } from './docs/openapi.js';
import { registerRouteDocs } from './docs/route-docs.js';
import { checkHealth } from './health/health.js';
import { Indexer } from './indexing/indexer.js';
import { registerPrintRoutes } from './prints/routes.js';
import { RealtimeHub } from './realtime/hub.js';
import { registerLiveRoute } from './realtime/routes.js';
import { registerShareRoutes } from './sharing/routes.js';
import { ThumbnailService } from './thumbnails/service.js';

/** Long-lived services the server also needs (watcher, startup scan, shutdown). */
export interface AppServices {
  indexer: Indexer;
  hub: RealtimeHub;
  spoolman: SpoolmanClient;
}

declare module 'fastify' {
  interface FastifyInstance {
    services: AppServices;
  }
}

export interface AppDependencies {
  config: AppConfig;
  db: AppDatabase;
  logger?: FastifyServerOptions['logger'];
  /** Clock for session expiry; tests move it forward. */
  now?: () => Date;
  /** Replaces the network for Spoolman requests (tests). */
  spoolmanFetch?: typeof fetch;
}

export async function buildApp({
  config,
  db,
  logger = false,
  now = () => new Date(),
  spoolmanFetch,
}: AppDependencies): Promise<FastifyInstance> {
  const { trustedProxies, corsOrigins } = config.http;
  const app = Fastify({
    logger:
      typeof logger !== 'object'
        ? logger
        : {
            ...logger,
            // A Deel-link token and an OIDC code are credentials, not identifiers,
            // and they travel in the URL that every request logs.
            serializers: {
              req: (request: { method: string; url: string; routeOptions?: unknown }) => ({
                method: request.method,
                url: redactUrl(request.url),
              }),
            },
          },
    // X-Forwarded-For/-Proto/-Host count only when they come from a configured proxy.
    trustProxy: trustedProxies.length > 0 ? [...trustedProxies] : false,
  });

  await app.register(fastifyCookie, { secret: config.auth.sessionSecret });
  await app.register(fastifyRateLimit, { global: false });
  await app.register(fastifyWebsocket, { options: { maxPayload: 64 * 1024 } });
  // Both must come before the routes: the hook adds the summaries, the plugin reads them.
  registerRouteDocs(app);
  await app.register(fastifySwagger, openapiOptions);
  if (corsOrigins.length > 0) {
    await app.register(fastifyCors, { origin: [...corsOrigins], credentials: true });
  }

  registerErrorHandler(app);

  const sessions = new SessionStore(db, config.auth.sessionSecret, now);
  registerAuthGuard(app, sessions);
  registerAuthRoutes(app, { config, db, sessions, now });
  registerAdminRoutes(app, { config, db, sessions, now });

  const hub = new RealtimeHub(db, app.log);
  const indexer = new Indexer({
    db,
    printsRoot: config.printsRoot,
    logger: app.log,
    now,
    // Every indexer change goes out live (the shared broadcast path).
    onEvent: (event) => {
      hub.broadcast({
        type: event.type,
        printId: event.printRecordId,
        customerFolder: event.customerFolder,
      });
    },
  });
  const thumbnails = new ThumbnailService({
    db,
    printsRoot: config.printsRoot,
    cacheDir: path.join(config.dataDir, 'thumbnails'),
    logger: app.log,
  });
  const spoolman = new SpoolmanClient({
    ...config.spoolman,
    now,
    ...(spoolmanFetch === undefined ? {} : { fetch: spoolmanFetch }),
  });
  app.decorate('services', { indexer, hub, spoolman });
  registerPrintRoutes(app, { db, printsRoot: config.printsRoot, indexer, hub, thumbnails, now });
  registerFinanceRoutes(app, { db, indexer, hub, spoolman, now });
  registerBillingRoutes(app, { db, hub, dataDir: config.dataDir, now });
  registerShareRoutes(app, {
    db,
    dataDir: config.dataDir,
    thumbnails,
    publicUrl: config.auth.publicUrl,
    rateLimit: config.auth.shareRateLimit,
    now,
  });
  registerLiveRoute(app, { config, hub, sessions });
  registerOpenapiRoute(app);
  const { oidc, publicUrl } = config.auth;
  if (oidc !== null && publicUrl !== null) {
    registerOidcRoutes(app, { db, sessions, oidc, publicUrl, now });
  }

  // Health probes run every few seconds; only problems are worth a log line.
  app.get('/healthz', { logLevel: 'warn' }, async (request, reply) => {
    const report = await checkHealth({
      db,
      printsRoot: config.printsRoot,
      onProblem: (check, error) => {
        request.log.warn({ check, err: error }, 'health check failed');
      },
    });
    return reply
      .code(report.status === 'error' ? 503 : 200)
      .header('cache-control', 'no-store')
      .send(report);
  });

  await registerSpa(app, config.staticDir);

  app.addHook('onClose', async () => {
    await db.destroy();
  });

  return app;
}

/**
 * Serves the built SPA and falls back to index.html for client-side routes.
 * API paths and missing assets keep returning a JSON 404.
 */
async function registerSpa(app: FastifyInstance, staticDir: string | null): Promise<void> {
  const indexFile = staticDir === null ? null : path.join(staticDir, 'index.html');
  if (staticDir === null || indexFile === null || !existsSync(indexFile)) {
    app.log.info({ staticDir }, 'no built frontend found; serving the API only');
    app.setNotFoundHandler((_request, reply) => reply.code(404).send({ error: 'Not Found' }));
    return;
  }

  await app.register(fastifyStatic, { root: staticDir, wildcard: false });

  app.setNotFoundHandler((request, reply) => {
    const isPageRequest =
      request.method === 'GET' &&
      !request.url.startsWith('/api/') &&
      path.extname(request.url.split('?')[0] ?? '') === '' &&
      (request.headers.accept ?? '').includes('text/html');
    if (isPageRequest) return reply.type('text/html').sendFile('index.html');
    return reply.code(404).send({ error: 'Not Found' });
  });
}
