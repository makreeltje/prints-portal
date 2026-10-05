import type { AppDatabase } from './connection.js';

/**
 * The single entry point for reading prints anywhere in the app. Records
 * with status Deleted are hidden from every list, detail, share page,
 * invoice and access check by starting from this query (brief §2.5).
 * Only the indexer and the admin "show deleted" view look past it.
 */
export function visibleRecords(db: AppDatabase) {
  return db.selectFrom('print_records').where('print_records.status', '!=', 'deleted');
}
