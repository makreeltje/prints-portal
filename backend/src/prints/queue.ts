import type { Kysely } from 'kysely';
import { sourceLabel } from '../core/url-file.js';
import type { Database } from '../db/schema.js';
import { ordersWithMoney } from '../finance/read.js';
import { parseRequestState, type RequestState } from '../finance/state.js';

/**
 * Wachtrij: work asked for and not finished (ScreenQueue 2.10).
 *
 * Two groups, `undecided` and `inProgress`, and only those: a refused job is
 * finished, so it stays on the dashboard with its badge rather than sitting in
 * a queue of outstanding work.
 *
 * Within a group the rows with no files sort first. That is the design
 * system's answer to "a job I still have to design" against "a job that is
 * sliced and waiting": the difference is drawn by whether files exist, which
 * the indexer observes, rather than by a fourth state the owner would have to
 * assert and keep up to date.
 */
export interface QueueRow {
  id: string;
  name: string;
  customerFolder: string;
  projectFolder: string | null;
  /** Null for a request that has never had a folder. */
  hasFiles: boolean;
  /** Whole days since it was asked for. */
  waitingDays: number;
  price: number | null;
  requestState: RequestState;
  /** The first bron, and how many more (PrintSource); only on a fileless row. */
  source: { url: string; label: string } | null;
  sourceCount: number;
  /** The note, on any row — the work outlives the files (PrintNote). */
  note: string | null;
}

export interface QueueGroup {
  state: RequestState;
  rows: QueueRow[];
  withoutFiles: number;
}

const DAY = 24 * 60 * 60 * 1000;

export async function queue(db: Kysely<Database>, now: string): Promise<QueueGroup[]> {
  const records = await db
    .selectFrom('print_records as r')
    .innerJoin('print_orders as o', 'o.print_record_id', 'r.id')
    .select([
      'r.id',
      'r.display_name',
      'r.customer_folder',
      'r.project_folder',
      'r.discovered_at',
      'r.origin',
      'r.source_url',
      'r.note',
      'o.request_state',
    ])
    .where('r.status', '=', 'indexed')
    .where('o.request_state', 'in', ['undecided', 'inProgress'])
    .execute();
  if (records.length === 0) return [];

  const ids = records.map((row) => row.id);
  const money = await ordersWithMoney(db, ids);
  const assets = await db
    .selectFrom('print_assets')
    .select(['print_record_id', 'file_name', 'url_target'])
    .where('print_record_id', 'in', ids)
    .execute();
  const withFiles = new Set(assets.map((row) => row.print_record_id));
  const found = new Map<string, string[]>();
  for (const asset of assets) {
    if (asset.url_target === null) continue;
    found.set(asset.print_record_id, [
      ...(found.get(asset.print_record_id) ?? []),
      asset.url_target,
    ]);
  }

  const asked = Date.parse(now);
  /*
    One row per print, however many of its orders carry a state. The join is
    on the orders, so a print with two of them in a queue state arrived here
    twice — the same job drawn twice, with the same key. A nabestelling starts
    without a state, so this needs the owner to set one on both; he can, from
    each order's own control on the print page.

    When two orders disagree, the least settled wins, which is the order the
    groups are already in: what is undecided comes before what is under way.
  */
  const PRECEDENCE: readonly RequestState[] = ['undecided', 'inProgress'];
  const oneEach = new Map<string, (typeof records)[number]>();
  for (const row of records) {
    const seen = oneEach.get(row.id);
    // Anything outside the two queue states loses: `indexOf` would rank a
    // declined or stateless order at -1 and win with it, and the print would
    // then be dropped by the filter below although one of its orders belongs
    // in the queue.
    const rank = (value: string | null) => {
      const at = PRECEDENCE.indexOf(parseRequestState(value) as RequestState);
      return at === -1 ? Number.POSITIVE_INFINITY : at;
    };
    if (seen === undefined || rank(row.request_state) < rank(seen.request_state)) {
      oneEach.set(row.id, row);
    }
  }

  const rows: QueueRow[] = [...oneEach.values()].flatMap((row) => {
    const state = parseRequestState(row.request_state);
    if (state === null || state === 'declined') return [];
    const orders = money.get(row.id) ?? [];
    const newest = orders.at(-1);
    return [
      {
        id: row.id,
        name: row.display_name,
        customerFolder: row.customer_folder,
        projectFolder: row.project_folder,
        hasFiles: withFiles.has(row.id),
        waitingDays: Math.max(0, Math.floor((asked - Date.parse(row.discovered_at)) / DAY)),
        price:
          newest?.money.priceCents === null || newest === undefined
            ? null
            : newest.money.priceCents / 100,
        requestState: state,
        /*
          Same order as the card: typed first, then the folder's, with an
          exact duplicate folded (PrintSource). Only a fileless row shows one
          — with files on disk the row's job is done and the bron is noise.
        */
        ...sourceOf(row.source_url, found.get(row.id) ?? [], withFiles.has(row.id)),
        note: row.note,
      },
    ];
  });

  // Fixed order: what is undecided comes before what is under way.
  return (['undecided', 'inProgress'] as const).flatMap((state) => {
    const mine = rows
      .filter((row) => row.requestState === state)
      // Fileless first, then oldest, then by name: the longest wait leads.
      .sort(
        (a, b) =>
          Number(a.hasFiles) - Number(b.hasFiles) ||
          b.waitingDays - a.waitingDays ||
          a.name.localeCompare(b.name, 'nl'),
      );
    if (mine.length === 0) return [];
    return [{ state, rows: mine, withoutFiles: mine.filter((row) => !row.hasFiles).length }];
  });
}

/** The one bron a row shows, and how many it stands for (PrintSource). */
function sourceOf(
  typed: string | null,
  found: string[],
  hasFiles: boolean,
): Pick<QueueRow, 'source' | 'sourceCount'> {
  if (hasFiles) return { source: null, sourceCount: 0 };
  const all = typed === null || found.includes(typed) ? found : [typed, ...found];
  const first = all[0];
  if (first === undefined) return { source: null, sourceCount: 0 };
  return { source: { url: first, label: sourceLabel(first) }, sourceCount: all.length };
}
