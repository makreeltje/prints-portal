import { MysqlAdapter, sql, type CreateTableBuilder, type Kysely } from 'kysely';

/**
 * Print index: records, files, counted lines (G-code or 3MF plate) and the
 * filament slots per line. Later milestones add their own tables in new
 * migrations.
 */
export async function up(db: Kysely<unknown>): Promise<void> {
  const mysql = db.getExecutor().adapter instanceof MysqlAdapter;
  // MariaDB/MySQL compare case-insensitively by default; folder names on Linux do not.
  const tableOptions = <T extends string, C extends string>(builder: CreateTableBuilder<T, C>) =>
    mysql
      ? builder.modifyEnd(sql`ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_bin`)
      : builder;

  await tableOptions(
    db.schema
      .createTable('print_records')
      .addColumn('id', 'varchar(36)', (c) => c.primaryKey())
      .addColumn('record_key', 'varchar(520)', (c) => c.notNull().unique())
      .addColumn('customer_folder', 'varchar(255)', (c) => c.notNull())
      .addColumn('project_folder', 'varchar(255)')
      .addColumn('display_name', 'varchar(255)', (c) => c.notNull())
      .addColumn('status', 'varchar(16)', (c) => c.notNull())
      .addColumn('discovered_at', 'varchar(30)', (c) => c.notNull())
      .addColumn('last_seen_at', 'varchar(30)', (c) => c.notNull())
      .addColumn('archived_at', 'varchar(30)')
      .addColumn('deleted_at', 'varchar(30)')
      .addColumn('deleted_by', 'varchar(36)')
      .addColumn('part_name', 'varchar(255)')
      .addColumn('material', 'varchar(64)')
      .addColumn('printer_model', 'varchar(255)')
      .addColumn('print_date', 'varchar(30)')
      .addColumn('total_grams', 'double precision')
      .addColumn('total_print_seconds', 'bigint')
      .addColumn('updated_at', 'varchar(30)', (c) => c.notNull()),
  ).execute();
  await db.schema
    .createIndex('print_records_customer_idx')
    .on('print_records')
    .columns(['customer_folder', 'status'])
    .execute();

  await tableOptions(
    db.schema
      .createTable('print_assets')
      .addColumn('id', 'varchar(36)', (c) => c.primaryKey())
      .addColumn('print_record_id', 'varchar(36)', (c) =>
        c.notNull().references('print_records.id').onDelete('cascade'),
      )
      .addColumn('relative_path', 'varchar(2048)', (c) => c.notNull())
      .addColumn('path_hash', 'varchar(64)', (c) => c.notNull().unique())
      .addColumn('file_name', 'varchar(512)', (c) => c.notNull())
      .addColumn('sub_path', 'varchar(1024)', (c) => c.notNull())
      .addColumn('type', 'varchar(16)', (c) => c.notNull())
      .addColumn('size_bytes', 'bigint', (c) => c.notNull())
      .addColumn('last_write_utc', 'varchar(30)', (c) => c.notNull())
      .addColumn('name_part', 'varchar(512)')
      .addColumn('name_material', 'varchar(64)')
      .addColumn('name_print_seconds', 'bigint')
      .addColumn('recorded_at', 'varchar(30)')
      .addColumn('printer_prefix', 'varchar(64)')
      .addColumn('slicer', 'varchar(255)')
      .addColumn('has_thumbnail', 'integer', (c) => c.notNull().defaultTo(0))
      .addColumn('parse_error', 'varchar(1024)')
      .addColumn('indexed_at', 'varchar(30)', (c) => c.notNull()),
  ).execute();
  await db.schema
    .createIndex('print_assets_record_idx')
    .on('print_assets')
    .column('print_record_id')
    .execute();

  await tableOptions(
    db.schema
      .createTable('print_lines')
      .addColumn('id', 'varchar(36)', (c) => c.primaryKey())
      .addColumn('asset_id', 'varchar(36)', (c) =>
        c.notNull().references('print_assets.id').onDelete('cascade'),
      )
      .addColumn('plate_index', 'integer', (c) => c.notNull())
      .addColumn('total_grams', 'double precision')
      .addColumn('print_seconds', 'bigint')
      .addColumn('printer_model', 'varchar(255)')
      .addColumn('material', 'varchar(64)')
      .addColumn('auto_excluded', 'integer', (c) => c.notNull().defaultTo(0))
      .addColumn('auto_exclusion_reason', 'varchar(300)')
      .addColumn('user_excluded', 'integer')
      .addColumn('times_printed', 'integer', (c) => c.notNull().defaultTo(1))
      .addColumn('duplicate_fingerprint', 'varchar(512)')
      .addColumn('possible_duplicate', 'integer', (c) => c.notNull().defaultTo(0))
      .addUniqueConstraint('print_lines_asset_plate_uq', ['asset_id', 'plate_index']),
  ).execute();

  await tableOptions(
    db.schema
      .createTable('line_slots')
      .addColumn('id', 'varchar(36)', (c) => c.primaryKey())
      .addColumn('line_id', 'varchar(36)', (c) =>
        c.notNull().references('print_lines.id').onDelete('cascade'),
      )
      .addColumn('slot', 'integer', (c) => c.notNull())
      .addColumn('grams', 'double precision', (c) => c.notNull())
      .addColumn('colour', 'varchar(7)')
      .addColumn('material', 'varchar(64)')
      .addUniqueConstraint('line_slots_line_slot_uq', ['line_id', 'slot']),
  ).execute();
}

export async function down(db: Kysely<unknown>): Promise<void> {
  await db.schema.dropTable('line_slots').execute();
  await db.schema.dropTable('print_lines').execute();
  await db.schema.dropTable('print_assets').execute();
  await db.schema.dropTable('print_records').execute();
}
