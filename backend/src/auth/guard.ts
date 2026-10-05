import type { FastifyInstance, FastifyReply, FastifyRequest } from 'fastify';
import type { Role } from '../db/schema.js';
import { tokensEqual, type ActiveSession, type SessionStore } from './sessions.js';

/**
 * Who may call a route under /api. Routes without `config.auth` need a
 * signed-in user, so a new endpoint is never public by accident.
 */
export type AuthRequirement = 'public' | 'signed-in' | readonly Role[];

declare module 'fastify' {
  interface FastifyContextConfig {
    auth?: AuthRequirement;
  }
  interface FastifyRequest {
    /** The signed-in session, resolved for every /api request. */
    auth: ActiveSession | null;
  }
}

export const SESSION_COOKIE = 'pp_session';
export const CSRF_HEADER = 'x-csrf-token';
const SAFE_METHODS = new Set(['GET', 'HEAD', 'OPTIONS']);

export function isSecureRequest(request: FastifyRequest): boolean {
  // request.protocol honours X-Forwarded-Proto only from TRUSTED_PROXIES.
  return request.protocol === 'https';
}

export function setSessionCookie(
  request: FastifyRequest,
  reply: FastifyReply,
  token: string,
  expiresAt: Date,
): void {
  reply.setCookie(SESSION_COOKIE, token, {
    path: '/',
    httpOnly: true,
    sameSite: 'lax',
    secure: isSecureRequest(request),
    expires: expiresAt,
  });
}

export function clearSessionCookie(request: FastifyRequest, reply: FastifyReply): void {
  reply.clearCookie(SESSION_COOKIE, {
    path: '/',
    httpOnly: true,
    sameSite: 'lax',
    secure: isSecureRequest(request),
  });
}

/**
 * Resolves the session cookie on every /api request and enforces the
 * route's requirement. Changing requests also need the session's CSRF token
 * in the X-CSRF-Token header (the SameSite cookie alone is not relied on).
 */
export function registerAuthGuard(app: FastifyInstance, sessions: SessionStore): void {
  app.decorateRequest('auth', null);

  app.addHook('onRequest', async (request, reply) => {
    if (!request.url.startsWith('/api/')) return;

    const token = request.cookies[SESSION_COOKIE];
    if (token !== undefined) {
      request.auth = await sessions.resolve(token);
      if (request.auth === null) clearSessionCookie(request, reply);
    }

    const requirement = request.routeOptions.config.auth ?? 'signed-in';
    if (requirement === 'public') return;

    const session = request.auth;
    if (session === null) {
      return reply.code(401).send({ error: 'unauthorized' });
    }
    if (!SAFE_METHODS.has(request.method)) {
      const header = request.headers[CSRF_HEADER];
      if (typeof header !== 'string' || !tokensEqual(header, session.csrfToken)) {
        return reply.code(403).send({ error: 'csrf' });
      }
    }
    if (requirement !== 'signed-in' && !requirement.includes(session.user.role)) {
      return reply.code(403).send({ error: 'forbidden' });
    }
  });
}
