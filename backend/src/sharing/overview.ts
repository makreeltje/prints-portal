import type { Kysely } from 'kysely';
import { sourceLabel } from '../core/url-file.js';
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
  /** For the line's thumbnail; the image itself is fetched per link. */
  printId: string;
  /**
   * "Bron", on the first line this print has and never again — a nabestelling
   * does not repeat it (PrintSource). Null on every later line of the same
   * print, and on a print with none. The owner decided the klant sees this;
   * the note is internal and never reaches here.
   */
  source: { url: string; label: string } | null;
}

/** Niet-factureren klant: Print, Project and Datum only. */
export interface PlainShareLine {
  id: string;
  description: string;
  project: string | null;
  date: string;
  printId: string;
  source: { url: string; label: string } | null;
}

interface ShareHead {
  studio: { name: string; hasLogo: boolean };
  customer: string;
  expiresAt: string | null;
}

/**
 * How to pay (ScreenSharePage 1.9, GAP-078). Only while something is open and
 * the studio has an IBAN; the klant sees no empty frame otherwise.
 */
export interface SharePayment {
  iban: string;
  name: string;
  /** The open amount, in euros, matching the Openstaand row. */
  amount: number;
  /** What to quote on the transfer: the klant's name. */
  reference: string;
  email: string | null;
  phone: string | null;
  /**
   * The klant's own payment link, if the studio pasted one (GAP-103). It is a
   * secondary way to pay: the bank details above are always correct, while this
   * link carries whatever amount it was made with.
   */
  payLink: string | null;
}

export type ShareView =
  | (ShareHead & {
      billed: true;
      lines: BilledShareLine[];
      /** Prints without a price are left out of the totals. */
      totals: { total: number; paid: number; open: number };
      pay: SharePayment | null;
    })
  | (ShareHead & { billed: false; lines: PlainShareLine[] });

const euros = (cents: number) => cents / 100;

const blankToNull = (value: string | null): string | null => {
  const text = (value ?? '').trim();
  return text === '' ? null : text;
};

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
/**
 * The bron each print shows on the share page, once (PrintSource).
 *
 * Returns a function rather than a map so a caller cannot show the same link
 * on a print's nabestelling as well: the first line that asks for a print gets
 * it, every later line gets null.
 */
async function sourcePerPrint(
  db: Db,
  printIds: string[],
): Promise<(printId: string) => { url: string; label: string } | null> {
  if (printIds.length === 0) return () => null;
  const [records, assets] = await Promise.all([
    db
      .selectFrom('print_records')
      .select(['id', 'source_url'])
      .where('id', 'in', printIds)
      .execute(),
    db
      .selectFrom('print_assets')
      .select(['print_record_id', 'url_target'])
      .where('print_record_id', 'in', printIds)
      .execute(),
  ]);
  const best = new Map<string, string>();
  // Typed first, then the folder's, as everywhere else (PrintSource).
  for (const asset of assets) {
    if (asset.url_target !== null && !best.has(asset.print_record_id)) {
      best.set(asset.print_record_id, asset.url_target);
    }
  }
  for (const record of records) {
    if (record.source_url !== null) best.set(record.id, record.source_url);
  }
  const shown = new Set<string>();
  return (printId) => {
    const url = best.get(printId);
    if (url === undefined || shown.has(printId)) return null;
    shown.add(printId);
    return { url, label: sourceLabel(url) };
  };
}

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
    expiresAt: link.expires_at,
  };
  if (await notBilled(db, link.customer_folder)) {
    // The backend returns no prices for these links (ScreenSharePage); the switch does not apply.
    const all = await shareOrders(db, link.customer_folder, false, settings);
    const firstOf = await sourcePerPrint(db, [...new Set(all.map((item) => item.print.id))]);
    return {
      ...head,
      billed: false,
      lines: all.map((item) => ({
        id: item.order.id,
        description: orderDescription(item.print.name, item.order.number),
        project: item.print.project,
        date: localDate(item.date),
        printId: item.print.id,
        source: firstOf(item.print.id),
      })),
    };
  }
  const orders = await shareOrders(db, link.customer_folder, options.onlyOpen, settings);
  const firstOf = await sourcePerPrint(db, [...new Set(orders.map((item) => item.print.id))]);
  const lines = orders.map((item): BilledShareLine => {
    const status = lineStatus(item);
    return {
      id: item.order.id,
      description: orderDescription(item.print.name, item.order.number),
      project: item.print.project,
      date: localDate(item.date),
      source: firstOf(item.print.id),
      price: status === 'noPrice' ? null : euros(item.money.priceCents ?? 0),
      paid: euros(item.money.paidCents),
      remaining: status === 'noPrice' ? null : euros(item.money.remainingCents ?? 0),
      status,
      printId: item.print.id,
    };
  });
  const priced = orders.filter((item) => lineStatus(item) !== 'noPrice');
  const totalCents = priced.reduce((sum, item) => sum + (item.money.priceCents ?? 0), 0);
  const paidCents = priced.reduce((sum, item) => sum + item.money.paidCents, 0);
  const openCents = totalCents - paidCents;
  const iban = settings.company.iban.trim();
  const payLink = await db
    .selectFrom('customers')
    .select('pay_link')
    .where('customer_folder', '=', link.customer_folder)
    .executeTakeFirst();
  // Something open, and either bank details or a link to pay it with (GAP-078,
  // GAP-103): a klant with a link but no IBAN still gets the block.
  const pay: SharePayment | null =
    openCents > 0 && (iban !== '' || (payLink?.pay_link ?? null) !== null)
      ? {
          iban,
          name: settings.company.name.trim(),
          amount: euros(openCents),
          reference: link.customer_folder,
          email: blankToNull(settings.company.email),
          phone: blankToNull(settings.company.phone),
          payLink: payLink?.pay_link ?? null,
        }
      : null;
  return {
    ...head,
    billed: true,
    lines,
    totals: {
      total: euros(totalCents),
      paid: euros(paidCents),
      open: euros(openCents),
    },
    pay,
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
      // The klant downloads this, so the internal label stays out (GAP-077).
      label: '',
      validUntil: link.expires_at === null ? null : localDate(link.expires_at),
      priced: lines.some((line) => line.noPrice !== true),
    },
  };
}
