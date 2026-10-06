import type { Kysely } from 'kysely';
import type { CostBreakdown, MissingInput, PriceSource } from '../core/cost.js';
import { suggestSalePrice } from '../core/pricing.js';
import type { Database } from '../db/schema.js';
import { loadPrintCosts, type LineFacts } from './costs.js';
import { itemKey } from './orders.js';
import { ordersWithMoney } from './read.js';
import type { SpoolSnapshot } from './spools.js';
import type { OrderStatus } from './state.js';

/** One payment in the order's history (undone ones stay, marked). */
export interface PaymentDto {
  id: string;
  amount: number;
  paidAt: string;
  by: string | null;
  undoneAt: string | null;
  undoneBy: string | null;
}

export interface CostSlotDto {
  slot: number;
  grams: number;
  pricePerKg: number | null;
  source: PriceSource | null;
  cost: number | null;
}

export interface CostLineDto {
  lineId: string;
  fileName: string;
  plateIndex: number;
  counted: boolean;
  timesPrinted: number;
  grams: number | null;
  materialCost: number | null;
  slots: CostSlotDto[];
}

/** CostBreakdown of one order: totals, the calculation per file and slot, and what is missing. */
export interface CostDto {
  materialCost: number | null;
  electricityCost: number | null;
  totalCost: number | null;
  grams: number | null;
  gramsSource: CostBreakdown['gramsSource'];
  printPricePerKg: number | null;
  printPriceSource: PriceSource | null;
  printSeconds: number | null;
  timeSource: CostBreakdown['timeSource'];
  energyKwh: number | null;
  tariffEurPerKwh: number | null;
  missing: MissingInput[];
  lines: CostLineDto[];
  /** Files in this order that do not count ("Niet meegeteld: 2 bestanden"). */
  excludedCount: number;
}

export interface OrderDto {
  id: string;
  number: number;
  createdAt: string;
  status: OrderStatus;
  /** What the klant pays, in euros; null when unknown or niet factureren. */
  price: number | null;
  /** Admin and Editor only from here on. */
  salePrice?: number | null;
  priceSuggested?: boolean;
  /** "Voorstel uit marge": the suggested sale price, or why there is none. */
  suggestion?: { salePrice: number | null; reason: 'noMarkup' | 'noCost' | null };
  paid?: number;
  remaining?: number | null;
  writtenOff?: { amount: number; at: string; by: string | null; reason: string | null } | null;
  payments?: PaymentDto[];
  overrides?: { pricePerKg: number | null; grams: number | null; printSeconds: number | null };
  cost?: CostDto;
  items?: { lineId: string | null; timesPrinted: number }[];
}

export interface LineFinanceDto {
  spool: SpoolSnapshot | null;
  manualPricePerKg: number | null;
  /** Times printed over all orders; 0 when the file is in no order yet. */
  timesPrinted: number;
  inOrder: boolean;
  slots: Map<number, { spool: SpoolSnapshot | null; manualPricePerKg: number | null }>;
}

export interface PrintFinanceDto {
  noBilling: boolean;
  markupPercent: number | null;
  spool: SpoolSnapshot | null;
  orders: OrderDto[];
  lines: Map<string, LineFinanceDto>;
}

