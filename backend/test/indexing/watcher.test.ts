import { mkdir, rm } from 'node:fs/promises';
import path from 'node:path';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import type { AppDatabase } from '../../src/db/connection.js';
import { Indexer } from '../../src/indexing/indexer.js';
import { PrintsWatcher, targetFor } from '../../src/indexing/watcher.js';
import { openTestDatabase } from '../helpers/databases.js';
import { makePrintsTree, put, putText } from '../helpers/prints-tree.js';

describe('targetFor', () => {
  const p = (...parts: string[]) => parts.join(path.sep);

  it.each([
    [
      'add',
      p('Koen', 'Box', 'a.gcode'),
      { kind: 'project', ref: { customerFolder: 'Koen', projectFolder: 'Box' } },
    ],
    [
      'change',
      p('Koen', 'Box', 'Test', 'a.gcode'),
      { kind: 'project', ref: { customerFolder: 'Koen', projectFolder: 'Box' } },
    ],
    [
      'addDir',
      p('Koen', 'Box'),
      { kind: 'project', ref: { customerFolder: 'Koen', projectFolder: 'Box' } },
    ],
    [
      'unlinkDir',
      p('Koen', 'Box'),
      { kind: 'project', ref: { customerFolder: 'Koen', projectFolder: 'Box' } },
    ],
    [
      'add',
      p('Koen', 'loose.stl'),
      { kind: 'project', ref: { customerFolder: 'Koen', projectFolder: null } },
    ],
    [
      'unlink',
      p('Koen', 'loose.stl'),
      { kind: 'project', ref: { customerFolder: 'Koen', projectFolder: null } },
    ],
    ['addDir', 'Koen', { kind: 'customer', customerFolder: 'Koen' }],
    ['unlinkDir', 'Koen', { kind: 'customer', customerFolder: 'Koen' }],
  ])('%s %s', (event, relative, target) => {
    expect(targetFor(event, relative)).toEqual(target);
  });

  it.each([
    ['add', 'notes.txt'],
    ['addDir', ''],
    ['add', p('..', 'elsewhere', 'x')],
  ])('ignores %s %j', (event, relative) => {
    expect(targetFor(event, relative)).toBeNull();
  });
});

describe('PrintsWatcher', () => {
  let db: AppDatabase;
  let root: string;
  let indexer: Indexer;
  let watcher: PrintsWatcher;
  let runs: string[];

  beforeEach(async () => {
    db = await openTestDatabase('sqlite::memory:');
    root = await makePrintsTree();
    runs = [];
    indexer = new Indexer({
      db,
      printsRoot: root,
      onEvent: (e) => runs.push(`${e.type} ${e.customerFolder}/${e.projectFolder ?? ''}`),
    });
    await indexer.indexAll();
    runs = [];
    watcher = new PrintsWatcher({ root, indexer, debounceMs: 150 });
    await watcher.start();
  });

  afterEach(async () => {
    await watcher.close();
    await indexer.idle();
    await db.destroy();
    await rm(root, { recursive: true, force: true });
  });

  const status = async (key: string) =>
    (
      await db
        .selectFrom('print_records')
        .select('status')
        .where('record_key', '=', key)
        .executeTakeFirst()
    )?.status;

  async function eventually(check: () => Promise<boolean>, timeoutMs = 5000): Promise<void> {
    const start = Date.now();
    while (!(await check())) {
      if (Date.now() - start > timeoutMs) throw new Error('condition not met in time');
      await new Promise((resolve) => setTimeout(resolve, 50));
    }
    await indexer.idle();
  }

  it('indexes a new project folder', async () => {
    await put(root, 'Veerle/Lamp/shade_PLA_1h.gcode', 'orca-single-slot.gcode');
    await eventually(async () => (await status('Veerle/Lamp')) === 'indexed');
    expect(runs).toContain('print:created Veerle/Lamp');
  });

  it('archives a project whose folder is removed', async () => {
    await rm(path.join(root, 'Esmee', 'Board game'), { recursive: true });
    await eventually(async () => (await status('Esmee/Board game')) === 'archived');
  });

  it('indexes a burst of changes in one project once', async () => {
    for (let i = 0; i < 5; i++) {
      await putText(root, `Esmee/Keychain/note-${String(i)}.pdf`, '%PDF');
    }
    await eventually(() => Promise.resolve(runs.some((r) => r.endsWith('Esmee/Keychain'))));
    await new Promise((resolve) => setTimeout(resolve, 400));
    await indexer.idle();
    expect(runs.filter((r) => r.endsWith('Esmee/Keychain'))).toEqual([
      'print:updated Esmee/Keychain',
    ]);
  });

  it('picks up a new customer folder', async () => {
    await mkdir(path.join(root, 'Anouk', 'Mount'), { recursive: true });
    await put(root, 'Anouk/Mount/mount_PLA_48m.gcode', 'orca-multi-slot.gcode');
    await eventually(async () => (await status('Anouk/Mount')) === 'indexed');
  });

  it('ignores changes in hidden folders', async () => {
    await putText(root, 'Koen/Bloembak clips/.thumbs/new.png', 'x');
    await new Promise((resolve) => setTimeout(resolve, 500));
    await indexer.idle();
    expect(runs).toEqual([]);
  });
});
