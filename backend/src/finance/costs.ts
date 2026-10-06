import type { Kysely, Transaction } from 'kysely';
import {
  calculateCost,
  type CostBreakdown,
  type CostLineInput,
  type CostSettings,
  type CostSlotInput,
} from '../core/cost.js';
import { toCents } from '../core/money.js';
import type { Database, PrintOrderTable } from '../db/schema.js';
import { itemKey } from './orders.js';
import { readSettings, type Settings } from './settings.js';
import { parseSnapshot, type SpoolSnapshot } from './spools.js';

type Db = Kysely<Database> | Transaction<Database>;

/** One file or plate with what the cost calculation and the UI need. */
export interface LineFacts {
  lineId: string;
  assetId: string;
  pathHash: string;
  plateIndex: number;
  excluded: boolean;
  printSeconds: number | null;
  printerModel: string | null;
  totalGrams: number | null;
  material: string | null;
  slots: {
    id: string;
    slot: number;
    grams: number;
    colour: string | null;
    material: string | null;
    spool: SpoolSnapshot | null;
    manualPricePerKg: number | null;
  }[];
  spool: SpoolSnapshot | null;
  manualPricePerKg: number | null;
}

export interface OrderCost {
  order: PrintOrderTable;
  items: { pathHash: string; plateIndex: number; timesPrinted: number }[];
  breakdown: CostBreakdown;
}

export interface PrintCosts {
  spool: SpoolSnapshot | null;
  lines: LineFacts[];
  orders: OrderCost[];
  settings: Settings;
}

/** Everything the cost of a print depends on, and the cost of each of its orders. */
export async function loadPrintCosts(
  db: Db,
  recordId: string,
  settings?: Settings,
): Promise<PrintCosts> {
  const resolvedSettings = settings ?? (await readSettings(db));
  const record = await db
    .selectFrom('print_records')
    .select(['spool_snapshot', 'material', 'printer_model'])
    .where('id', '=', recordId)
    .executeTakeFirstOrThrow();
  const lineRows = await db
    .selectFrom('print_lines as l')
    .innerJoin('print_assets as a', 'a.id', 'l.asset_id')
    .select([
      'l.id',
      'l.asset_id',
      'a.path_hash',
      'l.plate_index',
      'l.auto_excluded',
      'l.user_excluded',
      'l.print_seconds',
      'l.printer_model',
      'l.total_grams',
      'l.material',
    ])
    .where('a.print_record_id', '=', recordId)
    .execute();
  const slotRows =
    lineRows.length === 0
      ? []
      : await db
          .selectFrom('line_slots')
          .selectAll()
          .where(
            'line_id',
            'in',
            lineRows.map((line) => line.id),
          )
          .orderBy('slot')
          .execute();
  const overrides = await db
    .selectFrom('line_overrides')
    .selectAll()
    .where('print_record_id', '=', recordId)
    .execute();
  const override = (pathHash: string, plate: number, slot: number) =>
    overrides.find(
      (row) => row.path_hash === pathHash && row.plate_index === plate && row.slot === slot,
    );

  const lines: LineFacts[] = lineRows.map((line) => {
    const own = override(line.path_hash, line.plate_index, 0);
    return {
      lineId: line.id,
      assetId: line.asset_id,
      pathHash: line.path_hash,
      plateIndex: line.plate_index,
      excluded: (line.user_excluded ?? line.auto_excluded) === 1,
      printSeconds: line.print_seconds,
      printerModel: line.printer_model,
      totalGrams: line.total_grams,
      material: line.material,
      spool: parseSnapshot(own?.spool_snapshot ?? null),
      manualPricePerKg: own?.manual_price_per_kg ?? null,
      slots: slotRows
        .filter((slot) => slot.line_id === line.id)
        .map((slot) => {
          const slotOverride = override(line.path_hash, line.plate_index, slot.slot);
          return {
            id: slot.id,
            slot: slot.slot,
            grams: slot.grams,
            colour: slot.colour,
            material: slot.material,
            spool: parseSnapshot(slotOverride?.spool_snapshot ?? null),
            manualPricePerKg: slotOverride?.manual_price_per_kg ?? null,
          };
        }),
    };
  });
  const byKey = new Map(lines.map((line) => [itemKey(line.pathHash, line.plateIndex), line]));

  const orderRows = await db
    .selectFrom('print_orders')
    .selectAll()
    .where('print_record_id', '=', recordId)
    .orderBy('number')
    .execute();
  const itemRows =
    orderRows.length === 0
      ? []
      : await db
          .selectFrom('order_items')
          .selectAll()
          .where(
            'order_id',
            'in',
            orderRows.map((order) => order.id),
          )
          .execute();

  const printSpool = parseSnapshot(record.spool_snapshot);
  const costSettings: CostSettings = {
    materialPricesPerKg: resolvedSettings.pricing.materialPricesPerKg,
    tariffEurPerKwh: resolvedSettings.pricing.tariffEurPerKwh,
    printers: resolvedSettings.printers,
  };

  const orders = orderRows.map((order) => {
    const items = itemRows
      .filter((item) => item.order_id === order.id)
      .map((item) => ({
        pathHash: item.path_hash,
        plateIndex: item.plate_index,
        timesPrinted: item.times_printed,
      }));
    const costLines: CostLineInput[] = items.flatMap((item) => {
      const line = byKey.get(itemKey(item.pathHash, item.plateIndex));
      return line === undefined ? [] : [toCostLine(line, item.timesPrinted)];
    });
    const breakdown = calculateCost(
      {
        lines: costLines,
        spoolPricePerKg: printSpool?.pricePerKg ?? null,
        manualPricePerKg: order.manual_price_per_kg,
        manualGrams: order.manual_grams,
        manualPrintTimeSeconds: order.manual_print_seconds,
        material: record.material,
        printerModel: record.printer_model,
        metadataGrams: null,
      },
      costSettings,
    );
    return { order, items, breakdown };
  });

  return { spool: printSpool, lines, orders, settings: resolvedSettings };
}

