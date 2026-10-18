import { mkdir, rm, symlink, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import type { PrintDetail, PrintSummary } from '../../src/prints/types.js';
import { startTestApp, type Session, type TestApp } from '../helpers/app.js';
import { TEST_DATABASES } from '../helpers/databases.js';
import { makePrintsTree } from '../helpers/prints-tree.js';

interface ListBody {
  items: PrintSummary[];
  total: number;
}

describe.each(TEST_DATABASES)('prints API on $name', ({ url }) => {
  let t: TestApp;
  let root: string;
  let admin: Session;
  let editor: Session;
  let helper: Session;
  let helperId: string;

  beforeEach(async () => {
    root = await makePrintsTree();
    t = await startTestApp(url, { PRINTS_ROOT: root });
    await t.app.services.indexer.indexAll();
    await t.addUser('owner@example.org', 'Admin');
    await t.addUser('editor@example.org', 'Editor');
    helperId = await t.addUser('helper@example.org', 'User');
    admin = await t.login('owner@example.org');
    editor = await t.login('editor@example.org');
    helper = await t.login('helper@example.org');
    await t.as(admin, {
      method: 'PATCH',
      url: '/api/access',
      payload: { changes: [{ userId: helperId, customerFolder: 'Joey', granted: true }] },
    });
  });

  afterEach(async () => {
    await t.close();
    await rm(root, { recursive: true, force: true });
  });

  const list = async (session: Session, query = '') =>
    (await t.as(session, { url: `/api/prints${query}` })).json<ListBody>();
  const idOf = async (name: string) => {
    const found = (await list(admin, '?archived=true&deleted=true&limit=100')).items.find(
      (item) => item.name === name,
    );
    if (found === undefined) throw new Error(`no print ${name}`);
    return found.id;
  };

  it('lists prints newest first with totals, names and folders', async () => {
    const body = await list(admin);
    expect(body.total).toBe(body.items.length);
    expect(
      body.items.map((item) => `${item.customerFolder}/${item.projectFolder ?? ''}`).sort(),
    ).toEqual(
      [
        'Denise/Board game',
        'Denise/Keychain',
        'Joey/',
        'Joey/Babybox locks',
        'Wouter/Empty',
      ].sort(),
    );
    const lock = body.items.find((item) => item.name === 'Babybox locks');
    expect(lock).toMatchObject({ customerFolder: 'Joey', grams: 173.49, hasThumbnail: true });
    // Tint: slicer colour of the first slot of the counted G-code (the excluded 3MF does not count).
    expect(lock?.colour).toMatch(/^#[0-9a-f]{6}$/);
    expect(body.items.find((item) => item.name === 'Empty')?.colour).toBeNull();
    expect(body.items.find((item) => item.name === 'Empty')?.hasThumbnail).toBe(false);
  });

  it('pages with offset and limit', async () => {
    const first = await list(admin, '?limit=2');
    const second = await list(admin, '?limit=2&offset=2');
    expect(first.items).toHaveLength(2);
    expect(first.total).toBe(5);
    expect(second.items.map((i) => i.id)).not.toContain(first.items[0]?.id);
  });

  it('sorts and filters by status over the whole set, not one page', async () => {
    // Price two prints so the money sorts and filters have something to work on.
    const all = await list(admin);
    const lock = all.items.find((item) => item.name === 'Babybox locks');
    const keychain = all.items.find((item) => item.name === 'Keychain');
    for (const [print, price] of [
      [lock, 30],
      [keychain, 10],
    ] as const) {
      const detail = (await t.as(admin, { url: `/api/prints/${print?.id ?? ''}` })).json<{
        orders: { id: string }[];
      }>();
      await t.as(admin, {
        method: 'PUT',
        url: `/api/orders/${detail.orders[0]?.id ?? ''}/sale-price`,
        payload: { salePrice: price },
      });
    }

    // Dearest first, and a print without a price goes last either way.
    const high = await list(admin, '?sort=priceDesc');
    expect(high.items.map((item) => item.name).slice(0, 2)).toEqual(['Babybox locks', 'Keychain']);
    expect(high.items.at(-1)?.money?.price ?? null).toBeNull();
    const low = await list(admin, '?sort=priceAsc');
    expect(low.items.map((item) => item.name).slice(0, 2)).toEqual(['Keychain', 'Babybox locks']);
    expect(low.items.at(-1)?.money?.price ?? null).toBeNull();

    // Oldest first runs up the dates, newest first runs down them. (Prints that
    // share a date keep the same tie-break in both, so the lists are not exact
    // mirrors.)
    const dates = (items: { printDate: string | null }[]) => items.map((i) => i.printDate ?? '');
    const newest = dates((await list(admin, '?sort=newest')).items);
    const oldest = dates((await list(admin, '?sort=oldest')).items);
    expect(newest).toEqual([...newest].sort().reverse());
    expect(oldest).toEqual([...oldest].sort());

    // Klant A to Z, ties on newest.
    const byCustomer = await list(admin, '?sort=customer');
    const folders = byCustomer.items.map((item) => item.customerFolder);
    expect([...folders]).toEqual([...folders].sort((a, b) => a.localeCompare(b)));

    // Status narrows the set, and the total counts the matches, not the page.
    const open = await list(admin, '?status=open');
    expect(open.items.length).toBeGreaterThan(0);
    expect(open.total).toBe(open.items.length);
    for (const item of open.items) expect(['open', 'partial']).toContain(item.money?.status);
    const noPrice = await list(admin, '?status=noPrice');
    for (const item of noPrice.items) expect(item.money?.price ?? null).toBeNull();
    expect(open.total + noPrice.total).toBeLessThanOrEqual(all.total);

    // Filtering happens before paging: one page of a narrowed set still counts all of it.
    const firstOfOpen = await list(admin, '?status=open&limit=1');
    expect(firstOfOpen.items).toHaveLength(1);
    expect(firstOfOpen.total).toBe(open.total);
  });

  it('filters by customer and by search text, case-insensitively, with literal wildcards', async () => {
    expect((await list(admin, '?customer=Denise')).items.map((i) => i.name).sort()).toEqual([
      'Board game',
      'Keychain',
    ]);
    expect((await list(admin, '?q=BABYBOX')).items.map((i) => i.name)).toEqual(['Babybox locks']);
    expect((await list(admin, '?q=%25')).total).toBe(0);
    expect((await list(admin, '?q=_')).total).toBe(0);
  });

  it('scopes Users to their customers and answers 403 for others', async () => {
    const body = await list(helper);
    expect(new Set(body.items.map((i) => i.customerFolder))).toEqual(new Set(['Joey']));
    const denise = await idOf('Keychain');
    expect((await t.as(helper, { url: `/api/prints/${denise}` })).statusCode).toBe(403);
    expect((await t.as(helper, { url: `/api/prints/${denise}/thumbnail` })).statusCode).toBe(403);
    const unknown = '00000000-0000-4000-8000-000000000000';
    expect((await t.as(helper, { url: `/api/prints/${unknown}` })).statusCode).toBe(404);
    const customers = (await t.as(helper, { url: '/api/customers' })).json<{
      customers: { folder: string }[];
    }>();
    expect(customers.customers.map((c) => c.folder)).toEqual(['Joey']);
  });

  it('gives Admins and Editors the files; Users only the summary', async () => {
    const id = await idOf('Babybox locks');
    const full = (await t.as(editor, { url: `/api/prints/${id}` })).json<PrintDetail>();
    const files = (full.assets ?? []).map((a) => `${a.subPath}/${a.fileName}`).sort();
    expect(files).toEqual([
      '/lock.3mf',
      '/lock_PLA_3h27m.gcode',
      '/render.png',
      'Nog te printen/next_PLA_11m.gcode',
    ]);
    const next = full.assets?.find((a) => a.fileName === 'next_PLA_11m.gcode')?.lines[0];
    expect(next).toMatchObject({ excluded: true, autoExclusionReason: 'folder:Nog te printen' });
    expect(next?.slots.length).toBeGreaterThan(0);
    const plate = full.assets?.find((a) => a.fileName === 'lock.3mf')?.lines[0];
    expect(plate).toMatchObject({ excluded: true, autoExclusionReason: 'gcode-present' });
    expect(full.hasModel).toBe(true);

    const limited = (await t.as(helper, { url: `/api/prints/${id}` })).json<PrintDetail>();
    expect(limited.assets).toBeNull();
    expect(limited).toMatchObject({ name: 'Babybox locks', hasModel: true });
  });

  it('names the other file of a possible duplicate', async () => {
    const id = await idOf('Keychain');
    const detail = (await t.as(admin, { url: `/api/prints/${id}` })).json<PrintDetail>();
    const original = detail.assets?.find((a) => a.fileName === 'key_PLA_11m.gcode')?.lines[0];
    expect(original).toMatchObject({
      possibleDuplicate: true,
      duplicateOf: 'key_PLA_11m copy.gcode',
    });
  });

  it('serves the embedded G-code image as thumbnail, cached, with ETag and 304', async () => {
    const id = await idOf('Babybox locks');
    const first = await t.as(helper, { url: `/api/prints/${id}/thumbnail` });
    expect(first.statusCode).toBe(200);
    expect(first.headers['content-type']).toBe('image/png');
    expect(first.rawPayload.subarray(1, 4).toString()).toBe('PNG');
    const etag = String(first.headers.etag);
    const again = await t.as(helper, {
      url: `/api/prints/${id}/thumbnail`,
      headers: { 'if-none-match': etag },
    });
    expect(again.statusCode).toBe(304);
    // Still served from the cache when the files are gone (archived print).
    await rm(path.join(root, 'Joey', 'Babybox locks'), { recursive: true });
    await t.app.services.indexer.indexAll();
    const archived = await t.as(admin, { url: `/api/prints/${id}/thumbnail` });
    expect(archived.statusCode).toBe(200);
  });

  it('renders an STL when there is no embedded image', async () => {
    await writeFile(path.join(root, 'Wouter', 'Empty', 'cube.stl'), asciiCube());
    await t.app.services.indexer.indexAll();
    const id = await idOf('Empty');
    const response = await t.as(admin, { url: `/api/prints/${id}/thumbnail` });
    expect(response.statusCode).toBe(200);
    expect(response.headers['content-type']).toBe('image/png');
    const model = await t.as(helper, { url: `/api/prints/${id}/model` });
    expect(model.statusCode).toBe(403); // Wouter is not granted
    const adminModel = await t.as(admin, { url: `/api/prints/${id}/model` });
    expect(adminModel.statusCode).toBe(200);
    expect(adminModel.headers['content-disposition']).toMatch(/^inline;/);
  });

  it('gives each model file its own picture, and 404 for one that has none', async () => {
    // Two models in one print: before this, the strip showed the print's one
    // image or a glyph, so both buttons looked the same (GAP-094).
    // Its own folder: the test above also fills Wouter/Empty, and sharing it
    // made this one fail about one run in three.
    const dir = path.join(root, 'Wouter', 'Twee modellen');
    await mkdir(dir, { recursive: true });
    await writeFile(path.join(dir, 'cube.stl'), asciiCube());
    await writeFile(path.join(dir, 'cube_two.stl'), asciiCube());
    await writeFile(path.join(dir, 'notes.txt'), 'not a model');
    await t.app.services.indexer.indexAll();
    const id = await idOf('Twee modellen');
    const detail = (await t.as(admin, { url: `/api/prints/${id}` })).json<PrintDetail>();
    // Dutch collation puts the underscore before the dot; what matters here is
    // that both models are listed and each gets a picture of its own.
    expect([...detail.models.map((m) => m.fileName)].sort()).toEqual(['cube.stl', 'cube_two.stl']);
    expect(detail.models.every((m) => m.hasPicture)).toBe(true);

    const pictures = await Promise.all(
      detail.models.map(async (model) => {
        const response = await t.as(admin, {
          url: `/api/prints/${id}/model-thumbnail?asset=${model.id}`,
        });
        expect(response.statusCode).toBe(200);
        expect(response.headers['content-type']).toBe('image/png');
        return { etag: String(response.headers.etag), body: response.rawPayload };
      }),
    );
    // Each file is keyed on its own asset, so one cache entry cannot serve both.
    expect(pictures[0]?.etag).not.toBe(pictures[1]?.etag);

    const cached = await t.as(admin, {
      url: `/api/prints/${id}/model-thumbnail?asset=${detail.models[0]?.id ?? ''}`,
      headers: { 'if-none-match': pictures[0]?.etag ?? '' },
    });
    expect(cached.statusCode).toBe(304);

    // A file that is not a model has no picture of its own.
    const other = detail.assets?.find((a) => a.fileName === 'notes.txt');
    const none = await t.as(admin, {
      url: `/api/prints/${id}/model-thumbnail?asset=${other?.id ?? ''}`,
    });
    expect(none.statusCode).toBe(404);

    // The same authorisation as every other route on this print.
    const denied = await t.as(helper, {
      url: `/api/prints/${id}/model-thumbnail?asset=${detail.models[0]?.id ?? ''}`,
    });
    expect(denied.statusCode).toBe(403);
  });

  it('downloads files with Range support for Admins and Editors only', async () => {
    const id = await idOf('Babybox locks');
    const detail = (await t.as(admin, { url: `/api/prints/${id}` })).json<PrintDetail>();
    const asset = detail.assets?.find((a) => a.fileName === 'lock_PLA_3h27m.gcode');
    if (asset === undefined) throw new Error('asset missing');
    const full = await t.as(editor, { url: `/api/assets/${asset.id}/download` });
    expect(full.statusCode).toBe(200);
    expect(full.headers['content-disposition']).toBe(
      "attachment; filename*=UTF-8''lock_PLA_3h27m.gcode",
    );
    expect(full.headers['accept-ranges']).toBe('bytes');
    const part = await t.as(editor, {
      url: `/api/assets/${asset.id}/download`,
      headers: { range: 'bytes=0-9' },
    });
    expect(part.statusCode).toBe(206);
    expect(part.rawPayload).toHaveLength(10);
    expect(part.headers['content-range']).toMatch(/^bytes 0-9\//);
    const bad = await t.as(editor, {
      url: `/api/assets/${asset.id}/download`,
      headers: { range: 'bytes=999999999-' },
    });
    expect(bad.statusCode).toBe(416);
    expect((await t.as(helper, { url: `/api/assets/${asset.id}/download` })).statusCode).toBe(403);
  });

  it('never serves a file outside the prints root', async () => {
    const id = await idOf('Babybox locks');
    const detail = (await t.as(admin, { url: `/api/prints/${id}` })).json<PrintDetail>();
    const asset = detail.assets?.[0];
    if (asset === undefined) throw new Error('asset missing');
    // A tampered path in the database…
    await t.db
      .updateTable('print_assets')
      .set({ relative_path: '../../../../etc/hostname' })
      .where('id', '=', asset.id)
      .execute();
    expect((await t.as(admin, { url: `/api/assets/${asset.id}/download` })).statusCode).toBe(404);
    // …and a symlink inside the root that points out of it.
    await mkdir(path.join(root, 'Joey', 'Babybox locks'), { recursive: true });
    await symlink('/etc/hostname', path.join(root, 'Joey', 'Babybox locks', 'escape.gcode'));
    await t.db
      .updateTable('print_assets')
      .set({ relative_path: 'Joey/Babybox locks/escape.gcode' })
      .where('id', '=', asset.id)
      .execute();
    expect((await t.as(admin, { url: `/api/assets/${asset.id}/download` })).statusCode).toBe(404);
  });

  it('lets Editors delete and only Admins see and restore deleted prints', async () => {
    const id = await idOf('Keychain');
    expect((await t.as(helper, { method: 'DELETE', url: `/api/prints/${id}` })).statusCode).toBe(
      403,
    );
    expect((await t.as(editor, { method: 'DELETE', url: `/api/prints/${id}` })).statusCode).toBe(
      204,
    );
    expect((await list(admin)).items.map((i) => i.id)).not.toContain(id);
    // Editors cannot ask for deleted prints; Admins can.
    expect((await list(editor, '?deleted=true')).items.map((i) => i.id)).not.toContain(id);
    const shown = (await list(admin, '?deleted=true')).items.find((i) => i.id === id);
    expect(shown).toMatchObject({ status: 'deleted' });
    expect((await t.as(editor, { url: `/api/prints/${id}` })).statusCode).toBe(404);
    // A re-index never brings it back.
    await t.app.services.indexer.indexAll(true);
    expect((await list(admin)).items.map((i) => i.id)).not.toContain(id);

    expect(
      (await t.as(editor, { method: 'POST', url: `/api/prints/${id}/restore` })).statusCode,
    ).toBe(403);
    expect(
      (await t.as(admin, { method: 'POST', url: `/api/prints/${id}/restore` })).statusCode,
    ).toBe(204);
    expect((await list(admin)).items.find((i) => i.id === id)?.status).toBe('indexed');
  });

  it('restores a print whose folder is gone as archived', async () => {
    const id = await idOf('Board game');
    await t.as(admin, { method: 'DELETE', url: `/api/prints/${id}` });
    await rm(path.join(root, 'Denise', 'Board game'), { recursive: true });
    await t.as(admin, { method: 'POST', url: `/api/prints/${id}/restore` });
    const archived = (await list(admin, '?archived=true')).items.find((i) => i.id === id);
    expect(archived?.status).toBe('archived');
    expect((await list(admin)).items.map((i) => i.id)).not.toContain(id);
  });

  it('lists a klant whose folder holds nothing yet, and forgets the folder when it goes', async () => {
    const customers = async (session: Session) =>
      (await t.as(session, { url: '/api/customers' })).json<{
        customers: { folder: string; printCount: number; deleted: boolean }[];
      }>().customers;
    expect((await customers(admin)).map((one) => one.folder)).not.toContain('Anouk');
    const printsBefore = (await list(admin)).total;

    // The owner makes the folder for a klant who has asked for something.
    await mkdir(path.join(root, 'Anouk'), { recursive: true });
    await t.app.services.indexer.indexAll();
    const anouk = (await customers(admin)).find((one) => one.folder === 'Anouk');
    expect(anouk).toMatchObject({ printCount: 0, deleted: false });
    // Nothing else changed: an empty folder is not a print.
    expect((await list(admin)).total).toBe(printsBefore);
    expect((await list(admin, '?customer=Anouk')).total).toBe(0);

    // A User sees only the klanten they are granted, empty folders included.
    expect((await customers(helper)).map((one) => one.folder)).toEqual(['Joey']);

    // The folder goes away again; the klant goes with it.
    await rm(path.join(root, 'Anouk'), { recursive: true, force: true });
    await t.app.services.indexer.indexAll();
    expect((await customers(admin)).map((one) => one.folder)).not.toContain('Anouk');
  });

  it('deletes and restores a whole customer', async () => {
    const response = await t.as(editor, { method: 'DELETE', url: '/api/customers/Denise' });
    expect(response.json()).toEqual({ deleted: 2 });
    expect((await list(admin, '?customer=Denise')).total).toBe(0);
    const customers = (await t.as(admin, { url: '/api/customers?deleted=true' })).json<{
      customers: { folder: string; deleted: boolean }[];
    }>();
    expect(customers.customers.find((c) => c.folder === 'Denise')?.deleted).toBe(true);
    const restored = await t.as(admin, { method: 'POST', url: '/api/customers/Denise/restore' });
    expect(restored.json()).toEqual({ restored: 2 });
    expect((await list(admin, '?customer=Denise')).total).toBe(2);
  });

  it('manages tags and filters with AND', async () => {
    const create = async (name: string, colour?: string) =>
      t.as(editor, { method: 'POST', url: '/api/tags', payload: { name, colour } });
    const prio = (await create('prio', 'rose')).json<{ id: string; colour: string }>();
    expect(prio).toMatchObject({ colour: 'rose', ink: null });
    const gift = (await create('cadeau')).json<{ id: string }>();
    expect((await create('PRIO')).statusCode).toBe(409);
    // Since design system v1.3 new colours are palette keys only.
    expect((await create('hex', '#e11d48')).statusCode).toBe(400);
    expect((await create('x'.repeat(65))).json()).toEqual({ error: 'invalid_tag_name' });
    // Changing only the case of a tag's own name is allowed.
    const recased = await t.as(editor, {
      method: 'PATCH',
      url: `/api/tags/${prio.id}`,
      payload: { name: 'Prio' },
    });
    expect(recased.json()).toMatchObject({ name: 'Prio', colour: 'rose' });
    await t.as(editor, { method: 'PATCH', url: `/api/tags/${prio.id}`, payload: { name: 'prio' } });
    expect(
      (await t.as(helper, { method: 'POST', url: '/api/tags', payload: { name: 'x' } })).statusCode,
    ).toBe(403);

    const lock = await idOf('Babybox locks');
    const key = await idOf('Keychain');
    const tag = (id: string, tagIds: string[]) =>
      t.as(editor, { method: 'PUT', url: `/api/prints/${id}/tags`, payload: { tagIds } });
    expect((await tag(lock, [prio.id, gift.id])).statusCode).toBe(204);
    expect((await tag(key, [prio.id])).statusCode).toBe(204);
    expect((await tag(key, ['00000000-0000-4000-8000-000000000000'])).statusCode).toBe(400);

    expect((await list(admin, `?tag=${prio.id}`)).total).toBe(2);
    expect((await list(admin, `?tag=${prio.id}&tag=${gift.id}`)).items.map((i) => i.name)).toEqual([
      'Babybox locks',
    ]);
    expect((await list(admin, '?q=cade')).items.map((i) => i.name)).toEqual(['Babybox locks']);
    // Users see tags (read-only).
    const seen = (await list(helper)).items.find((i) => i.id === lock);
    expect(seen?.tags.map((t2) => t2.name)).toEqual(['cadeau', 'prio']);

    const renamed = await t.as(editor, {
      method: 'PATCH',
      url: `/api/tags/${gift.id}`,
      payload: { name: 'Gift', colour: null },
    });
    expect(renamed.json()).toEqual({ id: gift.id, name: 'Gift', colour: null, ink: null });
    expect((await t.as(editor, { method: 'DELETE', url: `/api/tags/${gift.id}` })).statusCode).toBe(
      204,
    );
    const tags = (await t.as(helper, { url: '/api/tags' })).json<{
      tags: { name: string; printCount: number }[];
    }>();
    expect(tags.tags).toEqual([
      { id: prio.id, name: 'prio', colour: 'rose', ink: null, printCount: 2 },
    ]);
    // A free colour stored before v1.3 still renders, with its text colour by contrast.
    await t.db.updateTable('tags').set({ colour: '#e11d48' }).where('id', '=', prio.id).execute();
    const legacy = (await t.as(helper, { url: '/api/tags' })).json<{ tags: unknown[] }>();
    expect(legacy.tags[0]).toMatchObject({ colour: '#e11d48', ink: '#ffffff' });
  });

  it('starts a re-index for Admins only', async () => {
    expect((await t.as(editor, { method: 'POST', url: '/api/admin/reindex' })).statusCode).toBe(
      403,
    );
    const response = await t.as(admin, {
      method: 'POST',
      url: '/api/admin/reindex',
      payload: { force: true },
    });
    expect(response.statusCode).toBe(202);
    await t.app.services.indexer.idle();
  });
});

function asciiCube(): string {
  const v = (x: number, y: number, z: number) => `vertex ${String(x)} ${String(y)} ${String(z)}`;
  const facet = (a: string, b: string, c: string) =>
    `facet normal 0 0 0\nouter loop\n${a}\n${b}\n${c}\nendloop\nendfacet`;
  const p = [
    v(0, 0, 0),
    v(10, 0, 0),
    v(10, 10, 0),
    v(0, 10, 0),
    v(0, 0, 10),
    v(10, 0, 10),
    v(10, 10, 10),
    v(0, 10, 10),
  ];
  const faces = [
    [0, 1, 2, 3],
    [4, 5, 6, 7],
    [0, 1, 5, 4],
    [1, 2, 6, 5],
    [2, 3, 7, 6],
    [3, 0, 4, 7],
  ];
  const facets = faces.flatMap(([a = 0, b = 0, c = 0, d = 0]) => [
    facet(p[a] ?? '', p[b] ?? '', p[c] ?? ''),
    facet(p[a] ?? '', p[c] ?? '', p[d] ?? ''),
  ]);
  return `solid cube\n${facets.join('\n')}\nendsolid cube\n`;
}
