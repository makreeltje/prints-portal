import type { Kysely } from 'kysely';
import { afterEach, describe, expect, it } from 'vitest';
import type { AppDatabase } from '../../src/db/connection.js';
import { migrateTo, migrateToEmpty, migrateToLatest } from '../../src/db/migrate.js';
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
      expect.arrayContaining([
        'print_records',
        'print_assets',
        'print_lines',
        'line_slots',
        'users',
        'customer_access',
        'sessions',
        'tags',
        'print_tags',
        'app_settings',
        'customers',
        'line_overrides',
        'print_orders',
        'order_items',
        'payments',
        'invoices',
        'invoice_lines',
      ]),
    );
  });

  it('moves times printed into order 1 of every existing print', async () => {
    db = await openTestDatabase(url);
    await migrateTo(db, '0003_tags');
    // Written at the 0003 schema, before orders existed.
    await db
      .insertInto('print_records')
      .values(record('r', 'Joey/Box', 'Joey'))
      .execute();
    await sqlInsert(db, 'r');
    await migrateToLatest(db);

    const orders = await db.selectFrom('print_orders').selectAll().execute();
    expect(orders).toMatchObject([{ print_record_id: 'r', number: 1, sale_price_cents: null }]);
    const items = await db.selectFrom('order_items').selectAll().execute();
    expect(items).toEqual([
      { order_id: orders[0]?.id, path_hash: 'h1', plate_index: 0, times_printed: 3 },
    ]);
    const columns = (await db.introspection.getTables())
      .find((t) => t.name === 'print_lines')
      ?.columns.map((c) => c.name);
    expect(columns).not.toContain('times_printed');
  });

  it('removes sessions and grants with their user', async () => {
    db = await openTestDatabase(url);
    await db
      .insertInto('users')
      .values({
        id: 'u1',
        login: 'helper@example.org',
        display_name: 'helper',
        role: 'User',
        password_hash: null,
        oidc_subject: null,
        role_from_group: 0,
        must_change_password: 0,
        created_at: now,
        last_login_at: null,
      })
      .execute();
    await db
      .insertInto('customer_access')
      .values([
        { user_id: 'u1', customer_folder: 'Joey', granted_at: now },
        { user_id: 'u1', customer_folder: 'joey', granted_at: now },
      ])
      .execute();
    await db
      .insertInto('sessions')
      .values({
        id_hash: 'h',
        user_id: 'u1',
        csrf_token: 'c',
        created_at: now,
        last_seen_at: now,
        expires_at: now,
      })
      .execute();
    await db.deleteFrom('users').where('id', '=', 'u1').execute();
    expect(await db.selectFrom('customer_access').selectAll().execute()).toEqual([]);
    expect(await db.selectFrom('sessions').selectAll().execute()).toEqual([]);
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
    expect(tables).not.toContain('users');
  });
});

/** A file with a line printed three times, in the 0003 schema (times_printed on the line). */
async function sqlInsert(db: AppDatabase, recordId: string): Promise<void> {
  const now = '2026-10-05T12:00:00.000Z';
  await db
    .insertInto('print_assets')
    .values({
      id: 'a1',
      print_record_id: recordId,
      relative_path: 'Joey/Box/a.gcode',
      path_hash: 'h1',
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
  await (db as unknown as Kysely<{ print_lines: Record<string, unknown> }>)
    .insertInto('print_lines')
    .values({
      id: 'l1',
      asset_id: 'a1',
      plate_index: 0,
      total_grams: 1,
      print_seconds: 1,
      printer_model: null,
      material: null,
      auto_excluded: 0,
      auto_exclusion_reason: null,
      user_excluded: null,
      times_printed: 3,
      duplicate_fingerprint: null,
      possible_duplicate: 0,
    })
    .execute();
}
