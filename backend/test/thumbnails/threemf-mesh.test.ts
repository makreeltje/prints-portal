import { mkdtemp, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { deflateRawSync } from 'node:zlib';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { readThreeMfMesh } from '../../src/thumbnails/threemf-mesh.js';

/** A minimal ZIP holding one deflated entry per file. */
function zip(files: Record<string, string>): Buffer {
  const locals: Buffer[] = [];
  const central: Buffer[] = [];
  let offset = 0;
  for (const [name, text] of Object.entries(files)) {
    const raw = Buffer.from(text, 'utf8');
    const data = deflateRawSync(raw);
    const nameBytes = Buffer.from(name, 'utf8');
    const crc = crc32(raw);
    const local = Buffer.alloc(30);
    local.writeUInt32LE(0x04034b50, 0);
    local.writeUInt16LE(20, 4);
    local.writeUInt16LE(8, 8); // deflate
    local.writeUInt32LE(crc, 14);
    local.writeUInt32LE(data.length, 18);
    local.writeUInt32LE(raw.length, 22);
    local.writeUInt16LE(nameBytes.length, 26);
    locals.push(local, nameBytes, data);

    const entry = Buffer.alloc(46);
    entry.writeUInt32LE(0x02014b50, 0);
    entry.writeUInt16LE(20, 6);
    entry.writeUInt16LE(8, 10);
    entry.writeUInt32LE(crc, 16);
    entry.writeUInt32LE(data.length, 20);
    entry.writeUInt32LE(raw.length, 24);
    entry.writeUInt16LE(nameBytes.length, 28);
    entry.writeUInt32LE(offset, 42);
    central.push(entry, nameBytes);
    offset += local.length + nameBytes.length + data.length;
  }
  const body = Buffer.concat(locals);
  const dir = Buffer.concat(central);
  const end = Buffer.alloc(22);
  end.writeUInt32LE(0x06054b50, 0);
  end.writeUInt16LE(Object.keys(files).length, 8);
  end.writeUInt16LE(Object.keys(files).length, 10);
  end.writeUInt32LE(dir.length, 12);
  end.writeUInt32LE(body.length, 16);
  return Buffer.concat([body, dir, end]);
}

function crc32(data: Buffer): number {
  let c = ~0;
  for (const byte of data) {
    c ^= byte;
    for (let k = 0; k < 8; k++) c = (c >>> 1) ^ (0xedb88320 & -(c & 1));
  }
  return ~c >>> 0;
}

const tetra = (ox = 0) => `
<model unit="millimeter"><resources><object id="1" type="model"><mesh>
<vertices>
<vertex x="${ox}" y="0" z="0"/><vertex x="${ox + 10}" y="0" z="0"/>
<vertex x="${ox}" y="10" z="0"/><vertex x="${ox}" y="0" z="10"/>
</vertices>
<triangles>
<triangle v1="0" v2="1" v3="2"/><triangle v1="0" v2="1" v3="3"/>
<triangle v1="0" v2="2" v3="3"/><triangle v1="1" v2="2" v3="3"/>
</triangles>
</mesh></object></resources><build><item objectid="1"/></build></model>`;

let dir = '';
const write = async (name: string, files: Record<string, string>) => {
  const file = path.join(dir, name);
  await writeFile(file, zip(files));
  return file;
};

describe('the mesh inside a 3MF', () => {
  beforeAll(async () => {
    dir = await mkdtemp(path.join(tmpdir(), 'pp3mf-'));
  });
  afterAll(async () => {
    await rm(dir, { recursive: true, force: true });
  });

  it('reads vertices and triangles', async () => {
    const mesh = await readThreeMfMesh(await write('plain.3mf', { '3D/3dmodel.model': tetra() }));
    expect(mesh?.triangleCount).toBe(4);
    expect(mesh?.vertices.length).toBe(36);
    // First triangle, first corner.
    expect([...(mesh?.vertices.slice(0, 3) ?? [])]).toEqual([0, 0, 0]);
  });

  it('applies a build transform', async () => {
    const moved = tetra().replace(
      '<item objectid="1"/>',
      '<item objectid="1" transform="1 0 0 0 1 0 0 0 1 100 0 0"/>',
    );
    const mesh = await readThreeMfMesh(await write('moved.3mf', { '3D/3dmodel.model': moved }));
    expect(mesh?.vertices[0]).toBeCloseTo(100);
  });

  it('places the same object twice through components', async () => {
    const xml = `
<model><resources>
<object id="1" type="model"><mesh>
<vertices><vertex x="0" y="0" z="0"/><vertex x="1" y="0" z="0"/><vertex x="0" y="1" z="0"/></vertices>
<triangles><triangle v1="0" v2="1" v3="2"/></triangles>
</mesh></object>
<object id="2" type="model"><components>
<component objectid="1"/><component objectid="1" transform="1 0 0 0 1 0 0 0 1 50 0 0"/>
</components></object>
</resources><build><item objectid="2"/></build></model>`;
    const mesh = await readThreeMfMesh(await write('twice.3mf', { '3D/3dmodel.model': xml }));
    expect(mesh?.triangleCount).toBe(2);
    const xs = [...(mesh?.vertices ?? [])].filter((_, i) => i % 3 === 0);
    expect(Math.max(...xs)).toBeCloseTo(51);
  });

  it('reads the per-object parts a slicer splits out', async () => {
    const mesh = await readThreeMfMesh(
      await write('split.3mf', {
        '3D/3dmodel.model':
          '<model><resources></resources><build><item objectid="7"/></build></model>',
        '3D/Objects/object_7.model': tetra()
          .replace('id="1"', 'id="7"')
          .replace(/<build>[\s\S]*<\/build>/, ''),
      }),
    );
    expect(mesh?.triangleCount).toBe(4);
  });

  it('returns null rather than throwing when there is no geometry', async () => {
    expect(
      await readThreeMfMesh(await write('empty.3mf', { 'Metadata/slice_info.config': '<x/>' })),
    ).toBeNull();
  });

  it('survives an object that references itself', async () => {
    const xml = `
<model><resources>
<object id="1" type="model"><components><component objectid="1"/></components></object>
</resources><build><item objectid="1"/></build></model>`;
    expect(await readThreeMfMesh(await write('loop.3mf', { '3D/3dmodel.model': xml }))).toBeNull();
  });
});
