import { createHash, randomUUID } from 'node:crypto';
import type { Transaction } from 'kysely';
import { DEFAULT_AUTO_EXCLUDE_FOLDERS } from '../core/files.js';
import type { GcodeSlot } from '../core/gcode.js';
import type { AppDatabase } from '../db/connection.js';
import type { Database, PrintAssetTable, PrintRecordTable } from '../db/schema.js';
import { recalculatePrint } from '../finance/costs.js';
import { assignNewLine, ensureFirstOrder } from '../finance/orders.js';
import { readAsset, type AssetReading, type LineReading } from './read-asset.js';
import { recomputeRecord } from './recompute.js';
import { Scanner, type ProjectRef, type ScannedFile } from './scanner.js';

/**
 * Keeps the database in step with the prints folder.
 *
 *   - One record per (customer, project); files and their lines are upserted.
 *   - Only files whose size or modification time changed are parsed again.
 *   - User decisions on lines (excluded) survive re-indexing; times printed
 *     live on order items, keyed by file path.
 *   - Every print has order 1; a new file joins the newest order while that
 *     order has no price, payment or write-off (owner decision, M6).
 *   - A folder that disappeared makes its record Archived: files go, the
 *     record (and later its financials) stays. It returns when the folder does.
 *   - A klant folder that disappeared is forgotten as soon as the indexer
 *     walks it, by a full pass or by one customer: `seen_at` is cleared, the
 *     row and its billing settings stay.
 *   - Records with status Deleted are skipped entirely: never re-created,
 *     never flipped back to Indexed.
 *
 * All work runs through one queue, so the watcher and a full scan never
 * index the same print at the same time.
 */
export type PrintEventType = 'print:created' | 'print:updated' | 'print:deleted';

export interface PrintEvent {
  type: PrintEventType;
  customerFolder: string;
  projectFolder: string | null;
  printRecordId: string;
}

export interface IndexerLogger {
  info(obj: object, msg: string): void;
  warn(obj: object, msg: string): void;
}

export interface IndexerOptions {
  db: AppDatabase;
  printsRoot: string;
  ignorePatterns?: readonly string[];
  autoExcludeFolders?: readonly string[];
  onEvent?: (event: PrintEvent) => void;
  logger?: IndexerLogger;
  now?: () => Date;
}

export interface IndexSummary {
  projects: number;
  created: number;
  updated: number;
  unchanged: number;
  archived: number;
  skippedDeleted: number;
  filesParsed: number;
  parseErrors: number;
}

type ProjectOutcome =
  'created' | 'updated' | 'unchanged' | 'archived' | 'skippedDeleted' | 'absent';

export function recordKey({ customerFolder, projectFolder }: ProjectRef): string {
  return `${customerFolder}/${projectFolder ?? ''}`;
}

export function pathHash(relativePath: string): string {
  return createHash('sha256').update(relativePath).digest('hex');
}

export class Indexer {
  private readonly scanner: Scanner;
  private readonly autoExcludeFolders: readonly string[];
  private queue: Promise<unknown> = Promise.resolve();

  constructor(private readonly options: IndexerOptions) {
    this.scanner = new Scanner(options.printsRoot, options.ignorePatterns);
    this.autoExcludeFolders = options.autoExcludeFolders ?? DEFAULT_AUTO_EXCLUDE_FOLDERS;
  }

  /** Full scan: every folder on disk plus every known record (to archive what vanished). */
  indexAll(force = false): Promise<IndexSummary> {
    return this.enqueue(async () => {
      const summary = emptySummary();
      const refs = new Map<string, ProjectRef>();
      const customers = await this.scanner.listCustomers();
      for (const customer of customers) {
        for (const ref of await this.scanner.listProjects(customer)) refs.set(recordKey(ref), ref);
      }
      // A klant is a folder, including one with no projects in it yet.
      await this.rememberCustomers(customers);
      for (const ref of await this.knownRecords()) refs.set(recordKey(ref), ref);
      for (const ref of refs.values()) await this.indexOne(ref, summary, force);
      this.options.logger?.info(summary, 'index complete');
      return summary;
    });
  }

