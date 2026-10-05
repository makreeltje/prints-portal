import { mkdtemp, readFile, rm, writeFile } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { bestThumbnail, parseGcodeText, readGcodeFile } from '../../src/core/gcode.js';

const fixture = (name: string) => path.join(import.meta.dirname, '..', 'fixtures', 'gcode', name);

describe('readGcodeFile on real slicer output (trimmed)', () => {
  it('OrcaSlicer, one slot, with a total line', async () => {
    const meta = await readGcodeFile(fixture('orca-single-slot.gcode'));
    expect(meta.slicer).toEqual({ name: 'OrcaSlicer', version: '2.3.0' });
    expect(meta.totalGrams).toBe(173.49);
    expect(meta.slots).toEqual([{ slot: 1, grams: 173.49, colour: '#ffffff', material: 'PLA' }]);
    expect(meta.printTimeSeconds).toBe(3 * 3600 + 24 * 60 + 54);
    expect(meta.printerModel).toBe('Creality K1 Max');
    expect(meta.thumbnails.map((t) => `${t.format} ${t.width}x${t.height}`)).toEqual([
      'png 100x100',
      'png 320x320',
    ]);
  });

  it('OrcaSlicer with the CFS: two slots in one file', async () => {
    const meta = await readGcodeFile(fixture('orca-multi-slot.gcode'));
    expect(meta.totalGrams).toBe(3.03);
    expect(meta.slots).toEqual([
      { slot: 2, grams: 1.65, colour: '#00fb00', material: 'PLA' },
      { slot: 4, grams: 1.38, colour: '#000000', material: 'PLA' },
    ]);
    expect(meta.printTimeSeconds).toBe(660);
  });

  it('Creality Print 6: no total line, so the slots are summed', async () => {
    const meta = await readGcodeFile(fixture('creality6-no-total.gcode'));
    expect(meta.slicer).toEqual({ name: 'Creality_Print', version: 'V6.3.0.3420' });
    expect(meta.totalGrams).toBe(15.36);
    expect(meta.slots).toEqual([{ slot: 4, grams: 15.36, colour: '#f8441d', material: 'PLA' }]);
    expect(meta.printTimeSeconds).toBe(1915);
    expect(meta.printerModel).toBe('Creality K1 Max');
  });

  it('Creality Print 5: "K1 Max", integer zeros and nine colours', async () => {
    const meta = await readGcodeFile(fixture('creality5-plate.gcode'));
    expect(meta.slicer).toEqual({ name: 'Creality_Print', version: 'V5.1.4.10249' });
    expect(meta.totalGrams).toBe(224.39);
    expect(meta.slots).toEqual([{ slot: 2, grams: 224.39, colour: '#000000', material: 'PLA' }]);
    expect(meta.printTimeSeconds).toBe(3 * 3600 + 54 * 60 + 52);
    expect(meta.printerModel).toBe('K1 Max');
  });

  it('decodes thumbnails to real PNG files and picks the largest', async () => {
    const meta = await readGcodeFile(fixture('creality5-plate.gcode'));
    const best = bestThumbnail(meta.thumbnails);
    expect(best?.width).toBe(300);
    expect(best?.data.subarray(1, 4).toString('latin1')).toBe('PNG');
    // IHDR width/height must match the header.
    expect(best?.data.readUInt32BE(16)).toBe(300);
    expect(best?.data.readUInt32BE(20)).toBe(300);
  });
});

describe('reading large files through windows', () => {
  let tmp: string;
  let bigFile: string;

  beforeAll(async () => {
    tmp = await mkdtemp(path.join(os.tmpdir(), 'pp-gcode-'));
    const original = await readFile(fixture('orca-multi-slot.gcode'), 'utf8');
    const lines = original.split('\n');
    const split = lines.findIndex((l) => l.includes('EXECUTABLE_BLOCK_START')) + 1;
    // ~6 MB of moves between the header and the tail.
    const filler = 'G1 X10.123 Y20.456 E0.0123\n'.repeat(230_000);
    bigFile = path.join(tmp, 'big_PLA_1h.gcode');
    await writeFile(
      bigFile,
      lines.slice(0, split).join('\n') + '\n' + filler + lines.slice(split).join('\n'),
    );
  });

  afterAll(async () => {
    await rm(tmp, { recursive: true, force: true });
  });

  it('finds header and tail metadata without reading the middle', async () => {
    const meta = await readGcodeFile(bigFile);
    expect(meta.totalGrams).toBe(3.03);
    expect(meta.slots).toHaveLength(2);
    expect(meta.thumbnails).toHaveLength(2);
  });

  it('extends the head window to finish a thumbnail that crosses it', async () => {
    const meta = await readGcodeFile(bigFile, 4 * 1024);
    expect(meta.thumbnails.map((t) => t.width)).toEqual([96, 300]);
    expect(meta.totalGrams).toBe(3.03);
  });
});

describe('parseGcodeText edge cases', () => {
  it('returns empty metadata for G-code without comments', () => {
    expect(parseGcodeText({ head: 'G28\nG1 X0', tail: '' })).toEqual({
      slicer: null,
      totalGrams: null,
      slots: [],
      printTimeSeconds: null,
      printerModel: null,
      thumbnails: [],
    });
  });

  it('accepts "filament used [g]" without a slot list and days in the print time', () => {
    const meta = parseGcodeText({
      head: '; filament used [g] = 12.34\n; estimated printing time (normal mode) = 1d 2h 3m 4s',
      tail: '',
    });
    expect(meta.totalGrams).toBe(12.34);
    expect(meta.slots).toEqual([{ slot: 1, grams: 12.34, colour: null, material: null }]);
    expect(meta.printTimeSeconds).toBe(93_784);
  });

  it('prefers the total line over the slot sum', () => {
    const meta = parseGcodeText({
      head: '',
      tail: '; filament used [g] = 0.72, 0.66\n; total filament used [g] = 1.37',
    });
    expect(meta.totalGrams).toBe(1.37);
    expect(meta.slots.map((s) => s.grams)).toEqual([0.72, 0.66]);
  });

  it('does not read [mm] or [cm3] lines as grams', () => {
    const meta = parseGcodeText({
      head: '; filament used [mm] = 8279.12\n; filament used [cm3] = 19.91',
      tail: '',
    });
    expect(meta.totalGrams).toBeNull();
  });

  it('falls back through the printer keys and strips quotes', () => {
    const meta = parseGcodeText({
      head: '',
      tail: '; printer_model = \n; print_compatible_printers = "Creality K1 Max (0.4 nozzle)";"Other"',
    });
    expect(meta.printerModel).toBe('Creality K1 Max (0.4 nozzle)');
  });

  it('ignores the silent-mode time and a broken thumbnail', () => {
    const meta = parseGcodeText({
      head: [
        '; estimated printing time (silent mode) = 2h',
        '; estimated printing time = 1h 30m',
        '; thumbnail begin 10x10 8',
        '; bm90IGEgcG5n',
        '; thumbnail end',
      ].join('\n'),
      tail: '',
    });
    expect(meta.printTimeSeconds).toBe(5400);
    expect(meta.thumbnails).toEqual([]);
  });
});
