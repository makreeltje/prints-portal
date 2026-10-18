import { mkdir, mkdtemp, realpath, rm, symlink, writeFile } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { parseCompactDuration, parseSpacedDuration } from '../../src/core/duration.js';
import { roundEnergy, roundMoney } from '../../src/core/money.js';
import {
  isInside,
  PathEscapeError,
  resolveExistingWithinRoot,
  resolveWithinRoot,
} from '../../src/core/paths.js';
import {
  checkBootstrapPassword,
  checkSessionSecret,
  isPlaceholder,
} from '../../src/core/secrets.js';
import {
  contrastRatio,
  normalizeHexColor,
  normalizeTagName,
  TAG_INK_DARK,
  TAG_INK_LIGHT,
  tagInkColor,
  tagKey,
  TagNameError,
} from '../../src/core/tags.js';

describe('money and energy rounding', () => {
  it.each([
    [1.005, 1.01],
    [2.675, 2.68],
    [1.004, 1],
    [-1.005, -1.01],
    [0.125, 0.13],
    [11.885, 11.89],
    [-0.001, 0],
    [0, 0],
  ])('roundMoney(%s) = %s', (input, expected) => {
    expect(roundMoney(input)).toBe(expected);
  });

  it.each([
    [0.4665, 0.467],
    [0.0005, 0.001],
    [1.2344, 1.234],
  ])('roundEnergy(%s) = %s', (input, expected) => {
    expect(roundEnergy(input)).toBe(expected);
  });

  it('rejects non-finite values', () => {
    expect(() => roundMoney(Number.NaN)).toThrow(RangeError);
  });
});

describe('durations', () => {
  it.each([
    ['37m0s', 2220],
    ['1h', 3600],
    ['2h5m', 7500],
    ['1h20m', 4800],
    ['31m55s', 1915],
    ['1d2h', 93_600],
    ['1H20M', 4800],
  ])('parses compact %s', (text, seconds) => {
    expect(parseCompactDuration(text)).toBe(seconds);
  });

  it.each(['', 'h', '1x', '20m1h', '1h 20m', 'abc'])('rejects compact %j', (text) => {
    expect(parseCompactDuration(text)).toBeNull();
  });

  it.each([
    ['37m 0s', 2220],
    ['1h 35m 31s', 5731],
    ['1d 2h 3m 4s', 93_784],
    ['11m 10s', 670],
    ['3h 24m 54s', 12_294],
  ])('parses slicer notation %s', (text, seconds) => {
    expect(parseSpacedDuration(text)).toBe(seconds);
  });
});

describe('path containment', () => {
  let tmp: string;
  let root: string;

  beforeAll(async () => {
    // realpath: on macOS the temp folder sits under /var, a symlink to /private/var,
    // and resolveExistingWithinRoot returns the canonical path.
    tmp = await realpath(await mkdtemp(path.join(os.tmpdir(), 'pp-paths-')));
    root = path.join(tmp, 'prints');
    await mkdir(path.join(root, 'Koen', 'Bloembak clips'), { recursive: true });
    await writeFile(path.join(root, 'Koen', 'Bloembak clips', 'lock.gcode'), 'G1');
    await mkdir(path.join(tmp, 'prints-other'));
    await writeFile(path.join(tmp, 'prints-other', 'secret.txt'), 'x');
    await writeFile(path.join(tmp, 'outside.txt'), 'x');
    await symlink(path.join(tmp, 'outside.txt'), path.join(root, 'Koen', 'link.txt'));
  });

  afterAll(async () => {
    await rm(tmp, { recursive: true, force: true });
  });

  it('resolves normal relative paths', () => {
    expect(resolveWithinRoot(root, 'Koen/Bloembak clips/lock.gcode')).toBe(
      path.join(root, 'Koen', 'Bloembak clips', 'lock.gcode'),
    );
    expect(resolveWithinRoot(root, 'Koen/./x/../lock.gcode')).toBe(
      path.join(root, 'Koen', 'lock.gcode'),
    );
  });

  it.each([
    '../outside.txt',
    'Koen/../../outside.txt',
    '../prints-other/secret.txt',
    '/etc/passwd',
    'C:\\Windows\\win.ini',
    'Koen/\0lock.gcode',
  ])('refuses %j', (relative) => {
    expect(() => resolveWithinRoot(root, relative)).toThrow(PathEscapeError);
  });

  it('does not accept a sibling folder that shares the prefix', () => {
    expect(isInside('/prints', '/prints-other/file')).toBe(false);
    expect(isInside('/prints', '/prints/file')).toBe(true);
    expect(isInside('/prints', '/prints')).toBe(true);
  });

  it('follows symlinks and refuses targets outside the root', async () => {
    await expect(resolveExistingWithinRoot(root, 'Koen/Bloembak clips/lock.gcode')).resolves.toBe(
      path.join(root, 'Koen', 'Bloembak clips', 'lock.gcode'),
    );
    await expect(resolveExistingWithinRoot(root, 'Koen/link.txt')).rejects.toBeInstanceOf(
      PathEscapeError,
    );
  });
});

