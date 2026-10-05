import { afterEach, describe, expect, it } from 'vitest';
import type { AppDatabase } from '../../src/db/connection.js';
import { migrateToEmpty, migrateToLatest } from '../../src/db/migrate.js';
import { openTestDatabase, TEST_DATABASES } from '../helpers/databases.js';

describe.each(TEST_DATABASES)('migrations on $name', ({ url }) => {
  let db: AppDatabase | undefined;

  afterEach(async () => {
    await db?.destroy();
    db = undefined;
  });

  const now = '2026-10-05T12:00:00.000Z';
  const record = (id: string, key: string, customer: string) => ({
    id,
    record_key: key,
    customer_folder: customer,
    project_folder: 'Box',
    display_name: 'Box',
    status: 'indexed' as const,
    discovered_at: now,
    last_seen_at: now,
    archived_at: null,
    deleted_at: null,
    deleted_by: null,
    part_name: null,
    material: null,
    printer_model: null,
    print_date: null,
    total_grams: 12.5,
    total_print_seconds: 3_000_000_000,
    updated_at: now,
  });

  it('creates the schema and is idempotent', async () => {
    db = await openTestDatabase(url);
    expect(await migrateToLatest(db)).toEqual([]);
    const tables = (await db.introspection.getTables()).map((t) => t.name);
    expect(tables).toEqual(
      expect.arrayContaining(['print_records', 'print_assets', 'print_lines', 'line_slots']),
    );
  });

  it('treats folder names case-sensitively and keeps numbers as numbers', async () => {
    db = await openTestDatabase(url);
    await db
      .insertInto('print_records')
      .values(record('a', 'Joey/Box', 'Joey'))
      .execute();
    await db
      .insertInto('print_records')
      .values(record('b', 'joey/Box', 'joey'))
      .execute();
    const rows = await db
      .selectFrom('print_records')
      .select(['record_key', 'total_grams', 'total_print_seconds'])
      .orderBy('id')
      .execute();
    expect(rows).toEqual([
      { record_key: 'Joey/Box', total_grams: 12.5, total_print_seconds: 3_000_000_000 },
      { record_key: 'joey/Box', total_grams: 12.5, total_print_seconds: 3_000_000_000 },
    ]);
  });

  it('cascades deletes from records to assets, lines and slots', async () => {
    db = await openTestDatabase(url);
    await db
      .insertInto('print_records')
      .values(record('r', 'Joey/Box', 'Joey'))
      .execute();
    await db
      .insertInto('print_assets')
      .values({
        id: 'asset',
        print_record_id: 'r',
        relative_path: 'Joey/Box/a.gcode',
        path_hash: 'h',
        file_name: 'a.gcode',
        sub_path: '',
        type: 'gcode',
        size_bytes: 10,
        last_write_utc: now,
        name_part: null,
        name_material: null,
        name_print_seconds: null,
        recorded_at: null,
        printer_prefix: null,
        slicer: null,
        has_thumbnail: 0,
        parse_error: null,
        indexed_at: now,
      })
      .execute();
    await db
      .insertInto('print_lines')
      .values({
        id: 'line',
        asset_id: 'asset',
        plate_index: 0,
        total_grams: 1,
        print_seconds: 1,
        printer_model: null,
        material: null,
        auto_excluded: 0,
        auto_exclusion_reason: null,
        user_excluded: null,
        times_printed: 1,
        duplicate_fingerprint: null,
        possible_duplicate: 0,
      })
      .execute();
    await db
      .insertInto('line_slots')
      .values({ id: 's', line_id: 'line', slot: 1, grams: 1, colour: null, material: null })
      .execute();

    await db.deleteFrom('print_records').where('id', '=', 'r').execute();
    expect(await db.selectFrom('line_slots').selectAll().execute()).toEqual([]);
    expect(await db.selectFrom('print_assets').selectAll().execute()).toEqual([]);
  });

  it('rolls back completely', async () => {
    db = await openTestDatabase(url);
    await migrateToEmpty(db);
    const tables = (await db.introspection.getTables()).map((t) => t.name);
    expect(tables).not.toContain('print_records');
  });
});
