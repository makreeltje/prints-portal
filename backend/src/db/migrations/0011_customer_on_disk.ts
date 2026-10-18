import type { Kysely } from 'kysely';

/**
 * A klant is a folder on disk, even an empty one (the owner's decision).
 *
 * Until now the klant list was derived from the prints: `group by
 * customer_folder`. A folder with no projects therefore existed nowhere in
 * the portal — which is exactly the klant a new request is for. The Wachtrij
 * made that visible: a request is work for someone who may have nothing yet.
 *
 * `seen_at` is when the indexer last saw the folder, and null means it is no
 * longer there. The flags on this row (niet factureren, betaallink) outlive
 * that: a folder can be moved away while its prints and its invoices stay.
 */
export async function up(db: Kysely<unknown>): Promise<void> {
  await db.schema.alterTable('customers').addColumn('seen_at', 'varchar(40)').execute();
}

export async function down(db: Kysely<unknown>): Promise<void> {
  await db.schema.alterTable('customers').dropColumn('seen_at').execute();
}