  /** One customer folder: its projects on disk and its known records. */
  indexCustomer(customerFolder: string): Promise<IndexSummary> {
    return this.enqueue(async () => {
      const summary = emptySummary();
      const refs = new Map<string, ProjectRef>();
      const onDisk = await this.scanner.listProjectsOrNull(customerFolder);
      for (const ref of onDisk ?? []) refs.set(recordKey(ref), ref);
      /*
        Null means the folder itself is gone, so the klant is forgotten right
        here and not only by the next full scan. Leaving it to the sweep left a
        folder removed while the portal was running listed as a klant with no
        prints until the next restart, which is the portal contradicting the
        disk — and the disk is the record (CustomerCard 2.13).

        `[]` means the folder is there and empty, which is a klant with nothing
        in it and not a klant to forget.
      */
      if (onDisk === null) await this.forgetCustomer(customerFolder);
      else await this.rememberCustomers([customerFolder], false);
      for (const ref of await this.knownRecords(customerFolder)) refs.set(recordKey(ref), ref);
      for (const ref of refs.values()) await this.indexOne(ref, summary, false);
      return summary;
    });
  }

  /**
   * Write down the klant folders that are on disk (0011).
   *
   * `sweep` is for a full pass only: a folder that was not walked this time is
   * no longer there, so its `seen_at` is cleared. The row itself stays, with
   * its "niet factureren" and its betaallink — a folder can be moved away
   * while its prints, its invoices and its history stay exactly where they are.
   */
  private async rememberCustomers(folders: readonly string[], sweep = true): Promise<void> {
    const { db } = this.options;
    const now = this.now();
    const known = new Set(
      (await db.selectFrom('customers').select('customer_folder').execute()).map(
        (row) => row.customer_folder,
      ),
    );
    for (const folder of folders) {
      if (known.has(folder)) {
        await db
          .updateTable('customers')
          .set({ seen_at: now })
          .where('customer_folder', '=', folder)
          .execute();
      } else {
        await db
          .insertInto('customers')
          .values({ customer_folder: folder, no_billing: 0, seen_at: now, updated_at: now })
          .execute();
      }
    }
    if (!sweep) return;
    const gone = [...known].filter((folder) => !folders.includes(folder));
    if (gone.length > 0) {
      await db
        .updateTable('customers')
        .set({ seen_at: null })
        .where('customer_folder', 'in', gone)
        .execute();
    }
  }

  /**
   * The folder is not on disk any more. Exactly what the full pass's sweep
   * does to one klant: `seen_at` is cleared and the row stays, with its "niet
   * factureren" and its betaallink, so a folder that comes back comes back
   * with its settings.
   */
  private async forgetCustomer(folder: string): Promise<void> {
    await this.options.db
      .updateTable('customers')
      .set({ seen_at: null })
      .where('customer_folder', '=', folder)
      .execute();
  }

  indexProject(ref: ProjectRef, force = false): Promise<IndexSummary> {
    return this.enqueue(async () => {
      const summary = emptySummary();
      await this.indexOne(ref, summary, force);
      return summary;
    });
  }

  /** Re-applies exclusion rules and totals after a user change to a print's lines. */
  recalculateRecord(recordId: string): Promise<void> {
    return this.enqueue(() =>
      this.options.db.transaction().execute(async (trx) => {
        const now = this.now();
        await recomputeRecord(trx, recordId, this.autoExcludeFolders, now);
        await recalculatePrint(trx, recordId, now);
      }),
    );
  }

  /** Resolves when all queued work has finished. */
  idle(): Promise<void> {
    return this.queue.then(() => undefined);
  }

  private enqueue<T>(task: () => Promise<T>): Promise<T> {
    const run = this.queue.then(task, task);
    this.queue = run.catch(() => undefined);
    return run;
  }

  private async knownRecords(customerFolder?: string): Promise<ProjectRef[]> {
    let query = this.options.db
      .selectFrom('print_records')
      .select(['customer_folder', 'project_folder'])
      .where('status', '!=', 'deleted')
      /*
        A request has no folder, so the absent-sweep would archive it on the
        next scan. It is not absent; it has not arrived yet.
      */
      .where('origin', '=', 'indexed');
    if (customerFolder !== undefined) query = query.where('customer_folder', '=', customerFolder);
    return (await query.execute()).map((row) => ({
      customerFolder: row.customer_folder,
      projectFolder: row.project_folder,
    }));
  }

  private async indexOne(ref: ProjectRef, summary: IndexSummary, force: boolean): Promise<void> {
    summary.projects += 1;
    const outcome = await this.indexProjectNow(ref, summary, force);
    if (outcome !== 'absent') summary[outcome] += 1;
  }

