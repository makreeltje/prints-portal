import type { InjectOptions } from 'fastify';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { startTestApp, type Session, type TestApp } from '../helpers/app.js';
import { TEST_DATABASES } from '../helpers/databases.js';

type Caller = 'anonymous' | 'User' | 'Editor' | 'Admin';

const UNKNOWN = '00000000-0000-4000-8000-000000000000';

/**
 * Every endpoint so far × every kind of caller. "ok" means the guard let the
 * request through (the handler may still answer 4xx for the payload).
 */
const ENDPOINTS: {
  name: string;
  request: (ids: Record<string, string>) => InjectOptions;
  allowed: readonly Caller[];
}[] = [
  {
    name: 'GET /api/auth/config',
    request: () => ({ url: '/api/auth/config' }),
    allowed: ['anonymous', 'User', 'Editor', 'Admin'],
  },
  {
    name: 'GET /api/auth/session',
    request: () => ({ url: '/api/auth/session' }),
    allowed: ['User', 'Editor', 'Admin'],
  },
  {
    name: 'POST /api/auth/password',
    request: () => ({
      method: 'POST',
      url: '/api/auth/password',
      payload: { currentPassword: 'wrong-password!!', newPassword: 'a-brand-new-password' },
    }),
    allowed: ['User', 'Editor', 'Admin'],
  },
  { name: 'GET /api/users', request: () => ({ url: '/api/users' }), allowed: ['Admin'] },
  {
    name: 'POST /api/users',
    request: () => ({
      method: 'POST',
      url: '/api/users',
      payload: {
        login: `n${String(Math.random()).slice(2)}@example.org`,
        role: 'User',
        password: 'temporary-password',
      },
    }),
    allowed: ['Admin'],
  },
  {
    name: 'PATCH /api/users/:id',
    request: (ids) => ({
      method: 'PATCH',
      url: `/api/users/${ids.target ?? ''}`,
      payload: { role: 'User' },
    }),
    allowed: ['Admin'],
  },
  {
    name: 'POST /api/users/:id/password',
    request: (ids) => ({
      method: 'POST',
      url: `/api/users/${ids.target ?? ''}/password`,
      payload: { password: 'another-temporary-pw' },
    }),
    allowed: ['Admin'],
  },
  {
    name: 'DELETE /api/users/:id',
    request: () => ({ method: 'DELETE', url: '/api/users/unknown-id' }),
    allowed: ['Admin'],
  },
  { name: 'GET /api/access', request: () => ({ url: '/api/access' }), allowed: ['Admin'] },
  {
    name: 'PATCH /api/access',
    request: (ids) => ({
      method: 'PATCH',
      url: '/api/access',
      payload: { changes: [{ userId: ids.target ?? '', customerFolder: 'Joey', granted: true }] },
    }),
    allowed: ['Admin'],
  },
  {
    name: 'GET /api/customers',
    request: () => ({ url: '/api/customers' }),
    allowed: ['User', 'Editor', 'Admin'],
  },
  {
    name: 'GET /api/prints',
    request: () => ({ url: '/api/prints' }),
    allowed: ['User', 'Editor', 'Admin'],
  },
  {
    name: 'GET /api/tags',
    request: () => ({ url: '/api/tags' }),
    allowed: ['User', 'Editor', 'Admin'],
  },
  {
    name: 'POST /api/tags',
    request: () => ({
      method: 'POST',
      url: '/api/tags',
      payload: { name: `t${String(Math.random()).slice(2)}` },
    }),
    allowed: ['Editor', 'Admin'],
  },
  {
    name: 'DELETE /api/prints/:id',
    request: () => ({ method: 'DELETE', url: `/api/prints/${UNKNOWN}` }),
    allowed: ['Editor', 'Admin'],
  },
  {
    name: 'POST /api/prints/:id/restore',
    request: () => ({ method: 'POST', url: `/api/prints/${UNKNOWN}/restore` }),
    allowed: ['Admin'],
  },
  {
    name: 'PUT /api/prints/:id/tags',
    request: () => ({ method: 'PUT', url: `/api/prints/${UNKNOWN}/tags`, payload: { tagIds: [] } }),
    allowed: ['Editor', 'Admin'],
  },
  {
    name: 'GET /api/assets/:id/download',
    request: () => ({ url: `/api/assets/${UNKNOWN}/download` }),
    allowed: ['Editor', 'Admin'],
  },
  {
    name: 'DELETE /api/customers/:folder',
    request: () => ({ method: 'DELETE', url: '/api/customers/Nobody' }),
    allowed: ['Editor', 'Admin'],
  },
  {
    name: 'POST /api/customers/:folder/restore',
    request: () => ({ method: 'POST', url: '/api/customers/Nobody/restore' }),
    allowed: ['Admin'],
  },
  {
    name: 'POST /api/admin/reindex',
    request: () => ({ method: 'POST', url: '/api/admin/reindex' }),
    allowed: ['Admin'],
  },
];

describe.each(TEST_DATABASES)('authorisation matrix on $name', ({ url }) => {
  let t: TestApp;
  const sessions: Partial<Record<Caller, Session>> = {};
  const ids: Record<string, string> = {};

  beforeAll(async () => {
    t = await startTestApp(url);
    for (const role of ['User', 'Editor', 'Admin'] as const) {
      await t.addUser(`${role.toLowerCase()}@example.org`, role);
      sessions[role] = await t.login(`${role.toLowerCase()}@example.org`);
    }
    ids.target = await t.addUser('target@example.org', 'User');
  });

  afterAll(async () => {
    await t.app.services.indexer.idle();
    await t.close();
  });

  const callers: Caller[] = ['anonymous', 'User', 'Editor', 'Admin'];
  const cases = ENDPOINTS.flatMap((endpoint) =>
    callers.map((caller) => ({ ...endpoint, caller, ok: endpoint.allowed.includes(caller) })),
  );

  it.each(cases)('$name as $caller → ok=$ok', async ({ request, caller, ok }) => {
    const response = await t.as(
      caller === 'anonymous' ? null : (sessions[caller] ?? null),
      request(ids),
    );
    if (ok) {
      expect([401, 403]).not.toContain(response.statusCode);
    } else {
      expect(response.statusCode).toBe(caller === 'anonymous' ? 401 : 403);
    }
  });
});
