import { rm, writeFile } from 'node:fs/promises';
import path from 'node:path';
import type { Kysely, Transaction } from 'kysely';
import { localDate } from '../core/time.js';
import type { Database, InvoiceLineTable, InvoiceTable } from '../db/schema.js';
import { billableOrders, orderDescription, type BillableOrder } from './billing.js';
import { loadPrintCosts } from './costs.js';
import { FinanceError } from './mutations.js';
import { ordersWithMoney } from './read.js';
import { readSettings, type CompanySettings, type Settings } from './settings.js';

type Db = Kysely<Database> | Transaction<Database>;

/** A line as it appears on a document; amounts in cents. */
export interface DocumentLine {
  orderId: string;
  printId: string;
  description: string;
  project: string | null;
  /** Local date (YYYY-MM-DD). */
  date: string;
  grams: number | null;
  amountCents: number;
  paidCents: number;
  /** null on a credit note. */
  status: 'paid' | 'open' | 'partial' | null;
  /** Overzicht: the order has no customer price yet ("Prijs volgt"); amounts are 0. */
  noPrice?: boolean;
}

/** Everything a PDF needs; also the snapshot stored with a final invoice. */
export interface InvoiceDocument {
  kind: 'invoice' | 'concept' | 'credit' | 'reminder' | 'overview';
  number: string | null;
  customer: string;
  issuedOn: string;
  period: { from: string; to: string } | null;
  /** Credit note: the invoice it corrects. */
  creditsNumber: string | null;
  lines: DocumentLine[];
  totalCents: number;
  paidCents: number;
  openCents: number;
  reference: string;
  company: CompanySettings;
  /** Overzicht: the Deel-link label (sub-line) and its expiry date ("Geldig tot"); null for Nooit. */
  overview?: { label: string; validUntil: string | null };
}

export interface InvoiceQuery {
  /** Inclusive local dates (YYYY-MM-DD); null is open-ended. */
  from: string | null;
  to: string | null;
  onlyOpen: boolean;
}

export interface InvoiceDraft {
  customer: string;
  lines: DocumentLine[];
  /** Orders in the period without a customer price, by description. */
  excluded: string[];
  /** Orders in the period already on a final invoice (information only). */
  earlier: { description: string; invoiceNumber: string }[];
  totalCents: number;
  paidCents: number;
  openCents: number;
  /** Full customer price per order id (what finalising pins as sale price). */
  prices: Record<string, number>;
}

/** The klant exists (has visible prints) and may be invoiced. */
export async function assertInvoiceable(db: Db, customer: string): Promise<void> {
  const record = await db
    .selectFrom('print_records')
    .select('id')
    .where('customer_folder', '=', customer)
    .where('status', '!=', 'deleted')
    .executeTakeFirst();
  if (record === undefined) throw new FinanceError('not_found');
  const flags = await db
    .selectFrom('customers')
    .select('no_billing')
    .where('customer_folder', '=', customer)
    .executeTakeFirst();
  if (flags?.no_billing === 1) throw new FinanceError('not_billed');
}

/**
 * The lines a new invoice for a klant would get: one line per order in the
 * period that is not on a final invoice and not written off. A full invoice
 * includes paid orders; "Alleen openstaand" takes open and partially paid
 * orders with their remainder. Orders without a price are left out and named.
 */
export async function draftInvoice(
  db: Db,
  customer: string,
  query: InvoiceQuery,
  settings?: Settings,
): Promise<InvoiceDraft> {
  await assertInvoiceable(db, customer);
  const all = await billableOrders(db, { customer }, settings);
  const inPeriod = all
    .filter((item) => {
      const day = localDate(item.date);
      return (query.from === null || day >= query.from) && (query.to === null || day <= query.to);
    })
    .sort(byDateThenName);
  const lines: BillableOrder[] = [];
  const excluded: string[] = [];
  const earlier: InvoiceDraft['earlier'] = [];
  for (const item of inPeriod) {
    const description = orderDescription(item.print.name, item.order.number);
    if (item.invoice !== null) {
      earlier.push({ description, invoiceNumber: item.invoice.number });
      continue;
    }
    const status = item.money.status;
    if (status === 'noPrice') excluded.push(description);
    else if (status === 'open' || status === 'partial') lines.push(item);
    else if (status === 'paid' && !query.onlyOpen) lines.push(item);
  }
  const grams = await gramsPerOrder(db, lines);
  const documentLines = lines.map((item): DocumentLine => {
    const price = item.money.priceCents ?? 0;
    const remaining = item.money.remainingCents ?? 0;
    const status =
      item.money.status === 'paid' ? 'paid' : item.money.status === 'partial' ? 'partial' : 'open';
    return {
      orderId: item.order.id,
      printId: item.print.id,
      description: orderDescription(item.print.name, item.order.number),
      project: item.print.project,
      date: localDate(item.date),
      grams: grams.get(item.order.id) ?? null,
      amountCents: query.onlyOpen ? remaining : price,
      paidCents: query.onlyOpen ? 0 : item.money.paidCents,
      status,
    };
  });
  const totalCents = sum(documentLines.map((line) => line.amountCents));
  const paidCents = sum(documentLines.map((line) => line.paidCents));
  return {
    customer,
    lines: documentLines,
    prices: Object.fromEntries(lines.map((item) => [item.order.id, item.money.priceCents ?? 0])),
    excluded,
    earlier,
    totalCents,
    paidCents,
    openCents: totalCents - paidCents,
  };
}

