import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { BootstrapError, ensureBootstrapAdmin } from '../../src/auth/bootstrap.js';
import { verifyPassword } from '../../src/auth/passwords.js';
import { createUser, findUserByEmail } from '../../src/auth/users.js';
import { loadConfig } from '../../src/config/config.js';
import type { AppDatabase } from '../../src/db/connection.js';
import { TEST_SESSION_SECRET } from '../helpers/app.js';
import { openTestDatabase } from '../helpers/databases.js';

const STRONG = 'a-long-and-unique-password';
const silent = { info: () => undefined, warn: () => undefined };

describe('ensureBootstrapAdmin', () => {
  let db: AppDatabase;
  const config = (env: Record<string, string>) =>
    loadConfig({ SESSION_SECRET: TEST_SESSION_SECRET, ...env });

  beforeEach(async () => {
    db = await openTestDatabase('sqlite::memory:');
  });

  afterEach(async () => {
    await db.destroy();
  });

  it('creates the first Admin from ADMIN_EMAIL and ADMIN_PASSWORD', async () => {
    await ensureBootstrapAdmin(
      db,
      config({ ADMIN_EMAIL: 'Owner@Example.org', ADMIN_PASSWORD: STRONG }),
      silent,
    );
    const admin = await findUserByEmail(db, 'owner@example.org');
    expect(admin?.role).toBe('Admin');
    expect(await verifyPassword(admin?.password_hash ?? null, STRONG)).toBe(true);
  });

  it('does nothing once an Admin exists and never resets the password', async () => {
    await createUser(db, { email: 'owner@example.org', role: 'Admin' }, new Date());
    await ensureBootstrapAdmin(
      db,
      config({ ADMIN_EMAIL: 'owner@example.org', ADMIN_PASSWORD: STRONG }),
      silent,
    );
    expect((await findUserByEmail(db, 'owner@example.org'))?.password_hash).toBeNull();
  });

  it.each([
    ['without ADMIN_EMAIL', {}, /ADMIN_EMAIL/],
    ['with a short password', { ADMIN_EMAIL: 'o@example.org', ADMIN_PASSWORD: 'short' }, /12/],
    [
      'with a placeholder password',
      { ADMIN_EMAIL: 'o@example.org', ADMIN_PASSWORD: 'CHANGE-ME-admin-password' },
      /placeholder/,
    ],
  ])('refuses to start %s', async (_label, env, message) => {
    await expect(ensureBootstrapAdmin(db, config(env), silent)).rejects.toThrow(BootstrapError);
    await expect(ensureBootstrapAdmin(db, config(env), silent)).rejects.toThrow(message);
  });

  it('uses a development account when nothing is configured in development', async () => {
    const warnings: string[] = [];
    await ensureBootstrapAdmin(db, loadConfig({ NODE_ENV: 'development' }), {
      info: () => undefined,
      warn: (message) => warnings.push(message),
    });
    expect((await findUserByEmail(db, 'admin@localhost'))?.role).toBe('Admin');
    expect(warnings.join('\n')).toMatch(/admin@localhost/);
  });

  it('creates nothing with OIDC, where the admin group makes Admins', async () => {
    await ensureBootstrapAdmin(
      db,
      config({
        OIDC_ISSUER: 'https://auth.example.org/application/o/prints/',
        OIDC_CLIENT_ID: 'prints',
        OIDC_CLIENT_SECRET: 'secret-value',
        OIDC_ADMIN_GROUP: 'admins',
        PUBLIC_URL: 'https://prints.example.org',
      }),
      silent,
    );
    expect(await db.selectFrom('users').selectAll().execute()).toEqual([]);
  });
});
