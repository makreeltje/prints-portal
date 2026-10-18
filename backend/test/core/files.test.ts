import { describe, expect, it } from 'vitest';
import {
  parseGcodeFileName,
  parsePrintStem,
  parseVideoFileName,
} from '../../src/core/file-names.js';
import {
  autoExcludeFolder,
  classifyAsset,
  globToRegExp,
  isIgnoredPath,
  locatePrintFile,
} from '../../src/core/files.js';
import { daysBetween, localDate, zonedTimeToUtc } from '../../src/core/time.js';

describe('classifyAsset', () => {
  it.each([
    ['lock_v3_PLA_1h20m.gcode', 'gcode'],
    ['lock.GCODE', 'gcode'],
    ['lock_v3.3mf', '3mf'],
    ['Unifi_AP-AC_Pro_mount.STL', 'stl'],
    ['timelapse.mp4', 'video'],
    ['timelapse.MKV', 'video'],
    ['case_v8.f3d', 'f3d'],
    ['Instructions.pdf', 'pdf'],
    ['model page.url', 'url'],
    ['render.png', 'other'],
    ['part.step', 'other'],
    ['parts.stl.cxprj', 'other'],
    ['README', 'other'],
  ])('%s is %s', (name, type) => {
    expect(classifyAsset(name)).toBe(type);
  });
});

describe('ignore rules', () => {
  it.each([
    'Customer/.DS_Store',
    'Customer/Project/._lock.gcode',
    'Customer/Project/.thumbs/abc.png',
    '.thumbnails/6fa4419b.png',
    '__MACOSX/Customer/._x',
    'Customer/Thumbs.db',
    'Customer/Project/desktop.ini',
    'Customer/Project/big.gcode.part',
    'Customer/Project/.ocTransferId123.part',
    'Customer/Project/~$notes.docx',
    'Customer/Project/.~lock.file#',
  ])('ignores %s', (relative) => {
    expect(isIgnoredPath(relative)).toBe(true);
  });

  it.each([
    'Customer/Project/lock_PLA_1h.gcode',
    'Customer/Project/Nog te printen/part.stl',
    'Customer/Project/model page.url',
  ])('keeps %s', (relative) => {
    expect(isIgnoredPath(relative)).toBe(false);
  });

  it('builds case-insensitive, anchored globs', () => {
    expect(globToRegExp('*.part').test('X.PART')).toBe(true);
    expect(globToRegExp('*.part').test('x.partial')).toBe(false);
    expect(globToRegExp('a?c').test('abc')).toBe(true);
    expect(globToRegExp('a.c').test('abc')).toBe(false);
  });
});

describe('locatePrintFile', () => {
  it('splits customer, project, subfolders and file', () => {
    expect(locatePrintFile('Koen/Bloembak clips/Nog te printen/lock.gcode')).toEqual({
      customerFolder: 'Koen',
      projectFolder: 'Bloembak clips',
      subFolders: ['Nog te printen'],
      fileName: 'lock.gcode',
    });
    expect(locatePrintFile('Veerle/Deurstop v2/Spirit Island/tray.stl')).toMatchObject({
      projectFolder: 'Deurstop v2',
      subFolders: ['Spirit Island'],
    });
  });

  it('puts files directly under a customer in a print without project', () => {
    expect(locatePrintFile('Koen/loose-part.stl')).toEqual({
      customerFolder: 'Koen',
      projectFolder: null,
      subFolders: [],
      fileName: 'loose-part.stl',
    });
  });

  it('returns null for files in the root', () => {
    expect(locatePrintFile('notes.txt')).toBeNull();
    expect(locatePrintFile('')).toBeNull();
  });

  it('accepts backslashes and duplicate separators', () => {
    expect(locatePrintFile('Koen\\Box//a.stl')?.projectFolder).toBe('Box');
  });
});

describe('autoExcludeFolder', () => {
  it('matches the configured folder names case-insensitively', () => {
    expect(autoExcludeFolder(['Nog te printen'])).toBe('Nog te printen');
    expect(autoExcludeFolder(['test'])).toBe('test');
    expect(autoExcludeFolder(['gcode', 'TEST'])).toBe('TEST');
    expect(autoExcludeFolder(['gcode', 'GLASS_SLIDER_VERSION'])).toBeNull();
    expect(autoExcludeFolder(['Proef'], ['proef'])).toBe('Proef');
  });
});

