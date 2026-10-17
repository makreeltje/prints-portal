import type { Kysely, Transaction } from 'kysely';
import type { Database, PrintOrderTable } from '../db/schema.js';
import { readSettings, type Settings } from './settings.js';
import { parseSnapshot } from './spools.js';
import {
  leastSettled,
  orderMoney,
  type OrderMoney,
  type OrderStatus,
  parseRequestState,
} from './state.js';

type Db = Kysely<Database> | Transaction<Database>;

export interface OrderWithMoney {
  order: PrintOrderTable;
  money: OrderMoney;
  noBilling: boolean;
}

/** Payment state of every order of the given prints, in order number order. */
export async function ordersWithMoney(
  db: Db,
  recordIds: readonly string[],
  settings?: Settings,
): Promise<Map<string, OrderWithMoney[]>> {
  const result = new Map<string, OrderWithMoney[]>();
  if (recordIds.length === 0) return result;
  const markup = (settings ?? (await readSettings(db))).pricing.defaultMarkupPercent;
  const orders = await db
    .selectFrom('print_orders as o')
    .innerJoin('print_records as r', 'r.id', 'o.print_record_id')
    .leftJoin('customers as c', 'c.customer_folder', 'r.customer_folder')
    .selectAll('o')
    .select('c.no_billing')
    .where('o.print_record_id', 'in', recordIds)
    .orderBy('o.number')
    .execute();
  const paid = await paidPerOrder(
    db,
    orders.map((order) => order.id),
  );
  for (const row of orders) {
    const { no_billing: noBillingFlag, ...order } = row;
    const noBilling = noBillingFlag === 1;
    const money = orderMoney({
      noBilling,
      salePriceCents: order.sale_price_cents,
      totalCostCents: order.total_cost_cents,
      defaultMarkupPercent: markup,
      paidCents: paid.get(order.id) ?? 0,
      writtenOffCents: order.written_off_cents,
      requestState: parseRequestState(order.request_state),
    });
    const list = result.get(order.print_record_id) ?? [];
    list.push({ order, money, noBilling });
    result.set(order.print_record_id, list);
  }
  return result;
}

export async function paidPerOrder(
  db: Db,
  orderIds: readonly string[],
): Promise<Map<string, number>> {
  const result = new Map<string, number>();
  if (orderIds.length === 0) return result;
  const rows = await db
    .selectFrom('payments')
    .select(['order_id', (eb) => eb.fn.sum<number | string>('amount_cents').as('total')])
    .where('order_id', 'in', orderIds)
    .where('undone_at', 'is', null)
    .groupBy('order_id')
    .execute();
  for (const row of rows) result.set(row.order_id, Number(row.total));
  return result;
}

/** What the dashboard shows of a print's money: the orders summed, the least settled status. */
export interface PrintMoneyDto {
  status: OrderStatus;
  /** Euros; null when no order has a price. */
  price: number | null;
  /** The price is (partly) a markup suggestion, not a saved sale price. */
  priceSuggested: boolean;
  paid: number;
  writtenOff: number;
  remaining: number | null;
  orderCount: number;
  /** Total internal cost in euros; null for Users and when unknown. */
  cost: number | null;
}

export function summariseMoney(
  orders: readonly OrderWithMoney[],
  options: { withCost: boolean },
): PrintMoneyDto | null {
  const status = leastSettled(orders.map((o) => o.money.status));
  if (status === null) return null;
  const priced = orders.filter((o) => o.money.priceCents !== null);
  const sum = (pick: (o: OrderWithMoney) => number) =>
    orders.reduce((total, o) => total + pick(o), 0) / 100;
  const costs = orders.map((o) => o.order.total_cost_cents);
  return {
    status,
    price: priced.length === 0 ? null : sum((o) => o.money.priceCents ?? 0),
    priceSuggested: orders.some((o) => o.money.priceSuggested),
    paid: sum((o) => o.money.paidCents),
    writtenOff: sum((o) => o.money.writtenOffCents),
    remaining: priced.length === 0 ? null : sum((o) => o.money.remainingCents ?? 0),
    orderCount: orders.length,
    cost:
      options.withCost && costs.some((c) => c !== null)
        ? costs.reduce<number>((total, c) => total + (c ?? 0), 0) / 100
        : null,
  };
}

/**
 * Tint rule (SpoolSwatch): the colour of the print's first assigned spool
 * (whole print, else the first file or slot with one); null when none, so the
 * slicer colour applies.
 */
export async function spoolTints(
  db: Db,
  records: readonly { id: string; spool_snapshot: string | null }[],
): Promise<Map<string, string>> {
  const result = new Map<string, string>();
  const rest: string[] = [];
  for (const record of records) {
    const colour = parseSnapshot(record.spool_snapshot)?.colour ?? null;
    if (colour !== null) result.set(record.id, colour);
    else rest.push(record.id);
  }
  if (rest.length === 0) return result;
  const overrides = await db
    .selectFrom('line_overrides')
    .select(['print_record_id', 'spool_snapshot'])
    .where('print_record_id', 'in', rest)
    .where('spool_snapshot', 'is not', null)
    .orderBy('plate_index')
    .orderBy('slot')
    .execute();
  for (const row of overrides) {
    if (result.has(row.print_record_id)) continue;
    const colour = parseSnapshot(row.spool_snapshot)?.colour ?? null;
    if (colour !== null) result.set(row.print_record_id, colour);
  }
  return result;
}
