import { mkdtemp, rm, writeFile } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { checkDataDir } from '../../src/config/data-dir.js';

describe('checkDataDir', () => {
  let tmp: string;

  beforeAll(async () => {
    tmp = await mkdtemp(path.join(os.tmpdir(), 'pp-data-'));
  });

  afterAll(async () => {
    await rm(tmp, { recursive: true, force: true });
  });

  it('accepts (and creates) a writable folder', async () => {
    expect(await checkDataDir(path.join(tmp, 'new', 'data'))).toBeNull();
  });

  it('explains how to fix a data folder that cannot be used', async () => {
    // A file where the folder should be fails for every user, root included.
    const notAFolder = path.join(tmp, 'occupied');
    await writeFile(notAFolder, 'x');
    const message = await checkDataDir(notAFolder);
    expect(message).toContain('is not writable');
    expect(message).toContain('chown');
  });
});
