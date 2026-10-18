import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { startTestApp, TEST_PASSWORD, type Session, type TestApp } from '../helpers/app.js';
import { TEST_DATABASES } from '../helpers/databases.js';

describe.each(TEST_DATABASES)('sign-in names and temporary passwords on $name', ({ url }) => {
  let t: TestApp;
  let admin: Session;

  beforeEach(async () => {
    t = await startTestApp(url);
    await t.addUser('owner@example.org', 'Admin');
    admin = await t.login('owner@example.org');
  });

  afterEach(async () => {
    await t.close();
  });

  const create = (login: string, role = 'User') =>
    t.as(admin, {
      method: 'POST',
      url: '/api/users',
      payload: { login, role, password: 'temporary-password' },
    });

  const changePassword = (session: Session, currentPassword: string, newPassword: string) =>
    t.as(session, {
      method: 'POST',
      url: '/api/auth/password',
      payload: { currentPassword, newPassword },
    });

  it('creates a user with a plain name who signs in with it, case-insensitively', async () => {
    const response = await create(' Helper2 ');
    expect(response.statusCode).toBe(201);
    expect(response.json()).toMatchObject({ login: 'helper2', displayName: 'helper2' });
    await t.login('HELPER2', 'temporary-password');
    expect((await create('helper2')).json()).toEqual({ error: 'login_taken' });
  });

  it('makes a new user choose their own password before anything else', async () => {
    await create('koen');
    const session = await t.login('koen', 'temporary-password');

    const status = await t.as(session, { url: '/api/auth/session' });
    expect(status.json()).toMatchObject({ mustChangePassword: true });
    const blocked = await t.as(session, { url: '/api/nothing-here' });
    expect(blocked.statusCode).toBe(403);
    expect(blocked.json()).toEqual({ error: 'password_change_required' });

    const changed = await changePassword(session, 'temporary-password', 'my-own-long-password');
    expect(changed.statusCode).toBe(200);
    expect(changed.json()).toMatchObject({ mustChangePassword: false, user: { login: 'koen' } });
    expect((await t.as(session, { url: '/api/nothing-here' })).statusCode).toBe(404);
    await t.login('koen', 'my-own-long-password');
  });

  it.each([
    ['wrong-password!!', 'my-own-long-password', 'wrong_current_password'],
    ['temporary-password', 'too-short', 'password_too_short'],
    ['temporary-password', 'temporary-password', 'password_unchanged'],
  ])('refuses current=%s new=%s', async (current, next, error) => {
    await create('koen');
    const session = await t.login('koen', 'temporary-password');
    const response = await changePassword(session, current, next);
    expect(response.statusCode).toBe(400);
    expect(response.json()).toEqual({ error });
  });

  it('flags a reset password as temporary and signs the user out elsewhere', async () => {
    const id = await t.addUser('helper@example.org', 'User');
    const old = await t.login('helper@example.org');
    await t.as(admin, {
      method: 'POST',
      url: `/api/users/${id}/password`,
      payload: { password: 'reset-by-admin-pw' },
    });
    expect((await t.as(old, { url: '/api/auth/session' })).statusCode).toBe(401);
    const session = await t.login('helper@example.org', 'reset-by-admin-pw');
    expect((await t.as(session, { url: '/api/auth/session' })).json()).toMatchObject({
      mustChangePassword: true,
    });
  });

  it('accepts a new password without the temporary one, but not for a normal password', async () => {
    await create('koen');
    const session = await t.login('koen', 'temporary-password');
    const withoutCurrent = (s: Session) =>
      t.as(s, {
        method: 'POST',
        url: '/api/auth/password',
        payload: { newPassword: 'my-own-long-password' },
      });
    expect((await withoutCurrent(session)).statusCode).toBe(200);
    const again = await withoutCurrent(session);
    expect(again.statusCode).toBe(400);
    expect(again.json()).toEqual({ error: 'current_password_required' });
  });

  it('lets anyone change their own password and signs out their other sessions', async () => {
    await t.addUser('helper@example.org', 'User');
    const here = await t.login('helper@example.org');
    const elsewhere = await t.login('helper@example.org');
    const response = await changePassword(here, TEST_PASSWORD, 'a-brand-new-password');
    expect(response.statusCode).toBe(200);
    expect((await t.as(here, { url: '/api/auth/session' })).statusCode).toBe(200);
    expect((await t.as(elsewhere, { url: '/api/auth/session' })).statusCode).toBe(401);
  });

  it('needs the CSRF token and a session to change a password', async () => {
    expect((await changePassword({ cookie: '', csrfToken: '' }, 'a', 'b')).statusCode).toBe(401);
    const session = await t.login('owner@example.org');
    const response = await t.app.inject({
      method: 'POST',
      url: '/api/auth/password',
      headers: { cookie: session.cookie },
      payload: { currentPassword: TEST_PASSWORD, newPassword: 'a-brand-new-password' },
    });
    expect(response.statusCode).toBe(403);
  });

  it('refuses for OIDC users', async () => {
    const id = await t.addUser('helper@example.org', 'User');
    const session = await t.login('helper@example.org');
    await t.db.updateTable('users').set({ oidc_subject: 'sub' }).where('id', '=', id).execute();
    const response = await changePassword(session, TEST_PASSWORD, 'a-brand-new-password');
    expect(response.statusCode).toBe(409);
  });
});
