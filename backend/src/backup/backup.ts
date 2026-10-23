import { cp, mkdir, readdir, readFile, rename, rm, stat, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { backupName, parseBackupName, selectBackupsToKeep } from './retention.js';
import type { BackupSettings } from './settings.js';

/** Left out of the file copy: a cache that is recreated on demand. */
const SKIPPED_DIRS = new Set(['thumbnails']);
const DATABASE_SUFFIXES = ['', '-wal', '-shm', '-journal'];

export interface BackupManifest {
  version: number;
  createdAt: string;
  /** `sqlite` backups hold the database; with another engine it must be dumped separately. */
  database: 'sqlite' | 'external';
  /** Path of the database file relative to the data folder (SQLite inside it), else its name. */
  databaseFile: string | null;
}

export interface BackupResult {
  name: string;
  path: string;
  manifest: BackupManifest;
  pruned: string[];
}

export async function createBackup(
  settings: BackupSettings,
  now = new Date(),
): Promise<BackupResult> {
  await mkdir(settings.backupDir, { recursive: true });
  const name = backupName(now);
  const finalPath = path.join(settings.backupDir, name);
  const tempPath = path.join(settings.backupDir, `.tmp-${name}`);
  await rm(tempPath, { recursive: true, force: true });
  await mkdir(path.join(tempPath, 'data'), { recursive: true });

  try {
    const sqliteFile =
      settings.database.dialect === 'sqlite' && settings.database.filename !== ':memory:'
        ? path.resolve(settings.database.filename)
        : null;

    let databaseFile: string | null = null;
    if (sqliteFile !== null) {
      databaseFile = relativeToData(settings.dataDir, sqliteFile);
      await mkdir(path.join(tempPath, 'database'), { recursive: true });
      await backupSqlite(sqliteFile, path.join(tempPath, 'database', path.basename(sqliteFile)));
    }

    const excluded = new Set(
      sqliteFile === null ? [] : DATABASE_SUFFIXES.map((suffix) => sqliteFile + suffix),
    );
    await copyDataDir(settings.dataDir, path.join(tempPath, 'data'), excluded);

    const manifest: BackupManifest = {
      version: 1,
      createdAt: now.toISOString(),
      database: sqliteFile === null ? 'external' : 'sqlite',
      databaseFile,
    };
    await writeFile(path.join(tempPath, 'manifest.json'), JSON.stringify(manifest, null, 2) + '\n');
    await rm(finalPath, { recursive: true, force: true });
    await rename(tempPath, finalPath);
    const pruned = await pruneBackups(settings);
    return { name, path: finalPath, manifest, pruned };
  } catch (error) {
    await rm(tempPath, { recursive: true, force: true });
    throw error;
  }
}

function relativeToData(dataDir: string, file: string): string {
  const relative = path.relative(dataDir, file);
  return relative.startsWith('..') || path.isAbsolute(relative) ? path.basename(file) : relative;
}

/**
 * SQLite's online backup API: a consistent copy while the app keeps writing,
 * which a plain file copy of a WAL database is not.
 */
async function backupSqlite(source: string, destination: string): Promise<void> {
  const { default: Database } = await import('better-sqlite3');
  const database = new Database(source, { fileMustExist: true });
  try {
    await database.backup(destination);
  } finally {
    database.close();
  }
  // Leave a single self-contained file: no -wal/-shm next to it.
  const copy = new Database(destination);
  try {
    copy.pragma('journal_mode = DELETE');
    const result = copy.pragma('integrity_check', { simple: true });
    if (result !== 'ok') {
      throw new Error(`The backup of the database failed its integrity check: ${String(result)}`);
    }
  } finally {
    copy.close();
  }
}

async function copyDataDir(source: string, destination: string, excluded: Set<string>) {
  await cp(source, destination, {
    recursive: true,
    filter: (file) => {
      if (excluded.has(file)) return false;
      const relative = path.relative(source, file);
      return !(relative !== '' && SKIPPED_DIRS.has(relative.split(path.sep)[0] ?? ''));
    },
  });
}

export async function listBackups(backupDir: string): Promise<string[]> {
  try {
    const entries = await readdir(backupDir, { withFileTypes: true });
    return entries
      .filter((entry) => entry.isDirectory() && parseBackupName(entry.name) !== null)
      .map((entry) => entry.name)
      .sort();
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === 'ENOENT') return [];
    throw error;
  }
}

export async function pruneBackups(settings: BackupSettings): Promise<string[]> {
  const names = await listBackups(settings.backupDir);
  const keep = selectBackupsToKeep(names, settings.retention);
  const removed = names.filter((name) => !keep.has(name));
  for (const name of removed) {
    await rm(path.join(settings.backupDir, name), { recursive: true, force: true });
  }
  return removed;
}

export async function newestBackupAge(backupDir: string, now = new Date()): Promise<number | null> {
  const newest = (await listBackups(backupDir)).at(-1);
  const date = newest === undefined ? null : parseBackupName(newest);
  return date === null ? null : now.getTime() - date.getTime();
}

/**
 * Restores a backup into an empty folder. It never overwrites: restore into a
 * new folder, check it, then swap it in (see docs/DEPLOYMENT.md).
 */
export async function restoreBackup(backupPath: string, target: string): Promise<BackupManifest> {
  const manifest = JSON.parse(
    await readFile(path.join(backupPath, 'manifest.json'), 'utf8'),
  ) as BackupManifest;
  if (manifest.version !== 1)
    throw new Error(`Unknown backup version ${String(manifest.version)}.`);

  await mkdir(target, { recursive: true });
  if ((await readdir(target)).length > 0) {
    throw new Error(`${target} is not empty. Restore into a new, empty folder.`);
  }
  await cp(path.join(backupPath, 'data'), target, { recursive: true });
  if (manifest.database === 'sqlite' && manifest.databaseFile !== null) {
    const destination = path.join(target, manifest.databaseFile);
    await mkdir(path.dirname(destination), { recursive: true });
    await cp(path.join(backupPath, 'database', path.basename(manifest.databaseFile)), destination);
  }
  return manifest;
}

export async function isDirectory(p: string): Promise<boolean> {
  return stat(p).then(
    (s) => s.isDirectory(),
    () => false,
  );
}
