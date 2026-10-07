import { createHash, randomBytes, randomUUID } from 'node:crypto';
import type { Kysely } from 'kysely';
import type { Database, ShareLinkTable } from '../db/schema.js';

type Db = Kysely<Database>;

/** Verloopt: Over 7, 30 or 90 dagen, or Nooit (null). */
export const EXPIRY_DAYS = [7, 30, 90] as const;
export type ExpiryDays = (typeof EXPIRY_DAYS)[number] | null;

export type ShareLinkStatus = 'active' | 'expired' | 'revoked';

export interface ShareLinkSummary {
  id: string;
  customer: string;
  label: string;
  createdAt: string;
  expiresAt: string | null;
  revokedAt: string | null;
  status: ShareLinkStatus;
}

/** 32 random bytes, base64url: 43 characters. */
export function newToken(): string {
  return randomBytes(32).toString('base64url');
}

const TOKEN_PATTERN = /^[A-Za-z0-9_-]{43}$/;

/** Hex SHA-256; only this is stored, so a database leak does not leak working links. */
export function hashToken(token: string): string {
  return createHash('sha256').update(token).digest('hex');
}

export function statusOf(link: ShareLinkTable, now: Date): ShareLinkStatus {
  if (link.revoked_at !== null) return 'revoked';
  if (link.expires_at !== null && link.expires_at <= now.toISOString()) return 'expired';
  return 'active';
}

function summary(link: ShareLinkTable, now: Date): ShareLinkSummary {
  return {
    id: link.id,
    customer: link.customer_folder,
    label: link.label,
    createdAt: link.created_at,
    expiresAt: link.expires_at,
    revokedAt: link.revoked_at,
    status: statusOf(link, now),
  };
}

/** The klant has prints that are not deleted (archived ones count). */
export async function customerExists(db: Db, customer: string): Promise<boolean> {
  const row = await db
    .selectFrom('print_records')
    .select('id')
    .where('customer_folder', '=', customer)
    .where('status', '!=', 'deleted')
    .limit(1)
    .executeTakeFirst();
  return row !== undefined;
}

/** Creates a link; the token is returned here and never again. */
export async function createShareLink(
  db: Db,
  input: { customer: string; label: string; expiresInDays: ExpiryDays; userId: string },
  now: Date,
): Promise<{ link: ShareLinkSummary; token: string }> {
  const token = newToken();
  const row: ShareLinkTable = {
    id: randomUUID(),
    token_hash: hashToken(token),
    customer_folder: input.customer,
    label: input.label,
    expires_at:
      input.expiresInDays === null
        ? null
        : new Date(now.getTime() + input.expiresInDays * 86_400_000).toISOString(),
    revoked_at: null,
    revoked_by: null,
    created_at: now.toISOString(),
    created_by: input.userId,
  };
  await db.insertInto('share_links').values(row).execute();
  return { link: summary(row, now), token };
}

/** Every link, newest first; tokens are never listed. */
export async function listShareLinks(db: Db, now: Date): Promise<ShareLinkSummary[]> {
  const rows = await db
    .selectFrom('share_links')
    .selectAll()
    .orderBy('created_at', 'desc')
    .orderBy('id')
    .execute();
  return rows.map((row) => summary(row, now));
}

/** Intrekken; false when the link does not exist or was already revoked. */
export async function revokeShareLink(
  db: Db,
  id: string,
  userId: string,
  now: Date,
): Promise<boolean> {
  const result = await db
    .updateTable('share_links')
    .set({ revoked_at: now.toISOString(), revoked_by: userId })
    .where('id', '=', id)
    .where('revoked_at', 'is', null)
    .executeTakeFirst();
  return Number(result.numUpdatedRows) > 0;
}

/**
 * The link for a token while it works; null for a malformed, unknown,
 * expired or revoked token alike, so callers answer all of them the same.
 */
export async function activeLink(db: Db, token: string, now: Date): Promise<ShareLinkTable | null> {
  if (!TOKEN_PATTERN.test(token)) return null;
  const link = await db
    .selectFrom('share_links')
    .selectAll()
    .where('token_hash', '=', hashToken(token))
    .executeTakeFirst();
  if (link === undefined || statusOf(link, now) !== 'active') return null;
  return link;
}
