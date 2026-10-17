import { customerPrice } from '../core/pricing.js';

/**
 * Payment state of one order, in cents (plan: partial payment stays open
 * for the remainder; a write-off covers only the remainder; "niet
 * factureren" klanten have no price or payment at all).
 */
export type OrderStatus =
  'open' | 'partial' | 'paid' | 'writtenOff' | 'noPrice' | 'notBilled' | 'declined';

/**
 * Where a request stands, on the order that carries its price.
 *
 * Null means "as before": the order behaves exactly as it did when the portal
 * modelled only money, which is why adding this changed no existing figure.
 */
export type RequestState = 'undecided' | 'inProgress' | 'declined';

export const REQUEST_STATES: readonly RequestState[] = ['undecided', 'inProgress', 'declined'];

export function parseRequestState(value: string | null): RequestState | null {
  return value !== null && (REQUEST_STATES as readonly string[]).includes(value)
    ? (value as RequestState)
    : null;
}

export interface OrderMoneyInput {
  noBilling: boolean;
  /** A refused quote owes nothing, whatever price it was given. */
  requestState?: RequestState | null;
  salePriceCents: number | null;
  totalCostCents: number | null;
  defaultMarkupPercent: number | null;
  /** Active (not undone) payments. */
  paidCents: number;
  writtenOffCents: number | null;
}

export interface OrderMoney {
  status: OrderStatus;
  /** What the klant pays: the sale price, else cost plus Standaardmarge; null when unknown. */
  priceCents: number | null;
  /** True when priceCents comes from the markup, not from a saved sale price. */
  priceSuggested: boolean;
  paidCents: number;
  writtenOffCents: number;
  /** Still to pay; 0 when paid or written off, null without a price. */
  remainingCents: number | null;
}

export function orderMoney(input: OrderMoneyInput): OrderMoney {
  const writtenOff = input.writtenOffCents ?? 0;
  /*
    Declined wins over every money state. The price is kept — it is the
    history of what was asked — but nothing is owed, so this order leaves
    Openstaand, every total and every invoice. It is checked first because a
    refused quote with a price would otherwise read as `open`.
  */
  if (input.requestState === 'declined') {
    return {
      status: 'declined',
      priceCents: input.salePriceCents,
      priceSuggested: false,
      paidCents: input.paidCents,
      writtenOffCents: writtenOff,
      remainingCents: null,
    };
  }
  if (input.noBilling) {
    return {
      status: 'notBilled',
      priceCents: null,
      priceSuggested: false,
      paidCents: input.paidCents,
      writtenOffCents: writtenOff,
      remainingCents: null,
    };
  }
  const price = customerPrice({
    salePrice: input.salePriceCents === null ? null : input.salePriceCents / 100,
    totalCost: input.totalCostCents === null ? null : input.totalCostCents / 100,
    defaultMarkupPercent: input.defaultMarkupPercent,
  });
  const priceCents = price === null ? null : Math.round(price * 100);
  const base = {
    priceCents,
    priceSuggested: input.salePriceCents === null && priceCents !== null,
    paidCents: input.paidCents,
    writtenOffCents: writtenOff,
  };
  if (priceCents === null) return { ...base, status: 'noPrice', remainingCents: null };
  const remaining = Math.max(0, priceCents - input.paidCents - writtenOff);
  let status: OrderStatus;
  if (remaining > 0) status = input.paidCents > 0 ? 'partial' : 'open';
  else if (writtenOff > 0) status = 'writtenOff';
  else status = 'paid';
  return { ...base, status, remainingCents: remaining };
}

/** Of several orders, the one that needs attention first decides the print's badge. */
const ATTENTION: readonly OrderStatus[] = [
  'notBilled',
  'noPrice',
  'open',
  'partial',
  'writtenOff',
  'paid',
  // Last: a refused quote needs nothing, so any other order of the same print
  // speaks first. A print whose only order is declined gets this.
  'declined',
];

export function leastSettled(statuses: readonly OrderStatus[]): OrderStatus | null {
  for (const status of ATTENTION) if (statuses.includes(status)) return status;
  return null;
}
