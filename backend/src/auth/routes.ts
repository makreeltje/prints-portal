import type { FastifyInstance } from 'fastify';
import type { AppConfig } from '../config/config.js';
import type { AppDatabase } from '../db/connection.js';
import { clearSessionCookie, setSessionCookie } from './guard.js';
import { hashPassword, MAX_PASSWORD_LENGTH, passwordProblem, verifyPassword } from './passwords.js';
import type { ActiveSession, SessionStore } from './sessions.js';
import { findUserByLogin, toPublicUser, type UserRow } from './users.js';

export interface AuthRouteDependencies {
  config: AppConfig;
  db: AppDatabase;
  sessions: SessionStore;
  now: () => Date;
}

/** What the client learns about its session. */
function sessionBody(user: UserRow, csrfToken: string, expiresAt: Date) {
  return {
    user: toPublicUser(user),
    csrfToken,
    expiresAt: expiresAt.toISOString(),
    // A temporary password set by an Admin must be replaced before anything else works.
    mustChangePassword: user.must_change_password === 1,
  };
}

/** /api/auth: which methods are enabled, the current session, local login, logout and own password. */
export function registerAuthRoutes(
  app: FastifyInstance,
  { config, db, sessions, now }: AuthRouteDependencies,
): void {
  const localLogin = config.auth.oidc === null;

  app.get('/api/auth/config', { config: { auth: 'public' } }, () => ({
    local: localLogin,
    oidc: config.auth.oidc !== null,
  }));

  app.get('/api/auth/session', { config: { allowWithTemporaryPassword: true } }, (request) => {
    const session = signedIn(request.auth);
    return sessionBody(session.user, session.csrfToken, session.expiresAt);
  });

  app.post<{ Body: { login: string; password: string } }>(
    '/api/auth/login',
    {
      config: {
        auth: 'public',
        rateLimit: { max: config.auth.loginRateLimit, timeWindow: '1 minute' },
      },
      schema: {
        body: {
          type: 'object',
          required: ['login', 'password'],
          additionalProperties: false,
          properties: {
            // An e-mail address or a plain name.
            login: { type: 'string', minLength: 1, maxLength: 320 },
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

      const user = await findUserByLogin(db, request.body.login);
      const valid = await verifyPassword(user?.password_hash ?? null, request.body.password);
      if (user === undefined || !valid) {
        request.log.info({ login: request.body.login }, 'failed login');
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
      return sessionBody(user, created.csrfToken, created.expiresAt);
    },
  );

  app.post<{ Body: { currentPassword?: string; newPassword: string } }>(
    '/api/auth/password',
    {
      config: {
        allowWithTemporaryPassword: true,
        // Guessing the current password through this endpoint is limited like a login.
        rateLimit: { max: config.auth.loginRateLimit, timeWindow: '1 minute' },
      },
      schema: {
        body: {
          type: 'object',
          // The current password may be left out only while the password is temporary:
          // the user proved it by signing in, and the "Nieuw wachtwoord kiezen" card does not ask again.
          required: ['newPassword'],
          additionalProperties: false,
          properties: {
            currentPassword: { type: 'string', minLength: 1, maxLength: 1024 },
            newPassword: { type: 'string', minLength: 1, maxLength: MAX_PASSWORD_LENGTH },
          },
        },
      },
    },
    async (request, reply) => {
      const session = signedIn(request.auth);
      const { user } = session;
      if (!localLogin || user.oidc_subject !== null) {
        return reply.code(409).send({ error: 'not_local' });
      }
      const { currentPassword } = request.body;
      if (currentPassword === undefined) {
        if (user.must_change_password !== 1) {
          return reply.code(400).send({ error: 'current_password_required' });
        }
      } else if (!(await verifyPassword(user.password_hash, currentPassword))) {
        return reply.code(400).send({ error: 'wrong_current_password' });
      }
      const problem = passwordProblem(request.body.newPassword);
      if (problem !== null) return reply.code(400).send({ error: `password_${problem}` });
      if (
        user.password_hash !== null &&
        (await verifyPassword(user.password_hash, request.body.newPassword))
      ) {
        return reply.code(400).send({ error: 'password_unchanged' });
      }
      await db
        .updateTable('users')
        .set({
          password_hash: await hashPassword(request.body.newPassword),
          must_change_password: 0,
        })
        .where('id', '=', user.id)
        .execute();
      // Other devices signed in with the old password are signed out.
      await sessions.destroyForUser(user.id, session.idHash);
      return sessionBody(
        { ...user, must_change_password: 0 },
        session.csrfToken,
        session.expiresAt,
      );
    },
  );

  app.post(
    '/api/auth/logout',
    { config: { allowWithTemporaryPassword: true } },
    async (request, reply) => {
      if (request.auth !== null) await sessions.destroy(request.auth.idHash);
      clearSessionCookie(request, reply);
      return reply.code(204).send();
    },
  );
}

/** The guard guarantees a session on routes that are not public. */
function signedIn(session: ActiveSession | null): ActiveSession {
  if (session === null) throw new Error('session missing after guard');
  return session;
}
