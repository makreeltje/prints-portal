/**
 * Backs up the SQLite database and the data folder.
 *
 *   node backend/dist/cli/backup.js [run]                      one backup, then prune
 *   node backend/dist/cli/backup.js schedule                   run every day at BACKUP_TIME
 *   node backend/dist/cli/backup.js list                       show the backups
 *   node backend/dist/cli/backup.js check                      exit 1 when the newest is too old
 *   node backend/dist/cli/backup.js restore <backup> <folder>  restore into an empty folder
 *
 * Settings: DATA_DIR, DATABASE_URL, BACKUP_DIR, BACKUP_TIME, BACKUP_KEEP_*.
 */
import path from 'node:path';
import { createBackup, listBackups, newestBackupAge, restoreBackup } from '../backup/backup.js';
import {
  BackupSettingsError,
  loadBackupSettings,
  type BackupSettings,
} from '../backup/settings.js';

/** Twice the daily interval would hide a missed night; 36 hours flags it the next morning. */
const MAX_AGE_MS = 36 * 3_600_000;
const log = (message: string) => {
  console.log(`${new Date().toISOString()} ${message}`);
};

async function runOnce(settings: BackupSettings): Promise<void> {
  const result = await createBackup(settings);
  log(`backup created: ${result.path} (database: ${result.manifest.database})`);
  if (result.manifest.database === 'external') {
    log(
      'the database is not SQLite: it is NOT in this backup, dump it separately (see DEPLOYMENT.md)',
    );
  }
  for (const name of result.pruned) log(`backup removed by retention: ${name}`);
}

export function msUntilNext(now: Date, time: { hour: number; minute: number }): number {
  const next = new Date(now);
  next.setHours(time.hour, time.minute, 0, 0);
  if (next.getTime() <= now.getTime()) next.setDate(next.getDate() + 1);
  return next.getTime() - now.getTime();
}

async function schedule(settings: BackupSettings): Promise<never> {
  // A container that was down at BACKUP_TIME catches up when it starts.
  const age = await newestBackupAge(settings.backupDir);
  if (age === null || age > MAX_AGE_MS / 1.5) {
    await runOnce(settings).catch((error: unknown) => {
      log(`backup FAILED: ${String(error)}`);
    });
  }
  for (;;) {
    const wait = msUntilNext(new Date(), settings.time);
    log(`next backup in ${String(Math.round(wait / 60_000))} minutes`);
    await new Promise((resolve) => setTimeout(resolve, wait));
    await runOnce(settings).catch((error: unknown) => {
      log(`backup FAILED: ${String(error)}`);
    });
  }
}

async function main(): Promise<number> {
  const [command = 'run', ...args] = process.argv.slice(2);
  const settings = loadBackupSettings(process.env);

  switch (command) {
    case 'run':
      await runOnce(settings);
      return 0;
    case 'schedule':
      return schedule(settings);
    case 'list':
      for (const name of await listBackups(settings.backupDir)) console.log(name);
      return 0;
    case 'check': {
      const age = await newestBackupAge(settings.backupDir);
      if (age === null) console.error('no backup yet');
      else if (age > MAX_AGE_MS)
        console.error(`newest backup is ${String(Math.round(age / 3_600_000))} hours old`);
      return age !== null && age <= MAX_AGE_MS ? 0 : 1;
    }
    case 'restore': {
      const [backup, target] = args;
      if (!backup || !target) {
        console.error('Usage: restore <backup folder> <empty target folder>');
        return 2;
      }
      const resolved = path.isAbsolute(backup) ? backup : path.join(settings.backupDir, backup);
      const manifest = await restoreBackup(resolved, path.resolve(target));
      log(`restored ${resolved} (made ${manifest.createdAt}) into ${path.resolve(target)}`);
      return 0;
    }
    default:
      console.error(`Unknown command "${command}". Use run, schedule, list, check or restore.`);
      return 2;
  }
}

main().then(
  (code) => {
    process.exitCode = code;
  },
  (error: unknown) => {
    console.error(
      error instanceof BackupSettingsError ? `Invalid backup settings:\n${error.message}` : error,
    );
    process.exitCode = 1;
  },
);
