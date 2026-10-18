import type { AppDatabase } from '../db/connection.js';
import { visibleRecords } from '../db/records.js';
import type { Role } from '../db/schema.js';

/**
 * The one place that decides which customers a user may see (brief §9.4):
 * Admins and Editors see every customer; Users only the customer folders
 * an Admin granted them. Every customer-scoped query and check goes through
 * here.
 */
export type CustomerScope =
  { kind: 'all' } | { kind: 'some'; customerFolders: ReadonlySet<string> };

export function hasAllCustomerAccess(role: Role): boolean {
  return role === 'Admin' || role === 'Editor';
}

export async function customerScope(
  db: AppDatabase,
  user: { id: string; role: Role },
): Promise<CustomerScope> {
  if (hasAllCustomerAccess(user.role)) return { kind: 'all' };
  const rows = await db
    .selectFrom('customer_access')
    .select('customer_folder')
    .where('user_id', '=', user.id)
    .execute();
  return { kind: 'some', customerFolders: new Set(rows.map((row) => row.customer_folder)) };
}

/**
 * What one request may see. A deel-link's session has no user row and no
 * grants, so its scope is the link's klant and nothing else (GAP-165); every
 * other session asks the grants, as before.
 */
export async function sessionScope(
  db: AppDatabase,
  session: { user: { id: string; role: Role }; share?: { customerFolder: string } },
): Promise<CustomerScope> {
  if (session.share !== undefined) {
    return { kind: 'some', customerFolders: new Set([session.share.customerFolder]) };
  }
  return customerScope(db, session.user);
}

export function scopeAllows(scope: CustomerScope, customerFolder: string): boolean {
  return scope.kind === 'all' || scope.customerFolders.has(customerFolder);
}

export async function canAccessCustomer(
  db: AppDatabase,
  user: { id: string; role: Role },
  customerFolder: string,
): Promise<boolean> {
  return scopeAllows(await customerScope(db, user), customerFolder);
}

/** Customer folders known from the index (deleted prints do not count). */
export async function listCustomerFolders(db: AppDatabase): Promise<string[]> {
  const rows = await visibleRecords(db).select('customer_folder').distinct().execute();
  return rows.map((row) => row.customer_folder).sort((a, b) => a.localeCompare(b, 'nl'));
}
