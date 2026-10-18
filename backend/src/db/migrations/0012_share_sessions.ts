import type { Kysely } from 'kysely';

/**
 * A deel-link becomes a way in, not only a page (GAP-165, the owner's
 * decision): visiting a valid link gives an anonymous, read-only session
 * scoped to that one klant.
 *
 * It is a table of its own rather than a nullable `user_id` on `sessions`,
 * for two reasons. A share session has no user — inventing a hidden `users`
 * row would put it in Gebruikers and in Toegang, two screens that are
 * designed and whose lists would then hold rows nobody made. And the two
 * kinds of session expire differently: a user session dies of idleness, a
 * share session dies with its link, which an Admin can revoke at any moment.
 */
export async function up(db: Kysely<unknown>): Promise<void> {
  await db.schema
    .createTable('share_sessions')
    .addColumn('id_hash', 'varchar(64)', (col) => col.primaryKey())
    .addColumn('share_link_id', 'varchar(36)', (col) => col.notNull())
    .addColumn('csrf_token', 'varchar(64)', (col) => col.notNull())
    .addColumn('created_at', 'varchar(40)', (col) => col.notNull())
    .addColumn('last_seen_at', 'varchar(40)', (col) => col.notNull())
    .addColumn('expires_at', 'varchar(40)', (col) => col.notNull())
    .execute();
  await db.schema
    .createIndex('share_sessions_link')
    .on('share_sessions')
    .column('share_link_id')
    .execute();
}

export async function down(db: Kysely<unknown>): Promise<void> {
  // The table alone: MariaDB wants `DROP INDEX x ON t` and every engine drops
  // an index with its table anyway.
  await db.schema.dropTable('share_sessions').execute();
}
