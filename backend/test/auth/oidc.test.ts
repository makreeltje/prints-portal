import { afterAll, beforeAll, beforeEach, afterEach, describe, expect, it } from 'vitest';
import { findUserByLogin } from '../../src/auth/users.js';
import { startTestApp, type TestApp } from '../helpers/app.js';
import { TEST_DATABASES } from '../helpers/databases.js';
import { FakeOidcProvider, type FakeUser } from '../helpers/oidc-provider.js';

const PUBLIC_URL = 'http://prints.test';
const ADMIN_GROUP = 'prints-admins';

describe.each(TEST_DATABASES)('OIDC sign-in on $name', ({ url }) => {
  const provider = new FakeOidcProvider();
  let t: TestApp;

  beforeAll(async () => {
    await provider.start();
  });

  afterAll(async () => {
    await provider.stop();
  });

  beforeEach(async () => {
    provider.groupsInUserinfoOnly = false;
    t = await startTestApp(url, {
      OIDC_ISSUER: provider.issuer,
      OIDC_CLIENT_ID: provider.clientId,
      OIDC_CLIENT_SECRET: provider.clientSecret,
      OIDC_ADMIN_GROUP: ADMIN_GROUP,
      PUBLIC_URL,
    });
  });

  afterEach(async () => {
    await t.close();
  });

  /** Runs the browser's part of the flow; returns the callback response. */
  async function signIn(user: FakeUser, tamper?: (callback: URL) => void) {
    provider.nextUser = user;
    const start = await t.app.inject({ method: 'GET', url: '/api/auth/oidc/login' });
    expect(start.statusCode).toBe(302);
    const flowCookie = start.cookies.find((c) => c.name === 'pp_oidc');
    expect(flowCookie).toMatchObject({ httpOnly: true, sameSite: 'Lax', path: '/api/auth/oidc' });

    const authorize = new URL(String(start.headers.location));
    expect(authorize.origin).toBe(provider.issuer);
    expect(authorize.searchParams.get('redirect_uri')).toBe(`${PUBLIC_URL}/api/auth/oidc/callback`);
    expect(authorize.searchParams.get('code_challenge_method')).toBe('S256');

    const providerResponse = await fetch(authorize, { redirect: 'manual' });
    const callback = new URL(providerResponse.headers.get('location') ?? '');
    tamper?.(callback);
    return t.app.inject({
      method: 'GET',
      url: `${callback.pathname}${callback.search}`,
      headers: { cookie: `pp_oidc=${flowCookie?.value ?? ''}` },
    });
  }

  function sessionCookie(response: Awaited<ReturnType<typeof signIn>>): string {
    const cookie = response.cookies.find((c) => c.name === 'pp_session');
    if (cookie === undefined) throw new Error('no session cookie');
    return `pp_session=${cookie.value}`;
  }

  it('turns local login off', async () => {
    expect((await t.as(null, { url: '/api/auth/config' })).json()).toEqual({
      local: false,
      oidc: true,
    });
    await t.addUser('owner@example.org', 'Admin');
    const login = await t.app.inject({
      method: 'POST',
      url: '/api/auth/login',
      payload: { login: 'owner@example.org', password: 'correct horse battery' },
    });
    expect(login.statusCode).toBe(404);
  });

  it('signs a new person in as User and issues the normal session cookie', async () => {
    const response = await signIn({ sub: 's-1', email: 'Helper@Example.org', name: 'Helper' });
    expect(response.statusCode).toBe(302);
    expect(response.headers.location).toBe('/');
    expect(response.cookies.find((c) => c.name === 'pp_oidc')?.value).toBe('');

    const session = await t.as(null, {
      url: '/api/auth/session',
      headers: { cookie: sessionCookie(response) },
    });
    expect(session.json()).toMatchObject({
      user: { login: 'helper@example.org', displayName: 'Helper', role: 'User', origin: 'oidc' },
    });
  });

  it('makes members of the admin group Admin, and demotes them when they leave it', async () => {
    await signIn({ sub: 's-2', email: 'owner@example.org', groups: [ADMIN_GROUP] });
    expect((await findUserByLogin(t.db, 'owner@example.org'))?.role).toBe('Admin');
    await signIn({ sub: 's-2', email: 'owner@example.org', groups: [] });
    expect((await findUserByLogin(t.db, 'owner@example.org'))?.role).toBe('User');
  });

  it('reads groups from userinfo when the ID token has none', async () => {
    provider.groupsInUserinfoOnly = true;
    await signIn({ sub: 's-3', email: 'owner@example.org', groups: [ADMIN_GROUP] });
    expect((await findUserByLogin(t.db, 'owner@example.org'))?.role).toBe('Admin');
  });

  it('keeps a role an Admin set by hand', async () => {
    await signIn({ sub: 's-4', email: 'editor@example.org' });
    await t.db
      .updateTable('users')
      .set({ role: 'Editor' })
      .where('oidc_subject', '=', 's-4')
      .execute();
    await signIn({ sub: 's-4', email: 'editor@example.org', name: 'Renamed' });
    const user = await findUserByLogin(t.db, 'editor@example.org');
    expect(user).toMatchObject({ role: 'Editor', display_name: 'Renamed' });
  });

  it('takes over an existing local account with the same e-mail address', async () => {
    const id = await t.addUser('owner@example.org', 'Admin');
    await signIn({ sub: 's-5', email: 'owner@example.org' });
    const user = await findUserByLogin(t.db, 'owner@example.org');
    expect(user).toMatchObject({ id, oidc_subject: 's-5', role: 'Admin', password_hash: null });
  });

  it.each([
    [
      'a wrong state',
      (callback: URL) => {
        callback.searchParams.set('state', 'forged');
      },
    ],
    [
      'a forged code',
      (callback: URL) => {
        callback.searchParams.set('code', 'forged');
      },
    ],
  ])('refuses %s', async (_label, tamper) => {
    const response = await signIn({ sub: 's-6', email: 'x@example.org' }, tamper);
    expect(response.headers.location).toBe('/login?error=oidc');
    expect(response.cookies.find((c) => c.name === 'pp_session')).toBeUndefined();
    expect(await findUserByLogin(t.db, 'x@example.org')).toBeUndefined();
  });

  it('refuses a callback without the signed flow cookie', async () => {
    provider.nextUser = { sub: 's-7', email: 'y@example.org' };
    const start = await t.app.inject({ method: 'GET', url: '/api/auth/oidc/login' });
    const providerResponse = await fetch(String(start.headers.location), { redirect: 'manual' });
    const callback = new URL(providerResponse.headers.get('location') ?? '');
    const forgedCookie = await t.app.inject({
      method: 'GET',
      url: `${callback.pathname}${callback.search}`,
      headers: {
        cookie: 'pp_oidc=' + encodeURIComponent('{"state":"a","nonce":"b","codeVerifier":"c"}'),
      },
    });
    expect(forgedCookie.headers.location).toBe('/login?error=oidc');
    const none = await t.app.inject({
      method: 'GET',
      url: `${callback.pathname}${callback.search}`,
    });
    expect(none.headers.location).toBe('/login?error=oidc');
  });
});

describe('OIDC with an unreachable provider', () => {
  it('sends the browser back to the login page and retries discovery later', async () => {
    const t = await startTestApp('sqlite::memory:', {
      OIDC_ISSUER: 'http://127.0.0.1:1',
      OIDC_CLIENT_ID: 'x',
      OIDC_CLIENT_SECRET: 'y',
      OIDC_ADMIN_GROUP: 'z',
      PUBLIC_URL,
    });
    try {
      for (let i = 0; i < 2; i++) {
        const response = await t.app.inject({ method: 'GET', url: '/api/auth/oidc/login' });
        expect(response.statusCode).toBe(302);
        expect(response.headers.location).toBe('/login?error=oidc');
      }
    } finally {
      await t.close();
    }
  });
});
