import { Kysely, MysqlDialect, PostgresDialect, SqliteDialect, sql, type Dialect } from 'kysely';
import type { DatabaseTarget } from './database-url.js';
import type { Database } from './schema.js';

export type { Database } from './schema.js';
export type AppDatabase = Kysely<Database>;

const CONNECT_TIMEOUT_MS = 5_000;

/**
 * Creates the Kysely instance for the configured engine. Drivers for engines
 * that are not used are never loaded.
 */
export async function createDatabase(target: DatabaseTarget): Promise<AppDatabase> {
  return new Kysely<Database>({ dialect: await createDialect(target) });
}

async function createDialect(target: DatabaseTarget): Promise<Dialect> {
  switch (target.dialect) {
    case 'sqlite': {
      const { default: SqliteDatabase } = await import('better-sqlite3');
      const database = new SqliteDatabase(target.filename);
      database.pragma('journal_mode = WAL');
      database.pragma('foreign_keys = ON');
      return new SqliteDialect({ database });
    }
    case 'postgres': {
      const { default: pg } = await import('pg');
      // BIGINT columns (sizes, seconds) are safe as JavaScript numbers; pg returns strings by default.
      pg.types.setTypeParser(pg.types.builtins.INT8, (value: string) => Number(value));
      return new PostgresDialect({
        pool: new pg.Pool({
          connectionString: target.connectionString,
          connectionTimeoutMillis: CONNECT_TIMEOUT_MS,
        }),
      });
    }
    case 'mysql': {
      const { createPool } = await import('mysql2');
      return new MysqlDialect({
        pool: createPool({ uri: target.uri, connectTimeout: CONNECT_TIMEOUT_MS }),
      });
    }
  }
}

/** Runs a trivial query; resolves to true when the database answers in time. */
export async function pingDatabase(db: AppDatabase, timeoutMs = 3_000): Promise<boolean> {
  let timer: NodeJS.Timeout | undefined;
  const timeout = new Promise<false>((resolve) => {
    timer = setTimeout(() => {
      resolve(false);
    }, timeoutMs);
  });
  try {
    return await Promise.race([sql`select 1`.execute(db).then(() => true), timeout]);
  } finally {
    clearTimeout(timer);
  }
}
