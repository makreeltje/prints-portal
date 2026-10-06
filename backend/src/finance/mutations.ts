import type { Kysely, Transaction } from 'kysely';
import type { Database, PrintOrderTable } from '../db/schema.js';
import { recalculatePrint } from './costs.js';
import { ordersWithMoney } from './read.js';
import type { SpoolSnapshot } from './spools.js';

type Db = Kysely<Database> | Transaction<Database>;

export type FinanceErrorCode =
  | 'not_found'
  | 'not_billed'
  | 'price_below_paid'
  | 'no_price'
  | 'overpayment'
  | 'nothing_open'
  | 'no_payment'
  | 'not_written_off'
  | 'not_in_order'
  | 'archived'
  | 'locked'
  | 'no_lines'
  | 'changed'
  | 'not_an_invoice'
  | 'unknown_line'
  | 'already_credited'
  | 'first_order'
  | 'has_payment'
  | 'written_off'
  | 'paid'
  | 'no_cost';

/** A business rule refused the change; `code` is the API's error code. */
export class FinanceError extends Error {
  override name = 'FinanceError';
  /** Extra facts for a per-print result ("Nabestelling 2 is al betaald.", "Staat op factuur …"). */
  constructor(
    readonly code: FinanceErrorCode,
    readonly detail: { orderNumber?: number; invoiceNumber?: string } = {},
  ) {
    super(code);
  }
}

async function orderById(db: Db, orderId: string): Promise<PrintOrderTable> {
  const order = await db
    .selectFrom('print_orders')
    .selectAll()
    .where('id', '=', orderId)
    .executeTakeFirst();
  if (order === undefined) throw new FinanceError('not_found');
  return order;
}

/** An order on a final invoice keeps its price, grams and items (correct it with a credit note). */
function assertUnlocked(order: PrintOrderTable): void {
  if (order.invoice_id !== null) throw new FinanceError('locked');
}

async function moneyOf(db: Db, order: PrintOrderTable) {
  const all = await ordersWithMoney(db, [order.print_record_id]);
  const found = all.get(order.print_record_id)?.find((o) => o.order.id === order.id);
  if (found === undefined) throw new FinanceError('not_found');
  return found;
}

/** Verkoopprijs; null removes it (the markup suggestion applies again). */
export async function setSalePrice(
  db: Kysely<Database>,
  orderId: string,
  cents: number | null,
  userId: string,
  now: string,
): Promise<PrintOrderTable> {
  return db.transaction().execute(async (trx) => {
    const order = await orderById(trx, orderId);
    assertUnlocked(order);
    const { money, noBilling } = await moneyOf(trx, order);
    if (noBilling) throw new FinanceError('not_billed');
    if (cents !== null && cents < money.paidCents + money.writtenOffCents) {
      throw new FinanceError('price_below_paid');
    }
    await trx
      .updateTable('print_orders')
      .set({
        sale_price_cents: cents,
        sale_price_set_at: cents === null ? null : now,
        sale_price_set_by: cents === null ? null : userId,
        updated_at: now,
      })
      .where('id', '=', orderId)
      .execute();
    return order;
  });
}

/** "Markeer als betaald": at most the open remainder (owner decision). */
export async function addPayment(
  db: Kysely<Database>,
  orderId: string,
  cents: number,
  userId: string,
  now: string,
): Promise<PrintOrderTable> {
  return db.transaction().execute(async (trx) => {
    const order = await orderById(trx, orderId);
    const { money, noBilling } = await moneyOf(trx, order);
    if (noBilling) throw new FinanceError('not_billed');
    if (money.remainingCents === null) throw new FinanceError('no_price');
    if (money.remainingCents === 0) throw new FinanceError('nothing_open');
    if (cents > money.remainingCents) throw new FinanceError('overpayment');
    // Payments keep a strict order (undo takes the last one), even within one millisecond.
    const previous = await trx
      .selectFrom('payments')
      .select((eb) => eb.fn.max('paid_at').as('at'))
      .where('order_id', '=', orderId)
      .executeTakeFirst();
    const latest = previous?.at ?? null;
    const paidAt =
      latest !== null && latest >= now
        ? new Date(new Date(latest).getTime() + 1).toISOString()
        : now;
    await trx
      .insertInto('payments')
      .values({
        id: crypto.randomUUID(),
        order_id: orderId,
        amount_cents: cents,
        paid_at: paidAt,
        recorded_by: userId,
        undone_at: null,
        undone_by: null,
      })
      .execute();
    await trx
      .updateTable('print_orders')
      .set({ updated_at: now })
      .where('id', '=', orderId)
      .execute();
    return order;
  });
}