/** The money side of one print as the detail page needs it. */
export async function printFinance(
  db: Kysely<Database>,
  recordId: string,
  options: { full: boolean; fileNames: Map<string, string> },
): Promise<PrintFinanceDto> {
  const costs = await loadPrintCosts(db, recordId);
  const money = (await ordersWithMoney(db, [recordId], costs.settings)).get(recordId) ?? [];
  const noBilling = money[0]?.noBilling ?? false;
  const lineByKey = new Map(
    costs.lines.map((line) => [itemKey(line.pathHash, line.plateIndex), line]),
  );

  const timesByKey = new Map<string, number>();
  for (const { items } of costs.orders) {
    for (const item of items) {
      const key = itemKey(item.pathHash, item.plateIndex);
      timesByKey.set(key, (timesByKey.get(key) ?? 0) + item.timesPrinted);
    }
  }
  const lines = new Map<string, LineFinanceDto>();
  for (const line of costs.lines) {
    const key = itemKey(line.pathHash, line.plateIndex);
    lines.set(line.lineId, {
      spool: line.spool,
      manualPricePerKg: line.manualPricePerKg,
      timesPrinted: timesByKey.get(key) ?? 0,
      inOrder: timesByKey.has(key),
      slots: new Map(
        line.slots.map((slot) => [
          slot.slot,
          { spool: slot.spool, manualPricePerKg: slot.manualPricePerKg },
        ]),
      ),
    });
  }

  const payments = options.full
    ? await paymentsFor(
        db,
        money.map((m) => m.order.id),
      )
    : new Map<string, Database['payments'][]>();
  const userIds = new Set<string>();
  for (const list of payments.values()) {
    for (const payment of list) {
      if (payment.recorded_by !== null) userIds.add(payment.recorded_by);
      if (payment.undone_by !== null) userIds.add(payment.undone_by);
    }
  }
  for (const { order } of money)
    if (order.written_off_by !== null) userIds.add(order.written_off_by);
  const names = await userNames(db, [...userIds]);
  const nameOf = (id: string | null) => (id === null ? null : (names.get(id) ?? null));

  const orders: OrderDto[] = money.map(({ order, money: m }) => {
    const base: OrderDto = {
      id: order.id,
      number: order.number,
      createdAt: order.created_at,
      status: m.status,
      price: m.priceCents === null ? null : m.priceCents / 100,
    };
    if (!options.full) return base;
    const cost = costs.orders.find((o) => o.order.id === order.id);
    const suggestion = suggestSalePrice(
      order.total_cost_cents === null ? null : order.total_cost_cents / 100,
      costs.settings.pricing.defaultMarkupPercent,
    );
    return {
      ...base,
      salePrice: order.sale_price_cents === null ? null : order.sale_price_cents / 100,
      priceSuggested: m.priceSuggested,
      suggestion: suggestion.ok
        ? { salePrice: suggestion.salePrice, reason: null }
        : { salePrice: null, reason: suggestion.reason },
      paid: m.paidCents / 100,
      remaining: m.remainingCents === null ? null : m.remainingCents / 100,
      writtenOff:
        order.written_off_cents === null || order.written_off_at === null
          ? null
          : {
              amount: order.written_off_cents / 100,
              at: order.written_off_at,
              by: nameOf(order.written_off_by),
              reason: order.written_off_reason,
            },
      payments: (payments.get(order.id) ?? []).map((p) => ({
        id: p.id,
        amount: p.amount_cents / 100,
        paidAt: p.paid_at,
        by: nameOf(p.recorded_by),
        undoneAt: p.undone_at,
        undoneBy: nameOf(p.undone_by),
      })),
      overrides: {
        pricePerKg: order.manual_price_per_kg,
        grams: order.manual_grams,
        printSeconds: order.manual_print_seconds,
      },
      cost:
        cost === undefined
          ? undefined
          : toCostDto(
              cost.breakdown,
              (id) => {
                const line = costs.lines.find((l) => l.lineId === id);
                return line === undefined ? '' : (options.fileNames.get(line.assetId) ?? '');
              },
              lineFacts(costs.lines),
            ),
      items: (cost?.items ?? []).map((item) => ({
        lineId: lineByKey.get(itemKey(item.pathHash, item.plateIndex))?.lineId ?? null,
        timesPrinted: item.timesPrinted,
      })),
    };
  });

  return {
    noBilling,
    markupPercent: costs.settings.pricing.defaultMarkupPercent,
    spool: costs.spool,
    orders,
    lines,
  };
}

function lineFacts(lines: readonly LineFacts[]): Map<string, LineFacts> {
  return new Map(lines.map((line) => [line.lineId, line]));
}

function toCostDto(
  breakdown: CostBreakdown,
  fileName: (lineId: string) => string,
  facts: Map<string, LineFacts>,
): CostDto {
  return {
    materialCost: breakdown.materialCost,
    electricityCost: breakdown.electricityCost,
    totalCost: breakdown.totalCost,
    grams: breakdown.grams,
    gramsSource: breakdown.gramsSource,
    printPricePerKg: breakdown.printPricePerKg,
    printPriceSource: breakdown.printPriceSource,
    printSeconds: breakdown.printTimeSeconds,
    timeSource: breakdown.timeSource,
    energyKwh: breakdown.energyKwh,
    tariffEurPerKwh: breakdown.tariffEurPerKwh,
    missing: breakdown.missing,
    excludedCount: breakdown.lines.filter((line) => !line.counted).length,
    lines: breakdown.lines
      .filter((line) => line.counted)
      .map((line) => ({
        lineId: line.id,
        fileName: fileName(line.id),
        plateIndex: facts.get(line.id)?.plateIndex ?? 0,
        counted: line.counted,
        timesPrinted: line.timesPrinted,
        grams: line.grams,
        materialCost: line.materialCost,
        slots: line.slots.map((slot) => ({
          slot: slot.slot,
          grams: slot.grams,
          pricePerKg: slot.pricePerKg,
          source: slot.source,
          cost: slot.cost,
        })),
      })),
  };
}

async function paymentsFor(db: Kysely<Database>, orderIds: readonly string[]) {
  const result = new Map<string, Database['payments'][]>();
  if (orderIds.length === 0) return result;
  const rows = await db
    .selectFrom('payments')
    .selectAll()
    .where('order_id', 'in', orderIds)
    .orderBy('paid_at')
    .orderBy('id')
    .execute();
  for (const row of rows) {
    const list = result.get(row.order_id) ?? [];
    list.push(row);
    result.set(row.order_id, list);
  }
  return result;
}

async function userNames(
  db: Kysely<Database>,
  ids: readonly string[],
): Promise<Map<string, string>> {
  if (ids.length === 0) return new Map();
  const rows = await db
    .selectFrom('users')
    .select(['id', 'display_name'])
    .where('id', 'in', ids)
    .execute();
  return new Map(rows.map((row) => [row.id, row.display_name]));
}
