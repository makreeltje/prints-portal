import { sql, type ExpressionBuilder, type SelectQueryBuilder } from 'kysely';
import { scopeAllows, type CustomerScope } from '../auth/access.js';
import { isTagPaletteKey, tagInkColor } from '../core/tags.js';
import type { AppDatabase } from '../db/connection.js';
import type { Database } from '../db/schema.js';
import type {
  AssetDto,
  CustomerSummary,
  LineDto,
  PrintDetail,
  PrintSummary,
  TagDto,
} from './types.js';

export const DEFAULT_PAGE_SIZE = 24;
export const MAX_PAGE_SIZE = 100;

export interface PrintFilter {
  customer?: string;
  /** Tag ids; a print must carry all of them (AND). */
  tagIds?: readonly string[];
  /** Free text over name, customer, project and tag names. */
  search?: string;
  /** Include archived prints ("Gearchiveerd tonen"). */
  includeArchived?: boolean;
  /** Include deleted prints ("Toon verwijderde", Admins only; the route checks the role). */
  includeDeleted?: boolean;
  offset?: number;
  limit?: number;
}

type RecordQuery = SelectQueryBuilder<Database, 'print_records', object>;

/** Visibility rules shared by list, count and customers. */
function applyScope(query: RecordQuery, scope: CustomerScope, filter: PrintFilter): RecordQuery {
  let q = query;
  const statuses: ('indexed' | 'archived' | 'deleted')[] = ['indexed'];
  if (filter.includeArchived === true) statuses.push('archived');
  if (filter.includeDeleted === true) statuses.push('deleted');
  q = q.where('print_records.status', 'in', statuses);
  if (scope.kind === 'some') {
    const folders = [...scope.customerFolders];
    // An empty IN list is invalid SQL; no grants means no prints.
    q =
      folders.length === 0
        ? q.where(sql<boolean>`1 = 0`)
        : q.where('print_records.customer_folder', 'in', folders);
  }
  return q;
}

function applyFilter(query: RecordQuery, filter: PrintFilter): RecordQuery {
  let q = query;
  if (filter.customer !== undefined)
    q = q.where('print_records.customer_folder', '=', filter.customer);
  for (const tagId of filter.tagIds ?? []) {
    q = q.where((eb) =>
      eb.exists(
        eb
          .selectFrom('print_tags')
          .select('print_tags.tag_id')
          .whereRef('print_tags.print_record_id', '=', 'print_records.id')
          .where('print_tags.tag_id', '=', tagId),
      ),
    );
  }
  const search = filter.search?.trim().toLowerCase();
  if (search !== undefined && search !== '') {
    // LIKE with escaped wildcards, lower-cased on both sides so every engine matches alike.
    // "!" escapes: a backslash would itself need escaping in MySQL string literals.
    const pattern = `%${search.replace(/[!%_]/g, (c) => `!${c}`)}%`;
    const like = (eb: ExpressionBuilder<Database, 'print_records'>, column: string) =>
      sql<boolean>`lower(${eb.ref(column as 'print_records.display_name')}) like ${pattern} escape '!'`;
    q = q.where((eb) =>
      eb.or([
        like(eb, 'print_records.display_name'),
        like(eb, 'print_records.customer_folder'),
        like(eb, 'print_records.project_folder'),
        like(eb, 'print_records.part_name'),
        eb.exists(
          eb
            .selectFrom('print_tags')
            .innerJoin('tags', 'tags.id', 'print_tags.tag_id')
            .select('tags.id')
            .whereRef('print_tags.print_record_id', '=', 'print_records.id')
            .where(sql<boolean>`tags.name_key like ${pattern} escape '!'`),
        ),
      ]),
    );
  }
  return q;
}

/** Slicer colour of the first used slot of the newest counted line (tint rule). */
function colourExpression(eb: ExpressionBuilder<Database, 'print_records'>) {
  return eb
    .selectFrom('line_slots as s')
    .innerJoin('print_lines as l', 'l.id', 's.line_id')
    .innerJoin('print_assets as a', 'a.id', 'l.asset_id')
    .select('s.colour')
    .whereRef('a.print_record_id', '=', 'print_records.id')
    .where('s.colour', 'is not', null)
    .where((inner) =>
      inner.or([
        inner('l.user_excluded', '=', 0),
        inner.and([inner('l.user_excluded', 'is', null), inner('l.auto_excluded', '=', 0)]),
      ]),
    )
    .orderBy('a.last_write_utc', 'desc')
    .orderBy('l.plate_index')
    .orderBy('s.slot')
    .limit(1)
    .as('colour');
}

