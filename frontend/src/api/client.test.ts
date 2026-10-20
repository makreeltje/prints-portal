import { afterEach, describe, expect, it, vi } from 'vitest';
import { stubFetch } from '../test/render';
import { api, ApiError, setCsrfToken, setUnauthorizedHandler } from './client';

afterEach(() => {
  vi.unstubAllGlobals();
  setCsrfToken(null);
  setUnauthorizedHandler(null);
});

describe('api', () => {
  it('sends the CSRF token on changing requests only', async () => {
    const calls = stubFetch({
      'GET /api/x': () => ({ json: { ok: 1 } }),
      'POST /api/x': () => ({ status: 204 }),
    });
    setCsrfToken('token-1');
    expect(await api('/api/x')).toEqual({ ok: 1 });
    await api('/api/x', { method: 'POST', body: { a: 1 } });
    expect(calls[0]?.headers['x-csrf-token']).toBeUndefined();
    expect(calls[1]?.headers).toMatchObject({
      'x-csrf-token': 'token-1',
      'content-type': 'application/json',
    });
  });

  it('accepts an answer with no body whatever its status', async () => {
    stubFetch({
      // What "Markeer als betaald" answered: created, nothing in it.
      'POST /api/paid': () => ({ status: 201, noBody: true }),
      'PUT /api/saved': () => ({ status: 204 }),
    });
    await expect(
      api('/api/paid', { method: 'POST', body: { amount: 5 } }),
    ).resolves.toBeUndefined();
    await expect(api('/api/saved', { method: 'PUT', body: {} })).resolves.toBeUndefined();
  });

  it('turns failures into ApiError with the error code and reports 401', async () => {
    stubFetch({
      'GET /api/a': () => ({ status: 409, json: { error: 'last_admin' } }),
      'GET /api/b': () => ({ status: 401, json: { error: 'unauthorized' } }),
    });
    const onUnauthorized = vi.fn();
    setUnauthorizedHandler(onUnauthorized);
    await expect(api('/api/a')).rejects.toEqual(new ApiError(409, 'last_admin'));
    await expect(api('/api/b')).rejects.toBeInstanceOf(ApiError);
    expect(onUnauthorized).toHaveBeenCalledOnce();
    await expect(api('/api/b', { quiet401: true })).rejects.toBeInstanceOf(ApiError);
    expect(onUnauthorized).toHaveBeenCalledOnce();
  });
});
