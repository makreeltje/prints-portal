import { appendFile, rename, rm, utimes } from 'node:fs/promises';
import path from 'node:path';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import type { AppDatabase } from '../../src/db/connection.js';
import { visibleRecords } from '../../src/db/records.js';
import { Indexer, type PrintEvent } from '../../src/indexing/indexer.js';
import { openTestDatabase, TEST_DATABASES } from '../helpers/databases.js';
import { makePrintsTree, putText } from '../helpers/prints-tree.js';

describe.each(TEST_DATABASES)('indexer on $name', ({ url }) => {
  let db: AppDatabase;
  let root: string;
  let events: PrintEvent[];
  let indexer: Indexer;

  beforeEach(async () => {
    db = await openTestDatabase(url);
    root = await makePrintsTree();
    events = [];
    indexer = new Indexer({ db, printsRoot: root, onEvent: (e) => events.push(e) });
  });

  afterEach(async () => {
    await indexer.idle();
    await db.destroy();
    await rm(root, { recursive: true, force: true });
  });

  const record = (key: string) =>
    db
      .selectFrom('print_records')
      .selectAll()
      .where('record_key', '=', key)
      .executeTakeFirstOrThrow();

  const lines = (key: string) =>
    db
      .selectFrom('print_lines as l')
      .innerJoin('print_assets as a', 'a.id', 'l.asset_id')
      .innerJoin('print_records as r', 'r.id', 'a.print_record_id')
      .select([
        'a.file_name',
        'l.plate_index',
        'l.total_grams',
        'l.auto_excluded',
        'l.auto_exclusion_reason',
        'l.user_excluded',
        'a.path_hash',
        'l.possible_duplicate',
        'l.id',
      ])
      .where('r.record_key', '=', key)
      .orderBy('a.file_name')
      .execute();

  it('indexes every print with its rules applied', async () => {
    const summary = await indexer.indexAll();
    expect(summary).toMatchObject({ created: 5, updated: 0, archived: 0, parseErrors: 0 });
    expect(summary.filesParsed).toBe(8);

    const keys = (
      await db.selectFrom('print_records').select('record_key').orderBy('record_key').execute()
    ).map((r) => r.record_key);
    expect(keys).toEqual([
      'Denise/Board game',
      'Denise/Keychain',
      'Joey/',
      'Joey/Babybox locks',
      'Wouter/Empty',
    ]);

    const babybox = await record('Joey/Babybox locks');
    expect(babybox).toMatchObject({
      status: 'indexed',
      customer_folder: 'Joey',
      project_folder: 'Babybox locks',
      display_name: 'Babybox locks',
      total_grams: 173.49,
      total_print_seconds: 12_294,
      part_name: 'lock',
      material: 'PLA',
      printer_model: 'Creality K1 Max',
    });

    expect(
      (await lines('Joey/Babybox locks')).map((l) => [
        l.file_name,
        l.auto_excluded,
        l.auto_exclusion_reason,
      ]),
    ).toEqual([
      ['lock.3mf', 1, 'gcode-present'],
      ['lock_PLA_3h27m.gcode', 0, null],
      ['next_PLA_11m.gcode', 1, 'folder:Nog te printen'],
    ]);

    const files = await db
      .selectFrom('print_assets')
      .select(['relative_path', 'sub_path', 'type'])
      .where('print_record_id', '=', babybox.id)
      .orderBy('relative_path')
      .execute();
    expect(files).toEqual([
      {
        relative_path: 'Joey/Babybox locks/Nog te printen/next_PLA_11m.gcode',
        sub_path: 'Nog te printen',
        type: 'gcode',
      },
      { relative_path: 'Joey/Babybox locks/lock.3mf', sub_path: '', type: '3mf' },
      { relative_path: 'Joey/Babybox locks/lock_PLA_3h27m.gcode', sub_path: '', type: 'gcode' },
      { relative_path: 'Joey/Babybox locks/render.png', sub_path: '', type: 'other' },
    ]);

    expect(await record('Joey/')).toMatchObject({
      project_folder: null,
      display_name: 'Joey',
      total_grams: 15.36,
    });
    expect(await record('Denise/Board game')).toMatchObject({
      total_grams: 224.39,
      printer_model: 'K1 Max',
    });
    expect(await record('Wouter/Empty')).toMatchObject({ total_grams: null, print_date: null });

    const keychain = await lines('Denise/Keychain');
    expect(keychain.map((l) => l.possible_duplicate)).toEqual([1, 1]);
    expect(await record('Denise/Keychain')).toMatchObject({ total_grams: 6.06 });

    expect(events.filter((e) => e.type === 'print:created')).toHaveLength(5);
  });

  it('does not parse unchanged files again', async () => {
    await indexer.indexAll();
    events = [];
    const again = await indexer.indexAll();
    expect(again).toMatchObject({ filesParsed: 0, unchanged: 5, created: 0, updated: 0 });
    expect(events).toEqual([]);
  });

  it('keeps user decisions when a file changes', async () => {
    await indexer.indexAll();
    const next = (await lines('Joey/Babybox locks')).find(
      (l) => l.file_name === 'next_PLA_11m.gcode',
    );
    await db
      .updateTable('print_lines')
      .set({ user_excluded: 0 })
      .where('id', '=', next?.id ?? '')
      .execute();
    await db
      .updateTable('order_items')
      .set({ times_printed: 2 })
      .where('path_hash', '=', next?.path_hash ?? '')
      .execute();

    const file = path.join(root, 'Joey/Babybox locks/Nog te printen/next_PLA_11m.gcode');
    await appendFile(file, '\n; touched\n');
    const summary = await indexer.indexProject({
      customerFolder: 'Joey',
      projectFolder: 'Babybox locks',
    });
    expect(summary).toMatchObject({ updated: 1, filesParsed: 1 });

    const after = (await lines('Joey/Babybox locks')).find(
      (l) => l.file_name === 'next_PLA_11m.gcode',
    );
    expect(after).toMatchObject({ user_excluded: 0, auto_excluded: 1 });
    const item = await db
      .selectFrom('order_items')
      .select('times_printed')
      .where('path_hash', '=', after?.path_hash ?? '')
      .executeTakeFirstOrThrow();
    expect(item.times_printed).toBe(2);
    // 173.49 + 2 × 3.03
    expect((await record('Joey/Babybox locks')).total_grams).toBe(179.55);
  });

  it('lets a 3MF count when the user excludes the only G-code', async () => {
    await indexer.indexAll();
    const babybox = await record('Joey/Babybox locks');
    const gcode = (await lines('Joey/Babybox locks')).find(
      (l) => l.file_name === 'lock_PLA_3h27m.gcode',
    );
    await db
      .updateTable('print_lines')
      .set({ user_excluded: 1 })
      .where('id', '=', gcode?.id ?? '')
      .execute();
    await indexer.recalculateRecord(babybox.id);

    const threeMf = (await lines('Joey/Babybox locks')).find((l) => l.file_name === 'lock.3mf');
    expect(threeMf).toMatchObject({ auto_excluded: 0, auto_exclusion_reason: null });
    expect((await record('Joey/Babybox locks')).total_grams).toBe(224.39);
  });

  it('never re-creates or revives a deleted print, and hides it', async () => {
    await indexer.indexAll();
    await db
      .updateTable('print_records')
      .set({ status: 'deleted', deleted_at: '2026-10-05T12:00:00.000Z' })
      .where('record_key', '=', 'Denise/Keychain')
      .execute();
    await putText(root, 'Denise/Keychain/new_PLA_1h.gcode', '; filament used [g] = 1');

    const summary = await indexer.indexAll(true);
    expect(summary.skippedDeleted).toBe(1);
    expect((await record('Denise/Keychain')).status).toBe('deleted');
    const visible = await visibleRecords(db).select('record_key').execute();
    expect(visible.map((r) => r.record_key)).not.toContain('Denise/Keychain');
    expect(visible).toHaveLength(4);
  });

  it('archives a print whose folder disappears and revives it when it returns', async () => {
    await indexer.indexAll();
    const before = await record('Denise/Board game');
    const folder = path.join(root, 'Denise/Board game');
    const parked = path.join(root, '..', `parked-${path.basename(root)}`);
    await rename(folder, parked);

    expect(await indexer.indexAll()).toMatchObject({ archived: 1 });
    const archived = await record('Denise/Board game');
    expect(archived).toMatchObject({ id: before.id, status: 'archived', total_grams: 224.39 });
    expect(archived.archived_at).not.toBeNull();
    const assets = await db
      .selectFrom('print_assets')
      .where('print_record_id', '=', before.id)
      .selectAll()
      .execute();
    expect(assets).toEqual([]);

    await rename(parked, folder);
    expect(await indexer.indexAll()).toMatchObject({ updated: 1 });
    expect(await record('Denise/Board game')).toMatchObject({
      id: before.id,
      status: 'indexed',
      archived_at: null,
      total_grams: 224.39,
    });
  });

  it('archives every print of a customer folder that is removed', async () => {
    await indexer.indexAll();
    await rm(path.join(root, 'Joey'), { recursive: true });
    const summary = await indexer.indexCustomer('Joey');
    expect(summary.archived).toBe(2);
    expect((await record('Joey/')).status).toBe('archived');
  });

  it('adds and removes files inside a print', async () => {
    await indexer.indexAll();
    await rm(path.join(root, 'Denise/Keychain/key_PLA_11m copy.gcode'));
    await putText(root, 'Denise/Keychain/notes.pdf', '%PDF');
    const later = new Date('2030-01-01T00:00:00Z');
    await utimes(path.join(root, 'Denise/Keychain/notes.pdf'), later, later);

    await indexer.indexProject({ customerFolder: 'Denise', projectFolder: 'Keychain' });
    const names = await db
      .selectFrom('print_assets')
      .select('file_name')
      .where('relative_path', 'like', 'Denise/Keychain/%')
      .orderBy('file_name')
      .execute();
    expect(names.map((n) => n.file_name)).toEqual(['key_PLA_11m.gcode', 'notes.pdf']);
    expect((await lines('Denise/Keychain')).map((l) => l.possible_duplicate)).toEqual([0]);
    expect((await record('Denise/Keychain')).total_grams).toBe(3.03);
  });

  it('puts every file of a new print in order 1', async () => {
    await indexer.indexAll();
    const box = await record('Joey/Babybox locks');
    const orders = await db
      .selectFrom('print_orders')
      .selectAll()
      .where('print_record_id', '=', box.id)
      .execute();
    expect(orders.map((o) => o.number)).toEqual([1]);
    const items = await db
      .selectFrom('order_items')
      .selectAll()
      .where('order_id', '=', orders[0]?.id ?? '')
      .execute();
    expect(items).toHaveLength((await lines('Joey/Babybox locks')).length);
    expect(items.every((item) => item.times_printed === 1)).toBe(true);
  });

  it('keeps new files out of an order that has a price, until a Nabestelling', async () => {
    await indexer.indexAll();
    const keychain = await record('Denise/Keychain');
    await db
      .updateTable('print_orders')
      .set({ sale_price_cents: 500 })
      .where('print_record_id', '=', keychain.id)
      .execute();
    await putText(
      root,
      'Denise/Keychain/spare_PLA_11m.gcode',
      '; total filament used [g] = 3.03\n',
    );
    await indexer.indexProject({ customerFolder: 'Denise', projectFolder: 'Keychain' });

    const items = await db
      .selectFrom('order_items as i')
      .innerJoin('print_orders as o', 'o.id', 'i.order_id')
      .select('i.path_hash')
      .where('o.print_record_id', '=', keychain.id)
      .execute();
    const spare = (await lines('Denise/Keychain')).find(
      (l) => l.file_name === 'spare_PLA_11m.gcode',
    );
    expect(spare).toBeDefined();
    expect(items.map((i) => i.path_hash)).not.toContain(spare?.path_hash);
    // A file in no order does not count.
    expect((await record('Denise/Keychain')).total_grams).toBe(keychain.total_grams);
  });

  it('keeps orders and their items when an archived folder returns', async () => {
    await indexer.indexAll();
    const before = await record('Denise/Board game');
    await db
      .updateTable('order_items')
      .set({ times_printed: 3 })
      .where('order_id', 'in', (eb) =>
        eb.selectFrom('print_orders').select('id').where('print_record_id', '=', before.id),
      )
      .execute();
    const folder = path.join(root, 'Denise/Board game');
    const parked = path.join(root, '..', `parked-orders-${path.basename(root)}`);
    await rename(folder, parked);
    await indexer.indexAll();
    await rename(parked, folder);
    await indexer.indexAll();
    const items = await db
      .selectFrom('order_items as i')
      .innerJoin('print_orders as o', 'o.id', 'i.order_id')
      .select('i.times_printed')
      .where('o.print_record_id', '=', before.id)
      .execute();
    expect(items.length).toBeGreaterThan(0);
    expect(items.every((item) => item.times_printed === 3)).toBe(true);
  });

  it('records unreadable files instead of failing', async () => {
    await putText(root, 'Wouter/Empty/broken.3mf', 'this is not a zip');
    const summary = await indexer.indexAll();
    expect(summary.parseErrors).toBe(1);
    const broken = await db
      .selectFrom('print_assets')
      .select(['parse_error', 'type'])
      .where('file_name', '=', 'broken.3mf')
      .executeTakeFirstOrThrow();
    expect(broken.type).toBe('3mf');
    expect(broken.parse_error).toContain('not a readable 3MF archive');
  });

  it('runs overlapping requests one after another', async () => {
    const results = await Promise.all([
      indexer.indexAll(),
      indexer.indexProject({ customerFolder: 'Joey', projectFolder: 'Babybox locks' }),
      indexer.indexAll(),
    ]);
    expect(results.map((r) => r.created)).toEqual([5, 0, 0]);
    expect(await db.selectFrom('print_records').select('id').execute()).toHaveLength(5);
  });
});