function byDateThenName(a: BillableOrder, b: BillableOrder): number {
  return (
    a.date.localeCompare(b.date) ||
    a.print.name.localeCompare(b.print.name, 'nl') ||
    a.order.number - b.order.number
  );
}

const sum = (values: readonly number[]) => values.reduce((total, value) => total + value, 0);

/** Grams of each order as its cost calculation counts them (times printed included). */
export async function gramsPerOrder(
  db: Db,
  items: readonly { print: { id: string } }[],
): Promise<Map<string, number | null>> {
  const result = new Map<string, number | null>();
  const settings = await readSettings(db);
  for (const printId of new Set(items.map((item) => item.print.id))) {
    const costs = await loadPrintCosts(db, printId, settings);
    for (const { order, breakdown } of costs.orders) result.set(order.id, breakdown.grams);
  }
  return result;
}

/** The period printed on a document: the filter, else the span of the line dates. */
export function documentPeriod(
  query: InvoiceQuery,
  lines: readonly DocumentLine[],
): { from: string; to: string } | null {
  const dates = lines.map((line) => line.date).sort();
  const from = query.from ?? dates[0];
  const to = query.to ?? dates.at(-1);
  return from === undefined || to === undefined ? null : { from, to };
}

export interface FinaliseOptions {
  invoiceDir: string;
  render: (document: InvoiceDocument) => Promise<Buffer>;
  /** The total the user confirmed; a different draft is refused with 'changed'. */
  expectedTotalCents?: number;
  expectedLines?: number;
}

/**
 * "Definitief maken": numbers the invoice in the yearly sequence it shares
 * with credit notes, stores the PDF and a JSON snapshot, pins every order's
 * price (a markup suggestion becomes its sale price) and locks the orders.
 */
export async function finaliseInvoice(
  db: Kysely<Database>,
  customer: string,
  query: InvoiceQuery,
  userId: string,
  now: Date,
  options: FinaliseOptions,
): Promise<InvoiceTable> {
  return withNumber(db, now, options.invoiceDir, async (trx, numbering) => {
    const settings = await readSettings(trx);
    // GAP-037: no final invoice without the name and IBAN for the payment sentence.
    if (!companyReady(settings)) throw new FinanceError('company_incomplete');
    const draft = await draftInvoice(trx, customer, query, settings);
    if (draft.lines.length === 0) throw new FinanceError('no_lines');
    if (
      (options.expectedTotalCents !== undefined &&
        options.expectedTotalCents !== draft.totalCents) ||
      (options.expectedLines !== undefined && options.expectedLines !== draft.lines.length)
    ) {
      throw new FinanceError('changed');
    }
    const stamp = now.toISOString();
    const document: InvoiceDocument = {
      kind: 'invoice',
      number: numbering.number,
      customer,
      issuedOn: numbering.issuedOn,
      period: documentPeriod(query, draft.lines),
      creditsNumber: null,
      lines: draft.lines,
      totalCents: draft.totalCents,
      paidCents: draft.paidCents,
      openCents: draft.openCents,
      reference: numbering.number,
      company: settings.company,
    };
    const invoice: InvoiceTable = {
      id: crypto.randomUUID(),
      number: numbering.number,
      year: numbering.year,
      sequence: numbering.sequence,
      kind: 'invoice',
      customer_folder: customer,
      issued_on: numbering.issuedOn,
      period_from: query.from,
      period_to: query.to,
      only_open: query.onlyOpen ? 1 : 0,
      credits_invoice_id: null,
      total_cents: draft.totalCents,
      paid_cents: draft.paidCents,
      open_cents: draft.openCents,
      reference: numbering.number,
      pdf_file: numbering.file,
      snapshot: JSON.stringify(document),
      created_at: stamp,
      created_by: userId,
    };
    await trx.insertInto('invoices').values(invoice).execute();
    await insertLines(trx, invoice.id, draft.lines);
    for (const line of draft.lines) {
      const order = await trx
        .selectFrom('print_orders')
        .select(['invoice_id', 'sale_price_cents'])
        .where('id', '=', line.orderId)
        .executeTakeFirstOrThrow();
      if (order.invoice_id !== null) throw new FinanceError('changed');
      const result = await trx
        .updateTable('print_orders')
        .set({
          invoice_id: invoice.id,
          ...(order.sale_price_cents === null
            ? {
                sale_price_cents: draft.prices[line.orderId] ?? line.amountCents,
                sale_price_set_at: stamp,
                sale_price_set_by: userId,
              }
            : {}),
          updated_at: stamp,
        })
        .where('id', '=', line.orderId)
        .where('invoice_id', 'is', null)
        .executeTakeFirst();
      // A concurrent finalise took this order first.
      if (result.numUpdatedRows === 0n) throw new FinanceError('changed');
    }
    await options.render(document).then((pdf) => numbering.write(pdf));
    return invoice;
  });
}