/** "Betaling ongedaan maken" (Admin): the most recent active payment of the order. */
export async function undoLastPayment(
  db: Kysely<Database>,
  orderId: string,
  userId: string,
  now: string,
): Promise<PrintOrderTable> {
  return db.transaction().execute(async (trx) => {
    const order = await orderById(trx, orderId);
    const last = await trx
      .selectFrom('payments')
      .select('id')
      .where('order_id', '=', orderId)
      .where('undone_at', 'is', null)
      .orderBy('paid_at', 'desc')
      .orderBy('id', 'desc')
      .executeTakeFirst();
    if (last === undefined) throw new FinanceError('no_payment');
    await trx
      .updateTable('payments')
      .set({ undone_at: now, undone_by: userId })
      .where('id', '=', last.id)
      .execute();
    await trx
      .updateTable('print_orders')
      .set({ updated_at: now })
      .where('id', '=', orderId)
      .execute();
    return order;
  });
}

/** "Afschrijven": the open remainder only, never what was paid. */
export async function writeOff(
  db: Kysely<Database>,
  orderId: string,
  reason: string | null,
  userId: string,
  now: string,
): Promise<PrintOrderTable> {
  return db.transaction().execute(async (trx) => {
    const order = await orderById(trx, orderId);
    const { money, noBilling } = await moneyOf(trx, order);
    if (noBilling) throw new FinanceError('not_billed');
    if (money.remainingCents === null) throw new FinanceError('no_price');
    if (money.remainingCents === 0) throw new FinanceError('nothing_open');
    await trx
      .updateTable('print_orders')
      .set({
        written_off_cents: money.writtenOffCents + money.remainingCents,
        written_off_at: now,
        written_off_by: userId,
        written_off_reason: reason,
        updated_at: now,
      })
      .where('id', '=', orderId)
      .execute();
    return order;
  });
}

/** "Afschrijving ongedaan maken" (Admin). */
export async function undoWriteOff(
  db: Kysely<Database>,
  orderId: string,
  now: string,
): Promise<PrintOrderTable> {
  const order = await orderById(db, orderId);
  if (order.written_off_cents === null) throw new FinanceError('not_written_off');
  await db
    .updateTable('print_orders')
    .set({
      written_off_cents: null,
      written_off_at: null,
      written_off_by: null,
      written_off_reason: null,
      updated_at: now,
    })
    .where('id', '=', orderId)
    .execute();
  return order;
}

export interface CostOverrides {
  pricePerKg: number | null;
  grams: number | null;
  printSeconds: number | null;
}

/** "Kosten aanpassen" for an order; all nulls is "Terug naar berekend". */
export async function setOrderOverrides(
  db: Kysely<Database>,
  orderId: string,
  overrides: CostOverrides,
  now: string,
): Promise<PrintOrderTable> {
  return db.transaction().execute(async (trx) => {
    const order = await orderById(trx, orderId);
    assertUnlocked(order);
    await trx
      .updateTable('print_orders')
      .set({
        manual_price_per_kg: overrides.pricePerKg,
        manual_grams: overrides.grams,
        manual_print_seconds: overrides.printSeconds,
        updated_at: now,
      })
      .where('id', '=', orderId)
      .execute();
    await recalculatePrint(trx, order.print_record_id, now);
    return order;
  });
}

/** "Spoel voor de hele print". */
export async function setPrintSpool(
  db: Kysely<Database>,
  recordId: string,
  spool: SpoolSnapshot | null,
  now: string,
): Promise<void> {
  await db.transaction().execute(async (trx) => {
    await trx
      .updateTable('print_records')
      .set({
        spool_id: spool?.id ?? null,
        spool_snapshot: spool === null ? null : JSON.stringify(spool),
        updated_at: now,
      })
      .where('id', '=', recordId)
      .execute();
    await recalculatePrint(trx, recordId, now);
  });
}

async function lineKey(db: Db, recordId: string, lineId: string) {
  const line = await db
    .selectFrom('print_lines as l')
    .innerJoin('print_assets as a', 'a.id', 'l.asset_id')
    .select(['a.path_hash', 'l.plate_index'])
    .where('l.id', '=', lineId)
    .where('a.print_record_id', '=', recordId)
    .executeTakeFirst();
  if (line === undefined) throw new FinanceError('not_found');
  return line;
}

