import { afterEach, describe, expect, it } from 'vitest';
import { startTestApp, type TestApp } from '../helpers/app.js';

describe('forwarded headers', () => {
  let t: TestApp | undefined;

  afterEach(async () => {
    await t?.close();
    t = undefined;
  });

  async function loginVia(env: Record<string, string>, remoteAddress: string) {
    t = await startTestApp('sqlite::memory:', env);
    await t.addUser('helper@example.org', 'User');
    const response = await t.app.inject({
      method: 'POST',
      url: '/api/auth/login',
      remoteAddress,
      headers: { 'x-forwarded-proto': 'https', 'x-forwarded-for': '203.0.113.9' },
      payload: { login: 'helper@example.org', password: 'correct horse battery' },
    });
    expect(response.statusCode).toBe(200);
    return response.cookies.find((c) => c.name === 'pp_session');
  }

  it('marks the cookie Secure behind a trusted HTTPS proxy', async () => {
    const cookie = await loginVia({ TRUSTED_PROXIES: '10.0.0.0/8' }, '10.1.2.3');
    expect(cookie?.secure).toBe(true);
  });

  it('ignores forwarded headers from an untrusted address', async () => {
    const cookie = await loginVia({ TRUSTED_PROXIES: '10.0.0.0/8' }, '192.0.2.50');
    expect(cookie?.secure).toBeUndefined();
  });

  it('ignores forwarded headers when no proxy is configured', async () => {
    const cookie = await loginVia({}, '10.1.2.3');
    expect(cookie?.secure).toBeUndefined();
  });

  it('rate-limits by the client address a trusted proxy forwards', async () => {
    t = await startTestApp('sqlite::memory:', {
      TRUSTED_PROXIES: '10.0.0.1',
      RATE_LIMIT_LOGIN: '1',
    });
    const attempt = (client: string) =>
      t?.app.inject({
        method: 'POST',
        url: '/api/auth/login',
        remoteAddress: '10.0.0.1',
        headers: { 'x-forwarded-for': client },
        payload: { login: 'nobody@example.org', password: 'guess' },
      });
    expect((await attempt('203.0.113.1'))?.statusCode).toBe(401);
    expect((await attempt('203.0.113.1'))?.statusCode).toBe(429);
    expect((await attempt('203.0.113.2'))?.statusCode).toBe(401);
  });
});

describe('CORS', () => {
  let t: TestApp | undefined;

  afterEach(async () => {
    await t?.close();
  });

  it('allows only configured origins, with credentials', async () => {
    t = await startTestApp('sqlite::memory:', { CORS_ORIGINS: 'https://tools.example.org' });
    const allowed = await t.app.inject({
      method: 'GET',
      url: '/api/auth/config',
      headers: { origin: 'https://tools.example.org' },
    });
    expect(allowed.headers['access-control-allow-origin']).toBe('https://tools.example.org');
    expect(allowed.headers['access-control-allow-credentials']).toBe('true');
    const other = await t.app.inject({
      method: 'GET',
      url: '/api/auth/config',
      headers: { origin: 'https://evil.example' },
    });
    expect(other.headers['access-control-allow-origin']).toBeUndefined();
  });

  it('sends no CORS headers when CORS_ORIGINS is empty', async () => {
    t = await startTestApp('sqlite::memory:');
    const response = await t.app.inject({
      method: 'GET',
      url: '/api/auth/config',
      headers: { origin: 'https://tools.example.org' },
    });
    expect(response.headers['access-control-allow-origin']).toBeUndefined();
  });
});
