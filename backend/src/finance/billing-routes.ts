import { mkdir, readFile, rm, writeFile } from 'node:fs/promises';
import { refuseSvg } from './svg-logo.js';
import path from 'node:path';
import { Resvg } from '@resvg/resvg-js';
import type { FastifyInstance, FastifyReply, FastifyRequest } from 'fastify';
import PDFDocument from 'pdfkit';
import { customerScope } from '../auth/access.js';
import { localDate } from '../core/time.js';
import type { AppDatabase } from '../db/connection.js';
import type { InvoiceKind, Role } from '../db/schema.js';
import type { RealtimeHub } from '../realtime/hub.js';
import { orderDescription } from './billing.js';
import {
  createCreditNote,
  creditedOrders,
  documentPeriod,
  draftInvoice,
  finaliseInvoice,
  companyReady,
  gramsPerOrder,
  nextInvoiceNumber,
  type InvoiceDocument,
  type InvoiceQuery,
} from './invoices.js';
import { FinanceError } from './mutations.js';
import { markCustomerPaid, outstanding } from './outstanding.js';
import { renderDocument } from './pdf.js';
import { readSettings } from './settings.js';

export interface BillingRouteDependencies {
  db: AppDatabase;
  hub: RealtimeHub;
  dataDir: string;
  now: () => Date;
}

const MANAGE: readonly Role[] = ['Admin', 'Editor'];
const ADMIN: readonly Role[] = ['Admin'];
const UUID = { type: 'string', pattern: '^[0-9a-fA-F-]{36}$' } as const;
const DATE = { type: 'string', pattern: '^\\d{4}-\\d{2}-\\d{2}$' } as const;
/** Largest logo upload (PNG or SVG). */
export const LOGO_MAX_BYTES = 1024 * 1024;
const LOGO_WIDTH_PX = 800;

const folderParams = {
  type: 'object',
  required: ['folder'],
  properties: { folder: { type: 'string', minLength: 1, maxLength: 255 } },
} as const;
const invoiceParams = { type: 'object', required: ['id'], properties: { id: UUID } } as const;
const periodQuery = {
  type: 'object',
  additionalProperties: false,
  properties: { from: DATE, to: DATE, onlyOpen: { type: 'boolean', default: false } },
} as const;

interface PeriodQuery {
  from?: string;
  to?: string;
  onlyOpen?: boolean;
}

/**
 * Openstaand, invoices, credit notes, reminders and the company logo (M7).
 * Admins and Editors work with all of it; credit notes and the logo are
 * Admin-only (plan). Users have no access.
 */
