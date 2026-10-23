import Database from 'better-sqlite3';
import { mkdir, mkdtemp, readFile, readdir, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { createBackup, listBackups, restoreBackup } from '../../src/backup/backup.js';
import { backupName, selectBackupsToKeep } from '../../src/backup/retention.js';
import {
  BackupSettingsError,
  loadBackupSettings,
  type BackupSettings,
} from '../../src/backup/settings.js';
import { msUntilNext } from '../../src/cli/backup.js';

describe('retention', () => {
  const at = (iso: string) => backupName(new Date(iso));

  it('keeps the newest backup of the last days, weeks and months', () => {
    const names = [
      '2026-10-23T03:00:00Z',
      '2026-10-23T01:00:00Z', // same day, older: dropped
      '2026-10-22T03:00:00Z',
      '2026-10-21T03:00:00Z',
      '2026-10-14T03:00:00Z',
      '2026-09-30T03:00:00Z',
      '2026-08-31T03:00:00Z',
      '2026-01-05T03:00:00Z',
    ].map(at);
    const keep = selectBackupsToKeep(names, { daily: 2, weekly: 2, monthly: 3 });
    expect([...keep].sort()).toEqual(
      [
        '2026-10-23T03:00:00Z', // day 1, week, month
        '2026-10-22T03:00:00Z', // day 2
        '2026-10-14T03:00:00Z', // previous week
        '2026-09-30T03:00:00Z', // month
        '2026-08-31T03:00:00Z', // month
      ]
        .map(at)
        .sort(),
    );
  });

  it('never selects names that are not backups', () => {
    expect(selectBackupsToKeep(['notes', '.tmp-x'], { daily: 1, weekly: 0, monthly: 0 }).size).toBe(
      0,
    );
  });
});

describe('settings', () => {
  it('uses defaults and treats empty values as unset', () => {
    const settings = loadBackupSettings({ BACKUP_DIR: '', BACKUP_TIME: '' });
    expect(settings.retention).toEqual({ daily: 7, weekly: 4, monthly: 6 });
    expect(settings.time).toEqual({ hour: 3, minute: 0 });
  });

  it('lists every problem, and refuses a backup folder inside the data folder', () => {
    expect(() =>
      loadBackupSettings({ BACKUP_TIME: '25:00', BACKUP_KEEP_DAILY: 'x', BACKUP_DIR: '/data/b' }),
    ).toThrow(BackupSettingsError);
    try {
      loadBackupSettings({ BACKUP_TIME: '25:00', BACKUP_KEEP_DAILY: 'x', BACKUP_DIR: '/data/b' });
    } catch (error) {
      const message = (error as Error).message;
      expect(message).toContain('BACKUP_TIME');
      expect(message).toContain('BACKUP_KEEP_DAILY');
      expect(message).toContain('BACKUP_DIR');
    }
  });
});

describe('schedule', () => {
  it('waits until the next occurrence of the time, today or tomorrow', () => {
    const now = new Date(2026, 9, 23, 2, 0, 0);
    expect(msUntilNext(now, { hour: 3, minute: 0 })).toBe(3_600_000);
    expect(msUntilNext(new Date(2026, 9, 23, 3, 0, 0), { hour: 3, minute: 0 })).toBe(86_400_000);
  });
});

describe('backup and restore', () => {
  let root: string;
  let settings: BackupSettings;

  beforeEach(async () => {
    root = await mkdtemp(path.join(tmpdir(), 'pp-backup-'));
    const dataDir = path.join(root, 'data');
    await mkdir(path.join(dataDir, 'invoices'), { recursive: true });
    await mkdir(path.join(dataDir, 'thumbnails'), { recursive: true });
    await writeFile(path.join(dataDir, 'invoices', '2026-0001.pdf'), 'pdf-bytes');
    await writeFile(path.join(dataDir, 'thumbnails', 'a.png'), 'cache');
    const db = new Database(path.join(dataDir, 'prints-portal.db'));
    db.pragma('journal_mode = WAL');
    db.exec('create table t (n integer); insert into t values (1), (2), (3);');
    // Left open on purpose: the app holds the database while the backup runs.
    (globalThis as { __pp_db?: Database.Database }).__pp_db = db;
    settings = loadBackupSettings({
      DATA_DIR: dataDir,
      DATABASE_URL: `sqlite://${path.join(dataDir, 'prints-portal.db')}`,
      BACKUP_DIR: path.join(root, 'backups'),
      BACKUP_KEEP_DAILY: '2',
      BACKUP_KEEP_WEEKLY: '0',
      BACKUP_KEEP_MONTHLY: '0',
    });
  });

  afterEach(async () => {
    (globalThis as { __pp_db?: Database.Database }).__pp_db?.close();
    await rm(root, { recursive: true, force: true });
  });

  it('backs up the database and invoices, skips the thumbnail cache, and restores both', async () => {
    const result = await createBackup(settings, new Date('2026-10-23T03:00:00Z'));
    expect(await readdir(path.join(result.path, 'data'))).toEqual(['invoices']);

    const target = path.join(root, 'restored');
    await restoreBackup(result.path, target);
    expect(await readFile(path.join(target, 'invoices', '2026-0001.pdf'), 'utf8')).toBe(
      'pdf-bytes',
    );
    const restored = new Database(path.join(target, 'prints-portal.db'), { readonly: true });
    expect(restored.prepare('select count(*) as c from t').get()).toEqual({ c: 3 });
    restored.close();
    await expect(restoreBackup(result.path, target)).rejects.toThrow(/not empty/);
  });

  it('applies retention after each backup and leaves no temporary folder', async () => {
    for (const day of ['21', '22', '23']) {
      await createBackup(settings, new Date(`2026-10-${day}T03:00:00Z`));
    }
    expect(await listBackups(settings.backupDir)).toHaveLength(2);
    expect((await readdir(settings.backupDir)).every((name) => !name.startsWith('.tmp-'))).toBe(
      true,
    );
  });
});