describe('parseGcodeFileName', () => {
  it.each([
    ['lock_v3_PLA_1h20m.gcode', 'lock_v3', 'PLA', 4800],
    ['Cable Organizer-Cable Clip_PLA_37m0s.gcode', 'Cable Organizer-Cable Clip', 'PLA', 2220],
    ['cableclip-30mm_PLA_31m55s.gcode', 'cableclip-30mm', 'PLA', 1915],
    ['dopper stabilizer v2_+2.5%_PLA_1h17m.gcode', 'dopper stabilizer v2_+2.5%', 'PLA', 4620],
    [
      'Bloembak clip corner 20-23 inner width_PLA-CF_3h4m.gcode',
      'Bloembak clip corner 20-23 inner width',
      'PLA-CF',
      11_040,
    ],
    ['tray1_PLA_3h27m.gcode', 'tray1', 'PLA', 12_420],
    ['Puzzle tray_skin_PLA_2h38m.gcode', 'Puzzle tray_skin', 'PLA', 9480],
    ['auslass 4_PETG_58m0s.gcode', 'auslass 4', 'PETG', 3480],
    ['frame_ABS_1h.gcode', 'frame', 'ABS', 3600],
    ['part_pla_2H5M.GCODE', 'part', 'pla', 7500],
  ])('parses %s', (name, partName, material, seconds) => {
    expect(parseGcodeFileName(name)).toEqual({ partName, material, printTimeSeconds: seconds });
  });

  it.each([
    ['Haakjes lang_PLA_5h17m_2.gcode', 'Haakjes lang', 19_020],
    ['puzzle_tray_PLA_2h38m copy.gcode', 'puzzle_tray', 9480],
    ['puzzle_tray_PLA_2h38m copy 2.gcode', 'puzzle_tray', 9480],
    ['IkeaAlexSewing_PLA_2h9m-2.gcode', 'IkeaAlexSewing', 7740],
    ['IkeaAlexSewing_PLA_2h9m - Copy.gcode', 'IkeaAlexSewing', 7740],
    ['body_PLA_44m56s4.gcode', 'body', 2696],
    ['record holder_PLA_5h40m - 2.gcode', 'record holder', 20_400],
    [
      'Koker klein 158mm one side cut v7_PLA_1h33m(1).gcode',
      'Koker klein 158mm one side cut v7',
      5580,
    ],
    ['Lampvoet ring met twee gaten_PLA_2h39m 2.gcode', 'Lampvoet ring met twee gaten', 9540],
    ['c_x4_k1max_v3_vents_ABS_58m54s_4.gcode', 'c_x4_k1max_v3_vents', 3534],
  ])('accepts the copy suffix in %s', (name, partName, seconds) => {
    expect(parseGcodeFileName(name)).toMatchObject({ partName, printTimeSeconds: seconds });
  });

  it.each([
    'lock_v3.gcode',
    'lock_PLA.gcode',
    'lock_PLA_soon.gcode',
    'lock_3D_1h.gcode', // material must start with a letter: "3D" is not one
    'tray_PLA_2.gcode', // a bare number is not a time
    'lock_PLA_1h20m.3mf',
    '_PLA_1h.gcode',
  ])('yields no metadata for %s', (name) => {
    expect(parseGcodeFileName(name)).toBeNull();
  });
});

