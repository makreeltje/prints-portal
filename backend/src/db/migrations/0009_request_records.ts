import type { Kysely } from 'kysely';

/**
 * Where a print record came from.
 *
 * Until now the indexer was the only writer: a record existed because a folder
 * existed. A request arrives before any of that — someone asks for something
 * while the owner is out, and the files appear days later, if at all — so it
 * needs a record with no folder behind it.
 *
 * `indexed` is every existing row and means "a folder on disk". `request`
 * means "asked for, nothing on disk yet": the indexer leaves those alone
 * instead of archiving them for being absent, and they appear only in the
 * queue until they are linked to a folder.
 */
export async function up(db: Kysely<unknown>): Promise<void> {
  await db.schema
    .alterTable('print_records')
    .addColumn('origin', 'varchar(16)', (c) => c.notNull().defaultTo('indexed'))
    .execute();
}

export async function down(db: Kysely<unknown>): Promise<void> {
  await db.schema.alterTable('print_records').dropColumn('origin').execute();
}
