import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { canAccessCustomer, customerScope } from '../../src/auth/access.js';
import type { AppDatabase } from '../../src/db/connection.js';
import { startTestApp, TEST_PASSWORD, type Session, type TestApp } from '../helpers/app.js';
import { TEST_DATABASES } from '../helpers/databases.js';

async function addRecord(db: AppDatabase, customer: string, status = 'indexed' as const) {
  const now = '2026-10-05T10:00:00.000Z';
  await db
    .insertInto('print_records')
    .values({
      id: crypto.randomUUID(),
      record_key: `${customer}/${crypto.randomUUID()}`,
      customer_folder: customer,
      project_folder: 'Box',
      display_name: 'Box',
      origin: 'indexed' as const,
      status,
      discovered_at: now,
      last_seen_at: now,
      archived_at: null,
      deleted_at: null,
      deleted_by: null,
      part_name: null,
      material: null,
      printer_model: null,
      print_date: null,
      total_grams: null,
      total_print_seconds: null,
      updated_at: now,
    })
    .execute();
}

describe.each(TEST_DATABASES)('users and access on $name', ({ url }) => {
  let t: TestApp;
  let admin: Session;
  let ids: Record<'admin' | 'editor' | 'helper', string>;

  beforeEach(async () => {
    t = await startTestApp(url);
    ids = {
      admin: await t.addUser('owner@example.org', 'Admin'),
      editor: await t.addUser('editor@example.org', 'Editor'),
      helper: await t.addUser('helper@example.org', 'User'),
    };
    admin = await t.login('owner@example.org');
  });

  afterEach(async () => {
    await t.close();
  });

  it('lists users without secrets', async () => {
    const response = await t.as(admin, { url: '/api/users' });
    expect(response.statusCode).toBe(200);
    const { users } = response.json<{ users: Record<string, unknown>[] }>();
    expect(users.map((u) => u.login)).toEqual([
      'editor@example.org',
      'helper@example.org',
      'owner@example.org',
    ]);
    expect(users[0]).toEqual({
      id: ids.editor,
      login: 'editor@example.org',
      displayName: 'editor@example.org',
      role: 'Editor',
      origin: 'local',
      lastLoginAt: null,
    });
    expect(response.body).not.toMatch(/password|argon/i);
  });

  it('creates a local user who can then sign in', async () => {
    const created = await t.as(admin, {
      method: 'POST',
      url: '/api/users',
      payload: { login: 'New@Example.org', role: 'User', password: 'temporary-password' },
    });
    expect(created.statusCode).toBe(201);
    expect(created.json()).toMatchObject({ login: 'new@example.org', role: 'User' });
    await t.login('new@example.org', 'temporary-password');

    const duplicate = await t.as(admin, {
      method: 'POST',
      url: '/api/users',
      payload: { login: 'new@example.org', role: 'User', password: 'temporary-password' },
    });
    expect(duplicate.statusCode).toBe(409);
    expect(duplicate.json()).toEqual({ error: 'login_taken' });
  });

  it.each([
    [{ login: 'a@example.org', role: 'User', password: 'short' }, 'password_too_short'],
    [{ login: '   ', role: 'User', password: 'temporary-password' }, undefined],
    [{ login: 'a@example.org', role: 'Owner', password: 'temporary-password' }, undefined],
  ])('rejects %j', async (payload, error) => {
    const response = await t.as(admin, { method: 'POST', url: '/api/users', payload });
    expect(response.statusCode).toBe(400);
    if (error !== undefined) expect(response.json()).toEqual({ error });
  });

  it('changes a role; the change applies to open sessions at once', async () => {
    const helper = await t.login('helper@example.org');
    expect((await t.as(helper, { url: '/api/users' })).statusCode).toBe(403);
    const response = await t.as(admin, {
      method: 'PATCH',
      url: `/api/users/${ids.helper}`,
      payload: { role: 'Admin' },
    });
    expect(response.json()).toMatchObject({ role: 'Admin' });
    expect((await t.as(helper, { url: '/api/users' })).statusCode).toBe(200);
  });

  it('never removes or demotes the last Admin', async () => {
    const demote = await t.as(admin, {
      method: 'PATCH',
      url: `/api/users/${ids.admin}`,
      payload: { role: 'Editor' },
    });
    expect(demote.statusCode).toBe(409);
    expect(demote.json()).toEqual({ error: 'last_admin' });
    const remove = await t.as(admin, { method: 'DELETE', url: `/api/users/${ids.admin}` });
    expect(remove.statusCode).toBe(409);

    await t.as(admin, {
      method: 'PATCH',
      url: `/api/users/${ids.editor}`,
      payload: { role: 'Admin' },
    });
    const now = await t.as(admin, {
      method: 'PATCH',
      url: `/api/users/${ids.admin}`,
      payload: { role: 'Editor' },
    });
    expect(now.statusCode).toBe(200);
  });

  it('resets a password and signs that user out everywhere', async () => {
    const helper = await t.login('helper@example.org');
    const response = await t.as(admin, {
      method: 'POST',
      url: `/api/users/${ids.helper}/password`,
      payload: { password: 'another-temporary-pw' },
    });
    expect(response.statusCode).toBe(204);
    expect((await t.as(helper, { url: '/api/auth/session' })).statusCode).toBe(401);
    await expect(t.login('helper@example.org', TEST_PASSWORD)).rejects.toThrow(/401/);
    await t.login('helper@example.org', 'another-temporary-pw');
  });

  it('does not reset the password of an OIDC user', async () => {
    await t.db
      .updateTable('users')
      .set({ oidc_subject: 'sub' })
      .where('id', '=', ids.helper)
      .execute();
    const response = await t.as(admin, {
      method: 'POST',
      url: `/api/users/${ids.helper}/password`,
      payload: { password: 'another-temporary-pw' },
    });
    expect(response.statusCode).toBe(409);
    expect(response.json()).toEqual({ error: 'not_local' });
  });

  it('deletes a user with their sessions and grants', async () => {
    const helper = await t.login('helper@example.org');
    await t.as(admin, {
      method: 'PATCH',
      url: '/api/access',
      payload: { changes: [{ userId: ids.helper, customerFolder: 'Joey', granted: true }] },
    });
    expect(
      (await t.as(admin, { method: 'DELETE', url: `/api/users/${ids.helper}` })).statusCode,
    ).toBe(204);
    expect((await t.as(helper, { url: '/api/auth/session' })).statusCode).toBe(401);
    expect(await t.db.selectFrom('customer_access').selectAll().execute()).toEqual([]);
    expect(
      (await t.as(admin, { method: 'DELETE', url: `/api/users/${ids.helper}` })).statusCode,
    ).toBe(404);
  });

  it('returns the access matrix: customers from the index, grants for Users, all for others', async () => {
    await addRecord(t.db, 'Wouter');
    await addRecord(t.db, 'Joey');
    await addRecord(t.db, 'Joey');
    await addRecord(t.db, 'Gone', 'deleted' as never);
    await t.as(admin, {
      method: 'PATCH',
      url: '/api/access',
      payload: { changes: [{ userId: ids.helper, customerFolder: 'Joey', granted: true }] },
    });
    const response = await t.as(admin, { url: '/api/access' });
    const body = response.json<{
      customers: string[];
      users: { login: string; customers: string[] }[];
    }>();
    expect(body.customers).toEqual(['Joey', 'Wouter']);
    expect(body.users.map((u) => [u.login, u.customers])).toEqual([
      ['editor@example.org', ['Joey', 'Wouter']],
      ['helper@example.org', ['Joey']],
      ['owner@example.org', ['Joey', 'Wouter']],
    ]);
  });

  it('grants and revokes in one request, idempotently', async () => {
    const change = (customerFolder: string, granted: boolean) => ({
      userId: ids.helper,
      customerFolder,
      granted,
    });
    const patch = (changes: ReturnType<typeof change>[]) =>
      t.as(admin, { method: 'PATCH', url: '/api/access', payload: { changes } });
    expect(
      (await patch([change('Joey', true), change('Joey', true), change('Wouter', true)]))
        .statusCode,
    ).toBe(204);
    await patch([change('Wouter', false)]);
    const scope = await customerScope(t.db, { id: ids.helper, role: 'User' });
    expect(scope).toEqual({ kind: 'some', customerFolders: new Set(['Joey']) });
  });

  it('refuses grants for Editors and Admins and for unknown users', async () => {
    const forEditor = await t.as(admin, {
      method: 'PATCH',
      url: '/api/access',
      payload: { changes: [{ userId: ids.editor, customerFolder: 'Joey', granted: true }] },
    });
    expect(forEditor.statusCode).toBe(400);
    const unknown = await t.as(admin, {
      method: 'PATCH',
      url: '/api/access',
      payload: { changes: [{ userId: 'nobody', customerFolder: 'Joey', granted: true }] },
    });
    expect(unknown.statusCode).toBe(404);
  });

  it('decides customer access by role and grant, case-sensitively', async () => {
    await t.as(admin, {
      method: 'PATCH',
      url: '/api/access',
      payload: { changes: [{ userId: ids.helper, customerFolder: 'Joey', granted: true }] },
    });
    const helper = { id: ids.helper, role: 'User' as const };
    expect(await canAccessCustomer(t.db, helper, 'Joey')).toBe(true);
    expect(await canAccessCustomer(t.db, helper, 'joey')).toBe(false);
    expect(await canAccessCustomer(t.db, helper, 'Denise')).toBe(false);
    expect(await canAccessCustomer(t.db, { id: ids.editor, role: 'Editor' }, 'Denise')).toBe(true);
    expect(await canAccessCustomer(t.db, { id: ids.admin, role: 'Admin' }, 'Denise')).toBe(true);
  });
});

describe('creating local users with OIDC on', () => {
  it('is refused, because local sign-in is off', async () => {
    const t = await startTestApp('sqlite::memory:', {
      OIDC_ISSUER: 'http://127.0.0.1:1',
      OIDC_CLIENT_ID: 'x',
      OIDC_CLIENT_SECRET: 'y',
      OIDC_ADMIN_GROUP: 'z',
      PUBLIC_URL: 'http://prints.test',
    });
    try {
      await t.addUser('owner@example.org', 'Admin');
      // No local login with OIDC: open a session directly.
      const { SessionStore } = await import('../../src/auth/sessions.js');
      const store = new SessionStore(t.db, t.config.auth.sessionSecret, t.clock.now);
      const owner = await t.db.selectFrom('users').select('id').executeTakeFirstOrThrow();
      const created = await store.create(owner.id);
      const response = await t.as(
        { cookie: `pp_session=${created.token}`, csrfToken: created.csrfToken },
        {
          method: 'POST',
          url: '/api/users',
          payload: { login: 'a@example.org', role: 'User', password: 'temporary-password' },
        },
      );
      expect(response.statusCode).toBe(409);
      expect(response.json()).toEqual({ error: 'local_login_disabled' });
    } finally {
      await t.close();
    }
  });
});