export function registerBillingRoutes(app: FastifyInstance, deps: BillingRouteDependencies): void {
  const { db, hub, now } = deps;
  const invoiceDir = path.join(deps.dataDir, 'invoices');
  const logoFile = logoPath(deps.dataDir);
  const userId = (request: FastifyRequest) => {
    if (request.auth === null) throw new Error('session missing after guard');
    return request.auth.user.id;
  };

  async function readLogo(): Promise<Buffer | null> {
    try {
      return await readFile(logoFile);
    } catch {
      return null;
    }
  }

  async function render(document: InvoiceDocument): Promise<Buffer> {
    return renderDocument(document, { logo: await readLogo(), creationDate: now() });
  }

  async function billingError(reply: FastifyReply, error: unknown): Promise<FastifyReply> {
    if (error instanceof FinanceError) {
      return reply.code(error.code === 'not_found' ? 404 : 409).send({ error: error.code });
    }
    throw error;
  }

  async function touched(printIds: Iterable<string>): Promise<void> {
    const ids = [...new Set(printIds)];
    if (ids.length === 0) return;
    const rows = await db
      .selectFrom('print_records')
      .select(['id', 'customer_folder'])
      .where('id', 'in', ids)
      .execute();
    for (const row of rows) {
      hub.broadcast({
        type: 'print:updated',
        printId: row.id,
        customerFolder: row.customer_folder,
      });
    }
  }

  function toQuery(query: PeriodQuery): InvoiceQuery | null {
    const from = query.from ?? null;
    const to = query.to ?? null;
    if (from !== null && to !== null && from > to) return null;
    return { from, to, onlyOpen: query.onlyOpen ?? false };
  }

  function sendPdf(reply: FastifyReply, pdf: Buffer, fileName: string): FastifyReply {
    return reply
      .header('content-type', 'application/pdf')
      .header('cache-control', 'private, no-store')
      .header('x-content-type-options', 'nosniff')
      .header('content-disposition', `attachment; filename="${fileName}"`)
      .send(pdf);
  }

  // -------------------------------------------------------------- Openstaand

  /** Admins and Editors see every klant; Users read their granted klanten (owner decision). */
  app.get('/api/outstanding', async (request) => {
    if (request.auth === null) throw new Error('session missing after guard');
    const scope = await customerScope(db, request.auth.user);
    return outstanding(db, now(), scope.kind === 'all' ? {} : { customers: scope.customerFolders });
  });

  /** "Alles als betaald" for one klant. */
  app.post<{ Params: { folder: string } }>(
    '/api/outstanding/:folder/mark-paid',
    { config: { auth: MANAGE }, schema: { params: folderParams } },
    async (request, reply) => {
      try {
        const result = await markCustomerPaid(db, request.params.folder, userId(request), now());
        if (result.orders === 0) return await reply.code(409).send({ error: 'nothing_open' });
        await touched(result.printIds);
        return { orders: result.orders, amount: result.cents / 100 };
      } catch (error) {
        return billingError(reply, error);
      }
    },
  );

  /** "Herinnering (PDF)": the klant's open and partially paid orders, no number. */
  app.get<{ Params: { folder: string } }>(
    '/api/customers/:folder/reminder.pdf',
    { config: { auth: MANAGE }, schema: { params: folderParams } },
    async (request, reply) => {
      const customer = request.params.folder;
      const group = (await outstanding(db, now(), { customer })).groups[0];
      if (group === undefined) return reply.code(409).send({ error: 'nothing_open' });
      const settings = await readSettings(db);
      const grams = await gramsPerOrder(
        db,
        group.lines.map((line) => ({ print: { id: line.printId } })),
      );
      const lines = group.lines.map((line) => ({
        orderId: line.orderId,
        printId: line.printId,
        description: orderDescription(line.printName, line.orderNumber),
        project: line.project,
        date: line.since,
        grams: grams.get(line.orderId) ?? null,
        amountCents: Math.round(line.remaining * 100),
        paidCents: 0,
        status: line.status,
      }));
      const totalCents = lines.reduce((total, line) => total + line.amountCents, 0);
      const document: InvoiceDocument = {
        kind: 'reminder',
        number: null,
        customer,
        issuedOn: localDate(now()),
        period: null,
        creditsNumber: null,
        lines,
        totalCents,
        paidCents: 0,
        openCents: totalCents,
        reference: customer,
        company: settings.company,
      };
      return sendPdf(
        reply,
        await render(document),
        safeFileName(['Herinnering', customer, document.issuedOn]),
      );
    },
  );

  // ---------------------------------------------------------------- invoices

  /** The export dialog's preview card: lines, totals and the prints left out. */
  app.get<{ Params: { folder: string }; Querystring: PeriodQuery }>(
    '/api/customers/:folder/invoice/preview',
    { config: { auth: MANAGE }, schema: { params: folderParams, querystring: periodQuery } },
    async (request, reply) => {
      const query = toQuery(request.query);
      if (query === null) return reply.code(400).send({ error: 'invalid_period' });
      try {
        const draft = await draftInvoice(db, request.params.folder, query);
        return {
          lines: draft.lines.map((line) => ({
            orderId: line.orderId,
            printId: line.printId,
            description: line.description,
            project: line.project,
            date: line.date,
            grams: line.grams,
            amount: line.amountCents / 100,
            paid: line.paidCents / 100,
            status: line.status,
          })),
          total: draft.totalCents / 100,
          paid: draft.paidCents / 100,
          open: draft.openCents / 100,
          excluded: draft.excluded,
          earlier: draft.earlier,
          nextNumber: await nextInvoiceNumber(db, now()),
          companyReady: companyReady(await readSettings(db)),
        };
      } catch (error) {
        return billingError(reply, error);
      }
    },
  );

  /** "Concept downloaden": unnumbered, not stored; the reference is the klant's name. */
  app.get<{ Params: { folder: string }; Querystring: PeriodQuery }>(
    '/api/customers/:folder/invoice/concept.pdf',
    { config: { auth: MANAGE }, schema: { params: folderParams, querystring: periodQuery } },
    async (request, reply) => {
      const query = toQuery(request.query);
      if (query === null) return reply.code(400).send({ error: 'invalid_period' });
      const customer = request.params.folder;
      try {
        const settings = await readSettings(db);
        const draft = await draftInvoice(db, customer, query, settings);
        if (draft.lines.length === 0) return await reply.code(409).send({ error: 'no_lines' });
        const document: InvoiceDocument = {
          kind: 'concept',
          number: null,
          customer,
          issuedOn: localDate(now()),
          period: documentPeriod(query, draft.lines),
          creditsNumber: null,
          lines: draft.lines,
          totalCents: draft.totalCents,
          paidCents: draft.paidCents,
          openCents: draft.openCents,
          reference: customer,
          company: settings.company,
        };
        return await sendPdf(
          reply,
          await render(document),
          safeFileName(['Concept', customer, document.issuedOn]),
        );
      } catch (error) {
        return billingError(reply, error);
      }
    },
  );

  /** "Definitief maken". */
  app.post<{
    Params: { folder: string };
    Body: PeriodQuery & { expectedTotal?: number; expectedLines?: number };
  }>(
    '/api/customers/:folder/invoices',
    {
      config: { auth: MANAGE },
      schema: {
        params: folderParams,
        body: {
          type: 'object',
          additionalProperties: false,
          properties: {
            ...periodQuery.properties,
            expectedTotal: { type: 'number', minimum: 0, maximum: 100_000_000 },
            expectedLines: { type: 'integer', minimum: 0, maximum: 100_000 },
          },
        },
      },
    },
    async (request, reply) => {
      const query = toQuery(request.body);
      if (query === null) return reply.code(400).send({ error: 'invalid_period' });
      const { expectedTotal, expectedLines } = request.body;
      try {
        await mkdir(invoiceDir, { recursive: true });
        const invoice = await finaliseInvoice(
          db,
          request.params.folder,
          query,
          userId(request),
          now(),
          {
            invoiceDir,
            render,
            ...(expectedTotal === undefined
              ? {}
              : { expectedTotalCents: Math.round(expectedTotal * 100) }),
            ...(expectedLines === undefined ? {} : { expectedLines }),
          },
        );
        const lines = await db
          .selectFrom('invoice_lines')
          .select('print_record_id')
          .where('invoice_id', '=', invoice.id)
          .execute();
        await touched(lines.map((line) => line.print_record_id));
        return await reply.code(201).send({ id: invoice.id, number: invoice.number });
      } catch (error) {
        return billingError(reply, error);
      }
    },
  );

  /** Facturen: final invoices and credit notes, newest first. */
  app.get<{ Querystring: { customer?: string; kind?: InvoiceKind; q?: string } }>(
    '/api/invoices',
    {
      config: { auth: MANAGE },
      schema: {
        querystring: {
          type: 'object',
          additionalProperties: false,
          properties: {
            customer: { type: 'string', minLength: 1, maxLength: 255 },
            kind: { type: 'string', enum: ['invoice', 'credit'] },
            q: { type: 'string', maxLength: 100 },
          },
        },
      },
    },
    async (request) => {
      let query = db
        .selectFrom('invoices as i')
        .leftJoin('invoices as c', 'c.id', 'i.credits_invoice_id')
        .select([
          'i.id',
          'i.number',
          'i.kind',
          'i.customer_folder',
          'i.issued_on',
          'i.total_cents',
          'i.paid_cents',
          'i.open_cents',
          'c.number as credits_number',
          // Written off on this invoice's own orders, so the list can tell
          // "Afgeschreven" from "Betaald" (ScreenInvoices 1.9, GAP-082).
          (eb) =>
            eb
              .selectFrom('print_orders as o')
              .select((inner) =>
                inner.fn
                  .coalesce(inner.fn.sum<number>('o.written_off_cents'), inner.val(0))
                  .as('written_off'),
              )
              .whereRef('o.invoice_id', '=', 'i.id')
              .as('written_off_cents'),
        ])
        .orderBy('i.year', 'desc')
        .orderBy('i.sequence', 'desc');
      const { customer, kind } = request.query;
      if (customer !== undefined) query = query.where('i.customer_folder', '=', customer);
      if (kind !== undefined) query = query.where('i.kind', '=', kind);
      const rows = await query.execute();
      const term = request.query.q?.trim().toLocaleLowerCase('nl') ?? '';
      const matching =
        term === ''
          ? rows
          : rows.filter(
              (row) =>
                row.number.toLowerCase().includes(term) ||
                row.customer_folder.toLocaleLowerCase('nl').includes(term),
            );
      return {
        invoices: matching.map((row) => ({
          id: row.id,
          number: row.number,
          kind: row.kind,
          customer: row.customer_folder,
          issuedOn: row.issued_on,
          total: row.total_cents / 100,
          paid: row.paid_cents / 100,
          open: row.open_cents / 100,
          writtenOff: (row.written_off_cents ?? 0) / 100,
          creditsNumber: row.credits_number,
        })),
      };
    },
  );

  /** One invoice with its lines; `credited` marks lines a credit note already corrects. */
  app.get<{ Params: { id: string } }>(
    '/api/invoices/:id',
    { config: { auth: MANAGE }, schema: { params: invoiceParams } },
    async (request, reply) => {
      const invoice = await db
        .selectFrom('invoices')
        .selectAll()
        .where('id', '=', request.params.id)
        .executeTakeFirst();
      if (invoice === undefined) return reply.code(404).send({ error: 'not_found' });
      const lines = await db
        .selectFrom('invoice_lines')
        .selectAll()
        .where('invoice_id', '=', invoice.id)
        .orderBy('position')
        .execute();
      const credited =
        invoice.kind === 'invoice' ? await creditedOrders(db, invoice.id) : new Set();
      const credits =
        invoice.credits_invoice_id === null
          ? null
          : await db
              .selectFrom('invoices')
              .select(['id', 'number'])
              .where('id', '=', invoice.credits_invoice_id)
              .executeTakeFirst();
      const creditNotes = await db
        .selectFrom('invoices')
        .select(['id', 'number'])
        .where('credits_invoice_id', '=', invoice.id)
        .orderBy('sequence')
        .execute();
      return {
        id: invoice.id,
        number: invoice.number,
        kind: invoice.kind,
        customer: invoice.customer_folder,
        issuedOn: invoice.issued_on,
        periodFrom: invoice.period_from,
        periodTo: invoice.period_to,
        onlyOpen: invoice.only_open === 1,
        total: invoice.total_cents / 100,
        paid: invoice.paid_cents / 100,
        open: invoice.open_cents / 100,
        credits: credits ?? null,
        creditNotes,
        nextNumber: await nextInvoiceNumber(db, now()),
        lines: lines.map((line) => ({
          id: line.id,
          orderId: line.order_id,
          printId: line.print_record_id,
          description: line.description,
          project: line.project,
          date: line.line_date,
          grams: line.grams,
          amount: line.amount_cents / 100,
          paid: line.paid_cents / 100,
          status: line.status,
          credited: credited.has(line.order_id),
        })),
      };
    },
  );

  /** Download the stored PDF of a final invoice or credit note. */
  app.get<{ Params: { id: string } }>(
    '/api/invoices/:id/pdf',
    { config: { auth: MANAGE }, schema: { params: invoiceParams } },
    async (request, reply) => {
      const invoice = await db
        .selectFrom('invoices')
        .select(['number', 'kind', 'customer_folder', 'pdf_file'])
        .where('id', '=', request.params.id)
        .executeTakeFirst();
      if (invoice === undefined) return reply.code(404).send({ error: 'not_found' });
      let pdf: Buffer;
      try {
        pdf = await readFile(path.join(invoiceDir, path.basename(invoice.pdf_file)));
      } catch {
        request.log.error({ number: invoice.number }, 'stored invoice PDF is missing');
        return reply.code(404).send({ error: 'file_not_found' });
      }
      const label = invoice.kind === 'credit' ? 'Creditnota' : 'Factuur';
      return sendPdf(reply, pdf, safeFileName([label, invoice.number, invoice.customer_folder]));
    },
  );

  /** "Creditnota maken" (Admin) for chosen lines of a final invoice. */
  app.post<{ Params: { id: string }; Body: { lineIds: string[] } }>(
    '/api/invoices/:id/credit',
    {
      config: { auth: ADMIN },
      schema: {
        params: invoiceParams,
        body: {
          type: 'object',
          required: ['lineIds'],
          additionalProperties: false,
          properties: {
            lineIds: { type: 'array', minItems: 1, maxItems: 10_000, items: UUID },
          },
        },
      },
    },
    async (request, reply) => {
      try {
        await mkdir(invoiceDir, { recursive: true });
        const note = await createCreditNote(
          db,
          request.params.id,
          request.body.lineIds,
          userId(request),
          now(),
          { invoiceDir, render },
        );
        const lines = await db
          .selectFrom('invoice_lines')
          .select('print_record_id')
          .where('invoice_id', '=', note.id)
          .execute();
        await touched(lines.map((line) => line.print_record_id));
        return await reply.code(201).send({ id: note.id, number: note.number });
      } catch (error) {
        return billingError(reply, error);
      }
    },
  );

  // -------------------------------------------------------------------- logo

  app.addContentTypeParser(
    ['image/png', 'image/svg+xml'],
    { parseAs: 'buffer', bodyLimit: LOGO_MAX_BYTES },
    (_request, body, done) => {
      done(null, body);
    },
  );

  // Every signed-in role: the logo replaces the studio name in the AppShell (GAP-046).
  app.get('/api/settings/logo', async (_request, reply) => {
    const logo = await readLogo();
    if (logo === null) return reply.code(404).send({ error: 'not_found' });
    return reply
      .header('content-type', 'image/png')
      .header('cache-control', 'private, no-cache')
      .header('x-content-type-options', 'nosniff')
      .send(logo);
  });

  /**
   * Upload a PNG or SVG logo (at most 1 MB). An SVG is rasterised to PNG
   * here and only the PNG is kept and served, so no SVG ever reaches a
   * browser or a PDF.
   */
  app.put<{ Body: Buffer }>(
    '/api/settings/logo',
    { config: { auth: ADMIN }, bodyLimit: LOGO_MAX_BYTES },
    async (request, reply) => {
      const type = (request.headers['content-type'] ?? '').split(';')[0]?.trim();
      const body = request.body;
      if (!Buffer.isBuffer(body) || body.length === 0) {
        return reply.code(415).send({ error: 'unsupported_image' });
      }
      if (type === 'image/svg+xml') {
        // An SVG this container cannot draw in full is refused rather than
        // rasterised into a logo that is silently missing its text (GAP-104).
        const refusal = refuseSvg(body);
        if (refusal !== null) return reply.code(422).send({ error: refusal });
      }
      const png = type === 'image/svg+xml' ? rasterise(body) : body;
      if (png === null || !isPng(png)) return reply.code(400).send({ error: 'invalid_image' });
      await mkdir(path.dirname(logoFile), { recursive: true });
      await writeFile(logoFile, png);
      return reply.code(204).send();
    },
  );

  app.delete('/api/settings/logo', { config: { auth: ADMIN } }, async (_request, reply) => {
    await rm(logoFile, { force: true });
    return reply.code(204).send();
  });
}

