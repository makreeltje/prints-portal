import type { Kysely } from 'kysely';

/**
 * Where a model came from, and what still has to be made (GAP-152).
 *
 * Both sit on the print record rather than on a request: a request is the same
 * record without a folder, so it can fill them early exactly as it already
 * carries a price.
 *
 * `url_target` on an asset is the folder's half. A `.url` file is already
 * classified and indexed; this is the link read out of it, parsed when the
 * file is, so it follows the file the way every other parsed fact does.
 */
export async function up(db: Kysely<unknown>): Promise<void> {
  // One column per statement: SQLite takes only one ADD COLUMN at a time.
  await db.schema.alterTable('print_records').addColumn('source_url', 'varchar(2048)').execute();
  await db.schema.alterTable('print_records').addColumn('note', 'text').execute();
  await db.schema.alterTable('print_assets').addColumn('url_target', 'varchar(2048)').execute();
}

export async function down(db: Kysely<unknown>): Promise<void> {
  await db.schema.alterTable('print_assets').dropColumn('url_target').execute();
  await db.schema.alterTable('print_records').dropColumn('note').execute();
  await db.schema.alterTable('print_records').dropColumn('source_url').execute();
}
