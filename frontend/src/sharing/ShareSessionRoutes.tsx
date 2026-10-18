import { useQuery } from '@tanstack/react-query';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { Route, Routes, useParams } from 'react-router';
import { api, ApiError, setCsrfToken, setUnauthorizedHandler } from '../api/client';
import { AuthContext, type AuthContextValue } from '../auth/context';
import type { AuthMethods } from '../auth/types';
import { ToastProvider } from '../components/Toasts';
import { t } from '../i18n/nl';
import { LoadingRows } from '../pages/ErrorState';
import { ErrorState } from '../pages/ErrorState';
import { PrintDetailPage } from '../prints/PrintDetailPage';
import { Gone, SessionEnded } from './EndPages';
import { GuestShell } from './GuestShell';
import { SessionPrintsPage } from './SessionPrintsPage';
import { fetchShareView, shareKeys } from './share-api';
import { SharePage } from './SharePage';
import { mintSession, ShareSessionContext, type ShareSession } from './session';

const METHODS: AuthMethods = { local: false, oidc: false };

/**
 * A deel-link session (ScreenShareSession 2.14, GAP-165).
 *
 * The owner opened a share link and said it was not what he expected: he
 * expected the klant to **walk through the portal**. So the link stopped
 * being a page you send and became a key. A valid token mints an anonymous,
 * read-only session for one klant (`POST /api/share/:token/session`), and the
 * visitor uses the real screens — which is the only mechanism that keeps a
 * session from becoming the second portal he rejected.
 *
 * The token stays in the URL because it is the visitor's only credential: a
 * reload, a bookmark or a forwarded link has to carry it. The session cookie
 * is what the API trusts, and the backend re-reads the link on every request,
 * so revoking one ends the session at once.
 *
 * The session provides the AuthContext the shared screens read, with the
 * anonymous user the backend builds: role **User**, which has meant
 * read-only, no cost and no notes since 1.1. A visitor is a User without an
 * account, not a new privilege level.
 */
export function ShareSessionRoutes() {
  const { token = '' } = useParams();
  // Keyed on the token: another link is another session, from scratch.
  return <Session key={token} token={token} />;
}

function Session({ token }: { token: string }) {
  const [state, setState] = useState<'minting' | 'live' | 'gone' | 'ended' | 'error'>('minting');
  const [customer, setCustomer] = useState('');

  useEffect(() => {
    let cancelled = false;
    mintSession(token).then(
      (session) => {
        if (cancelled) return;
        setCsrfToken(session.csrfToken);
        setCustomer(session.customer);
        setState('live');
      },
      (error: unknown) => {
        if (cancelled) return;
        // Unknown, malformed, expired and revoked are one answer, on purpose.
        setState(error instanceof ApiError && error.status === 404 ? 'gone' : 'error');
      },
    );
    return () => {
      cancelled = true;
      setCsrfToken(null);
    };
  }, [token]);

  /*
    The link dies while the visitor is inside: the session's next request
    answers 401 (the cookie no longer resolves) or 404 (a share endpoint), and
    the whole page becomes the one page every dead link shows. At the
    visitor's next action, never on a timer.
  */
  const died = useCallback(() => {
    setState((current) => (current === 'live' ? 'gone' : current));
  }, []);
  useEffect(() => {
    if (state !== 'live') return;
    setUnauthorizedHandler(died);
    return () => {
      setUnauthorizedHandler(null);
    };
  }, [state, died]);

  const session = useMemo<ShareSession>(
    () => ({ token, customer, base: `/share/${encodeURIComponent(token)}` }),
    [token, customer],
  );

  const exit = useCallback(async () => {
    try {
      await api('/api/auth/logout', { method: 'POST', quiet401: true });
    } finally {
      setCsrfToken(null);
      setState('ended');
    }
  }, []);

  const auth = useMemo<AuthContextValue>(
    () => ({
      state: {
        status: 'signed-in',
        // What the backend made of this token: an anonymous role User.
        user: {
          id: `share:${token}`,
          login: `share:${token}`,
          displayName: customer,
          role: 'User',
          origin: 'local',
          lastLoginAt: null,
        },
        methods: METHODS,
        mustChangePassword: false,
      },
      login: () => Promise.reject(new Error('no login in a share session')),
      logout: exit,
      changePassword: () => Promise.reject(new Error('no password in a share session')),
      retry: () => undefined,
    }),
    [token, customer, exit],
  );

  if (state === 'gone') return <Gone />;
  if (state === 'ended') return <SessionEnded />;
  if (state === 'error') {
    return (
      <main className="pp-share-col">
        <div className="pp-share-body">
          <ErrorState
            body={t('system.errorBody')}
            onRetry={() => {
              setState('minting');
              window.location.reload();
            }}
          />
        </div>
      </main>
    );
  }
  if (state === 'minting') {
    return (
      <main className="pp-share-col" aria-busy="true">
        <div className="pp-share-body">
          <LoadingRows rows={4} />
        </div>
      </main>
    );
  }

  return (
    <ShareSessionContext.Provider value={session}>
      <AuthContext.Provider value={auth}>
        <ToastProvider dismissLabel={t('common.close')}>
          <Shell session={session} onExit={exit} onGone={died} />
        </ToastProvider>
      </AuthContext.Provider>
    </ShareSessionContext.Provider>
  );
}

/**
 * The shell and the three screens inside it. The studio comes from the share
 * view, which the Overzicht fetches anyway, so the head costs no request of
 * its own.
 */
function Shell({
  session,
  onExit,
  onGone,
}: {
  session: ShareSession;
  onExit: () => Promise<void>;
  onGone: () => void;
}) {
  const view = useQuery({
    queryKey: shareKeys.view(session.token, false),
    queryFn: () => fetchShareView(session.token, false),
    retry: (count, error) => !(error instanceof ApiError && error.status === 404) && count < 2,
  });
  const gone = view.isError && view.error instanceof ApiError && view.error.status === 404;
  useEffect(() => {
    if (gone) onGone();
  }, [gone, onGone]);

  return (
    <GuestShell
      session={session}
      studio={view.data?.studio.name ?? t('app.name')}
      hasLogo={view.data?.studio.hasLogo ?? false}
      onExit={onExit}
    >
      <Routes>
        <Route index element={<SharePage inSession onGone={onGone} />} />
        <Route path="prints" element={<SessionPrintsPage />} />
        <Route path="prints/:id" element={<PrintDetailPage />} />
      </Routes>
    </GuestShell>
  );
}
