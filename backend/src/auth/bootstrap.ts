import type { AppConfig } from '../config/config.js';
import { checkBootstrapPassword } from '../core/secrets.js';
import type { AppDatabase } from '../db/connection.js';
import { hashPassword } from './passwords.js';
import { countAdmins, createUser, findUserByLogin } from './users.js';

export class BootstrapError extends Error {
  override name = 'BootstrapError';
}

export interface BootstrapLogger {
  info(object: object, message: string): void;
  warn(message: string): void;
}

/** Development fallback so `npm run dev:backend` works without any setup. */
const DEVELOPMENT_ADMIN = { email: 'admin@localhost', password: 'development-only' };

/**
 * Creates the first Admin from ADMIN_EMAIL and ADMIN_PASSWORD when no Admin
 * exists yet. With OIDC the identity provider's admin group makes Admins, so
 * nothing is created. Once an Admin exists the variables are ignored; they
 * never reset a password.
 */
export async function ensureBootstrapAdmin(
  db: AppDatabase,
  config: AppConfig,
  logger: BootstrapLogger,
  now: Date = new Date(),
): Promise<void> {
  if (config.auth.oidc !== null) return;
  if ((await countAdmins(db)) > 0) return;

  const development = config.environment === 'development';
  let { email, password } = config.auth.bootstrapAdmin;
  if (development && (email === null || password === null)) {
    email ??= DEVELOPMENT_ADMIN.email;
    password ??= DEVELOPMENT_ADMIN.password;
    logger.warn(`development: signing in as ${email} with the password "${password}"`);
  }
  if (email === null) {
    throw new BootstrapError(
      'No Admin exists yet: set ADMIN_EMAIL and ADMIN_PASSWORD to create the first one',
    );
  }
  const check = checkBootstrapPassword(password ?? undefined, config.environment);
  if (!check.ok) throw new BootstrapError(check.problem);
  for (const warning of check.warnings) logger.warn(warning);

  const passwordHash = await hashPassword(password ?? '');
  const existing = await findUserByLogin(db, email);
  if (existing === undefined) {
    await createUser(db, { login: email, role: 'Admin', passwordHash }, now);
  } else {
    // An existing account with this address is promoted rather than duplicated.
    await db
      .updateTable('users')
      .set({
        role: 'Admin',
        password_hash: passwordHash,
        role_from_group: 0,
        must_change_password: 0,
      })
      .where('id', '=', existing.id)
      .execute();
  }
  logger.info({ email }, 'created the first Admin');
}