async function insertLines(
  trx: Transaction<Database>,
  invoiceId: string,
  lines: readonly DocumentLine[],
): Promise<void> {
  let position = 0;
  for (const line of lines) {
    position += 1;
    const row: InvoiceLineTable = {
      id: crypto.randomUUID(),
      invoice_id: invoiceId,
      position,
      order_id: line.orderId,
      print_record_id: line.printId,
      description: line.description,
      project: line.project,
      line_date: line.date,
      grams: line.grams,
      amount_cents: line.amountCents,
      paid_cents: line.paidCents,
      status: line.status,
    };
    await trx.insertInto('invoice_lines').values(row).execute();
  }
}

/**
 * "Creditnota maken" (Admin) for chosen lines of a final invoice: negative
 * amounts, its own number from the same sequence. Each credited order is
 * written off for the credited amount, capped at what is still open (what
 * was paid stays paid), with the credit note as reason. A line is credited
 * at most once.
 */
export async function createCreditNote(
  db: Kysely<Database>,
  invoiceId: string,
  lineIds: readonly string[],
  userId: string,
  now: Date,
  options: Omit<FinaliseOptions, 'expectedTotalCents' | 'expectedLines'>,
): Promise<InvoiceTable> {
  return withNumber(db, now, options.invoiceDir, async (trx, numbering) => {
    const original = await trx
      .selectFrom('invoices')
      .selectAll()
      .where('id', '=', invoiceId)
      .executeTakeFirst();
    if (original === undefined) throw new FinanceError('not_found');
    if (original.kind !== 'invoice') throw new FinanceError('not_an_invoice');
    const lines = await trx
      .selectFrom('invoice_lines')
      .selectAll()
      .where('invoice_id', '=', invoiceId)
      .orderBy('position')
      .execute();
    const chosen = lines.filter((line) => lineIds.includes(line.id));
    if (chosen.length === 0 || chosen.length !== new Set(lineIds).size) {
      throw new FinanceError('unknown_line');
    }
    const credited = await creditedOrders(trx, invoiceId);
    if (chosen.some((line) => credited.has(line.order_id))) {
      throw new FinanceError('already_credited');
    }
    const settings = await readSettings(trx);
    const stamp = now.toISOString();
    const documentLines: DocumentLine[] = chosen.map((line) => ({
      orderId: line.order_id,
      printId: line.print_record_id,
      description: line.description,
      project: line.project,
      date: line.line_date ?? original.issued_on,
      grams: line.grams,
      amountCents: -line.amount_cents,
      paidCents: 0,
      status: null,
    }));
    const totalCents = sum(documentLines.map((line) => line.amountCents));
    const document: InvoiceDocument = {
      kind: 'credit',
      number: numbering.number,
      customer: original.customer_folder,
      issuedOn: numbering.issuedOn,
      period: null,
      creditsNumber: original.number,
      lines: documentLines,
      totalCents,
      paidCents: 0,
      openCents: 0,
      reference: numbering.number,
      company: settings.company,
    };
    const note: InvoiceTable = {
      id: crypto.randomUUID(),
      number: numbering.number,
      year: numbering.year,
      sequence: numbering.sequence,
      kind: 'credit',
      customer_folder: original.customer_folder,
      issued_on: numbering.issuedOn,
      period_from: null,
      period_to: null,
      only_open: 0,
      credits_invoice_id: original.id,
      total_cents: totalCents,
      paid_cents: 0,
      open_cents: 0,
      reference: numbering.number,
      pdf_file: numbering.file,
      snapshot: JSON.stringify(document),
      created_at: stamp,
      created_by: userId,
    };
    await trx.insertInto('invoices').values(note).execute();
    await insertLines(trx, note.id, documentLines);
    await writeOffCredited(trx, chosen, note.number, userId, stamp);
    await options.render(document).then((pdf) => numbering.write(pdf));
    return note;
  });
}

