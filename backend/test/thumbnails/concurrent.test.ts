import { mkdir, readdir, rm, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { startTestApp, type Session, type TestApp } from '../helpers/app.js';
import { makePrintsTree } from '../helpers/prints-tree.js';

/**
 * Two models of one print, asked for at the same time.
 *
 * Since per-model pictures (GAP-094) a print legitimately holds one cached
 * image per model file in one directory. The cache key is a hash, so a file
 * name says nothing about which model it belongs to.
 */
describe('two models of one print, rendered at once', () => {
  let t: TestApp;
  let root: string;
  let admin: Session;
  let dir: string;

  beforeEach(async () => {
    root = await makePrintsTree();
    dir = path.join(root, 'Veerle', 'Twee modellen tegelijk');
    await mkdir(dir, { recursive: true });
    await writeFile(path.join(dir, 'cube.stl'), asciiCube());
    await writeFile(path.join(dir, 'cube_two.stl'), asciiCube());
    t = await startTestApp('sqlite::memory:', { PRINTS_ROOT: root });
    await t.app.services.indexer.indexAll();
    await t.addUser('owner@example.org', 'Admin');
    admin = await t.login('owner@example.org');
  });

  afterEach(async () => {
    await t.close();
    await rm(root, { recursive: true, force: true });
  });

  const printId = async () => {
    const items = (await t.as(admin, { url: '/api/prints?limit=100' })).json<{
      items: { id: string; name: string }[];
    }>().items;
    return items.find((print) => print.name === 'Twee modellen tegelijk')?.id ?? '';
  };

  const modelIds = async (id: string) =>
    (await t.as(admin, { url: `/api/prints/${id}` }))
      .json<{ models: { id: string }[] }>()
      .models.map((model) => model.id);

  const picture = (id: string, asset: string) =>
    t.as(admin, { url: `/api/prints/${id}/model-thumbnail?asset=${asset}` });

  it("leaves another model's half-written file alone", async () => {
    const id = await printId();
    const models = await modelIds(id);
    const dir = path.join(t.config.dataDir, 'thumbnails', id);

    // One model cached, so the directory exists and holds its image.
    expect((await picture(id, models[0] ?? '')).statusCode).toBe(200);
    const [mine] = await readdir(dir);

    /*
      What a concurrent render of the *other* model looks like between its
      writeFile and its rename. The sweep used to delete every name that was
      not its own, so this file vanished, that rename failed, and the request
      answered 404 — on CI, where two renders really do overlap.
    */
    const theirs = `${models[1] ?? ''}-0123456789abcdef0123456789abcdef.png.4242.tmp`;
    await writeFile(path.join(dir, theirs), 'half written');

    // Re-render the first model, which sweeps.
    await rm(path.join(dir, mine ?? ''), { force: true });
    expect((await picture(id, models[0] ?? '')).statusCode).toBe(200);

    expect(await readdir(dir)).toContain(theirs);
  });

  it('keeps one cached image per model, not one per print', async () => {
    const id = (await t.as(admin, { url: '/api/prints?limit=100' }))
      .json<{ items: { id: string; name: string }[] }>()
      .items.find((print) => print.name === 'Twee modellen tegelijk')?.id;
    const detail = (await t.as(admin, { url: `/api/prints/${id ?? ''}` })).json<{
      models: { id: string }[];
    }>();
    // One at a time, so nothing can be blamed on a race.
    for (const model of detail.models) {
      const response = await t.as(admin, {
        url: `/api/prints/${id ?? ''}/model-thumbnail?asset=${model.id}`,
      });
      expect(response.statusCode).toBe(200);
    }
    const cached = await readdir(path.join(t.config.dataDir, 'thumbnails', id ?? ''));
    expect(cached.filter((name) => !name.endsWith('.tmp'))).toHaveLength(2);
  });
});

function asciiCube(): string {
  const facet = (a: number[], b: number[], c: number[]) =>
    `facet normal 0 0 0\nouter loop\nvertex ${a.join(' ')}\nvertex ${b.join(' ')}\nvertex ${c.join(' ')}\nendloop\nendfacet`;
  return [
    'solid cube',
    facet([0, 0, 0], [10, 0, 0], [10, 10, 0]),
    facet([0, 0, 0], [10, 10, 0], [0, 10, 0]),
    facet([0, 0, 10], [10, 0, 10], [10, 10, 10]),
    facet([0, 0, 10], [10, 10, 10], [0, 10, 10]),
    'endsolid cube',
  ].join('\n');
}
