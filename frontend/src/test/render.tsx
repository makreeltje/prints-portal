import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { render } from '@testing-library/react';
import type { ReactNode } from 'react';
import { MemoryRouter } from 'react-router';
import { vi } from 'vitest';
import { AppRoutes } from '../App';
import { AuthContext, type AuthContextValue, type AuthState } from '../auth/context';
import type { AuthMethods, Role, User } from '../auth/types';
import { ToastProvider } from '../components/Toasts';

export const LOCAL_ONLY: AuthMethods = { local: true, oidc: false };

export function makeUser(role: Role, overrides: Partial<User> = {}): User {
  return {
    id: `id-${role.toLowerCase()}`,
    login: `${role.toLowerCase()}@example.org`,
    displayName: `${role.toLowerCase()}@example.org`,
    role,
    origin: 'local',
    lastLoginAt: null,
    ...overrides,
  };
}

export function signedIn(role: Role = 'Admin'): AuthState {
  return {
    status: 'signed-in',
    user: makeUser(role),
    methods: LOCAL_ONLY,
    mustChangePassword: false,
  };
}

/** Renders with a fixed auth state; login/logout are spies. */
export function renderWithAuth(
  ui: ReactNode,
  {
    state = signedIn(),
    path = '/',
    auth = {},
  }: {
    state?: AuthState;
    path?: string;
    auth?: Partial<AuthContextValue>;
  } = {},
) {
  const value: AuthContextValue = {
    state,
    login: vi.fn(() => Promise.resolve()),
    logout: vi.fn(() => Promise.resolve()),
    changePassword: vi.fn(() => Promise.resolve()),
    retry: vi.fn(),
    ...auth,
  };
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false, staleTime: Infinity } },
  });
  const result = render(
    <QueryClientProvider client={queryClient}>
      <AuthContext.Provider value={value}>
        <ToastProvider dismissLabel="Sluiten">
          <MemoryRouter initialEntries={[path]}>{ui}</MemoryRouter>
        </ToastProvider>
      </AuthContext.Provider>
    </QueryClientProvider>,
  );
  return { ...result, auth: value };
}

export function renderApp(path: string, state: AuthState = signedIn()) {
  return renderWithAuth(<AppRoutes />, { state, path });
}

/** A fetch stub answering by "METHOD path"; unknown requests fail the test loudly. */
export function stubFetch(
  routes: Record<string, (body: unknown) => { status?: number; json?: unknown; noBody?: boolean }>,
) {
  const calls: { method: string; path: string; body: unknown; headers: Record<string, string> }[] =
    [];
  const fetchMock = vi.fn((input: string, init: RequestInit = {}) => {
    const method = init.method ?? 'GET';
    const body: unknown = typeof init.body === 'string' ? JSON.parse(init.body) : undefined;
    calls.push({
      method,
      path: input,
      body,
      headers: (init.headers ?? {}) as Record<string, string>,
    });
    const route = routes[`${method} ${input}`] ?? routes[`${method} ${input.split('?')[0] ?? ''}`];
    if (route === undefined) throw new Error(`unexpected request ${method} ${input}`);
    const { status = 200, json, noBody = false } = route(body);
    /*
      `noBody` is an answer that carries nothing at all, which Fastify sends
      for `reply.code(2xx).send()` with no payload. The harness could not say
      this before: every status but 204 was given a `{}` body, so a route that
      answered this way passed in tests and failed in the browser.
    */
    const empty = noBody || status === 204;
    return Promise.resolve(
      new Response(empty ? null : JSON.stringify(json ?? {}), {
        status,
        headers: empty ? {} : { 'content-type': 'application/json' },
      }),
    );
  });
  vi.stubGlobal('fetch', fetchMock);
  return calls;
}
