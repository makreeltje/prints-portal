import { roundMoney } from './money.js';

/**
 * The one definition of what a customer pays (brief §5.1): the sale price
 * if set, else the total cost plus the default markup when both are known,
 * else nothing. Used by share pages, invoices and the UI alike; the raw
 * internal cost never reaches a customer through any other path.
 */
export interface CustomerPriceInput {
  salePrice: number | null;
  totalCost: number | null;
  defaultMarkupPercent: number | null;
}

export function customerPrice({
  salePrice,
  totalCost,
  defaultMarkupPercent,
}: CustomerPriceInput): number | null {
  if (salePrice !== null) return salePrice;
  if (totalCost === null || defaultMarkupPercent === null) return null;
  return withMarkup(totalCost, defaultMarkupPercent);
}

export type MarkupSuggestion =
  { ok: true; salePrice: number } | { ok: false; reason: 'noMarkup' | 'noCost' };

/** "Voorstel uit marge": round(totalCost × (1 + markup/100), 2). */
export function suggestSalePrice(
  totalCost: number | null,
  defaultMarkupPercent: number | null,
): MarkupSuggestion {
  if (defaultMarkupPercent === null) return { ok: false, reason: 'noMarkup' };
  if (totalCost === null) return { ok: false, reason: 'noCost' };
  return { ok: true, salePrice: withMarkup(totalCost, defaultMarkupPercent) };
}

function withMarkup(totalCost: number, markupPercent: number): number {
  return roundMoney(totalCost * (1 + markupPercent / 100));
}
