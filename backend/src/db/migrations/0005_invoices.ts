import { MysqlAdapter, sql, type CreateTableBuilder, type Kysely } from 'kysely';

/**
 * Invoices (M7): final invoices and credit notes share one yearly sequence
 * (YYYY-NNN). A final invoice stores its lines, a JSON snapshot and the
 * path of its PDF; the orders on it are locked through
 * print_orders.invoice_id. Concepts and reminders are never stored.
 */
export async function up(db: Kysely<unknown>): Promise<void> {
  const mysql = db.getExecutor().adapter instanceof MysqlAdapter;
  const tableOptions = <T extends string, C extends string>(builder: CreateTableBuilder<T, C>) =>
    mysql
      ? builder.modifyEnd(sql`ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_bin`)
      : builder;

  await tableOptions(
    db.schema
      .createTable('invoices')
      .addColumn('id', 'varchar(36)', (c) => c.primaryKey())
      .addColumn('number', 'varchar(16)', (c) => c.notNull().unique())
      .addColumn('year', 'integer', (c) => c.notNull())
      .addColumn('sequence', 'integer', (c) => c.notNull())
      // 'invoice' or 'credit'
      .addColumn('kind', 'varchar(16)', (c) => c.notNull())
      .addColumn('customer_folder', 'varchar(255)', (c) => c.notNull())
      .addColumn('issued_on', 'varchar(10)', (c) => c.notNull())
      .addColumn('period_from', 'varchar(10)')
      .addColumn('period_to', 'varchar(10)')
      .addColumn('only_open', 'integer', (c) => c.notNull().defaultTo(0))
      .addColumn('credits_invoice_id', 'varchar(36)')
      .addColumn('total_cents', 'bigint', (c) => c.notNull())
      .addColumn('paid_cents', 'bigint', (c) => c.notNull())
      .addColumn('open_cents', 'bigint', (c) => c.notNull())
      .addColumn('reference', 'varchar(64)', (c) => c.notNull())
      .addColumn('pdf_file', 'varchar(255)', (c) => c.notNull())
      .addColumn('snapshot', 'text', (c) => c.notNull())
      .addColumn('created_at', 'varchar(30)', (c) => c.notNull())
      .addColumn('created_by', 'varchar(36)'),
  ).execute();
  await db.schema
    .createIndex('invoices_sequence_idx')
    .on('invoices')
    .columns(['year', 'sequence'])
    .unique()
    .execute();
  await db.schema
    .createIndex('invoices_customer_idx')
    .on('invoices')
    .column('customer_folder')
    .execute();

  await tableOptions(
    db.schema
      .createTable('invoice_lines')
      .addColumn('id', 'varchar(36)', (c) => c.primaryKey())
      .addColumn('invoice_id', 'varchar(36)', (c) =>
        c.notNull().references('invoices.id').onDelete('cascade'),
      )
      .addColumn('position', 'integer', (c) => c.notNull())
      .addColumn('order_id', 'varchar(36)', (c) => c.notNull())
      .addColumn('print_record_id', 'varchar(36)', (c) => c.notNull())
      .addColumn('description', 'varchar(512)', (c) => c.notNull())
      .addColumn('project', 'varchar(255)')
      .addColumn('line_date', 'varchar(10)')
      .addColumn('grams', 'double precision')
      .addColumn('amount_cents', 'bigint', (c) => c.notNull())
      .addColumn('paid_cents', 'bigint', (c) => c.notNull())
      // 'paid', 'open' or 'partial'; null on a credit note.
      .addColumn('status', 'varchar(16)'),
  ).execute();
  await db.schema
    .createIndex('invoice_lines_invoice_idx')
    .on('invoice_lines')
    .column('invoice_id')
    .execute();
  await db.schema
    .createIndex('invoice_lines_order_idx')
    .on('invoice_lines')
    .column('order_id')
    .execute();

  // The final invoice an order is on (at most one); its price and items are then locked.
  await db.schema.alterTable('print_orders').addColumn('invoice_id', 'varchar(36)').execute();
}

export async function down(db: Kysely<unknown>): Promise<void> {
  await db.schema.alterTable('print_orders').dropColumn('invoice_id').execute();
  await db.schema.dropTable('invoice_lines').execute();
  await db.schema.dropTable('invoices').execute();
}
