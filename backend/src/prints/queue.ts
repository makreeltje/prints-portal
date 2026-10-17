import type { Kysely } from 'kysely';
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
      'o.request_state',
    ])
    .where('r.status', '=', 'indexed')
    .where('o.request_state', 'in', ['undecided', 'inProgress'])
    .execute();
  if (records.length === 0) return [];

  const ids = records.map((row) => row.id);
  const money = await ordersWithMoney(db, ids);
  const withFiles = new Set(
    (
      await db
        .selectFrom('print_assets')
        .select('print_record_id')
        .where('print_record_id', 'in', ids)
        .execute()
    ).map((row) => row.print_record_id),
  );

  const asked = Date.parse(now);
  const rows: QueueRow[] = records.flatMap((row) => {
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