/** Records with a file that can give a preview image (embedded image, 3MF image or STL). */
function hasThumbnailExpression(eb: ExpressionBuilder<Database, 'print_records'>) {
  return eb
    .exists(
      eb
        .selectFrom('print_assets')
        .select('print_assets.id')
        .whereRef('print_assets.print_record_id', '=', 'print_records.id')
        .where((inner) =>
          inner.or([
            inner('print_assets.has_thumbnail', '=', 1),
            inner('print_assets.type', '=', 'stl'),
          ]),
        ),
    )
    .as('has_thumbnail');
}

export async function listPrints(
  db: AppDatabase,
  scope: CustomerScope,
  filter: PrintFilter,
): Promise<{ items: PrintSummary[]; total: number }> {
  const base = applyFilter(applyScope(db.selectFrom('print_records'), scope, filter), filter);
  const limit = Math.min(Math.max(filter.limit ?? DEFAULT_PAGE_SIZE, 1), MAX_PAGE_SIZE);
  const offset = Math.max(filter.offset ?? 0, 0);

  const [countRow, rows] = await Promise.all([
    base.select((eb) => eb.fn.countAll<number | string>().as('count')).executeTakeFirstOrThrow(),
    base
      .selectAll('print_records')
      .select((eb) => [hasThumbnailExpression(eb), colourExpression(eb)])
      // Newest print first; prints without a print date by discovery date.
      .orderBy(sql`coalesce(print_records.print_date, print_records.discovered_at)`, 'desc')
      .orderBy('print_records.id')
      .limit(limit)
      .offset(offset)
      .execute(),
  ]);
  const tags = await tagsFor(
    db,
    rows.map((row) => row.id),
  );
  return {
    total: Number(countRow.count),
    items: rows.map((row) =>
      toSummary(row, tags.get(row.id) ?? [], toBool(row.has_thumbnail), row.colour),
    ),
  };
}

/** Customers with prints the caller can see, for the dashboard strip. */
export async function listCustomers(
  db: AppDatabase,
  scope: CustomerScope,
  options: { includeArchived?: boolean; includeDeleted?: boolean },
): Promise<CustomerSummary[]> {
  const rows = await applyScope(db.selectFrom('print_records'), scope, options)
    .select([
      'print_records.customer_folder',
      (eb) => eb.fn.countAll<number | string>().as('count'),
      (eb) =>
        eb.fn
          .sum<number | string>(
            eb.case().when('print_records.status', '!=', 'deleted').then(1).else(0).end(),
          )
          .as('alive'),
    ])
    .groupBy('print_records.customer_folder')
    .execute();
  return rows
    .map((row) => ({
      folder: row.customer_folder,
      printCount: Number(row.count),
      deleted: Number(row.alive) === 0,
    }))
    .sort((a, b) => a.folder.localeCompare(b.folder, 'nl'));
}

type RecordRow = Database['print_records'];