describe('parseVideoFileName', () => {
  it('reads printer prefix, print and recording time from a timelapse name', () => {
    expect(
      parseVideoFileName('k1_Cable Organizer-Cable Clip_PLA_1h1m.gcode_18-11-2025_15h58.mp4'),
    ).toEqual({
      printerPrefix: 'k1',
      print: { partName: 'Cable Organizer-Cable Clip', material: 'PLA', printTimeSeconds: 3660 },
      // 15:58 in Amsterdam in November (CET, UTC+1)
      recordedAt: new Date('2025-11-18T14:58:00Z'),
    });
  });

  it('uses summer time when it applies', () => {
    const video = parseVideoFileName('k1_Keychain multipart_PLA_5m39s.gcode_02-06-2026_21h52.mp4');
    expect(video?.recordedAt).toEqual(new Date('2026-06-02T19:52:00Z'));
  });

  it('accepts the (n) duplicate marker and .mkv', () => {
    const video = parseVideoFileName(
      'k1_Unifi_AP-AC_Pro_mount_PLA_48m3s.gcode_25-02-2025_16h04 (2).mkv',
    );
    expect(video?.print).toEqual({
      partName: 'Unifi_AP-AC_Pro_mount',
      material: 'PLA',
      printTimeSeconds: 2883,
    });
  });

  it('keeps the recording time when the print part does not parse', () => {
    const video = parseVideoFileName('k1_something odd.gcode_01-03-2025_09h05.mp4');
    expect(video).toEqual({
      printerPrefix: 'k1',
      print: null,
      recordedAt: new Date('2025-03-01T08:05:00Z'),
    });
  });

  it('reads Unix-timestamp names as the recording time', () => {
    expect(parseVideoFileName('1727091308.mkv')).toEqual({
      printerPrefix: null,
      print: null,
      recordedAt: new Date(1_727_091_308_000),
    });
    expect(parseVideoFileName('1727346184 (1).mp4')?.recordedAt).toEqual(
      new Date(1_727_346_184_000),
    );
  });

  it.each([
    'tray-1.mp4',
    'Koker groot 158mm.mp4',
    '2_Slot_Orange-FAIL.mp4',
    '0000000001.mp4', // timestamp outside the plausible range
    'k1_part_PLA_1h.gcode_31-02-2025_10h00.mp4', // 31 February
    'k1_part_PLA_1h.gcode_01-01-2025_25h00.mp4',
    'k1_part_PLA_1h.gcode_01-01-2025_10h00.avi',
  ])('yields no metadata for %s', (name) => {
    expect(parseVideoFileName(name)).toBeNull();
  });
});

describe('parsePrintStem', () => {
  it('trims stray spaces around the part name', () => {
    expect(parsePrintStem(' lock _PLA_1h')?.partName).toBe('lock');
  });
});

describe('zonedTimeToUtc', () => {
  it.each([
    [{ year: 2026, month: 1, day: 15, hour: 12, minute: 0 }, '2026-01-15T11:00:00Z'],
    [{ year: 2026, month: 7, day: 15, hour: 12, minute: 0 }, '2026-07-15T10:00:00Z'],
    // Last Sunday of October 2026: 03:00 CEST becomes 02:00 CET.
    [{ year: 2026, month: 10, day: 25, hour: 1, minute: 30 }, '2026-10-24T23:30:00Z'],
    [{ year: 2026, month: 10, day: 25, hour: 4, minute: 0 }, '2026-10-25T03:00:00Z'],
  ])('converts %j', (local, iso) => {
    expect(zonedTimeToUtc(local).toISOString()).toBe(new Date(iso).toISOString());
  });
});

describe('local dates in Europe/Amsterdam', () => {
  it('takes the calendar day of the business time zone', () => {
    expect(localDate('2026-10-04T23:30:00Z')).toBe('2026-10-05');
    expect(localDate('2026-01-15T22:59:00Z')).toBe('2026-01-15');
    expect(localDate('2026-01-15T23:00:00Z')).toBe('2026-01-16');
  });

  it('counts whole calendar days, never negative', () => {
    expect(daysBetween('2026-10-01T10:00:00Z', '2026-10-01T21:00:00Z')).toBe(0);
    expect(daysBetween('2026-10-01T21:59:00Z', '2026-10-01T22:00:00Z')).toBe(1);
    // Across the switch to winter time (25 October 2026).
    expect(daysBetween('2026-10-20T12:00:00Z', '2026-10-30T12:00:00Z')).toBe(10);
    expect(daysBetween('2026-10-30T12:00:00Z', '2026-10-20T12:00:00Z')).toBe(0);
  });
});
