import { Migrator, NO_MIGRATIONS, type Migration, type MigrationProvider } from 'kysely/migration';
import type { AppDatabase } from './connection.js';
import * as m0001 from './migrations/0001_print_index.js';
import * as m0002 from './migrations/0002_auth.js';
import * as m0003 from './migrations/0003_tags.js';
import * as m0004 from './migrations/0004_financials.js';
import * as m0005 from './migrations/0005_invoices.js';
import * as m0006 from './migrations/0006_share_links.js';
import * as m0007 from './migrations/0007_pay_link.js';

/** Migrations are listed explicitly so the compiled app needs no directory scanning. */
const MIGRATIONS: Record<string, Migration> = {
  '0001_print_index': m0001,
  '0002_auth': m0002,
  '0003_tags': m0003,
  '0004_financials': m0004,
  '0005_invoices': m0005,
  '0006_share_links': m0006,
  '0007_pay_link': m0007,
};

const provider: MigrationProvider = {
  getMigrations: () => Promise.resolve(MIGRATIONS),
};

export class MigrationError extends Error {
  override name = 'MigrationError';
}

/** Applies all pending migrations; throws (and the app refuses to start) when one fails. */
export async function migrateToLatest(db: AppDatabase): Promise<string[]> {
  const { error, results } = await new Migrator({ db, provider }).migrateToLatest();
  const failed = results?.find((result) => result.status === 'Error');
  if (error !== undefined || failed !== undefined) {
    const which = failed === undefined ? '' : ` (${failed.migrationName})`;
    const reason = describe(error ?? failed);
    throw new MigrationError(`database migration failed${which}: ${reason}`);
  }
  return (results ?? []).map((result) => result.migrationName);
}

/** Migrates up or down to one named migration; used by tests of data migrations. */
export async function migrateTo(db: AppDatabase, name: string): Promise<void> {
  const { error } = await new Migrator({ db, provider }).migrateTo(name);
  if (error !== undefined)
    throw new MigrationError(`migration to ${name} failed: ${describe(error)}`);
}

/** Drops everything the migrations created; used by tests to start clean. */
export async function migrateToEmpty(db: AppDatabase): Promise<void> {
  const { error } = await new Migrator({ db, provider }).migrateTo(NO_MIGRATIONS);
  if (error !== undefined) {
    throw new MigrationError(`database reset failed: ${describe(error)}`);
  }
}

function describe(error: unknown): string {
  if (error instanceof Error) return error.message;
  return typeof error === 'string' ? error : 'unknown error';
}