  private async indexProjectNow(
    ref: ProjectRef,
    summary: IndexSummary,
    force: boolean,
  ): Promise<ProjectOutcome> {
    const { db } = this.options;
    const key = recordKey(ref);
    const existing = await db
      .selectFrom('print_records')
      .selectAll()
      .where('record_key', '=', key)
      .executeTakeFirst();
    if (existing?.status === 'deleted') return 'skippedDeleted';

    const files = await this.scanner.listFiles(ref);
    const now = this.now();

    if (files === null) {
      if (existing === undefined) return 'absent';
      if (existing.status === 'archived') return 'unchanged';
      await db.transaction().execute(async (trx) => {
        await trx.deleteFrom('print_assets').where('print_record_id', '=', existing.id).execute();
        await trx
          .updateTable('print_records')
          .set({ status: 'archived', archived_at: now, updated_at: now })
          .where('id', '=', existing.id)
          .execute();
      });
      this.emit('print:updated', ref, existing.id);
      return 'archived';
    }

    const previous = new Map<string, PrintAssetTable>();
    if (existing !== undefined) {
      const assets = await db
        .selectFrom('print_assets')
        .selectAll()
        .where('print_record_id', '=', existing.id)
        .execute();
      for (const asset of assets) previous.set(asset.path_hash, asset);
    }

    const work: {
      file: ScannedFile;
      hash: string;
      prev?: PrintAssetTable;
      reading?: AssetReading;
    }[] = [];
    for (const file of files) {
      const hash = pathHash(file.relativePath);
      const prev = previous.get(hash);
      const changed =
        force ||
        prev === undefined ||
        prev.size_bytes !== file.sizeBytes ||
        prev.last_write_utc !== file.lastWriteUtc ||
        /*
          A `.url` shortcut indexed before 0010 has no link read out of it yet,
          and nothing about the file changed, so the two checks above would
          never look inside it again. This reads it once more. It is bounded by
          how few of these exist (16 in the owner's library, a few hundred
          bytes each) and by the fact that a readable one stops matching after
          the first pass; an unreadable one is re-read, which is also how a
          shortcut the owner repairs gets picked up.
        */
        (prev.type === 'url' && prev.url_target === null);
      const item: (typeof work)[number] = { file, hash };
      if (prev !== undefined) item.prev = prev;
      if (changed) {
        const reading = await readAsset(this.options.printsRoot, file);
        summary.filesParsed += 1;
        if (reading.parseError !== null) {
          summary.parseErrors += 1;
          this.options.logger?.warn(
            { file: file.relativePath, error: reading.parseError },
            'could not read print file',
          );
        }
        item.reading = reading;
      }
      work.push(item);
    }

    const seen = new Set(work.map((item) => item.hash));
    const removed = [...previous.values()].filter((asset) => !seen.has(asset.path_hash));
    const modified = work.some((item) => item.reading !== undefined) || removed.length > 0;
    if (existing !== undefined && existing.status === 'indexed' && !modified) {
      await db
        .updateTable('print_records')
        .set({ last_seen_at: now })
        .where('id', '=', existing.id)
        .execute();
      return 'unchanged';
    }

    const recordId = existing?.id ?? randomUUID();
    await db.transaction().execute(async (trx) => {
      if (existing === undefined) {
        await trx
          .insertInto('print_records')
          .values(newRecord(recordId, key, ref, now))
          .execute();
        await ensureFirstOrder(trx, recordId, now);
      } else {
        await trx
          .updateTable('print_records')
          .set({ status: 'indexed', archived_at: null, last_seen_at: now, updated_at: now })
          .where('id', '=', recordId)
          .execute();
      }

      for (const item of work) {
        if (item.reading === undefined) continue;
        const assetId = item.prev?.id ?? randomUUID();
        const values = assetValues(assetId, recordId, item.file, item.hash, item.reading, now);
        if (item.prev === undefined) {
          await trx.insertInto('print_assets').values(values).execute();
        } else {
          await trx.updateTable('print_assets').set(values).where('id', '=', assetId).execute();
        }
        await syncLines(trx, recordId, assetId, item.hash, item.reading.lines);
      }

      for (const asset of removed) {
        await trx.deleteFrom('print_assets').where('id', '=', asset.id).execute();
      }

      await recomputeRecord(trx, recordId, this.autoExcludeFolders, now);
      await recalculatePrint(trx, recordId, now);
    });

    this.emit(existing === undefined ? 'print:created' : 'print:updated', ref, recordId);
    return existing === undefined ? 'created' : 'updated';
  }

  private emit(type: PrintEventType, ref: ProjectRef, printRecordId: string): void {
    this.options.onEvent?.({
      type,
      customerFolder: ref.customerFolder,
      projectFolder: ref.projectFolder,
      printRecordId,
    });
  }

  private now(): string {
    return (this.options.now?.() ?? new Date()).toISOString();
  }
}

