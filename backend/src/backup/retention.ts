import type { RetentionPolicy } from './settings.js';

const NAME = /^prints-portal-(\d{4})(\d{2})(\d{2})T(\d{2})(\d{2})(\d{2})Z$/;

export function backupName(date: Date): string {
  const iso = date
    .toISOString()
    .replace(/[-:]/g, '')
    .replace(/\.\d+Z$/, 'Z');
  return `prints-portal-${iso}`;
}

export function parseBackupName(name: string): Date | null {
  const m = NAME.exec(name);
  if (!m) return null;
  const [y, mo, d, h, mi, s] = m.slice(1).map(Number) as [
    number,
    number,
    number,
    number,
    number,
    number,
  ];
  return new Date(Date.UTC(y, mo - 1, d, h, mi, s));
}

function isoWeekKey(date: Date): string {
  const day = new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()));
  const weekday = day.getUTCDay() || 7;
  day.setUTCDate(day.getUTCDate() + 4 - weekday); // the Thursday decides the year
  const yearStart = Date.UTC(day.getUTCFullYear(), 0, 1);
  const week = Math.ceil(((day.getTime() - yearStart) / 86_400_000 + 1) / 7);
  return `${String(day.getUTCFullYear())}-W${String(week)}`;
}

/**
 * Picks the backups to keep: the newest one of each of the last `daily` days,
 * `weekly` ISO weeks and `monthly` months (UTC) that have a backup. A backup
 * kept by any rule stays. Names that are not backups are never returned, so
 * they are never deleted.
 */
export function selectBackupsToKeep(names: string[], policy: RetentionPolicy): Set<string> {
  const dated = names
    .map((name) => ({ name, date: parseBackupName(name) }))
    .filter((entry): entry is { name: string; date: Date } => entry.date !== null)
    .sort((a, b) => b.date.getTime() - a.date.getTime());

  const keep = new Set<string>();
  const rules: [number, (date: Date) => string][] = [
    [policy.daily, (date) => date.toISOString().slice(0, 10)],
    [policy.weekly, isoWeekKey],
    [policy.monthly, (date) => date.toISOString().slice(0, 7)],
  ];
  for (const [limit, keyOf] of rules) {
    const seen = new Set<string>();
    for (const { name, date } of dated) {
      const key = keyOf(date);
      if (seen.has(key)) continue;
      if (seen.size >= limit) break;
      seen.add(key);
      keep.add(name);
    }
  }
  return keep;
}
