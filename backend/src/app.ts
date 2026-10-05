import { existsSync } from 'node:fs';
import path from 'node:path';
import fastifyCookie from '@fastify/cookie';
import fastifyCors from '@fastify/cors';
import fastifyRateLimit from '@fastify/rate-limit';
import fastifyStatic from '@fastify/static';
import Fastify, { type FastifyInstance, type FastifyServerOptions } from 'fastify';
import { registerAdminRoutes } from './auth/admin-routes.js';
import { registerAuthGuard } from './auth/guard.js';
import { registerOidcRoutes } from './auth/oidc.js';
import { registerAuthRoutes } from './auth/routes.js';
import { SessionStore } from './auth/sessions.js';
import type { AppConfig } from './config/config.js';
import type { AppDatabase } from './db/connection.js';
import { checkHealth } from './health/health.js';

export interface AppDependencies {
  config: AppConfig;
  db: AppDatabase;
  logger?: FastifyServerOptions['logger'];
  /** Clock for session expiry; tests move it forward. */
  now?: () => Date;
}

export async function buildApp({
  config,
  db,
  logger = false,
  now = () => new Date(),
}: AppDependencies): Promise<FastifyInstance> {
  const { trustedProxies, corsOrigins } = config.http;
  const app = Fastify({
    logger,
    // X-Forwarded-For/-Proto/-Host count only when they come from a configured proxy.
    trustProxy: trustedProxies.length > 0 ? [...trustedProxies] : false,
  });

  await app.register(fastifyCookie, { secret: config.auth.sessionSecret });
  await app.register(fastifyRateLimit, { global: false });
  if (corsOrigins.length > 0) {
    await app.register(fastifyCors, { origin: [...corsOrigins], credentials: true });
  }

  const sessions = new SessionStore(db, config.auth.sessionSecret, now);
  registerAuthGuard(app, sessions);
  registerAuthRoutes(app, { config, db, sessions, now });
  registerAdminRoutes(app, { config, db, sessions, now });
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
