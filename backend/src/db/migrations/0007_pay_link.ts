import type { Kysely } from 'kysely';

/**
 * An optional payment link per klant (GAP-103): a URL the studio pastes, shown
 * on the share page beside the bank details.
 *
 * It is deliberately a dumb string. The link carries whatever amount the studio
 * put in it, which Openstaand does not know about and cannot keep in step, so
 * the date it was added is stored with it: an old link is then visibly old
 * rather than silently wrong.
 */
export async function up(db: Kysely<unknown>): Promise<void> {
  await db.schema.alterTable('customers').addColumn('pay_link', 'varchar(2048)').execute();
  await db.schema.alterTable('customers').addColumn('pay_link_added_at', 'varchar(32)').execute();
}

export async function down(db: Kysely<unknown>): Promise<void> {
  await db.schema.alterTable('customers').dropColumn('pay_link_added_at').execute();
  await db.schema.alterTable('customers').dropColumn('pay_link').execute();
}
