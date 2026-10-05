import { useCallback, useEffect, useMemo, useState, type ReactNode } from 'react';
import { api, ApiError, setCsrfToken, setUnauthorizedHandler } from '../api/client';
import { AuthContext, type AuthContextValue, type AuthState } from './context';
import type { AuthMethods, SessionResponse } from './types';

const LOCAL_ONLY: AuthMethods = { local: true, oidc: false };

export function AuthProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<AuthState>({ status: 'loading' });
  const [attempt, setAttempt] = useState(0);

  const signOut = useCallback((methods: AuthMethods, expired = false) => {
    setCsrfToken(null);
    setState({ status: 'signed-out', methods, expired });
  }, []);

  const signIn = useCallback((session: SessionResponse, methods: AuthMethods) => {
    setCsrfToken(session.csrfToken);
    setState({
      status: 'signed-in',
      user: session.user,
      methods,
      mustChangePassword: session.mustChangePassword,
    });
  }, []);

  useEffect(() => {
    const run = { cancelled: false };
    (async () => {
      const methods = await api<AuthMethods>('/api/auth/config');
      try {
        const session = await api<SessionResponse>('/api/auth/session', { quiet401: true });
        if (run.cancelled) return;
        signIn(session, methods);
      } catch (error) {
        if (run.cancelled) return;
        if (error instanceof ApiError && error.status === 401) signOut(methods);
        else throw error;
      }
      // A 401 later on means the session ended (idle or 12-hour limit).
      setUnauthorizedHandler(() => {
        signOut(methods, true);
      });
    })().catch(() => {
      if (!run.cancelled) setState({ status: 'error' });
    });
    return () => {
      run.cancelled = true;
      setUnauthorizedHandler(null);
    };
  }, [attempt, signIn, signOut]);

  const value = useMemo<AuthContextValue>(() => {
    const methods =
      state.status === 'signed-in' || state.status === 'signed-out' ? state.methods : LOCAL_ONLY;
    return {
      state,
      login: async (login, password) => {
        const session = await api<SessionResponse>('/api/auth/login', {
          method: 'POST',
          body: { login, password },
          quiet401: true,
        });
        signIn(session, methods);
      },
      logout: async () => {
        try {
          await api('/api/auth/logout', { method: 'POST', quiet401: true });
        } finally {
          signOut(methods);
        }
      },
      changePassword: async (newPassword) => {
        const session = await api<SessionResponse>('/api/auth/password', {
          method: 'POST',
          body: { newPassword },
        });
        signIn(session, methods);
      },
      retry: () => {
        setState({ status: 'loading' });
        setAttempt((n) => n + 1);
      },
    };
  }, [state, signIn, signOut]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