/** Spool or manual price for a file or plate (slot 0) or one of its slots. */
export async function setLineOverride(
  db: Kysely<Database>,
  recordId: string,
  lineId: string,
  slot: number,
  change: { spool?: SpoolSnapshot | null; manualPricePerKg?: number | null },
  now: string,
): Promise<void> {
  await db.transaction().execute(async (trx) => {
    const key = await lineKey(trx, recordId, lineId);
    if (slot > 0) {
      const exists = await trx
        .selectFrom('line_slots')
        .select('id')
        .where('line_id', '=', lineId)
        .where('slot', '=', slot)
        .executeTakeFirst();
      if (exists === undefined) throw new FinanceError('not_found');
    }
    const current = await trx
      .selectFrom('line_overrides')
      .selectAll()
      .where('print_record_id', '=', recordId)
      .where('path_hash', '=', key.path_hash)
      .where('plate_index', '=', key.plate_index)
      .where('slot', '=', slot)
      .executeTakeFirst();
    const spool = change.spool === undefined ? undefined : change.spool;
    const next = {
      spool_id: spool === undefined ? (current?.spool_id ?? null) : (spool?.id ?? null),
      spool_snapshot:
        spool === undefined
          ? (current?.spool_snapshot ?? null)
          : spool === null
            ? null
            : JSON.stringify(spool),
      manual_price_per_kg:
        change.manualPricePerKg === undefined
          ? (current?.manual_price_per_kg ?? null)
          : change.manualPricePerKg,
      updated_at: now,
    };
    if (current !== undefined) {
      if (next.spool_snapshot === null && next.manual_price_per_kg === null) {
        await trx.deleteFrom('line_overrides').where('id', '=', current.id).execute();
      } else {
        await trx.updateTable('line_overrides').set(next).where('id', '=', current.id).execute();
      }
    } else if (next.spool_snapshot !== null || next.manual_price_per_kg !== null) {
      await trx
        .insertInto('line_overrides')
        .values({
          id: crypto.randomUUID(),
          print_record_id: recordId,
          path_hash: key.path_hash,
          plate_index: key.plate_index,
          slot,
          ...next,
        })
        .execute();
    }
    await trx
      .updateTable('print_records')
      .set({ updated_at: now })
      .where('id', '=', recordId)
      .execute();
    await recalculatePrint(trx, recordId, now);
  });
}

/**
 * "Aantal keer geprint" of a file or plate in one order (default: the first
 * order that holds it). The caller recomputes totals and costs.
 */
export async function setTimesPrinted(
  db: Kysely<Database>,
  recordId: string,
  lineId: string,
  orderId: string | null,
  times: number,
  now: string,
): Promise<void> {
  await db.transaction().execute(async (trx) => {
    const key = await lineKey(trx, recordId, lineId);
    let query = trx
      .selectFrom('order_items as i')
      .innerJoin('print_orders as o', 'o.id', 'i.order_id')
      .select(['i.order_id', 'o.invoice_id'])
      .where('o.print_record_id', '=', recordId)
      .where('i.path_hash', '=', key.path_hash)
      .where('i.plate_index', '=', key.plate_index)
      .orderBy('o.number');
    if (orderId !== null) query = query.where('i.order_id', '=', orderId);
    const item = await query.executeTakeFirst();
    if (item === undefined) throw new FinanceError('not_in_order');
    if (item.invoice_id !== null) throw new FinanceError('locked');
    await trx
      .updateTable('order_items')
      .set({ times_printed: times })
      .where('order_id', '=', item.order_id)
      .where('path_hash', '=', key.path_hash)
      .where('plate_index', '=', key.plate_index)
      .execute();
    await trx
      .updateTable('print_records')
      .set({ updated_at: now })
      .where('id', '=', recordId)
      .execute();
  });
}

/** Klanten flagged "Niet factureren". */
export async function setNoBilling(
  db: Kysely<Database>,
  folder: string,
  noBilling: boolean,
  now: string,
): Promise<void> {
  const exists = await db
    .selectFrom('customers')
    .select('customer_folder')
    .where('customer_folder', '=', folder)
    .executeTakeFirst();
  if (exists === undefined) {
    await db
      .insertInto('customers')
      .values({ customer_folder: folder, no_billing: noBilling ? 1 : 0, updated_at: now })
      .execute();
  } else {
    await db
      .updateTable('customers')
      .set({ no_billing: noBilling ? 1 : 0, updated_at: now })
      .where('customer_folder', '=', folder)
      .execute();
  }
}

/**
 * "Nabestelling verwijderen" (Admin, Editor): only a later order without
 * payment or write-off that is not on an invoice; Bestelling 1 never. Its
 * files go back to "Niet in een bestelling". Undone payments go with it.
 */
export async function deleteRepeatOrder(
  db: Kysely<Database>,
  orderId: string,
  now: string,
): Promise<PrintOrderTable> {
  return db.transaction().execute(async (trx) => {
    const order = await orderById(trx, orderId);
    if (order.number === 1) throw new FinanceError('first_order');
    assertUnlocked(order);
    if (order.written_off_cents !== null) throw new FinanceError('written_off');
    const active = await trx
      .selectFrom('payments')
      .select('id')
      .where('order_id', '=', orderId)
      .where('undone_at', 'is', null)
      .executeTakeFirst();
    if (active !== undefined) throw new FinanceError('has_payment');
    await trx.deleteFrom('payments').where('order_id', '=', orderId).execute();
    await trx.deleteFrom('order_items').where('order_id', '=', orderId).execute();
    await trx.deleteFrom('print_orders').where('id', '=', orderId).execute();
    await trx
      .updateTable('print_records')
      .set({ updated_at: now })
      .where('id', '=', order.print_record_id)
      .execute();
    return order;
  });
}
