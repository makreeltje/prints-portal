import { MysqlAdapter, sql, type CreateTableBuilder, type Kysely } from 'kysely';

/**
 * Financials (M6): business settings, the per-customer "niet factureren"
 * flag, spool and price overrides, orders inside a print (owner decision:
 * a print can get repeat orders), order items with their own times printed,
 * and payments.
 *
 * Order items and overrides point at a file by (path_hash, plate_index)
 * rather than at a print_lines row: lines are re-created when an archived
 * folder returns, and the money side must survive that.
 *
 * Existing data: every print gets order 1 holding all its lines with the
 * times printed they had; print_lines.times_printed then goes away.
 */
/** The tables this migration reads and writes, as they are at this point. */
interface MigrationDatabase {
  print_records: { id: string; discovered_at: string };
  print_assets: { id: string; print_record_id: string; path_hash: string };
  print_lines: { asset_id: string; plate_index: number; times_printed: number };
  print_orders: {
    id: string;
    print_record_id: string;
    number: number;
    created_at: string;
    updated_at: string;
  };
  order_items: { order_id: string; path_hash: string; plate_index: number; times_printed: number };
}

export async function up(anyDb: Kysely<unknown>): Promise<void> {
  const db = anyDb as Kysely<MigrationDatabase>;
  const mysql = db.getExecutor().adapter instanceof MysqlAdapter;
  const tableOptions = <T extends string, C extends string>(builder: CreateTableBuilder<T, C>) =>
    mysql
      ? builder.modifyEnd(sql`ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_bin`)
      : builder;

  await tableOptions(
    db.schema
      .createTable('app_settings')
      .addColumn('key', 'varchar(64)', (c) => c.primaryKey())
      .addColumn('value', 'text', (c) => c.notNull())
      .addColumn('updated_at', 'varchar(30)', (c) => c.notNull())
      .addColumn('updated_by', 'varchar(36)'),
  ).execute();

  await tableOptions(
    db.schema
      .createTable('customers')
      .addColumn('customer_folder', 'varchar(255)', (c) => c.primaryKey())
      .addColumn('no_billing', 'integer', (c) => c.notNull().defaultTo(0))
      .addColumn('updated_at', 'varchar(30)', (c) => c.notNull()),
  ).execute();

  await db.schema.alterTable('print_records').addColumn('spool_id', 'bigint').execute();
  await db.schema.alterTable('print_records').addColumn('spool_snapshot', 'text').execute();

  await tableOptions(
    db.schema
      .createTable('line_overrides')
      .addColumn('id', 'varchar(36)', (c) => c.primaryKey())
      .addColumn('print_record_id', 'varchar(36)', (c) =>
        c.notNull().references('print_records.id').onDelete('cascade'),
      )
      .addColumn('path_hash', 'varchar(64)', (c) => c.notNull())
      .addColumn('plate_index', 'integer', (c) => c.notNull())
      // 0: the whole file or plate; 1…n: one filament slot.
      .addColumn('slot', 'integer', (c) => c.notNull())
      .addColumn('spool_id', 'bigint')
      .addColumn('spool_snapshot', 'text')
      .addColumn('manual_price_per_kg', 'double precision')
      .addColumn('updated_at', 'varchar(30)', (c) => c.notNull()),
  ).execute();
  await db.schema
    .createIndex('line_overrides_key_idx')
    .on('line_overrides')
    .columns(['print_record_id', 'path_hash', 'plate_index', 'slot'])
    .unique()
    .execute();

  await tableOptions(
    db.schema
      .createTable('print_orders')
      .addColumn('id', 'varchar(36)', (c) => c.primaryKey())
      .addColumn('print_record_id', 'varchar(36)', (c) =>
        c.notNull().references('print_records.id').onDelete('cascade'),
      )
      .addColumn('number', 'integer', (c) => c.notNull())
      .addColumn('created_at', 'varchar(30)', (c) => c.notNull())
      .addColumn('created_by', 'varchar(36)')
      .addColumn('sale_price_cents', 'bigint')
      .addColumn('sale_price_set_at', 'varchar(30)')
      .addColumn('sale_price_set_by', 'varchar(36)')
      .addColumn('manual_price_per_kg', 'double precision')
      .addColumn('manual_grams', 'double precision')
      .addColumn('manual_print_seconds', 'bigint')
      .addColumn('written_off_cents', 'bigint')
      .addColumn('written_off_at', 'varchar(30)')
      .addColumn('written_off_by', 'varchar(36)')
      .addColumn('written_off_reason', 'varchar(500)')
      // Cached result of the cost calculation, refreshed on every change.
      .addColumn('material_cost_cents', 'bigint')
      .addColumn('electricity_cost_cents', 'bigint')
      .addColumn('total_cost_cents', 'bigint')
      .addColumn('cost_missing', 'varchar(200)')
      .addColumn('updated_at', 'varchar(30)', (c) => c.notNull()),
  ).execute();
  await db.schema
    .createIndex('print_orders_record_idx')
    .on('print_orders')
    .columns(['print_record_id', 'number'])
    .unique()
    .execute();

  await tableOptions(
    db.schema
      .createTable('order_items')
      .addColumn('order_id', 'varchar(36)', (c) =>
        c.notNull().references('print_orders.id').onDelete('cascade'),
      )
      .addColumn('path_hash', 'varchar(64)', (c) => c.notNull())
      .addColumn('plate_index', 'integer', (c) => c.notNull())
      .addColumn('times_printed', 'integer', (c) => c.notNull())
      .addPrimaryKeyConstraint('order_items_pk', ['order_id', 'path_hash', 'plate_index']),
  ).execute();

  await tableOptions(
    db.schema
      .createTable('payments')
      .addColumn('id', 'varchar(36)', (c) => c.primaryKey())
      .addColumn('order_id', 'varchar(36)', (c) =>
        c.notNull().references('print_orders.id').onDelete('cascade'),
      )
      .addColumn('amount_cents', 'bigint', (c) => c.notNull())
      .addColumn('paid_at', 'varchar(30)', (c) => c.notNull())
      .addColumn('recorded_by', 'varchar(36)')
      .addColumn('undone_at', 'varchar(30)')
      .addColumn('undone_by', 'varchar(36)'),
  ).execute();
  await db.schema.createIndex('payments_order_idx').on('payments').column('order_id').execute();

  // Order 1 for every existing print, holding its lines with their times printed.
  const records = await db.selectFrom('print_records').select(['id', 'discovered_at']).execute();
  for (const record of records) {
    const orderId = crypto.randomUUID();
    await db
      .insertInto('print_orders')
      .values({
        id: orderId,
        print_record_id: record.id,
        number: 1,
        created_at: record.discovered_at,
        updated_at: record.discovered_at,
      })
      .execute();
    const lines = await db
      .selectFrom('print_lines as l')
      .innerJoin('print_assets as a', 'a.id', 'l.asset_id')
      .select(['a.path_hash', 'l.plate_index', 'l.times_printed'])
      .where('a.print_record_id', '=', record.id)
      .execute();
    for (const line of lines) {
      await db
        .insertInto('order_items')
        .values({
          order_id: orderId,
          path_hash: line.path_hash,
          plate_index: line.plate_index,
          times_printed: Math.max(1, line.times_printed),
        })
        .execute();
    }
  }

  await db.schema.alterTable('print_lines').dropColumn('times_printed').execute();
}

export async function down(db: Kysely<unknown>): Promise<void> {
  await db.schema
    .alterTable('print_lines')
    .addColumn('times_printed', 'integer', (c) => c.notNull().defaultTo(1))
    .execute();
  await db.schema.dropTable('payments').execute();
  await db.schema.dropTable('order_items').execute();
  await db.schema.dropTable('print_orders').execute();
  await db.schema.dropTable('line_overrides').execute();
  await db.schema.alterTable('print_records').dropColumn('spool_snapshot').execute();
  await db.schema.alterTable('print_records').dropColumn('spool_id').execute();
  await db.schema.dropTable('customers').execute();
  await db.schema.dropTable('app_settings').execute();
}