/** A PNG that PDFKit can place: the signature and a decodable header. */
function isPng(data: Buffer): boolean {
  if (data.length < 8 || data.readUInt32BE(0) !== 0x89504e47) return false;
  try {
    const doc = new PDFDocument({ autoFirstPage: false });
    (doc as unknown as { openImage(src: Buffer): unknown }).openImage(data);
    return true;
  } catch {
    return false;
  }
}

/** SVG to PNG, without fetching anything the SVG refers to. */
function rasterise(svg: Buffer): Buffer | null {
  try {
    const image = new Resvg(svg, {
      fitTo: { mode: 'width', value: LOGO_WIDTH_PX },
      background: 'rgba(0,0,0,0)',
    });
    return Buffer.from(image.render().asPng());
  } catch {
    return null;
  }
}

/** "Factuur-2026-008-Joey.pdf": plain ASCII, safe in every header and file system. */
/** Where the uploaded logo is kept (always a PNG). */
export function logoPath(dataDir: string): string {
  return path.join(dataDir, 'branding', 'logo.png');
}

export function safeFileName(parts: readonly string[]): string {
  const name = parts
    .map((part) =>
      part
        .normalize('NFKD')
        .replace(/[̀-ͯ]/g, '')
        .replace(/[^A-Za-z0-9._-]+/g, '-')
        .replace(/-{2,}/g, '-')
        .replace(/^[-.]+|[-.]+$/g, ''),
    )
    .filter((part) => part !== '')
    .join('-')
    .slice(0, 120);
  return `${name === '' ? 'document' : name}.pdf`;
}