function toCostLine(line: LineFacts, timesPrinted: number): CostLineInput {
  const lineSpool = line.spool?.pricePerKg ?? null;
  const slots: CostSlotInput[] = line.slots.map((slot) => ({
    slot: slot.slot,
    grams: slot.grams,
    material: slot.material,
    spoolPricePerKg: slot.spool?.pricePerKg ?? lineSpool,
    manualPricePerKg: slot.manualPricePerKg,
  }));
  // A file without slot data counts as one slot, so a spool on the file still applies.
  if (slots.length === 0 && line.totalGrams !== null && line.totalGrams > 0) {
    slots.push({
      slot: 1,
      grams: line.totalGrams,
      material: line.material,
      spoolPricePerKg: lineSpool,
      manualPricePerKg: null,
    });
  }
  return {
    id: line.lineId,
    excluded: line.excluded,
    timesPrinted,
    printTimeSeconds: line.printSeconds,
    printerModel: line.printerModel,
    totalGrams: line.totalGrams,
    material: line.material,
    manualPricePerKg: line.manualPricePerKg,
    slots,
  };
}

/**
 * Recalculates and stores the cost of every order of a print (plan:
 * "recalculation on every change"). An archived print keeps its last costs:
 * its files are gone, its financials are not.
 */
export async function recalculatePrint(
  db: Db,
  recordId: string,
  now: string,
  settings?: Settings,
): Promise<void> {
  const record = await db
    .selectFrom('print_records')
    .select('status')
    .where('id', '=', recordId)
    .executeTakeFirst();
  if (record === undefined || record.status === 'archived') return;
  const { orders } = await loadPrintCosts(db, recordId, settings);
  for (const { order, breakdown } of orders) {
    const values = {
      material_cost_cents: centsOrNull(breakdown.materialCost),
      electricity_cost_cents: centsOrNull(breakdown.electricityCost),
      total_cost_cents: centsOrNull(breakdown.totalCost),
      cost_missing: breakdown.missing.length === 0 ? null : breakdown.missing.join(','),
    };
    if (
      values.material_cost_cents === order.material_cost_cents &&
      values.electricity_cost_cents === order.electricity_cost_cents &&
      values.total_cost_cents === order.total_cost_cents &&
      values.cost_missing === order.cost_missing
    ) {
      continue;
    }
    await db
      .updateTable('print_orders')
      .set({ ...values, updated_at: now })
      .where('id', '=', order.id)
      .execute();
  }
}

/** After a settings change: every print that is not archived. */
export async function recalculateAll(db: Kysely<Database>, now: string): Promise<number> {
  const settings = await readSettings(db);
  const records = await db
    .selectFrom('print_records')
    .select('id')
    .where('status', '!=', 'archived')
    .execute();
  for (const record of records) await recalculatePrint(db, record.id, now, settings);
  return records.length;
}

function centsOrNull(euros: number | null): number | null {
  return euros === null ? null : toCents(euros);
}
