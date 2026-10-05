import type { FastifyInstance, FastifyRequest } from 'fastify';
import type { AppConfig } from '../config/config.js';
import type { SessionStore } from '../auth/sessions.js';
import type { RealtimeHub } from './hub.js';

/** How often open sockets are checked against their session (expiry, sign-out, removal). */
export const SESSION_CHECK_MS = 60_000;

/**
 * GET /api/live: the WebSocket for live updates. The session cookie is
 * checked by the auth guard like any /api request; the Origin must be this
 * site (or PUBLIC_URL / CORS_ORIGINS), so another site cannot open a socket
 * with the user's cookie.
 */
export function registerLiveRoute(
  app: FastifyInstance,
  deps: { config: AppConfig; hub: RealtimeHub; sessions: SessionStore },
): void {
  const { hub, sessions } = deps;

  app.get('/api/live', { websocket: true }, (socket, request) => {
    const session = request.auth;
    if (session === null) {
      socket.close(1008, 'unauthorized');
      return;
    }
    if (!originAllowed(request, deps.config)) {
      request.log.warn(
        { origin: request.headers.origin },
        'live socket from another origin refused',
      );
      socket.close(1008, 'origin not allowed');
      return;
    }
    void hub.add(socket, session.user, session.idHash);
  });

  const timer = setInterval(() => {
    const hashes = hub.sessionHashes();
    if (hashes.length === 0) return;
    sessions.activeAmong(hashes).then(
      (active) => {
        hub.closeWhere((idHash) => !active.has(idHash), 'session ended');
      },
      (error: unknown) => {
        app.log.warn({ err: error }, 'could not check live sessions');
      },
    );
  }, SESSION_CHECK_MS);
  timer.unref();
  app.addHook('onClose', () => {
    clearInterval(timer);
    hub.closeAll();
  });
}

function originAllowed(request: FastifyRequest, config: AppConfig): boolean {
  const origin = request.headers.origin;
  if (origin === undefined) return true; // not a browser
  let host: string;
  try {
    host = new URL(origin).host;
  } catch {
    return false;
  }
  if (host === request.headers.host) return true;
  const allowed = [config.auth.publicUrl, ...config.http.corsOrigins].filter(
    (value): value is string => value !== null,
  );
  return allowed.some((value) => new URL(value).origin === origin);
}
