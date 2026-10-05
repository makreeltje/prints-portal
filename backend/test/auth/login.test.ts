import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { SESSION_ABSOLUTE_MS, SESSION_IDLE_MS } from '../../src/auth/sessions.js';
import { startTestApp, TEST_PASSWORD, type TestApp } from '../helpers/app.js';
import { TEST_DATABASES } from '../helpers/databases.js';

describe.each(TEST_DATABASES)('local login on $name', ({ url }) => {
  let t: TestApp;

  beforeEach(async () => {
    t = await startTestApp(url, { RATE_LIMIT_LOGIN: '20' });
    await t.addUser('helper@example.org', 'User');
  });

  afterEach(async () => {
    await t.close();
  });

  it('reports the enabled sign-in methods to anyone', async () => {
    const response = await t.as(null, { url: '/api/auth/config' });
    expect(response.json()).toEqual({ local: true, oidc: false });
  });

  it('signs in with a case-insensitive e-mail address and sets a hardened cookie', async () => {
    const response = await t.app.inject({
      method: 'POST',
      url: '/api/auth/login',
      payload: { login: ' Helper@Example.org ', password: TEST_PASSWORD },
    });
    expect(response.statusCode).toBe(200);
    expect(response.json()).toMatchObject({
      user: { login: 'helper@example.org', role: 'User', origin: 'local' },
      csrfToken: expect.any(String) as string,
    });
    expect(response.json()).not.toHaveProperty('user.passwordHash');
    const cookie = response.cookies.find((c) => c.name === 'pp_session');
    expect(cookie).toMatchObject({ httpOnly: true, sameSite: 'Lax', path: '/' });
    expect(cookie?.secure).toBeUndefined(); // plain http; see the proxy tests for https

    const stored = await t.db.selectFrom('sessions').selectAll().execute();
    expect(stored).toHaveLength(1);
    expect(stored[0]?.id_hash).not.toBe(cookie?.value);
  });

  it('refuses a wrong password or unknown user with the same answer', async () => {
    for (const payload of [
      { login: 'helper@example.org', password: 'wrong password!' },
      { login: 'nobody@example.org', password: TEST_PASSWORD },
    ]) {
      const response = await t.app.inject({ method: 'POST', url: '/api/auth/login', payload });
      expect(response.statusCode).toBe(401);
      expect(response.json()).toEqual({ error: 'invalid_credentials' });
      expect(response.cookies).toEqual([]);
    }
  });

  it('accepts only JSON logins', async () => {
    const response = await t.app.inject({
      method: 'POST',
      url: '/api/auth/login',
      headers: { 'content-type': 'application/x-www-form-urlencoded' },
      payload: 'login=helper%40example.org&password=x',
    });
    expect(response.statusCode).toBe(415);
  });

  it('returns the session with its CSRF token', async () => {
    const session = await t.login('helper@example.org');
    const response = await t.as(session, { url: '/api/auth/session' });
    expect(response.statusCode).toBe(200);
    expect(response.json()).toMatchObject({
      user: { login: 'helper@example.org' },
      csrfToken: session.csrfToken,
    });
    expect((await t.as(null, { url: '/api/auth/session' })).statusCode).toBe(401);
  });

  it('requires the CSRF token for changing requests', async () => {
    const session = await t.login('helper@example.org');
    const withoutToken = await t.app.inject({
      method: 'POST',
      url: '/api/auth/logout',
      headers: { cookie: session.cookie },
    });
    expect(withoutToken.statusCode).toBe(403);
    expect(withoutToken.json()).toEqual({ error: 'csrf' });

    const wrongToken = await t.as(
      { ...session, csrfToken: 'x'.repeat(session.csrfToken.length) },
      { method: 'POST', url: '/api/auth/logout' },
    );
    expect(wrongToken.statusCode).toBe(403);
  });

  it('logs out and forgets the session', async () => {
    const session = await t.login('helper@example.org');
    const response = await t.as(session, { method: 'POST', url: '/api/auth/logout' });
    expect(response.statusCode).toBe(204);
    expect(response.cookies.find((c) => c.name === 'pp_session')?.value).toBe('');
    expect((await t.as(session, { url: '/api/auth/session' })).statusCode).toBe(401);
  });

  it('expires after an hour without requests', async () => {
    const session = await t.login('helper@example.org');
    t.clock.advance(SESSION_IDLE_MS - 60_000);
    expect((await t.as(session, { url: '/api/auth/session' })).statusCode).toBe(200);
    // That request moved the idle window.
    t.clock.advance(SESSION_IDLE_MS - 60_000);
    expect((await t.as(session, { url: '/api/auth/session' })).statusCode).toBe(200);
    t.clock.advance(SESSION_IDLE_MS);
    const expired = await t.as(session, { url: '/api/auth/session' });
    expect(expired.statusCode).toBe(401);
    expect(expired.cookies.find((c) => c.name === 'pp_session')?.value).toBe('');
  });

  it('expires 12 hours after sign-in even when used', async () => {
    const session = await t.login('helper@example.org');
    for (let elapsed = 0; elapsed < SESSION_ABSOLUTE_MS - 30 * 60_000; elapsed += 30 * 60_000) {
      t.clock.advance(30 * 60_000);
      expect((await t.as(session, { url: '/api/auth/session' })).statusCode).toBe(200);
    }
    t.clock.advance(30 * 60_000);
    expect((await t.as(session, { url: '/api/auth/session' })).statusCode).toBe(401);
  });

  it('ends sessions when the user is removed', async () => {
    const session = await t.login('helper@example.org');
    await t.db.deleteFrom('users').where('login', '=', 'helper@example.org').execute();
    expect((await t.as(session, { url: '/api/auth/session' })).statusCode).toBe(401);
  });

  it('answers unknown API paths with 404 once signed in', async () => {
    const session = await t.login('helper@example.org');
    expect((await t.as(session, { url: '/api/nothing-here' })).statusCode).toBe(404);
  });
});

describe('login rate limit', () => {
  let t: TestApp;

  beforeEach(async () => {
    t = await startTestApp('sqlite::memory:', { RATE_LIMIT_LOGIN: '3' });
  });

  afterEach(async () => {
    await t.close();
  });

  it('answers 429 with Retry-After once the limit per minute is used up', async () => {
    const attempt = () =>
      t.app.inject({
        method: 'POST',
        url: '/api/auth/login',
        payload: { login: 'nobody@example.org', password: 'guess' },
      });
    for (let i = 0; i < 3; i++) expect((await attempt()).statusCode).toBe(401);
    const limited = await attempt();
    expect(limited.statusCode).toBe(429);
    expect(Number(limited.headers['retry-after'])).toBeGreaterThan(0);
  });
});
