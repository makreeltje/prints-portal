import { mkdir, rm, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { startTestApp, type Session, type TestApp } from '../helpers/app.js';
import { TEST_DATABASES } from '../helpers/databases.js';
import { makePrintsTree } from '../helpers/prints-tree.js';

/** The exact shape of all 16 shortcuts in the owner's library. */
const shortcut = (url: string) =>
  [
    '[{000214A0-0000-0000-C000-000000000046}]',
    'Prop3=19,11',
    '[InternetShortcut]',
    'IDList=',
    `URL=${url}`,
  ].join('\r\n');

describe.each(TEST_DATABASES)('bron and notitie on $name', ({ url }) => {
  let t: TestApp;
  let root: string;
  let admin: Session;
  let helper: Session;
  let dir: string;

  beforeEach(async () => {
    root = await makePrintsTree();
    dir = path.join(root, 'Koen', 'Met een bron');
    await mkdir(dir, { recursive: true });
    await writeFile(path.join(dir, 'cube.stl'), 'solid cube\nendsolid cube\n');
    await writeFile(
      path.join(dir, 'Laptop Stand.url'),
      shortcut('https://www.printables.com/model/417260-laptop-tablet-foldable-stand'),
    );
    t = await startTestApp(url, { PRINTS_ROOT: root });
    await t.app.services.indexer.indexAll();
    await t.addUser('owner@example.org', 'Admin');
    const helperId = await t.addUser('helper@example.org', 'User');
    admin = await t.login('owner@example.org');
    helper = await t.login('helper@example.org');
    await t.as(admin, {
      method: 'PATCH',
      url: '/api/access',
      payload: { changes: [{ userId: helperId, customerFolder: 'Koen', granted: true }] },
    });
  });

  afterEach(async () => {
    await t.close();
    await rm(root, { recursive: true, force: true });
  });

  const idOf = async (name: string) =>
    (await t.as(admin, { url: '/api/prints?limit=100' }))
      .json<{ items: { id: string; name: string }[] }>()
      .items.find((print) => print.name === name)?.id ?? '';

  const detail = async (session: Session, id: string) =>
    (await t.as(session, { url: `/api/prints/${id}` })).json<{
      sources: { url: string; label: string; fileName: string | null }[];
      note: string | null;
    }>();

  it('reads the link out of a .url file in the folder', async () => {
    const id = await idOf('Met een bron');
    expect((await detail(admin, id)).sources).toEqual([
      {
        url: 'https://www.printables.com/model/417260-laptop-tablet-foldable-stand',
        label: 'printables.com/model/417260-laptop-tablet-foldable-stand',
        fileName: 'Laptop Stand.url',
      },
    ]);
  });

  it('backfills a shortcut indexed before the column existed', async () => {
    const id = await idOf('Met een bron');
    // What an install upgraded to 0010 looks like: the file is indexed, the
    // link is not, and nothing about the file has changed.
    await t.db.updateTable('print_assets').set({ url_target: null }).execute();
    await t.app.services.indexer.indexAll();
    expect((await detail(admin, id)).sources).toHaveLength(1);
  });

  it('keeps a typed bron beside the folder, with the typed one first', async () => {
    const id = await idOf('Met een bron');
    await t.as(admin, {
      method: 'PUT',
      url: `/api/prints/${id}/source`,
      payload: { url: 'https://makerworld.com/en/models/38999' },
    });
    const sources = (await detail(admin, id)).sources;
    expect(sources.map((one) => one.fileName)).toEqual([null, 'Laptop Stand.url']);
    expect(sources[0]?.label).toBe('makerworld.com/en/models/38999');
  });

  it("folds a typed bron that is exactly the folder's", async () => {
    const id = await idOf('Met een bron');
    await t.as(admin, {
      method: 'PUT',
      url: `/api/prints/${id}/source`,
      payload: { url: 'https://www.printables.com/model/417260-laptop-tablet-foldable-stand' },
    });
    const sources = (await detail(admin, id)).sources;
    // One fact written twice is one entry, and it keeps its provenance.
    expect(sources).toHaveLength(1);
    expect(sources[0]?.fileName).toBe('Laptop Stand.url');
  });

  it('refuses something that is not an absolute http link', async () => {
    const id = await idOf('Met een bron');
    for (const bad of ['printables.com/model/1', 'javascript:alert(1)', 'file:///C:/x.stl']) {
      const response = await t.as(admin, {
        method: 'PUT',
        url: `/api/prints/${id}/source`,
        payload: { url: bad },
      });
      expect(response.statusCode).toBe(422);
      expect(response.json()).toEqual({ error: 'invalid_url' });
    }
  });

  it('clears a bron by saving nothing, with no separate act', async () => {
    const id = await idOf('Met een bron');
    await t.as(admin, {
      method: 'PUT',
      url: `/api/prints/${id}/source`,
      payload: { url: 'https://makerworld.com/en/models/38999' },
    });
    for (const empty of ['   ', null]) {
      await t.as(admin, {
        method: 'PUT',
        url: `/api/prints/${id}/source`,
        payload: { url: empty },
      });
      // The folder's entry is untouched: only the typed half is writable.
      expect((await detail(admin, id)).sources.map((one) => one.fileName)).toEqual([
        'Laptop Stand.url',
      ]);
    }
  });

  it('keeps a note internal: an Admin sees it, a User never does', async () => {
    const id = await idOf('Met een bron');
    await t.as(admin, {
      method: 'PUT',
      url: `/api/prints/${id}/note`,
      payload: { note: 'In zwart printen, de vorige was wit' },
    });
    expect((await detail(admin, id)).note).toBe('In zwart printen, de vorige was wit');
    expect((await detail(helper, id)).note).toBeNull();
    const asUser = await t.as(helper, { url: `/api/prints/${id}` });
    expect(asUser.body).not.toMatch(/zwart printen/);
  });

  it('refuses a note past 280 characters and keeps the one already saved', async () => {
    const id = await idOf('Met een bron');
    await t.as(admin, { method: 'PUT', url: `/api/prints/${id}/note`, payload: { note: 'kort' } });
    const response = await t.as(admin, {
      method: 'PUT',
      url: `/api/prints/${id}/note`,
      payload: { note: 'x'.repeat(281) },
    });
    expect(response.statusCode).toBe(400);
    expect((await detail(admin, id)).note).toBe('kort');
  });

  it('a User may not write either field', async () => {
    const id = await idOf('Met een bron');
    for (const [field, payload] of [
      ['source', { url: 'https://a.test/x' }],
      ['note', { note: 'nee' }],
    ] as const) {
      const response = await t.as(helper, {
        method: 'PUT',
        url: `/api/prints/${id}/${field}`,
        payload,
      });
      expect(response.statusCode).toBe(403);
    }
  });
});
