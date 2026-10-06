import type { Kysely, Transaction } from 'kysely';
import type { Database, PrintOrderTable } from '../db/schema.js';
import { ordersWithMoney } from './read.js';
import type { Settings } from './settings.js';
import type { OrderMoney } from './state.js';

type Db = Kysely<Database> | Transaction<Database>;

/** One order of a visible print with its money, date and invoice: what Openstaand and invoices start from. */
export interface BillableOrder {
  order: PrintOrderTable;
  money: OrderMoney;
  noBilling: boolean;
  print: { id: string; name: string; project: string | null; customer: string };
  /**
   * The order's date (owner decision, M7): the modification time of the
   * newest counted G-code in the order, else the order's creation time.
   */
  date: string;
  invoice: { id: string; number: string; issuedOn: string } | null;
}

/** Every order of the visible (not deleted) prints, optionally of one klant. */
export async function billableOrders(
  db: Db,
  filter: { customer?: string },
  settings?: Settings,
): Promise<BillableOrder[]> {
  let query = db
    .selectFrom('print_records')
    .select(['id', 'display_name', 'project_folder', 'customer_folder'])
    .where('status', '!=', 'deleted');
  if (filter.customer !== undefined) query = query.where('customer_folder', '=', filter.customer);
  const records = await query.execute();
  if (records.length === 0) return [];
  const byRecord = await ordersWithMoney(
    db,
    records.map((record) => record.id),
    settings,
  );
  const orderIds = [...byRecord.values()].flatMap((list) => list.map((o) => o.order.id));
  const dates = await orderDates(db, orderIds);
  const invoiceIds = [...byRecord.values()].flatMap((list) =>
    list.flatMap((o) => (o.order.invoice_id === null ? [] : [o.order.invoice_id])),
  );
  const invoices = new Map(
    invoiceIds.length === 0
      ? []
      : (
          await db
            .selectFrom('invoices')
            .select(['id', 'number', 'issued_on'])
            .where('id', 'in', [...new Set(invoiceIds)])
            .execute()
        ).map((row) => [row.id, { id: row.id, number: row.number, issuedOn: row.issued_on }]),
  );
  const result: BillableOrder[] = [];
  for (const record of records) {
    for (const { order, money, noBilling } of byRecord.get(record.id) ?? []) {
      result.push({
        order,
        money,
        noBilling,
        print: {
          id: record.id,
          name: record.display_name,
          project: record.project_folder,
          customer: record.customer_folder,
        },
        date: dates.get(order.id) ?? order.created_at,
        invoice: order.invoice_id === null ? null : (invoices.get(order.invoice_id) ?? null),
      });
    }
  }
  return result;
}

/** Newest modification time of the counted G-code files and plates per order. */
export async function orderDates(
  db: Db,
  orderIds: readonly string[],
): Promise<Map<string, string>> {
  const result = new Map<string, string>();
  if (orderIds.length === 0) return result;
  const rows = await db
    .selectFrom('order_items as i')
    .innerJoin('print_orders as o', 'o.id', 'i.order_id')
    .innerJoin('print_assets as a', (join) =>
      join
        .onRef('a.print_record_id', '=', 'o.print_record_id')
        .onRef('a.path_hash', '=', 'i.path_hash'),
    )
    .innerJoin('print_lines as l', (join) =>
      join.onRef('l.asset_id', '=', 'a.id').onRef('l.plate_index', '=', 'i.plate_index'),
    )
    .select(['i.order_id', (eb) => eb.fn.max('a.last_write_utc').as('newest')])
    .where('i.order_id', 'in', orderIds)
    .where((eb) =>
      eb.or([
        eb('l.user_excluded', '=', 0),
        eb.and([eb('l.user_excluded', 'is', null), eb('l.auto_excluded', '=', 0)]),
      ]),
    )
    .groupBy('i.order_id')
    .execute();
  for (const row of rows) {
    // MAX over no rows is NULL, whatever the column type says.
    const newest = row.newest as string | null;
    if (newest !== null) result.set(row.order_id, newest);
  }
  return result;
}

/** How a line is named on documents: order 1 is the print, a later order says so. */
export function orderDescription(printName: string, orderNumber: number): string {
  return orderNumber === 1 ? printName : `${printName} (nabestelling ${orderNumber})`;
}
