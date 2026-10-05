import { MysqlAdapter, sql, type CreateTableBuilder, type Kysely } from 'kysely';

/** Users, per-customer access grants for the User role, and login sessions. */
export async function up(db: Kysely<unknown>): Promise<void> {
  const mysql = db.getExecutor().adapter instanceof MysqlAdapter;
  const tableOptions = <T extends string, C extends string>(builder: CreateTableBuilder<T, C>) =>
    mysql
      ? builder.modifyEnd(sql`ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_bin`)
      : builder;

  await tableOptions(
    db.schema
      .createTable('users')
      .addColumn('id', 'varchar(36)', (c) => c.primaryKey())
      // Sign-in name: an e-mail address or a plain name. Stored lower-case, so a
      // case-sensitive unique index is enough on every engine.
      .addColumn('login', 'varchar(320)', (c) => c.notNull().unique())
      .addColumn('display_name', 'varchar(255)', (c) => c.notNull())
      .addColumn('role', 'varchar(16)', (c) => c.notNull())
      .addColumn('password_hash', 'varchar(255)')
      .addColumn('oidc_subject', 'varchar(255)', (c) => c.unique())
      .addColumn('role_from_group', 'integer', (c) => c.notNull().defaultTo(0))
      // 1 after an Admin set a temporary password; the user must choose their own first.
      .addColumn('must_change_password', 'integer', (c) => c.notNull().defaultTo(0))
      .addColumn('created_at', 'varchar(30)', (c) => c.notNull())
      .addColumn('last_login_at', 'varchar(30)'),
  ).execute();

  await tableOptions(
    db.schema
      .createTable('customer_access')
      .addColumn('user_id', 'varchar(36)', (c) =>
        c.notNull().references('users.id').onDelete('cascade'),
      )
      .addColumn('customer_folder', 'varchar(255)', (c) => c.notNull())
      .addColumn('granted_at', 'varchar(30)', (c) => c.notNull())
      .addPrimaryKeyConstraint('customer_access_pk', ['user_id', 'customer_folder']),
  ).execute();

  await tableOptions(
    db.schema
      .createTable('sessions')
      // HMAC of the cookie value; the value itself is never stored.
      .addColumn('id_hash', 'varchar(64)', (c) => c.primaryKey())
      .addColumn('user_id', 'varchar(36)', (c) =>
        c.notNull().references('users.id').onDelete('cascade'),
      )
      .addColumn('csrf_token', 'varchar(64)', (c) => c.notNull())
      .addColumn('created_at', 'varchar(30)', (c) => c.notNull())
      .addColumn('last_seen_at', 'varchar(30)', (c) => c.notNull())
      .addColumn('expires_at', 'varchar(30)', (c) => c.notNull()),
  ).execute();
  await db.schema.createIndex('sessions_user_idx').on('sessions').column('user_id').execute();
}

export async function down(db: Kysely<unknown>): Promise<void> {
  await db.schema.dropTable('sessions').execute();
  await db.schema.dropTable('customer_access').execute();
  await db.schema.dropTable('users').execute();
}
