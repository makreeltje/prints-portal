import path from 'node:path';
import { DatabaseUrlError, parseDatabaseUrl, type DatabaseTarget } from '../db/database-url.js';

export interface BackupSettings {
  dataDir: string;
  database: DatabaseTarget;
  backupDir: string;
  retention: RetentionPolicy;
  /** Local time of day (TZ) the schedule runs at. */
  time: { hour: number; minute: number };
}

export interface RetentionPolicy {
  daily: number;
  weekly: number;
  monthly: number;
}

export class BackupSettingsError extends Error {
  override name = 'BackupSettingsError';
}

type Env = Record<string, string | undefined>;

/**
 * Reads the backup settings. Like the app, an empty value counts as unset and
 * every problem is reported at once. Only what the backup needs is read: it
 * runs without SESSION_SECRET or any sign-in setting.
 */
export function loadBackupSettings(env: Env): BackupSettings {
  const problems: string[] = [];
  const read = (name: string): string | undefined => {
    const value = env[name]?.trim();
    return value === undefined || value === '' ? undefined : value;
  };
  const count = (name: string, fallback: number): number => {
    const raw = read(name);
    if (raw === undefined) return fallback;
    if (!/^\d+$/.test(raw)) {
      problems.push(`${name} must be a whole number of 0 or more, got "${raw}".`);
      return fallback;
    }
    return Number(raw);
  };

  const dataDir = path.resolve(read('DATA_DIR') ?? '/data');
  const backupDir = path.resolve(read('BACKUP_DIR') ?? '/backups');

  // Same default as the app: the database file sits in the data folder.
  let database: DatabaseTarget = {
    dialect: 'sqlite',
    filename: path.join(dataDir, 'prints-portal.db'),
  };
  const databaseUrl = read('DATABASE_URL');
  if (databaseUrl !== undefined) {
    try {
      database = parseDatabaseUrl(databaseUrl);
    } catch (error) {
      if (error instanceof DatabaseUrlError) problems.push(error.message);
      else throw error;
    }
  }

  const retention = {
    daily: count('BACKUP_KEEP_DAILY', 7),
    weekly: count('BACKUP_KEEP_WEEKLY', 4),
    monthly: count('BACKUP_KEEP_MONTHLY', 6),
  };
  if (retention.daily + retention.weekly + retention.monthly === 0) {
    problems.push('BACKUP_KEEP_DAILY, BACKUP_KEEP_WEEKLY and BACKUP_KEEP_MONTHLY are all 0.');
  }

  let time = { hour: 3, minute: 0 };
  const rawTime = read('BACKUP_TIME');
  if (rawTime !== undefined) {
    const match = /^([01]\d|2[0-3]):([0-5]\d)$/.exec(rawTime);
    if (match) time = { hour: Number(match[1]), minute: Number(match[2]) };
    else problems.push(`BACKUP_TIME must look like 03:00 (24-hour clock), got "${rawTime}".`);
  }

  if (
    path.relative(dataDir, backupDir) === '' ||
    !path.relative(dataDir, backupDir).startsWith('..')
  ) {
    problems.push(
      'BACKUP_DIR must not be DATA_DIR or inside it: a backup next to the data is lost with it.',
    );
  }

  if (problems.length > 0) {
    throw new BackupSettingsError(problems.map((problem) => `- ${problem}`).join('\n'));
  }
  return { dataDir, database, backupDir, retention, time };
}
