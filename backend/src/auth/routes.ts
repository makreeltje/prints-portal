import type { FastifyInstance } from 'fastify';
import type { AppConfig } from '../config/config.js';
import type { AppDatabase } from '../db/connection.js';
import { clearSessionCookie, setSessionCookie } from './guard.js';
import { verifyPassword } from './passwords.js';
import type { SessionStore } from './sessions.js';
import { findUserByEmail, toPublicUser } from './users.js';

export interface AuthRouteDependencies {
  config: AppConfig;
  db: AppDatabase;
  sessions: SessionStore;
  now: () => Date;
}

/** /api/auth: which methods are enabled, the current session, local login and logout. */
export function registerAuthRoutes(
  app: FastifyInstance,
  { config, db, sessions, now }: AuthRouteDependencies,
): void {
  const localLogin = config.auth.oidc === null;

  app.get('/api/auth/config', { config: { auth: 'public' } }, () => ({
    local: localLogin,
    oidc: config.auth.oidc !== null,
  }));

  app.get('/api/auth/session', (request) => {
    // The guard guarantees a session here.
    const session = request.auth;
    if (session === null) throw new Error('session missing after guard');
    return {
      user: toPublicUser(session.user),
      csrfToken: session.csrfToken,
      expiresAt: session.expiresAt.toISOString(),
    };
  });

  app.post<{ Body: { email: string; password: string } }>(
    '/api/auth/login',
    {
      config: {
        auth: 'public',
        rateLimit: { max: config.auth.loginRateLimit, timeWindow: '1 minute' },
      },
      schema: {
        body: {
          type: 'object',
          required: ['email', 'password'],
          additionalProperties: false,
          properties: {
            email: { type: 'string', minLength: 1, maxLength: 320 },
            password: { type: 'string', minLength: 1, maxLength: 1024 },
          },
        },
      },
    },
    async (request, reply) => {
      if (!localLogin) return reply.code(404).send({ error: 'local_login_disabled' });
      // Only JSON is accepted, so a cross-site HTML form cannot post a login.
      if (!(request.headers['content-type'] ?? '').startsWith('application/json')) {
        return reply.code(415).send({ error: 'unsupported_media_type' });
      }

      const user = await findUserByEmail(db, request.body.email);
      const valid = await verifyPassword(user?.password_hash ?? null, request.body.password);
      if (user === undefined || !valid) {
        request.log.info({ email: request.body.email }, 'failed login');
        return reply.code(401).send({ error: 'invalid_credentials' });
      }

      if (request.auth !== null) await sessions.destroy(request.auth.idHash);
      const created = await sessions.create(user.id);
      await db
        .updateTable('users')
        .set({ last_login_at: now().toISOString() })
        .where('id', '=', user.id)
        .execute();
      setSessionCookie(request, reply, created.token, created.expiresAt);
      return {
        user: toPublicUser(user),
        csrfToken: created.csrfToken,
        expiresAt: created.expiresAt.toISOString(),
      };
    },
  );

  app.post('/api/auth/logout', async (request, reply) => {
    if (request.auth !== null) await sessions.destroy(request.auth.idHash);
    clearSessionCookie(request, reply);
    return reply.code(204).send();
  });
}
