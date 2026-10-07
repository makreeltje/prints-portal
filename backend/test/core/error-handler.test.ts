import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { startTestApp, type Session, type TestApp } from '../helpers/app.js';
import { TEST_DATABASES } from '../helpers/databases.js';

describe.each(TEST_DATABASES.slice(0, 1))('error responses on $name', ({ url }) => {
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

  it('answers an unexpected failure with the status and nothing else', async () => {
    // A real internal failure: the database is gone underneath the route.
    await t.db.destroy();

    const response = await t.as(admin, { url: '/api/tags' });
    expect(response.statusCode).toBe(500);
    expect(response.json()).toEqual({ statusCode: 500, error: 'Internal Server Error' });
    // Nothing about the inside of the app: no message, no stack, no SQL.
    for (const leak of ['sqlite', 'SQL', 'select', 'kysely', 'stack', 'destroyed']) {
      expect(response.body.toLowerCase()).not.toContain(leak.toLowerCase());
    }
  });

  it('keeps the message of a validation error, which names the field', async () => {
    // limit has a maximum of 100 in the schema.
    const response = await t.as(admin, { url: '/api/prints?limit=9999' });
    expect(response.statusCode).toBe(400);
    const body = response.json<{ message: string; code?: string }>();
    expect(body.message).toContain('limit');
    expect(body.code).toBe('FST_ERR_VALIDATION');
  });

  it('keeps the bodies the routes answer with deliberately', async () => {
    // The guard's own replies are sent, not thrown, so they pass through untouched.
    expect((await t.as(null, { url: '/api/prints' })).json()).toEqual({ error: 'unauthorized' });
    const unknown = await t.as(admin, { url: '/api/prints/00000000-0000-4000-8000-000000000000' });
    expect(unknown.statusCode).toBe(404);
    expect(unknown.json()).toEqual({ error: 'not_found' });
  });
});
