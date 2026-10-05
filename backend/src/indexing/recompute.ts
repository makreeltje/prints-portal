import path from 'node:path';
import type { Transaction } from 'kysely';
import { autoExcludeFolder } from '../core/files.js';
import type { Database } from '../db/schema.js';

/**
 * Recomputes everything derived for one print from its lines: automatic
 * exclusions, duplicate flags, totals and the derived metadata. Called by
 * the indexer and (later) after every user change that affects counting.
 *
 * Rules (owner decisions):
 *   - files under a folder such as "Nog te printen" or "Test" start excluded;
 *   - a 3MF plate is excluded when the print has a counted G-code;
 *   - G-code files with the same size and slicer metadata are possible duplicates;
 *   - the user's own choice (user_excluded) always wins over the automatic one.
 */
export async function recomputeRecord(
  trx: Transaction<Database>,
  recordId: string,
  autoExcludeFolders: readonly string[],
  now: string,
): Promise<void> {
  const rows = await trx
    .selectFrom('print_lines as l')
    .innerJoin('print_assets as a', 'a.id', 'l.asset_id')
    .select([
      'l.id',
      'l.total_grams',
      'l.print_seconds',
      'l.printer_model',
      'l.material',
      'l.auto_excluded',
      'l.auto_exclusion_reason',
      'l.user_excluded',
      'l.times_printed',
      'l.duplicate_fingerprint',
      'l.possible_duplicate',
      'a.type',
      'a.sub_path',
      'a.file_name',
      'a.last_write_utc',
      'a.name_part',
      'a.name_material',
    ])
    .where('a.print_record_id', '=', recordId)
    .execute();

  const folderReason = (subPath: string) => {
    const folder = autoExcludeFolder(subPath === '' ? [] : subPath.split('/'), autoExcludeFolders);
    return folder === null ? null : `folder:${folder}`;
  };
  const effective = (user: number | null, auto: boolean) => (user ?? (auto ? 1 : 0)) === 1;

  const hasCountedGcode = rows.some(
    (row) =>
      row.type === 'gcode' && !effective(row.user_excluded, folderReason(row.sub_path) !== null),
  );

  const fingerprintCounts = new Map<string, number>();
  for (const row of rows) {
    if (row.type === 'gcode' && row.duplicate_fingerprint !== null) {
      fingerprintCounts.set(
        row.duplicate_fingerprint,
        (fingerprintCounts.get(row.duplicate_fingerprint) ?? 0) + 1,
      );
    }
  }

  const resolved = rows.map((row) => {
    const reason =
      folderReason(row.sub_path) ??
      (row.type === '3mf' && hasCountedGcode ? 'gcode-present' : null);
    const duplicate =
      row.duplicate_fingerprint !== null &&
      (fingerprintCounts.get(row.duplicate_fingerprint) ?? 0) > 1;
    return { row, reason, duplicate, excluded: effective(row.user_excluded, reason !== null) };
  });

  for (const { row, reason, duplicate } of resolved) {
    const autoExcluded = reason === null ? 0 : 1;
    const possibleDuplicate = duplicate ? 1 : 0;
    if (
      row.auto_excluded !== autoExcluded ||
      row.auto_exclusion_reason !== reason ||
      row.possible_duplicate !== possibleDuplicate
    ) {
      await trx
        .updateTable('print_lines')
        .set({
          auto_excluded: autoExcluded,
          auto_exclusion_reason: reason,
          possible_duplicate: possibleDuplicate,
        })
        .where('id', '=', row.id)
        .execute();
    }
  }

  const counted = resolved.filter((item) => !item.excluded).map((item) => item.row);
  const sum = (pick: (row: (typeof counted)[number]) => number | null) => {
    const values = counted.flatMap((row) => {
      const value = pick(row);
      return value === null ? [] : [value * row.times_printed];
    });
    return values.length === 0 ? null : values.reduce((a, b) => a + b, 0);
  };
  const grams = sum((row) => row.total_grams);
  const byNewest = (a: { last_write_utc: string }, b: { last_write_utc: string }) =>
    b.last_write_utc.localeCompare(a.last_write_utc);
  const primary =
    counted.filter((row) => row.type === 'gcode').sort(byNewest)[0] ??
    counted.filter((row) => row.type === '3mf').sort(byNewest)[0];

  await trx
    .updateTable('print_records')
    .set({
      total_grams: grams === null ? null : Math.round(grams * 100) / 100,
      total_print_seconds: sum((row) => row.print_seconds),
      print_date: [...counted].sort(byNewest)[0]?.last_write_utc ?? null,
      part_name:
        primary === undefined ? null : (primary.name_part ?? path.parse(primary.file_name).name),
      material: primary === undefined ? null : (primary.material ?? primary.name_material),
      printer_model: primary?.printer_model ?? null,
      updated_at: now,
    })
    .where('id', '=', recordId)
    .execute();
}