function emptySummary(): IndexSummary {
  return {
    projects: 0,
    created: 0,
    updated: 0,
    unchanged: 0,
    archived: 0,
    skippedDeleted: 0,
    filesParsed: 0,
    parseErrors: 0,
  };
}

function newRecord(id: string, key: string, ref: ProjectRef, now: string): PrintRecordTable {
  return {
    id,
    record_key: key,
    customer_folder: ref.customerFolder,
    project_folder: ref.projectFolder,
    display_name: ref.projectFolder ?? ref.customerFolder,
    status: 'indexed',
    origin: 'indexed',
    discovered_at: now,
    last_seen_at: now,
    archived_at: null,
    deleted_at: null,
    deleted_by: null,
    part_name: null,
    material: null,
    printer_model: null,
    print_date: null,
    total_grams: null,
    total_print_seconds: null,
    updated_at: now,
    spool_id: null,
    spool_snapshot: null,
    source_url: null,
    note: null,
  };
}

function assetValues(
  id: string,
  recordId: string,
  file: ScannedFile,
  hash: string,
  reading: AssetReading,
  now: string,
): PrintAssetTable {
  return {
    id,
    print_record_id: recordId,
    relative_path: file.relativePath,
    path_hash: hash,
    file_name: file.fileName,
    sub_path: file.subFolders.join('/'),
    type: reading.type,
    size_bytes: file.sizeBytes,
    last_write_utc: file.lastWriteUtc,
    name_part: reading.namePart,
    name_material: reading.nameMaterial,
    name_print_seconds: reading.namePrintSeconds,
    recorded_at: reading.recordedAt,
    printer_prefix: reading.printerPrefix,
    slicer: reading.slicer,
    has_thumbnail: reading.hasThumbnail ? 1 : 0,
    parse_error: reading.parseError,
    url_target: reading.urlTarget,
    indexed_at: now,
  };
}

/** Updates parsed fields of existing lines (keeping user decisions), adds new ones, drops gone ones. */
async function syncLines(
  trx: Transaction<Database>,
  recordId: string,
  assetId: string,
  pathHash: string,
  lines: readonly LineReading[],
): Promise<void> {
  const existing = await trx
    .selectFrom('print_lines')
    .select(['id', 'plate_index'])
    .where('asset_id', '=', assetId)
    .execute();
  const byPlate = new Map(existing.map((line) => [line.plate_index, line.id]));

  for (const line of lines) {
    const parsed = {
      total_grams: line.totalGrams,
      print_seconds: line.printSeconds,
      printer_model: line.printerModel,
      material: line.material,
      duplicate_fingerprint: line.duplicateFingerprint,
    };
    let lineId = byPlate.get(line.plateIndex);
    if (lineId === undefined) {
      lineId = randomUUID();
      await trx
        .insertInto('print_lines')
        .values({
          id: lineId,
          asset_id: assetId,
          plate_index: line.plateIndex,
          ...parsed,
          auto_excluded: 0,
          auto_exclusion_reason: null,
          user_excluded: null,
          possible_duplicate: 0,
        })
        .execute();
      await assignNewLine(trx, recordId, pathHash, line.plateIndex);
    } else {
      await trx.updateTable('print_lines').set(parsed).where('id', '=', lineId).execute();
    }
    byPlate.delete(line.plateIndex);
    await syncSlots(trx, lineId, line.slots);
  }

  const gone = [...byPlate.values()];
  if (gone.length > 0) await trx.deleteFrom('print_lines').where('id', 'in', gone).execute();
}

async function syncSlots(
  trx: Transaction<Database>,
  lineId: string,
  slots: readonly GcodeSlot[],
): Promise<void> {
  const existing = await trx
    .selectFrom('line_slots')
    .select(['id', 'slot'])
    .where('line_id', '=', lineId)
    .execute();
  const bySlot = new Map(existing.map((row) => [row.slot, row.id]));

  for (const slot of slots) {
    const values = { grams: slot.grams, colour: slot.colour, material: slot.material };
    const id = bySlot.get(slot.slot);
    if (id === undefined) {
      await trx
        .insertInto('line_slots')
        .values({ id: randomUUID(), line_id: lineId, slot: slot.slot, ...values })
        .execute();
    } else {
      await trx.updateTable('line_slots').set(values).where('id', '=', id).execute();
      bySlot.delete(slot.slot);
    }
  }

  const gone = [...bySlot.values()];
  if (gone.length > 0) await trx.deleteFrom('line_slots').where('id', 'in', gone).execute();
}
