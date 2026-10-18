import { createHmac, randomBytes, timingSafeEqual } from 'node:crypto';
import type { ExpressionBuilder } from 'kysely';
import type { AppDatabase } from '../db/connection.js';
import type { Database } from '../db/schema.js';
import type { UserRow } from './users.js';

export const SESSION_IDLE_MS = 60 * 60 * 1000;
export const SESSION_ABSOLUTE_MS = 12 * 60 * 60 * 1000;
/** last_seen_at is written at most this often, so reads do not turn into writes. */
const TOUCH_INTERVAL_MS = 60 * 1000;

export interface ActiveSession {
  idHash: string;
  csrfToken: string;
  expiresAt: Date;
  user: UserRow;
  /**
   * Set when a deel-link minted this session (GAP-165). The visitor has no
   * account, so `user` is built here and exists nowhere else; what they may
   * see comes from this one klant and from nothing stored against a user.
   */
  share?: { linkId: string; customerFolder: string };
}

/**
 * Server-side sessions. The cookie holds 32 random bytes; the database keeps
 * only an HMAC of it (keyed with SESSION_SECRET), so a copy of the database
 * cannot be replayed as cookies. A session ends after 60 minutes without
 * requests or 12 hours after sign-in, whichever comes first.
 */
export class SessionStore {
  constructor(
    private readonly db: AppDatabase,
    private readonly secret: string,
    private readonly now: () => Date,
  ) {}

  async create(userId: string): Promise<{ token: string; csrfToken: string; expiresAt: Date }> {
    const now = this.now();
    await this.purgeExpired(now);
    const token = randomBytes(32).toString('base64url');
    const csrfToken = randomBytes(32).toString('base64url');
    const expiresAt = new Date(now.getTime() + SESSION_ABSOLUTE_MS);
    await this.db
      .insertInto('sessions')
      .values({
        id_hash: this.hash(token),
        user_id: userId,
        csrf_token: csrfToken,
        created_at: now.toISOString(),
        last_seen_at: now.toISOString(),
        expires_at: expiresAt.toISOString(),
      })
      .execute();
    return { token, csrfToken, expiresAt };
  }

  /**
   * A session minted by a deel-link: no user row, scoped to one klant, and
   * only for as long as the link itself is valid (GAP-165).
   */
  async createForShareLink(
    linkId: string,
  ): Promise<{ token: string; csrfToken: string; expiresAt: Date }> {
    const now = this.now();
    await this.purgeExpired(now);
    const token = randomBytes(32).toString('base64url');
    const csrfToken = randomBytes(32).toString('base64url');
    const expiresAt = new Date(now.getTime() + SESSION_ABSOLUTE_MS);
    await this.db
      .insertInto('share_sessions')
      .values({
        id_hash: this.hash(token),
        share_link_id: linkId,
        csrf_token: csrfToken,
        created_at: now.toISOString(),
        last_seen_at: now.toISOString(),
        expires_at: expiresAt.toISOString(),
      })
      .execute();
    return { token, csrfToken, expiresAt };
  }

  /** Ends every session a link minted; used when it is revoked. */
  async destroyForShareLink(linkId: string): Promise<void> {
    await this.db.deleteFrom('share_sessions').where('share_link_id', '=', linkId).execute();
  }

  /** The session and its user, extending the idle window; null when unknown or expired. */
  async resolve(token: string): Promise<ActiveSession | null> {
    if (token === '' || token.length > 100) return null;
    const idHash = this.hash(token);
    const row = await this.db
      .selectFrom('sessions')
      .innerJoin('users', 'users.id', 'sessions.user_id')
      .selectAll('users')
      .select([
        'sessions.csrf_token as session_csrf_token',
        'sessions.last_seen_at as session_last_seen_at',
        'sessions.expires_at as session_expires_at',
      ])
      .where('sessions.id_hash', '=', idHash)
      .executeTakeFirst();
    if (row === undefined) return this.resolveShare(idHash);

    const now = this.now();
    const lastSeen = new Date(row.session_last_seen_at);
    const expiresAt = new Date(row.session_expires_at);
    if (now >= expiresAt || now.getTime() - lastSeen.getTime() >= SESSION_IDLE_MS) {
      await this.db.deleteFrom('sessions').where('id_hash', '=', idHash).execute();
      return null;
    }
    if (now.getTime() - lastSeen.getTime() >= TOUCH_INTERVAL_MS) {
      await this.db
        .updateTable('sessions')
        .set({ last_seen_at: now.toISOString() })
        .where('id_hash', '=', idHash)
        .execute();
    }
    const user: UserRow = {
      id: row.id,
      login: row.login,
      display_name: row.display_name,
      role: row.role,
      password_hash: row.password_hash,
      oidc_subject: row.oidc_subject,
      role_from_group: row.role_from_group,
      must_change_password: row.must_change_password,
      created_at: row.created_at,
      last_login_at: row.last_login_at,
    };
    return { idHash, csrfToken: row.session_csrf_token, expiresAt, user };
  }