describe('weak secrets', () => {
  const strong = 'aV3ry-L0ng-Random-Session-Secret-Value-1234';

  it('recognises the .env.example placeholders', () => {
    expect(isPlaceholder('CHANGE-ME-generate-with-openssl-rand-base64-48')).toBe(true);
    expect(isPlaceholder('CHANGE-ME-to-a-long-password')).toBe(true);
    expect(isPlaceholder(strong)).toBe(false);
  });

  it.each([
    [undefined, 'not set'],
    ['', 'not set'],
    ['CHANGE-ME-generate-with-openssl-rand-base64-48', 'placeholder'],
    ['too-short-but-random-1234', 'at least 32'],
  ])('refuses session secret %j outside development', (secret, reason) => {
    for (const environment of ['production', 'test'] as const) {
      const result = checkSessionSecret(secret, environment);
      expect(result.ok).toBe(false);
      if (!result.ok) expect(result.problem).toContain(reason);
    }
  });

  it('only warns in development', () => {
    const result = checkSessionSecret(undefined, 'development');
    expect(result).toEqual({ ok: true, warnings: [expect.stringContaining('not set')] });
  });

  it('accepts a strong secret', () => {
    expect(checkSessionSecret(strong, 'production')).toEqual({ ok: true, warnings: [] });
  });

  it.each([
    ['CHANGE-ME-to-a-long-password', 'placeholder'],
    ['short-pw-1', 'at least 12'],
    ['password', 'placeholder'],
  ])('refuses bootstrap password %j outside development', (password, reason) => {
    const result = checkBootstrapPassword(password, 'production');
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.problem).toContain(reason);
  });

  it('accepts a long bootstrap password', () => {
    expect(checkBootstrapPassword('correct horse battery', 'production').ok).toBe(true);
  });
});

describe('tags', () => {
  it('normalises names and compares case-insensitively', () => {
    expect(normalizeTagName('  Bord   spellen ')).toBe('Bord spellen');
    expect(tagKey('Muurbeugel')).toBe(tagKey('MUURBEUGEL '));
  });

  it('limits names to 64 characters', () => {
    expect(normalizeTagName('x'.repeat(64))).toHaveLength(64);
    expect(() => normalizeTagName('x'.repeat(65))).toThrow(TagNameError);
    expect(() => normalizeTagName('   ')).toThrow(TagNameError);
  });

  it.each([
    ['#E0A3FF', '#e0a3ff'],
    ['e0a3ff', '#e0a3ff'],
    ['#abc', '#aabbcc'],
    ['  #00F600 ', '#00f600'],
    ['red', null],
    ['#12345', null],
    ['#gggggg', null],
    ['', null],
    [null, null],
  ])('normalises colour %j to %j', (input, expected) => {
    expect(normalizeHexColor(input)).toBe(expected);
  });

  it('picks the text colour with the higher contrast', () => {
    expect(tagInkColor('#ffffff')).toBe(TAG_INK_DARK);
    expect(tagInkColor('#ffde00')).toBe(TAG_INK_DARK);
    expect(tagInkColor('#000000')).toBe(TAG_INK_LIGHT);
    expect(tagInkColor('#7a00ff')).toBe(TAG_INK_LIGHT);
    for (const bg of ['#e0a3ff', '#3ddf57', '#0000a0', '#ff4848']) {
      const ink = tagInkColor(bg);
      const other = ink === TAG_INK_DARK ? TAG_INK_LIGHT : TAG_INK_DARK;
      expect(contrastRatio(bg, ink)).toBeGreaterThanOrEqual(contrastRatio(bg, other));
    }
  });
});
