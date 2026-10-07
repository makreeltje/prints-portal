import type { Kysely } from 'kysely';
import { daysBetween, localDate } from '../core/time.js';
import type { Database } from '../db/schema.js';
import { billableOrders, type BillableOrder } from './billing.js';
import { addPayment } from './mutations.js';

/** One order with money still open (Openstaand). Amounts in euros. */
export interface OutstandingLine {
  orderId: string;
  orderNumber: number;
  printId: string;
  printName: string;
  project: string | null;
  /** Archived prints stay in Openstaand with the Gearchiveerd badge (plan). */
  archived: boolean;
  status: 'open' | 'partial';
  price: number;
  paid: number;
  remaining: number;
  /** Local date the age counts from: invoice date, else sale price date, else order date. */
  since: string;
  daysOpen: number;
  invoiceNumber: string | null;
}

export interface OutstandingGroup {
  customer: string;
  total: number;
  count: number;
  oldestDays: number;
  lines: OutstandingLine[];
}

export interface Outstanding {
  total: number;
  customers: number;
  oldest: { printName: string; orderNumber: number; days: number } | null;
  groups: OutstandingGroup[];
}

function since(item: BillableOrder): string {
  if (item.invoice !== null) return item.invoice.issuedOn;
  return localDate(item.order.sale_price_set_at ?? item.date);
}

/**
 * Everything still owed, per klant, oldest first. Only the remainder of a
 * partially paid order counts; written-off orders, orders without a price,
 * niet-factureren klanten and deleted prints never appear.
 */
export async function outstanding(
  db: Kysely<Database>,
  now: Date,
  filter: { customer?: string; customers?: ReadonlySet<string> } = {},
): Promise<Outstanding> {
  const today = localDate(now);
  const groups = new Map<string, OutstandingGroup>();
  for (const item of await billableOrders(db, filter)) {
    const { money } = item;
    if (filter.customers !== undefined && !filter.customers.has(item.print.customer)) continue;
    if (item.noBilling || (money.status !== 'open' && money.status !== 'partial')) continue;
    const remaining = money.remainingCents ?? 0;
    if (remaining <= 0 || money.priceCents === null) continue;
    const from = since(item);
    const line: OutstandingLine = {
      orderId: item.order.id,
      orderNumber: item.order.number,
      printId: item.print.id,
      printName: item.print.name,
      project: item.print.project,
      archived: item.print.archived,
      status: money.status,
      price: money.priceCents / 100,
      paid: money.paidCents / 100,
      remaining: remaining / 100,
      since: from,
      daysOpen: daysBetween(`${from}T12:00:00Z`, `${today}T12:00:00Z`),
      invoiceNumber: item.invoice?.number ?? null,
    };
    const group = groups.get(item.print.customer) ?? {
      customer: item.print.customer,
      total: 0,
      count: 0,
      oldestDays: 0,
      lines: [],
    };
    group.lines.push(line);
    groups.set(item.print.customer, group);
  }
  const list = [...groups.values()];
  for (const group of list) {
    group.lines.sort(
      (a, b) =>
        b.daysOpen - a.daysOpen ||
        a.printName.localeCompare(b.printName, 'nl') ||
        a.orderNumber - b.orderNumber,
    );
    group.count = group.lines.length;
    group.total = sumEuros(group.lines.map((line) => line.remaining));
    group.oldestDays = group.lines[0]?.daysOpen ?? 0;
  }
  list.sort((a, b) => b.oldestDays - a.oldestDays || a.customer.localeCompare(b.customer, 'nl'));
  const oldestLine = list[0]?.lines[0];
  return {
    total: sumEuros(list.map((group) => group.total)),
    customers: list.length,
    oldest:
      oldestLine === undefined
        ? null
        : {
            printName: oldestLine.printName,
            orderNumber: oldestLine.orderNumber,
            days: oldestLine.daysOpen,
          },
    groups: list,
  };
}

/** Sums euro amounts through cents, so 0.1 + 0.2 stays 0.3. */
function sumEuros(values: readonly number[]): number {
  return values.reduce((total, value) => total + Math.round(value * 100), 0) / 100;
}

/**
 * "Alles als betaald" for one klant: pays the remainder of every open
 * order. Returns the orders paid and the amount in cents.
 */
export async function markCustomerPaid(
  db: Kysely<Database>,
  customer: string,
  userId: string,
  now: Date,
): Promise<{ orders: number; cents: number; printIds: string[] }> {
  const open = (await outstanding(db, now, { customer })).groups[0]?.lines ?? [];
  const stamp = now.toISOString();
  let cents = 0;
  for (const line of open) {
    const amount = Math.round(line.remaining * 100);
    await addPayment(db, line.orderId, amount, userId, stamp);
    cents += amount;
  }
  return { orders: open.length, cents, printIds: [...new Set(open.map((line) => line.printId))] };
}
