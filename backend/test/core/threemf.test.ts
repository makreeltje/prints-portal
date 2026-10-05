import { createWriteStream } from 'node:fs';
import { mkdtemp, readFile, rm, writeFile } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { pipeline } from 'node:stream/promises';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { ZipFile } from 'yazl';
import { hasSliceData, parseSliceInfo, readThreeMf, ThreeMfError } from '../../src/core/threemf.js';

// 1×1 PNG; the reader only stores image bytes, it does not decode them.
const PNG = Buffer.from(
  'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==',
  'base64',
);
const PNG_2 = Buffer.concat([PNG, Buffer.from('plate-2')]);

const CREALITY_SLICE_INFO = `<?xml version="1.0" encoding="UTF-8"?>
<config>
  <header>
    <header_item key = "X-BBL-Client-Type" value = "slicer"/ >
    <header_item key = "X-CX-Client-Type" value = "creality_print"/ >
    <header_item key = "X-CX-Client-Version" value = "V5.1.4.10249"/ >
  </header>
</config>`;

// Shape of a Bambu Studio project sliced for another printer (MakerWorld download).
const BAMBU_SLICE_INFO = `<?xml version="1.0" encoding="UTF-8"?>
<config>
  <header>
    <header_item key="X-BBL-Client-Type" value="slicer"/>
    <header_item key="X-BBL-Client-Version" value="01.10.01.50"/>
  </header>
  <plate>
    <metadata key="index" value="1"/>
    <metadata key="printer_model_id" value="C12"/>
    <metadata key="prediction" value="14647"/>
    <metadata key="weight" value="163.97"/>
    <object identify_id="429" name="tray2v2.stl" skipped="false" />
    <filament id="3" tray_info_idx="GFL99" type="PLA" color="#F9A846" used_m="54.98" used_g="163.97" />
  </plate>
  <plate>
    <metadata key="index" value="2"/>
    <metadata key="prediction" value="7289"/>
    <metadata key="weight" value="68.81"/>
    <filament id="1" type="PETG" color="#000000" used_g="40.00" />
    <filament id="4" type="PLA" color="#A0E20E" used_g="28.81" />
  </plate>
  <plate>
    <metadata key="index" value="3"/>
    <metadata key="prediction" value="0"/>
    <metadata key="weight" value="0"/>
  </plate>
</config>`;

const model = (metadata: string) =>
  `<?xml version="1.0" encoding="UTF-8"?>\n<model unit="millimeter" xmlns="http://schemas.microsoft.com/3dmanufacturing/core/2015/02">\n${metadata}\n<resources/></model>`;

let tmp: string;
let crealityGcode: string;

async function makeZip(name: string, entries: Record<string, string | Buffer>): Promise<string> {
  const zip = new ZipFile();
  for (const [entryName, content] of Object.entries(entries)) {
    zip.addBuffer(Buffer.isBuffer(content) ? content : Buffer.from(content), entryName);
  }
  zip.end();
  const file = path.join(tmp, name);
  await pipeline(zip.outputStream, createWriteStream(file));
  return file;
}

beforeAll(async () => {
  tmp = await mkdtemp(path.join(os.tmpdir(), 'pp-3mf-'));
  crealityGcode = await readFile(
    path.join(import.meta.dirname, '..', 'fixtures', 'gcode', 'creality5-plate.gcode'),
    'utf8',
  );
});

afterAll(async () => {
  await rm(tmp, { recursive: true, force: true });
});

