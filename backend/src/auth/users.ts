import type { Selectable } from 'kysely';
import type { AppDatabase } from '../db/connection.js';
import type { Role, UserTable } from '../db/schema.js';

export type UserRow = Selectable<UserTable>;

export const ROLES: readonly Role[] = ['User', 'Editor', 'Admin'];

/** What the API exposes about a user; never the password hash. */
export interface PublicUser {
  id: string;
  email: string;
  displayName: string;
  role: Role;
  /** "oidc" once the user has signed in through the identity provider. */
  origin: 'local' | 'oidc';
  lastLoginAt: string | null;
}

export function toPublicUser(user: UserRow): PublicUser {
  return {
    id: user.id,
    email: user.email,
    displayName: user.display_name,
    role: user.role,
    origin: user.oidc_subject === null ? 'local' : 'oidc',
    lastLoginAt: user.last_login_at,
  };
}

export function normalizeEmail(email: string): string {
  return email.trim().toLowerCase();
}

export function findUserByEmail(db: AppDatabase, email: string): Promise<UserRow | undefined> {
  return db
    .selectFrom('users')
    .selectAll()
    .where('email', '=', normalizeEmail(email))
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
    email: string;
    displayName?: string;
    role: Role;
    passwordHash?: string | null;
    oidcSubject?: string | null;
    roleFromGroup?: boolean;
  },
  now: Date,
): Promise<UserRow> {
  const email = normalizeEmail(values.email);
  const row: UserRow = {
    id: crypto.randomUUID(),
    email,
    display_name: values.displayName?.trim() || email,
    role: values.role,
    password_hash: values.passwordHash ?? null,
    oidc_subject: values.oidcSubject ?? null,
    role_from_group: values.roleFromGroup === true ? 1 : 0,
    created_at: now.toISOString(),
    last_login_at: null,
  };
  await db.insertInto('users').values(row).execute();
  return row;
}
