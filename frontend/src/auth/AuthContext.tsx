import { useCallback, useEffect, useMemo, useState, type ReactNode } from 'react';
import { api, ApiError, setCsrfToken, setUnauthorizedHandler } from '../api/client';
import { AuthContext, type AuthContextValue, type AuthState } from './context';
import type { AuthMethods, SessionResponse } from './types';

export function AuthProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<AuthState>({ status: 'loading' });
  const [attempt, setAttempt] = useState(0);

  const signOut = useCallback((methods: AuthMethods) => {
    setCsrfToken(null);
    setState({ status: 'signed-out', methods });
  }, []);

  useEffect(() => {
    const run = { cancelled: false };
    (async () => {
      const methods = await api<AuthMethods>('/api/auth/config');
      try {
        const session = await api<SessionResponse>('/api/auth/session', { quiet401: true });
        if (run.cancelled) return;
        setCsrfToken(session.csrfToken);
        setState({ status: 'signed-in', user: session.user, methods });
      } catch (error) {
        if (run.cancelled) return;
        if (error instanceof ApiError && error.status === 401) signOut(methods);
        else throw error;
      }
      setUnauthorizedHandler(() => {
        signOut(methods);
      });
    })().catch(() => {
      if (!run.cancelled) setState({ status: 'error' });
    });
    return () => {
      run.cancelled = true;
      setUnauthorizedHandler(null);
    };
  }, [attempt, signOut]);

  const value = useMemo<AuthContextValue>(() => {
    const methods =
      state.status === 'signed-in' || state.status === 'signed-out' ? state.methods : null;
    return {
      state,
      login: async (email, password) => {
        const session = await api<SessionResponse>('/api/auth/login', {
          method: 'POST',
          body: { email, password },
          quiet401: true,
        });
        setCsrfToken(session.csrfToken);
        setState({
          status: 'signed-in',
          user: session.user,
          methods: methods ?? { local: true, oidc: false },
        });
      },
      logout: async () => {
        try {
          await api('/api/auth/logout', { method: 'POST', quiet401: true });
        } finally {
          signOut(methods ?? { local: true, oidc: false });
        }
      },
      retry: () => {
        setState({ status: 'loading' });
        setAttempt((n) => n + 1);
      },
    };
  }, [state, signOut]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