describe('readThreeMf', () => {
  it('Creality Print project: plates from embedded G-code, despite malformed slice_info', async () => {
    const file = await makeZip('creality.3mf', {
      '3D/3dmodel.model': model(
        '<metadata name="Application">Creality_Print V5.1.4.10249 Release</metadata>',
      ),
      'Metadata/slice_info.config': CREALITY_SLICE_INFO,
      'Metadata/plate_1.png': PNG,
      'Metadata/plate_3.gcode': crealityGcode,
      'Metadata/plate_3.png': PNG_2,
      'Metadata/plate_3.gcode.md5': 'abc',
    });
    const meta = await readThreeMf(file);
    expect(meta.application).toBe('Creality_Print V5.1.4.10249 Release');
    expect(hasSliceData(meta)).toBe(true);
    expect(meta.plates).toEqual([
      {
        index: 3,
        source: 'gcode',
        totalGrams: 224.39,
        printTimeSeconds: 14_092,
        slots: [{ slot: 2, grams: 224.39, colour: '#000000', material: 'PLA' }],
        printerModel: 'K1 Max',
        thumbnail: PNG_2,
      },
    ]);
    expect(meta.thumbnail).toEqual(PNG);
  });

  it('streams large embedded G-code and still finds head and tail', async () => {
    const lines = crealityGcode.split('\n');
    const split = lines.findIndex((l) => l.includes('EXECUTABLE_BLOCK_START')) + 1;
    const big =
      lines.slice(0, split).join('\n') +
      '\n' +
      'G1 X1 Y2 E0.01\n'.repeat(400_000) +
      lines.slice(split).join('\n');
    const file = await makeZip('big.3mf', { 'Metadata/plate_1.gcode': big });
    const meta = await readThreeMf(file);
    expect(meta.plates[0]?.totalGrams).toBe(224.39);
    expect(meta.plates[0]?.printTimeSeconds).toBe(14_092);
  });

  it('Bambu project sliced for another printer: plates from slice_info', async () => {
    const file = await makeZip('makerworld.3mf', {
      '3D/3dmodel.model': model('<metadata name="Application">BambuStudio-01.10.01.50</metadata>'),
      'Metadata/slice_info.config': BAMBU_SLICE_INFO,
      'Auxiliaries/.thumbnails/thumbnail_3mf.png': PNG,
    });
    const meta = await readThreeMf(file);
    expect(meta.application).toBe('BambuStudio-01.10.01.50');
    expect(meta.plates).toEqual([
      {
        index: 1,
        source: 'slice_info',
        totalGrams: 163.97,
        printTimeSeconds: 14_647,
        slots: [{ slot: 3, grams: 163.97, colour: '#f9a846', material: 'PLA' }],
        printerModel: null,
        thumbnail: null,
      },
      {
        index: 2,
        source: 'slice_info',
        totalGrams: 68.81,
        printTimeSeconds: 7289,
        slots: [
          { slot: 1, grams: 40, colour: '#000000', material: 'PETG' },
          { slot: 4, grams: 28.81, colour: '#a0e20e', material: 'PLA' },
        ],
        printerModel: null,
        thumbnail: null,
      },
    ]);
    expect(meta.thumbnail).toEqual(PNG);
  });

  it('unsliced OrcaSlicer project: no plates, but a thumbnail and the Orca version', async () => {
    const file = await makeZip('orca.3mf', {
      '3D/3dmodel.model': model(
        '<metadata name="Application">BambuStudio-02.06.00.51</metadata>\n<metadata name="OrcaSlicer">2.4.2</metadata>',
      ),
      'Metadata/slice_info.config':
        '<?xml version="1.0"?>\n<config><header><header_item key="OrcaSlicer-Version" value="2.4.2"/></header></config>',
      'Metadata/plate_1.png': PNG,
    });
    const meta = await readThreeMf(file);
    expect(meta.application).toBe('OrcaSlicer 2.4.2');
    expect(meta.plates).toEqual([]);
    expect(hasSliceData(meta)).toBe(false);
    expect(meta.thumbnail).toEqual(PNG);
  });

  it('a bare 3MF without metadata yields nothing', async () => {
    const file = await makeZip('bare.3mf', { '3D/3dmodel.model': model('') });
    expect(await readThreeMf(file)).toEqual({ application: null, plates: [], thumbnail: null });
  });

  it('rejects files that are not zip archives', async () => {
    const file = path.join(tmp, 'broken.3mf');
    await writeFile(file, 'not a zip');
    await expect(readThreeMf(file)).rejects.toBeInstanceOf(ThreeMfError);
  });
});

describe('parseSliceInfo', () => {
  it('skips plates without an index and filaments without grams', () => {
    const plates = parseSliceInfo(
      '<plate><metadata key="weight" value="5"/></plate>' +
        '<plate><metadata key="index" value="2"/><metadata key="weight" value="5"/>' +
        '<filament id="1" type="PLA" color="#fff" used_g="0"/></plate>',
    );
    expect(plates).toEqual([
      {
        index: 2,
        source: 'slice_info',
        totalGrams: 5,
        printTimeSeconds: null,
        slots: [],
        printerModel: null,
      },
    ]);
  });
});