/** Orders of an invoice that a credit note already corrects. */
export async function creditedOrders(db: Db, invoiceId: string): Promise<Set<string>> {
  const rows = await db
    .selectFrom('invoice_lines as l')
    .innerJoin('invoices as i', 'i.id', 'l.invoice_id')
    .select('l.order_id')
    .where('i.credits_invoice_id', '=', invoiceId)
    .execute();
  return new Set(rows.map((row) => row.order_id));
}

async function writeOffCredited(
  trx: Transaction<Database>,
  lines: readonly InvoiceLineTable[],
  noteNumber: string,
  userId: string,
  stamp: string,
): Promise<void> {
  const printIds = [...new Set(lines.map((line) => line.print_record_id))];
  const money = await ordersWithMoney(trx, printIds);
  for (const line of lines) {
    const found = money.get(line.print_record_id)?.find((o) => o.order.id === line.order_id);
    if (found === undefined) continue;
    const open = found.money.remainingCents ?? 0;
    const amount = Math.min(open, line.amount_cents);
    if (amount <= 0) continue;
    await trx
      .updateTable('print_orders')
      .set({
        written_off_cents: found.money.writtenOffCents + amount,
        written_off_at: stamp,
        written_off_by: userId,
        written_off_reason: `Creditnota ${noteNumber}`,
        updated_at: stamp,
      })
      .where('id', '=', line.order_id)
      .execute();
  }
}

/** Bedrijfsgegevens has what the payment sentence needs. */
export function companyReady(settings: Settings): boolean {
  return settings.company.name.trim() !== '' && settings.company.iban.trim() !== '';
}

/** The number the next invoice or credit note of this year would get (for the confirm dialogs). */
export async function nextInvoiceNumber(db: Db, now: Date): Promise<string> {
  const year = Number(localDate(now).slice(0, 4));
  const last = await db
    .selectFrom('invoices')
    .select((eb) => eb.fn.max('sequence').as('sequence'))
    .where('year', '=', year)
    .executeTakeFirst();
  return `${String(year)}-${String((last?.sequence ?? 0) + 1).padStart(3, '0')}`;
}

interface Numbering {
  year: number;
  sequence: number;
  number: string;
  issuedOn: string;
  file: string;
  write: (pdf: Buffer) => Promise<void>;
}

/**
 * Runs `work` in a transaction with the next number of the year. Two
 * finalisations at once can pick the same number; the unique index refuses
 * the second, which then retries with the next one.
 */
async function withNumber<T>(
  db: Kysely<Database>,
  now: Date,
  invoiceDir: string,
  work: (trx: Transaction<Database>, numbering: Numbering) => Promise<T>,
): Promise<T> {
  const issuedOn = localDate(now);
  const year = Number(issuedOn.slice(0, 4));
  for (let attempt = 1; ; attempt += 1) {
    const written: { file: string | null } = { file: null };
    try {
      return await db.transaction().execute(async (trx) => {
        const last = await trx
          .selectFrom('invoices')
          .select((eb) => eb.fn.max('sequence').as('sequence'))
          .where('year', '=', year)
          .executeTakeFirst();
        const sequence = (last?.sequence ?? 0) + 1;
        const number = `${year}-${String(sequence).padStart(3, '0')}`;
        const file = `${number}.pdf`;
        return work(trx, {
          year,
          sequence,
          number,
          issuedOn,
          file,
          write: async (pdf) => {
            written.file = path.join(invoiceDir, file);
            await writeFile(written.file, pdf);
          },
        });
      });
    } catch (error) {
      if (written.file !== null) await rm(written.file, { force: true });
      if (attempt < 5 && isUniqueViolation(error)) continue;
      throw error;
    }
  }
}

function isUniqueViolation(error: unknown): boolean {
  if (!(error instanceof Error)) return false;
  const code = (error as { code?: unknown }).code;
  return (
    code === '23505' ||
    code === 'ER_DUP_ENTRY' ||
    code === 'SQLITE_CONSTRAINT_UNIQUE' ||
    /unique/i.test(error.message)
  );
}
