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
    if (asset.lines.length === 0) return order.number === 1 ? [asset] : [];
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

/** "Joey / Babybox locks", plus "· 2 bestellingen" when the print has several orders. */
export function subLine(print: PrintSummary): string {
  const orders = print.money?.orderCount ?? 1;
  return orders > 1
    ? `${placeOf(print)} · ${t('orders.count', { count: orders })}`
    : placeOf(print);
}
