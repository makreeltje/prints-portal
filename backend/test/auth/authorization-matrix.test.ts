import type { InjectOptions } from 'fastify';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { startTestApp, type Session, type TestApp } from '../helpers/app.js';
import { TEST_DATABASES } from '../helpers/databases.js';

type Caller = 'anonymous' | 'User' | 'Editor' | 'Admin';

const UNKNOWN = '00000000-0000-4000-8000-000000000000';
const MANAGE: readonly Caller[] = ['Editor', 'Admin'];

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
      payload: { changes: [{ userId: ids.target ?? '', customerFolder: 'Koen', granted: true }] },
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
    // A klant may watch the film of their own print (GAP-175); the download
    // route below stays Editor and Admin, so nothing can be saved.
    name: 'GET /api/prints/:id/video',
    request: () => ({ url: `/api/prints/${UNKNOWN}/video` }),
    allowed: ['User', 'Editor', 'Admin'],
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
  // M6: financials. Users never reach any of them.
  { name: 'GET /api/spools', request: () => ({ url: '/api/spools' }), allowed: MANAGE },
  {
    name: 'GET /api/spoolman/status',
    request: () => ({ url: '/api/spoolman/status' }),
    allowed: MANAGE,
  },
  {
    name: 'POST /api/spoolman/refresh',
    request: () => ({ method: 'POST', url: '/api/spoolman/refresh' }),
    allowed: MANAGE,
  },
  {
    name: 'PUT /api/prints/:id/spool',
    request: () => ({
      method: 'PUT',
      url: `/api/prints/${UNKNOWN}/spool`,
      payload: { spoolId: null },
    }),
    allowed: MANAGE,
  },
  {
    name: 'PUT /api/prints/:id/lines/:lineId/override',
    request: () => ({
      method: 'PUT',
      url: `/api/prints/${UNKNOWN}/lines/${UNKNOWN}/override`,
      payload: { slot: 0, pricePerKg: 20 },
    }),
    allowed: MANAGE,
  },
  {
    name: 'PUT /api/prints/:id/lines/:lineId/excluded',
    request: () => ({
      method: 'PUT',
      url: `/api/prints/${UNKNOWN}/lines/${UNKNOWN}/excluded`,
      payload: { excluded: true },
    }),
    allowed: MANAGE,
  },
  {
    name: 'PUT /api/prints/:id/lines/:lineId/times',
    request: () => ({
      method: 'PUT',
      url: `/api/prints/${UNKNOWN}/lines/${UNKNOWN}/times`,
      payload: { timesPrinted: 2 },
    }),
    allowed: MANAGE,
  },
  {
    name: 'POST /api/prints/:id/orders',
    request: () => ({
      method: 'POST',
      url: `/api/prints/${UNKNOWN}/orders`,
      payload: { items: [{ lineId: UNKNOWN, timesPrinted: 1 }] },
    }),
    allowed: MANAGE,
  },
  {
    name: 'PUT /api/orders/:orderId/overrides',
    request: () => ({
      method: 'PUT',
      url: `/api/orders/${UNKNOWN}/overrides`,
      payload: { pricePerKg: null, grams: null, printSeconds: null },
    }),
    allowed: MANAGE,
  },
  {
    name: 'PUT /api/orders/:orderId/sale-price',
    request: () => ({
      method: 'PUT',
      url: `/api/orders/${UNKNOWN}/sale-price`,
      payload: { salePrice: 10 },
    }),
    allowed: MANAGE,
  },
  {
    name: 'POST /api/orders/:orderId/payments',
    request: () => ({
      method: 'POST',
      url: `/api/orders/${UNKNOWN}/payments`,
      payload: { amount: 1 },
    }),
    allowed: MANAGE,
  },
  {
    name: 'POST /api/orders/:orderId/payments/undo',
    request: () => ({ method: 'POST', url: `/api/orders/${UNKNOWN}/payments/undo` }),
    allowed: ['Admin'],
  },
  {
    name: 'POST /api/orders/:orderId/write-off',
    request: () => ({ method: 'POST', url: `/api/orders/${UNKNOWN}/write-off`, payload: {} }),
    allowed: MANAGE,
  },
  {
    name: 'DELETE /api/orders/:orderId/write-off',
    request: () => ({ method: 'DELETE', url: `/api/orders/${UNKNOWN}/write-off` }),
    allowed: ['Admin'],
  },
  {
    name: 'POST /api/calculate',
    request: () => ({ method: 'POST', url: '/api/calculate', payload: { grams: 10 } }),
    allowed: MANAGE,
  },
  { name: 'GET /api/settings', request: () => ({ url: '/api/settings' }), allowed: ['Admin'] },
  {
    name: 'PUT /api/settings/pricing',
    request: () => ({
      method: 'PUT',
      url: '/api/settings/pricing',
      payload: { defaultMarkupPercent: 400, tariffEurPerKwh: 0.25, materialPricesPerKg: {} },
    }),
    allowed: ['Admin'],
  },
  {
    name: 'PUT /api/settings/printers',
    request: () => ({ method: 'PUT', url: '/api/settings/printers', payload: [] }),
    allowed: ['Admin'],
  },
  {
    name: 'PUT /api/settings/company',
    request: () => ({
      method: 'PUT',
      url: '/api/settings/company',
      payload: { name: 'Studio', iban: '', address: '' },
    }),
    allowed: ['Admin'],
  },
  {
    name: 'PUT /api/customers/:folder/billing',
    request: () => ({
      method: 'PUT',
      url: '/api/customers/Nobody/billing',
      payload: { noBilling: true },
    }),
    allowed: ['Admin'],
  },
  {
    name: 'POST /api/prints/bulk',
    request: () => ({
      method: 'POST',
      url: '/api/prints/bulk',
      payload: { action: 'markPaid', ids: [UNKNOWN] },
    }),
    allowed: MANAGE,
  },
  {
    name: 'DELETE /api/orders/:orderId',
    request: () => ({ method: 'DELETE', url: `/api/orders/${UNKNOWN}` }),
    allowed: MANAGE,
  },
  {
    name: 'GET /api/settings/markup',
    request: () => ({ url: '/api/settings/markup' }),
    allowed: MANAGE,
  },
  {
    name: 'GET /api/outstanding',
    request: () => ({ url: '/api/outstanding' }),
    allowed: ['User', 'Editor', 'Admin'],
  },
  {
    name: 'POST /api/outstanding/:folder/mark-paid',
    request: () => ({ method: 'POST', url: '/api/outstanding/Nobody/mark-paid' }),
    allowed: MANAGE,
  },
  {
    name: 'GET /api/customers/:folder/reminder.pdf',
    request: () => ({ url: '/api/customers/Nobody/reminder.pdf' }),
    allowed: MANAGE,
  },
  {
    name: 'GET /api/customers/:folder/invoice/preview',
    request: () => ({ url: '/api/customers/Nobody/invoice/preview' }),
    allowed: MANAGE,
  },
  {
    name: 'GET /api/customers/:folder/invoice/concept.pdf',
    request: () => ({ url: '/api/customers/Nobody/invoice/concept.pdf' }),
    allowed: MANAGE,
  },
  {
    name: 'POST /api/customers/:folder/invoices',
    request: () => ({ method: 'POST', url: '/api/customers/Nobody/invoices', payload: {} }),
    allowed: MANAGE,
  },
  { name: 'GET /api/invoices', request: () => ({ url: '/api/invoices' }), allowed: MANAGE },
  {
    name: 'GET /api/invoices/:id',
    request: () => ({ url: `/api/invoices/${UNKNOWN}` }),
    allowed: MANAGE,
  },
  {
    name: 'GET /api/invoices/:id/pdf',
    request: () => ({ url: `/api/invoices/${UNKNOWN}/pdf` }),
    allowed: MANAGE,
  },
  {
    name: 'POST /api/invoices/:id/credit',
    request: () => ({
      method: 'POST',
      url: `/api/invoices/${UNKNOWN}/credit`,
      payload: { lineIds: [UNKNOWN] },
    }),
    allowed: ['Admin'],
  },
  {
    name: 'GET /api/settings/logo',
    request: () => ({ url: '/api/settings/logo' }),
    allowed: ['User', 'Editor', 'Admin'],
  },
  {
    name: 'PUT /api/settings/logo',
    request: () => ({
      method: 'PUT',
      url: '/api/settings/logo',
      headers: { 'content-type': 'image/png' },
      payload: Buffer.from('not a png'),
    }),
    allowed: ['Admin'],
  },
  {
    name: 'DELETE /api/settings/logo',
    request: () => ({ method: 'DELETE', url: '/api/settings/logo' }),
    allowed: ['Admin'],
  },
  {
    name: 'GET /api/share-links',
    request: () => ({ url: '/api/share-links' }),
    allowed: ['Admin'],
  },
  {
    name: 'POST /api/share-links',
    request: () => ({
      method: 'POST',
      url: '/api/share-links',
      payload: { customer: 'Nobody', label: 'x', expiresInDays: 7 },
    }),
    allowed: ['Admin'],
  },
  {
    name: 'POST /api/share-links/:id/revoke',
    request: () => ({ method: 'POST', url: `/api/share-links/${UNKNOWN}/revoke` }),
    allowed: ['Admin'],
  },
  // The share page needs no sign-in; the token is the key.
  {
    name: 'GET /api/share/:token',
    request: () => ({ url: `/api/share/${'A'.repeat(43)}` }),
    allowed: ['anonymous', 'User', 'Editor', 'Admin'],
  },
  {
    name: 'GET /api/share/:token/overview.pdf',
    request: () => ({ url: `/api/share/${'A'.repeat(43)}/overview.pdf` }),
    allowed: ['anonymous', 'User', 'Editor', 'Admin'],
  },
  {
    name: 'GET /api/share/:token/logo',
    request: () => ({ url: `/api/share/${'A'.repeat(43)}/logo` }),
    allowed: ['anonymous', 'User', 'Editor', 'Admin'],
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
