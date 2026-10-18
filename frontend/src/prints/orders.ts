import { t } from '../i18n/nl';
import { placeOf } from './filter';
import type { Asset, Order, OrderStatus, PrintSummary } from './types';

/**
 * The files of one order: its files and plates with this order's "Aantal
 * keer geprint". Files without counted lines (STL, video, PDF) belong to
 * the print, so they are listed with Bestelling 1.
 */
export function assetsForOrder(assets: readonly Asset[], order: Order): Asset[] {
  const times = new Map<string, number>();
  for (const item of order.items ?? []) {
    if (item.lineId !== null) times.set(item.lineId, item.timesPrinted);
  }
  return assets.flatMap((asset) => {
    // 2.0: an order holds only what it bills. A file with no printable line —
    // an STL, a video, a PDF, a link — is the print's, not an order's, and
    // lives in the print's file list alone (GAP-097).
    if (asset.lines.length === 0) return [];
    const lines = asset.lines.flatMap((line) => {
      const timesPrinted = times.get(line.id);
      return timesPrinted === undefined ? [] : [{ ...line, timesPrinted, inOrder: true }];
    });
    return lines.length === 0 ? [] : [{ ...asset, lines }];
  });
}

/** Files and plates that are in no order yet ("Niet in een bestelling"). */
export function unassignedAssets(assets: readonly Asset[]): Asset[] {
  return assets.flatMap((asset) => {
    const lines = asset.lines.filter((line) => !line.inOrder);
    return lines.length === 0 ? [] : [{ ...asset, lines }];
  });
}

/** Paid and written-off orders are settled: their section starts closed. */
export const isSettled = (status: OrderStatus) => status === 'paid' || status === 'writtenOff';

/** Newest first (OrderSection: "a column, newest order first"). */
export const newestFirst = (orders: readonly Order[]) =>
  [...orders].sort((a, b) => b.number - a.number);

/** "Koen / Bloembak clips", plus "· 2 bestellingen" when the print has several orders. */
export function subLine(print: PrintSummary): string {
  const orders = print.money?.orderCount ?? 1;
  return orders > 1
    ? `${placeOf(print)} · ${t('orders.count', { count: orders })}`
    : placeOf(print);
}

/**
 * Which order counts each asset, for the print's own file list (GAP-097). An
 * asset with no printable line is billed by nobody and gets no label; one whose
 * lines are in no order keeps the "Niet in een bestelling" badge it already had.
 */
export function orderLabels(
  assets: readonly Asset[],
  orders: readonly Order[],
): ReadonlyMap<string, string> {
  const labels = new Map<string, string>();
  for (const order of orders) {
    const lineIds = new Set(
      (order.items ?? []).flatMap((item) => (item.lineId === null ? [] : [item.lineId])),
    );
    if (lineIds.size === 0) continue;
    const name = order.number === 1 ? t('orders.first') : t('orders.repeat', { n: order.number });
    for (const asset of assets) {
      if (labels.has(asset.id)) continue;
      if (asset.lines.some((line) => lineIds.has(line.id))) {
        labels.set(asset.id, t('asset.countsIn', { bestelling: name }));
      }
    }
  }
  return labels;
}
