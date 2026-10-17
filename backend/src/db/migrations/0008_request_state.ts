import type { Kysely } from 'kysely';

/**
 * Where a request stands, on the order that carries its price.
 *
 * The portal modelled only what happens after money is owed: an order is
 * `open`, `paid`, `writtenOff` or has no price. A print that was quoted and
 * turned down was indistinguishable from one never priced — both `noPrice` —
 * so it wore the "Geen prijs" warning while needing nothing.
 *
 * Null is the default and means "as before", so no existing order changes.
 */
export async function up(db: Kysely<unknown>): Promise<void> {
  await db.schema.alterTable('print_orders').addColumn('request_state', 'varchar(16)').execute();
  await db.schema.alterTable('print_orders').addColumn('request_state_at', 'varchar(32)').execute();
}

export async function down(db: Kysely<unknown>): Promise<void> {
  await db.schema.alterTable('print_orders').dropColumn('request_state_at').execute();
  await db.schema.alterTable('print_orders').dropColumn('request_state').execute();
}