  /**
   * The share half of `resolve`. The link is re-read on every request, so a
   * revoked or expired link ends the session at once rather than at the next
   * sign-in — an Admin who revokes a link expects it to be dead, not dead in
   * an hour.
   *
   * The user is built here and stored nowhere: role `User`, which already
   * means read-only, no cost and no notes everywhere in this app, and an id
   * that cannot collide with a real one.
   */
  private async resolveShare(idHash: string): Promise<ActiveSession | null> {
    const row = await this.db
      .selectFrom('share_sessions as s')
      .innerJoin('share_links as l', 'l.id', 's.share_link_id')
      .select([
        's.share_link_id',
        's.csrf_token',
        's.last_seen_at',
        's.expires_at',
        'l.customer_folder',
        'l.label',
        'l.revoked_at',
        'l.expires_at as link_expires_at',
        'l.created_at as link_created_at',
      ])
      .where('s.id_hash', '=', idHash)
      .executeTakeFirst();
    if (row === undefined) return null;

    const now = this.now();
    const expiresAt = new Date(row.expires_at);
    const lastSeen = new Date(row.last_seen_at);
    const linkDead =
      row.revoked_at !== null ||
      (row.link_expires_at !== null && row.link_expires_at <= now.toISOString());
    if (linkDead || now >= expiresAt || now.getTime() - lastSeen.getTime() >= SESSION_IDLE_MS) {
      await this.db.deleteFrom('share_sessions').where('id_hash', '=', idHash).execute();
      return null;
    }
    if (now.getTime() - lastSeen.getTime() >= TOUCH_INTERVAL_MS) {
      await this.db
        .updateTable('share_sessions')
        .set({ last_seen_at: now.toISOString() })
        .where('id_hash', '=', idHash)
        .execute();
    }
    const user: UserRow = {
      id: `share:${row.share_link_id}`,
      login: `share:${row.share_link_id}`,
      display_name: row.customer_folder,
      role: 'User',
      password_hash: null,
      oidc_subject: null,
      role_from_group: 0,
      must_change_password: 0,
      created_at: row.link_created_at,
      last_login_at: null,
    };
    return {
      idHash,
      csrfToken: row.csrf_token,
      expiresAt,
      user,
      share: { linkId: row.share_link_id, customerFolder: row.customer_folder },
    };
  }

  /** Session hashes (from `candidates`) that are still valid; never extends a session. */
  async activeAmong(candidates: readonly string[]): Promise<Set<string>> {
    if (candidates.length === 0) return new Set();
    const now = this.now();
    const rows = await this.db
      .selectFrom('sessions')
      .select('id_hash')
      .where('id_hash', 'in', [...candidates])
      .where('expires_at', '>', now.toISOString())
      .where('last_seen_at', '>', new Date(now.getTime() - SESSION_IDLE_MS).toISOString())
      .execute();
    return new Set(rows.map((row) => row.id_hash));
  }

  /**
   * Ends one session, whichever kind it is. A deel-link session lives in its
   * own table, and "Sessie afsluiten" (ScreenShareSession §1) is the visitor's
   * only way out: deel-links are opened on borrowed phones and in family
   * group chats, and without this the only way to end one is to clear the
   * browser. The hash is of the cookie's token, so it can only match one row
   * in one of the two tables.
   */
  async destroy(idHash: string): Promise<void> {
    await this.db.deleteFrom('sessions').where('id_hash', '=', idHash).execute();
    await this.db.deleteFrom('share_sessions').where('id_hash', '=', idHash).execute();
  }

  /** Ends every session of a user, optionally except the current one. */
  async destroyForUser(userId: string, exceptIdHash?: string): Promise<void> {
    let query = this.db.deleteFrom('sessions').where('user_id', '=', userId);
    if (exceptIdHash !== undefined) query = query.where('id_hash', '!=', exceptIdHash);
    await query.execute();
  }

  async purgeExpired(now = this.now()): Promise<void> {
    const stale = (eb: ExpressionBuilder<Database, 'sessions' | 'share_sessions'>) =>
      eb.or([
        eb('expires_at', '<=', now.toISOString()),
        eb('last_seen_at', '<=', new Date(now.getTime() - SESSION_IDLE_MS).toISOString()),
      ]);
    await this.db.deleteFrom('sessions').where(stale).execute();
    // The share half ages the same way; a dead link is handled on resolve.
    await this.db.deleteFrom('share_sessions').where(stale).execute();
  }

  private hash(token: string): string {
    return createHmac('sha256', this.secret).update(token).digest('hex');
  }
}

export function tokensEqual(a: string, b: string): boolean {
  const left = Buffer.from(a);
  const right = Buffer.from(b);
  return left.length === right.length && timingSafeEqual(left, right);
}
