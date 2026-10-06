import { MysqlAdapter, sql, type CreateTableBuilder, type Kysely } from 'kysely';

/** Tags (name, optional colour) and which prints carry them. */
export async function up(db: Kysely<unknown>): Promise<void> {
  const mysql = db.getExecutor().adapter instanceof MysqlAdapter;
  const tableOptions = <T extends string, C extends string>(builder: CreateTableBuilder<T, C>) =>
    mysql
      ? builder.modifyEnd(sql`ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_bin`)
      : builder;

  await tableOptions(
    db.schema
      .createTable('tags')
      .addColumn('id', 'varchar(36)', (c) => c.primaryKey())
      .addColumn('name', 'varchar(255)', (c) => c.notNull())
      // Lower-cased name: tags are unique case-insensitively on every engine.
      .addColumn('name_key', 'varchar(255)', (c) => c.notNull().unique())
      .addColumn('colour', 'varchar(7)')
      .addColumn('created_at', 'varchar(30)', (c) => c.notNull()),
  ).execute();

  await tableOptions(
    db.schema
      .createTable('print_tags')
      .addColumn('print_record_id', 'varchar(36)', (c) =>
        c.notNull().references('print_records.id').onDelete('cascade'),
      )
      .addColumn('tag_id', 'varchar(36)', (c) =>
        c.notNull().references('tags.id').onDelete('cascade'),
      )
      .addPrimaryKeyConstraint('print_tags_pk', ['print_record_id', 'tag_id']),
  ).execute();
  await db.schema.createIndex('print_tags_tag_idx').on('print_tags').column('tag_id').execute();
}

export async function down(db: Kysely<unknown>): Promise<void> {
  await db.schema.dropTable('print_tags').execute();
  await db.schema.dropTable('tags').execute();
}
