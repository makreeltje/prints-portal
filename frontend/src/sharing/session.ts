import { createContext, useContext } from 'react';
import { api } from '../api/client';

/**
 * A deel-link session (ScreenShareSession 2.14, GAP-165): a valid token mints
 * an anonymous, read-only session for one klant and the visitor walks the
 * real screens.
 *
 * The screens read this to drop what a visitor has no business with — no
 * tags, no filament tint, no selection — and to build their links, because a
 * session keeps the token in the URL: it is the visitor's only credential, so
 * a reload or a shared link has to carry it.
 */
export interface ShareSession {
  token: string;
  customer: string;
  /** `/share/<token>`: the base every link inside the session hangs off. */
  base: string;
}

export const ShareSessionContext = createContext<ShareSession | null>(null);

/** The session, or null on every screen an operator sees. */
export function useShareSession(): ShareSession | null {
  return useContext(ShareSessionContext);
}

/** Where a print's page lives, in a session and outside one. */
export function printHref(session: ShareSession | null, printId: string): string {
  return session === null ? `/prints/${printId}` : `${session.base}/prints/${printId}`;
}

export interface MintedSession {
  csrfToken: string;
  customer: string;
  expiresAt: string | null;
}

/**
 * POST, never GET: a GET would hand a session to anything that follows a link
 * in a mail client or a chat preview (the backend says the same).
 */
export const mintSession = (token: string) =>
  api<MintedSession>(`/api/share/${encodeURIComponent(token)}/session`, {
    method: 'POST',
    quiet401: true,
  });
