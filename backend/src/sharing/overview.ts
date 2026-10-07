import type { Kysely } from 'kysely';
import { localDate } from '../core/time.js';
import type { Database, ShareLinkTable } from '../db/schema.js';
import { billableOrders, orderDescription, type BillableOrder } from '../finance/billing.js';
import { gramsPerOrder, type DocumentLine, type InvoiceDocument } from '../finance/invoices.js';
import type { Settings } from '../finance/settings.js';

type Db = Kysely<Database>;

export type ShareLineStatus = 'paid' | 'open' | 'partial' | 'noPrice';

/** One order on the share page: customer price only, never cost, margin, notes or files. */
export interface BilledShareLine {
  id: string;
  description: string;
  project: string | null;
  /** Local date of the order (YYYY-MM-DD). */
  date: string;
  /** Euros; null: "Prijs volgt". */
  price: number | null;
  paid: number;
  remaining: number | null;
  status: ShareLineStatus;
}

/** Niet-factureren klant: Print, Project and Datum only. */
export interface PlainShareLine {
  id: string;
  description: string;
  project: string | null;
  date: string;
}

interface ShareHead {
  studio: { name: string; hasLogo: boolean };
  customer: string;
  label: string;
  expiresAt: string | null;
}

export type ShareView =
  | (ShareHead & {
      billed: true;
      lines: BilledShareLine[];
      /** Prints without a price are left out of the totals. */
      totals: { total: number; paid: number; open: number };
    })
  | (ShareHead & { billed: false; lines: PlainShareLine[] });

const euros = (cents: number) => cents / 100;

function byDateThenName(a: BillableOrder, b: BillableOrder): number {
  return (
    a.date.localeCompare(b.date) ||
    a.print.name.localeCompare(b.print.name, 'nl') ||
    a.order.number - b.order.number
  );
}

/**
 * The klant's orders as a Deel-link shows them: one line per order, archived
 * prints included, written-off orders and deleted prints left out. With
 * "Alleen openstaand" only open and partially paid orders remain.
 */
async function shareOrders(db: Db, customer: string, onlyOpen: boolean, settings: Settings) {
  const orders = (await billableOrders(db, { customer }, settings))
    .filter((item) => item.money.status !== 'writtenOff')
    .sort(byDateThenName);
  return onlyOpen
    ? orders.filter((item) => item.money.status === 'open' || item.money.status === 'partial')
    : orders;
}

/** Niet factureren: the link shows the print list without amounts, and there is no PDF. */
async function notBilled(db: Db, customer: string): Promise<boolean> {
  const row = await db
    .selectFrom('customers')
    .select('no_billing')
    .where('customer_folder', '=', customer)
    .executeTakeFirst();
  return row?.no_billing === 1;
}

const lineStatus = (item: BillableOrder): ShareLineStatus =>
  item.money.status === 'paid' || item.money.status === 'partial' || item.money.status === 'open'
    ? item.money.status
    : 'noPrice';

export async function shareView(
  db: Db,
  link: ShareLinkTable,
  options: { onlyOpen: boolean; settings: Settings; hasLogo: boolean },
): Promise<ShareView> {
  const { settings } = options;
  const head: ShareHead = {
    studio: {
      name: settings.company.name.trim() === '' ? '3D Prints Portal' : settings.company.name,
      hasLogo: options.hasLogo,
    },
    customer: link.customer_folder,
    label: link.label,
    expiresAt: link.expires_at,
  };
  if (await notBilled(db, link.customer_folder)) {
    // The backend returns no prices for these links (ScreenSharePage); the switch does not apply.
    const all = await shareOrders(db, link.customer_folder, false, settings);
    return {
      ...head,
      billed: false,
      lines: all.map((item) => ({
        id: item.order.id,
        description: orderDescription(item.print.name, item.order.number),
        project: item.print.project,
        date: localDate(item.date),
      })),
    };
  }
  const orders = await shareOrders(db, link.customer_folder, options.onlyOpen, settings);
  const lines = orders.map((item): BilledShareLine => {
    const status = lineStatus(item);
    return {
      id: item.order.id,
      description: orderDescription(item.print.name, item.order.number),
      project: item.print.project,
      date: localDate(item.date),
      price: status === 'noPrice' ? null : euros(item.money.priceCents ?? 0),
      paid: euros(item.money.paidCents),
      remaining: status === 'noPrice' ? null : euros(item.money.remainingCents ?? 0),
      status,
    };
  });
  const priced = orders.filter((item) => lineStatus(item) !== 'noPrice');
  const totalCents = priced.reduce((sum, item) => sum + (item.money.priceCents ?? 0), 0);
  const paidCents = priced.reduce((sum, item) => sum + item.money.paidCents, 0);
  return {
    ...head,
    billed: true,
    lines,
    totals: {
      total: euros(totalCents),
      paid: euros(paidCents),
      open: euros(totalCents - paidCents),
    },
  };
}

/** The Overzicht PDF for a billed klant; null for a niet-factureren klant (no PDF). */
export async function overviewDocument(
  db: Db,
  link: ShareLinkTable,
  options: { onlyOpen: boolean; settings: Settings; now: Date },
): Promise<InvoiceDocument | null> {
  const { settings } = options;
  if (await notBilled(db, link.customer_folder)) return null;
  const orders = await shareOrders(db, link.customer_folder, options.onlyOpen, settings);
  const grams = await gramsPerOrder(db, orders);
  const lines = orders.map((item): DocumentLine => {
    const status = lineStatus(item);
    return {
      orderId: item.order.id,
      printId: item.print.id,
      description: orderDescription(item.print.name, item.order.number),
      project: item.print.project,
      date: localDate(item.date),
      grams: grams.get(item.order.id) ?? null,
      amountCents: status === 'noPrice' ? 0 : (item.money.priceCents ?? 0),
      paidCents: status === 'noPrice' ? 0 : item.money.paidCents,
      status: status === 'noPrice' ? null : status,
      ...(status === 'noPrice' ? { noPrice: true } : {}),
    };
  });
  const totalCents = lines.reduce((sum, line) => sum + line.amountCents, 0);
  const paidCents = lines.reduce((sum, line) => sum + line.paidCents, 0);
  return {
    kind: 'overview',
    number: null,
    customer: link.customer_folder,
    issuedOn: localDate(options.now),
    period: null,
    creditsNumber: null,
    lines,
    totalCents,
    paidCents,
    openCents: totalCents - paidCents,
    // DocOverview 1.5: the payment reference on an Overzicht is the klant name.
    reference: link.customer_folder,
    company: settings.company,
    overview: {
      label: link.label,
      validUntil: link.expires_at === null ? null : localDate(link.expires_at),
    },
  };
}
