import type { Selectable } from 'kysely';
import type { AppDatabase } from '../db/connection.js';
import type { Role, UserTable } from '../db/schema.js';

export type UserRow = Selectable<UserTable>;

export const ROLES: readonly Role[] = ['User', 'Editor', 'Admin'];

/** What the API exposes about a user; never the password hash. */
export interface PublicUser {
  id: string;
  login: string;
  displayName: string;
  role: Role;
  /** "oidc" once the user has signed in through the identity provider. */
  origin: 'local' | 'oidc';
  lastLoginAt: string | null;
}

export function toPublicUser(user: UserRow): PublicUser {
  return {
    id: user.id,
    login: user.login,
    displayName: user.display_name,
    role: user.role,
    origin: user.oidc_subject === null ? 'local' : 'oidc',
    lastLoginAt: user.last_login_at,
  };
}

/** Sign-in names compare case-insensitively and without surrounding spaces. */
export function normalizeLogin(login: string): string {
  return login.trim().toLowerCase();
}

export function findUserByLogin(db: AppDatabase, login: string): Promise<UserRow | undefined> {
  return db
    .selectFrom('users')
    .selectAll()
    .where('login', '=', normalizeLogin(login))
    .executeTakeFirst();
}

export function findUserById(db: AppDatabase, id: string): Promise<UserRow | undefined> {
  return db.selectFrom('users').selectAll().where('id', '=', id).executeTakeFirst();
}

export async function countAdmins(db: AppDatabase): Promise<number> {
  const row = await db
    .selectFrom('users')
    .select((eb) => eb.fn.countAll<number | string>().as('count'))
    .where('role', '=', 'Admin')
    .executeTakeFirstOrThrow();
  return Number(row.count);
}

export async function createUser(
  db: AppDatabase,
  values: {
    login: string;
    displayName?: string;
    role: Role;
    passwordHash?: string | null;
    oidcSubject?: string | null;
    roleFromGroup?: boolean;
    mustChangePassword?: boolean;
  },
  now: Date,
): Promise<UserRow> {
  const login = normalizeLogin(values.login);
  const row: UserRow = {
    id: crypto.randomUUID(),
    login,
    display_name: values.displayName?.trim() || login,
    role: values.role,
    password_hash: values.passwordHash ?? null,
    oidc_subject: values.oidcSubject ?? null,
    role_from_group: values.roleFromGroup === true ? 1 : 0,
    must_change_password: values.mustChangePassword === true ? 1 : 0,
    created_at: now.toISOString(),
    last_login_at: null,
  };
  await db.insertInto('users').values(row).execute();
  return row;
}
