import { MysqlAdapter, sql, type CreateTableBuilder, type Kysely } from 'kysely';

/**
 * Deel-links (M8): read-only links a klant opens without signing in. Only
 * the SHA-256 of the token is stored; the token itself is shown once.
 * A link without expires_at never expires (Nooit); a revoked link stays
 * listed as Ingetrokken.
 */
export async function up(db: Kysely<unknown>): Promise<void> {
  const mysql = db.getExecutor().adapter instanceof MysqlAdapter;
  const tableOptions = <T extends string, C extends string>(builder: CreateTableBuilder<T, C>) =>
    mysql
      ? builder.modifyEnd(sql`ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_bin`)
      : builder;

  await tableOptions(
    db.schema
      .createTable('share_links')
      .addColumn('id', 'varchar(36)', (c) => c.primaryKey())
      // Hex SHA-256 of the token.
      .addColumn('token_hash', 'varchar(64)', (c) => c.notNull().unique())
      .addColumn('customer_folder', 'varchar(255)', (c) => c.notNull())
      .addColumn('label', 'varchar(120)', (c) => c.notNull())
      .addColumn('expires_at', 'varchar(30)')
      .addColumn('revoked_at', 'varchar(30)')
      .addColumn('revoked_by', 'varchar(36)')
      .addColumn('created_at', 'varchar(30)', (c) => c.notNull())
      .addColumn('created_by', 'varchar(36)'),
  ).execute();
  await db.schema
    .createIndex('share_links_customer_idx')
    .on('share_links')
    .column('customer_folder')
    .execute();
}

export async function down(db: Kysely<unknown>): Promise<void> {
  await db.schema.dropTable('share_links').execute();
}
