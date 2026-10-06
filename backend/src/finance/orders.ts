import type { Kysely, Transaction } from 'kysely';
import type { Database, PrintOrderTable } from '../db/schema.js';

type Db = Kysely<Database> | Transaction<Database>;

/**
 * Orders inside a print (owner decision, M6). Order 1 always exists. Items
 * point at a file or plate by (path_hash, plate_index) and carry their own
 * times printed, so the same G-code can be reprinted in a later order.
 */
export const itemKey = (pathHash: string, plateIndex: number) => `${pathHash}#${plateIndex}`;

export async function ensureFirstOrder(db: Db, recordId: string, now: string): Promise<void> {
  const existing = await db
    .selectFrom('print_orders')
    .select('id')
    .where('print_record_id', '=', recordId)
    .executeTakeFirst();
  if (existing !== undefined) return;
  await db
    .insertInto('print_orders')
    .values(emptyOrder(crypto.randomUUID(), recordId, 1, now, null))
    .execute();
}

export function emptyOrder(
  id: string,
  recordId: string,
  number: number,
  now: string,
  userId: string | null,
): PrintOrderTable {
  return {
    id,
    print_record_id: recordId,
    number,
    created_at: now,
    created_by: userId,
    sale_price_cents: null,
    sale_price_set_at: null,
    sale_price_set_by: null,
    manual_price_per_kg: null,
    manual_grams: null,
    manual_print_seconds: null,
    written_off_cents: null,
    written_off_at: null,
    written_off_by: null,
    written_off_reason: null,
    material_cost_cents: null,
    electricity_cost_cents: null,
    total_cost_cents: null,
    cost_missing: null,
    updated_at: now,
  };
}

/** An order takes new files until it has a sale price, a payment or a write-off. */
export async function acceptsNewFiles(db: Db, order: PrintOrderTable): Promise<boolean> {
  if (order.sale_price_cents !== null || order.written_off_cents !== null) return false;
  const payment = await db
    .selectFrom('payments')
    .select('id')
    .where('order_id', '=', order.id)
    .where('undone_at', 'is', null)
    .executeTakeFirst();
  return payment === undefined;
}

/**
 * A file or plate the indexer has just found: it joins the newest order if
 * that order still takes new files; otherwise it waits for a Nabestelling.
 * A key that is already in an order (a folder that came back) stays put.
 */
export async function assignNewLine(
  db: Db,
  recordId: string,
  pathHash: string,
  plateIndex: number,
): Promise<void> {
  const orders = await db
    .selectFrom('print_orders')
    .selectAll()
    .where('print_record_id', '=', recordId)
    .orderBy('number', 'desc')
    .execute();
  if (orders.length === 0) return;
  const known = await db
    .selectFrom('order_items')
    .select('order_id')
    .where(
      'order_id',
      'in',
      orders.map((order) => order.id),
    )
    .where('path_hash', '=', pathHash)
    .where('plate_index', '=', plateIndex)
    .executeTakeFirst();
  if (known !== undefined) return;
  const newest = orders[0];
  if (newest === undefined || !(await acceptsNewFiles(db, newest))) return;
  await db
    .insertInto('order_items')
    .values({ order_id: newest.id, path_hash: pathHash, plate_index: plateIndex, times_printed: 1 })
    .execute();
}

/** Times printed per file or plate over all orders of a print (0 when in no order). */
export async function timesPerLine(db: Db, recordId: string): Promise<Map<string, number>> {
  const rows = await db
    .selectFrom('order_items as i')
    .innerJoin('print_orders as o', 'o.id', 'i.order_id')
    .select(['i.path_hash', 'i.plate_index', 'i.times_printed'])
    .where('o.print_record_id', '=', recordId)
    .execute();
  const result = new Map<string, number>();
  for (const row of rows) {
    const key = itemKey(row.path_hash, row.plate_index);
    result.set(key, (result.get(key) ?? 0) + row.times_printed);
  }
  return result;
}