/** A print by id with its files; null when it does not exist (deleted ones only with `includeDeleted`). */
export async function getPrintDetail(
  db: AppDatabase,
  id: string,
  options: { includeDeleted: boolean; withAssets: boolean },
): Promise<PrintDetail | null> {
  const row = await db
    .selectFrom('print_records')
    .selectAll('print_records')
    .select((eb) => [hasThumbnailExpression(eb), colourExpression(eb)])
    .where('print_records.id', '=', id)
    .executeTakeFirst();
  if (row === undefined) return null;
  if (row.status === 'deleted' && !options.includeDeleted) return null;

  const [tags, assets] = await Promise.all([
    tagsFor(db, [row.id]),
    db
      .selectFrom('print_assets')
      .selectAll()
      .where('print_record_id', '=', row.id)
      .orderBy('sub_path')
      .orderBy('file_name')
      .execute(),
  ]);
  const hasModel = assets.some((asset) => asset.type === 'stl' || asset.type === '3mf');
  const detail: PrintDetail = {
    ...toSummary(row, tags.get(row.id) ?? [], toBool(row.has_thumbnail), row.colour),
    printerModel: row.printer_model,
    archivedAt: row.archived_at,
    hasModel: hasModel && row.status !== 'archived',
    assets: null,
  };
  if (!options.withAssets) return detail;

  const assetIds = assets.map((asset) => asset.id);
  const lines =
    assetIds.length === 0
      ? []
      : await db
          .selectFrom('print_lines')
          .selectAll()
          .where('asset_id', 'in', assetIds)
          .orderBy('plate_index')
          .execute();
  const lineIds = lines.map((line) => line.id);
  const slots =
    lineIds.length === 0
      ? []
      : await db
          .selectFrom('line_slots')
          .selectAll()
          .where('line_id', 'in', lineIds)
          .orderBy('slot')
          .execute();

  const fileByAsset = new Map(assets.map((asset) => [asset.id, asset.file_name]));
  const byFingerprint = new Map<string, string[]>();
  for (const line of lines) {
    if (line.duplicate_fingerprint === null) continue;
    const list = byFingerprint.get(line.duplicate_fingerprint) ?? [];
    list.push(line.asset_id);
    byFingerprint.set(line.duplicate_fingerprint, list);
  }

  detail.assets = assets.map((asset): AssetDto => ({
    id: asset.id,
    fileName: asset.file_name,
    subPath: asset.sub_path,
    type: asset.type,
    sizeBytes: asset.size_bytes,
    lastWriteUtc: asset.last_write_utc,
    recordedAt: asset.recorded_at,
    parseError: asset.parse_error,
    lines: lines
      .filter((line) => line.asset_id === asset.id)
      .map((line): LineDto => {
        const other =
          line.possible_duplicate === 1 && line.duplicate_fingerprint !== null
            ? (byFingerprint.get(line.duplicate_fingerprint) ?? []).find((a) => a !== asset.id)
            : undefined;
        const excluded = (line.user_excluded ?? line.auto_excluded) === 1;
        return {
          id: line.id,
          plateIndex: line.plate_index,
          grams: line.total_grams,
          printSeconds: line.print_seconds,
          material: line.material,
          printerModel: line.printer_model,
          excluded,
          autoExclusionReason:
            line.user_excluded === null && line.auto_excluded === 1
              ? line.auto_exclusion_reason
              : null,
          timesPrinted: line.times_printed,
          possibleDuplicate: line.possible_duplicate === 1,
          duplicateOf: other === undefined ? null : (fileByAsset.get(other) ?? null),
          slots: slots
            .filter((slot) => slot.line_id === line.id)
            .map((slot) => ({
              slot: slot.slot,
              grams: slot.grams,
              colour: slot.colour,
              material: slot.material,
            })),
        };
      }),
  }));
  return detail;
}

/** Customer folder of a print, for access checks; null when unknown. */
export async function customerOfPrint(
  db: AppDatabase,
  id: string,
): Promise<{ customerFolder: string; status: RecordRow['status'] } | null> {
  const row = await db
    .selectFrom('print_records')
    .select(['customer_folder', 'status'])
    .where('id', '=', id)
    .executeTakeFirst();
  return row === undefined ? null : { customerFolder: row.customer_folder, status: row.status };
}

export function canSeeCustomer(scope: CustomerScope, folder: string): boolean {
  return scopeAllows(scope, folder);
}

export async function tagsFor(
  db: AppDatabase,
  recordIds: readonly string[],
): Promise<Map<string, TagDto[]>> {
  const result = new Map<string, TagDto[]>();
  if (recordIds.length === 0) return result;
  const rows = await db
    .selectFrom('print_tags')
    .innerJoin('tags', 'tags.id', 'print_tags.tag_id')
    .select(['print_tags.print_record_id', 'tags.id', 'tags.name', 'tags.colour'])
    .where('print_tags.print_record_id', 'in', [...recordIds])
    .orderBy('tags.name_key')
    .execute();
  for (const row of rows) {
    const list = result.get(row.print_record_id) ?? [];
    list.push(toTagDto(row));
    result.set(row.print_record_id, list);
  }
  return result;
}

export function toTagDto(row: { id: string; name: string; colour: string | null }): TagDto {
  return {
    id: row.id,
    name: row.name,
    colour: row.colour,
    // Palette keys get their ink from the design system's `data-c` rules.
    ink: row.colour === null || isTagPaletteKey(row.colour) ? null : tagInkColor(row.colour),
  };
}

function toBool(value: unknown): boolean {
  // SQLite and MySQL return 0/1, PostgreSQL true/false.
  return value === true || value === 1 || value === '1';
}

function toSummary(
  row: {
    id: string;
    display_name: string;
    customer_folder: string;
    project_folder: string | null;
    material: string | null;
    total_print_seconds: number | null;
    total_grams: number | null;
    print_date: string | null;
    discovered_at: string;
    status: RecordRow['status'];
    deleted_at: string | null;
    updated_at: string;
  },
  tags: TagDto[],
  hasThumbnail: boolean,
  colour: string | null,
): PrintSummary {
  return {
    id: row.id,
    name: row.display_name,
    customerFolder: row.customer_folder,
    projectFolder: row.project_folder,
    material: row.material,
    printSeconds: row.total_print_seconds,
    grams: row.total_grams,
    printDate: row.print_date,
    discoveredAt: row.discovered_at,
    status: row.status,
    deletedAt: row.deleted_at,
    tags,
    hasThumbnail,
    colour,
    version: row.updated_at,
  };
}
