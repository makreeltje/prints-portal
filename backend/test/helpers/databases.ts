import { createDatabase, type AppDatabase } from '../../src/db/connection.js';
import { parseDatabaseUrl } from '../../src/db/database-url.js';
import { migrateToEmpty, migrateToLatest } from '../../src/db/migrate.js';

/**
 * Engines to run database tests against: SQLite always, PostgreSQL and
 * MariaDB/MySQL when TEST_POSTGRES_URL / TEST_MYSQL_URL are set (CI sets both).
 */
export const TEST_DATABASES: readonly { name: string; url: string }[] = [
  { name: 'sqlite', url: 'sqlite::memory:' },
  ...(process.env.TEST_POSTGRES_URL
    ? [{ name: 'postgres', url: process.env.TEST_POSTGRES_URL }]
    : []),
  ...(process.env.TEST_MYSQL_URL ? [{ name: 'mariadb', url: process.env.TEST_MYSQL_URL }] : []),
];

/** A connection with an empty, fully migrated schema. */
export async function openTestDatabase(url: string): Promise<AppDatabase> {
  const db = await createDatabase(parseDatabaseUrl(url));
  await migrateToEmpty(db);
  await migrateToLatest(db);
  return db;
}
