import { readdir, rm, utimes } from 'node:fs/promises';
import path from 'node:path';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import type { Outstanding } from '../../src/finance/outstanding.js';
import { safeFileName } from '../../src/finance/billing-routes.js';
import type { PrintDetail, PrintSummary } from '../../src/prints/types.js';
import { startTestApp, type Session, type TestApp } from '../helpers/app.js';
import { TEST_DATABASES } from '../helpers/databases.js';
import { pdfFlatText, pdfPlainText } from '../helpers/pdf-text.js';
import { makePrintsTree } from '../helpers/prints-tree.js';

/** A 1 × 1 transparent PNG. */
const PNG = Buffer.from(
  'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==',
  'base64',
);
const SVG = Buffer.from(
  '<svg xmlns="http://www.w3.org/2000/svg" width="200" height="50"><rect width="200" height="50" fill="#141a33"/></svg>',
);

interface Preview {
  lines: { orderId: string; description: string; amount: number; paid: number; status: string }[];
  total: number;
  paid: number;
  open: number;
  excluded: string[];
  earlier: { description: string; invoiceNumber: string }[];
}

interface InvoiceDetail {
  id: string;
  number: string;
  kind: string;
  total: number;
  lines: { id: string; orderId: string; amount: number; credited: boolean }[];
  creditNotes: { id: string; number: string }[];
}

describe.each(TEST_DATABASES)('invoices and Openstaand on $name', ({ url }) => {
  let t: TestApp;
  let root: string;
  let admin: Session;
  let editor: Session;
  let helper: Session;

  const at = (iso: string) => new Date(iso);

  beforeEach(async () => {
    root = await makePrintsTree();
    // Order dates come from the newest counted G-code in the order.
    await utimes(
      path.join(root, 'Joey/Babybox locks/lock_PLA_3h27m.gcode'),
      at('2026-09-12T10:00:00Z'),
      at('2026-09-12T10:00:00Z'),
    );
    await utimes(
      path.join(root, 'Joey/loose_PLA_31m55s.gcode'),
      at('2026-09-20T10:00:00Z'),
      at('2026-09-20T10:00:00Z'),
    );
    for (const file of ['key_PLA_11m.gcode', 'key_PLA_11m copy.gcode']) {
      await utimes(
        path.join(root, 'Denise/Keychain', file),
        at('2026-10-01T10:00:00Z'),
        at('2026-10-01T10:00:00Z'),
      );
    }
    await utimes(
      path.join(root, 'Denise/Board game/parts.3mf'),
      at('2026-08-01T10:00:00Z'),
      at('2026-08-01T10:00:00Z'),
    );
    t = await startTestApp(url, { PRINTS_ROOT: root });
    await t.addUser('owner@example.org', 'Admin');
    await t.addUser('editor@example.org', 'Editor');
    await t.addUser('helper@example.org', 'User');
    admin = await t.login('owner@example.org');
    editor = await t.login('editor@example.org');
    helper = await t.login('helper@example.org');
    await t.as(admin, {
      method: 'PUT',
      url: '/api/settings/pricing',
      payload: {
        defaultMarkupPercent: 400,
        tariffEurPerKwh: 0.25,
        materialPricesPerKg: { PLA: 20 },
      },
    });
    const settings = (await t.as(admin, { url: '/api/settings' })).json<{
      printers: { key: string; watts: number | null }[];
    }>();
    await t.as(admin, {
      method: 'PUT',
      url: '/api/settings/printers',
      payload: settings.printers.map((p) => (p.key === 'k1max' ? { ...p, watts: 350 } : p)),
    });
    await t.as(admin, {
      method: 'PUT',
      url: '/api/settings/company',
      payload: {
        name: 'Voorbeeld 3D',
        iban: 'NL00 BANK 0000 0000 00',
        address: 'Voorbeeldstraat 1\n6000 AA Plaats',
        email: 'info@example.nl',
        phone: null,
      },
    });
    await t.app.services.indexer.indexAll();
  });

  afterEach(async () => {
    await t.close();
    await rm(root, { recursive: true, force: true });
  });

  const idOf = async (name: string) => {
    const items = (await t.as(admin, { url: '/api/prints?limit=100' })).json<{
      items: PrintSummary[];
    }>().items;
    const found = items.find((item) => item.name === name);
    if (found === undefined) throw new Error(`no print ${name}`);
    return found.id;
  };
  const detail = async (name: string) =>
    (await t.as(admin, { url: `/api/prints/${await idOf(name)}` })).json<PrintDetail>();
  const firstOrderId = async (name: string) => {
    const id = (await detail(name)).orders[0]?.id;
    if (id === undefined) throw new Error('no order');
    return id;
  };
  const getOutstanding = async () =>
    (await t.as(editor, { url: '/api/outstanding' })).json<Outstanding>();
  const preview = async (customer: string, query = '') =>
    (
      await t.as(editor, { url: `/api/customers/${customer}/invoice/preview${query}` })
    ).json<Preview>();
  const finalise = (customer: string, body: object = {}) =>
    t.as(editor, { method: 'POST', url: `/api/customers/${customer}/invoices`, payload: body });
  const invoice = async (id: string) =>
    (await t.as(editor, { url: `/api/invoices/${id}` })).json<InvoiceDetail>();

  it('lists what is still owed per klant, oldest first, with days open', async () => {
    const result = await getOutstanding();
    expect(result.groups.map((g) => g.customer)).toEqual(['Denise', 'Joey']);
    const joey = result.groups.find((g) => g.customer === 'Joey');
    expect(joey?.lines.map((l) => [l.printName, l.since, l.daysOpen, l.status])).toEqual([
      ['Babybox locks', '2026-09-12', 23, 'open'],
      ['Joey', '2026-09-20', 15, 'open'],
    ]);
    expect(joey?.lines[0]?.remaining).toBe(18.85);
    expect(joey?.oldestDays).toBe(23);
    expect(result.oldest).toMatchObject({ printName: 'Board game', days: 65 });
    expect(result.customers).toBe(2);
    const sum = result.groups.reduce((total, g) => total + Math.round(g.total * 100), 0);
    expect(Math.round(result.total * 100)).toBe(sum);
    // Wouter's print has no files, so no price: it is not owed and does not appear.
    expect(result.groups.some((g) => g.customer === 'Wouter')).toBe(false);

    // Partial payment: only the remainder counts; the sale price date starts the clock.
    const box = await firstOrderId('Babybox locks');
    t.clock.advance(24 * 3600 * 1000);
    editor = await t.login('editor@example.org');
    admin = await t.login('owner@example.org');
    await t.as(editor, {
      method: 'PUT',
      url: `/api/orders/${box}/sale-price`,
      payload: { salePrice: 20 },
    });
    await t.as(editor, {
      method: 'POST',
      url: `/api/orders/${box}/payments`,
      payload: { amount: 5 },
    });
    const after = (await getOutstanding()).groups.find((g) => g.customer === 'Joey');
    expect(after?.lines.find((l) => l.printName === 'Babybox locks')).toMatchObject({
      status: 'partial',
      price: 20,
      paid: 5,
      remaining: 15,
      since: '2026-10-06',
      daysOpen: 0,
    });

    // Written-off orders and niet-factureren klanten never appear.
    await t.as(editor, { method: 'POST', url: `/api/orders/${box}/write-off`, payload: {} });
    await t.as(admin, {
      method: 'PUT',
      url: '/api/customers/Denise/billing',
      payload: { noBilling: true },
    });
    const last = await getOutstanding();
    expect(last.groups.map((g) => g.customer)).toEqual(['Joey']);
    expect(last.groups[0]?.lines.map((l) => l.printName)).toEqual(['Joey']);
  });

  it('marks everything of one klant paid', async () => {
    const response = await t.as(editor, { method: 'POST', url: '/api/outstanding/Joey/mark-paid' });
    expect(response.statusCode).toBe(200);
    expect(response.json<{ orders: number }>().orders).toBe(2);
    expect((await getOutstanding()).groups.map((g) => g.customer)).toEqual(['Denise']);
    expect((await detail('Babybox locks')).orders[0]?.status).toBe('paid');
    const again = await t.as(editor, { method: 'POST', url: '/api/outstanding/Joey/mark-paid' });
    expect(again.statusCode).toBe(409);
    expect(again.json()).toEqual({ error: 'nothing_open' });
  });

  it('writes a reminder with the open lines only', async () => {
    const box = await firstOrderId('Babybox locks');
    await t.as(editor, {
      method: 'POST',
      url: `/api/orders/${box}/payments`,
      payload: { amount: 5 },
    });
    const response = await t.as(editor, { url: '/api/customers/Joey/reminder.pdf' });
    expect(response.statusCode).toBe(200);
    expect(response.headers['content-type']).toBe('application/pdf');
    expect(response.headers['content-disposition']).toBe(
      'attachment; filename="Herinnering-Joey-2026-10-05.pdf"',
    );
    const text = pdfFlatText(response.rawPayload);
    expect(text).toContain('Herinnering');
    expect(text).toContain('Openstaande prints');
    expect(text).toContain('Beste Joey, volgens onze administratie');
    expect(text).toContain('€ 13,85');
    expect(text).toContain('Deels betaald');
    expect(text).toContain('Totaal openstaand');
    expect(text).toContain('onder vermelding van Joey.');
    expect(text).toContain('Pagina 1 van 1');
  });

  it('previews an invoice and leaves out prints without a price', async () => {
    const joey = await preview('Joey');
    expect(joey.lines.map((l) => [l.description, l.status])).toEqual([
      ['Babybox locks', 'open'],
      ['Joey', 'open'],
    ]);
    expect(joey.excluded).toEqual([]);
    expect(joey.total).toBe(joey.open);

    const wouter = await preview('Wouter');
    expect(wouter.lines).toEqual([]);
    expect(wouter.excluded).toEqual(['Empty']);

    // The period filters on the order date (inclusive), in Europe/Amsterdam.
    const september = await preview('Joey', '?from=2026-09-13&to=2026-09-20');
    expect(september.lines.map((l) => l.description)).toEqual(['Joey']);
    expect(
      (
        await t.as(editor, {
          url: '/api/customers/Joey/invoice/preview?from=2026-10-01&to=2026-09-01',
        })
      ).statusCode,
    ).toBe(400);

    // A full invoice includes paid orders; "Alleen openstaand" shows the remainder.
    const box = await firstOrderId('Babybox locks');
    await t.as(editor, {
      method: 'POST',
      url: `/api/orders/${box}/payments`,
      payload: { amount: 5 },
    });
    const loose = await firstOrderId('Joey');
    const looseOpen = (await preview('Joey')).lines.find((l) => l.description === 'Joey');
    await t.as(editor, {
      method: 'POST',
      url: `/api/orders/${loose}/payments`,
      payload: { amount: looseOpen?.amount },
    });
    const full = await preview('Joey');
    expect(full.lines.map((l) => [l.description, l.status, l.paid])).toEqual([
      ['Babybox locks', 'partial', 5],
      ['Joey', 'paid', looseOpen?.amount],
    ]);
    const onlyOpen = await preview('Joey', '?onlyOpen=true');
    expect(onlyOpen.lines.map((l) => [l.description, l.amount, l.paid])).toEqual([
      ['Babybox locks', 13.85, 0],
    ]);
    expect(onlyOpen.total).toBe(13.85);

    // Niet factureren: no invoice at all; an unknown klant is not found.
    await t.as(admin, {
      method: 'PUT',
      url: '/api/customers/Joey/billing',
      payload: { noBilling: true },
    });
    expect((await t.as(editor, { url: '/api/customers/Joey/invoice/preview' })).json()).toEqual({
      error: 'not_billed',
    });
    expect((await t.as(editor, { url: '/api/customers/Nobody/invoice/preview' })).statusCode).toBe(
      404,
    );
  });

  it('downloads an unnumbered concept with the klant as reference', async () => {
    const response = await t.as(editor, { url: '/api/customers/Joey/invoice/concept.pdf' });
    expect(response.statusCode).toBe(200);
    expect(response.headers['content-disposition']).toBe(
      'attachment; filename="Concept-Joey-2026-10-05.pdf"',
    );
    const text = pdfFlatText(response.rawPayload);
    expect(text).toContain('CONCEPT — nog niet definitief');
    expect(text).toContain('wordt toegekend bij definitief maken');
    expect(text).toContain('12 sep 2026 – 20 sep 2026');
    expect(text).toContain('onder vermelding van Joey.');
    // Nothing is stored or locked.
    expect((await t.as(editor, { url: '/api/invoices' })).json()).toEqual({ invoices: [] });
    expect(
      (await t.as(editor, { url: '/api/customers/Wouter/invoice/concept.pdf' })).json(),
    ).toEqual({ error: 'no_lines' });
  });

  it('finalises with yearly numbering, stores the PDF and locks the orders', async () => {
    const draft = await preview('Joey');
    expect((draft as Preview & { nextNumber: string }).nextNumber).toBe('2026-001');
    const changed = await finalise('Joey', { expectedTotal: draft.total + 1 });
    expect(changed.statusCode).toBe(409);
    expect(changed.json()).toEqual({ error: 'changed' });

    const created = await finalise('Joey', {
      expectedTotal: draft.total,
      expectedLines: draft.lines.length,
    });
    expect(created.statusCode).toBe(201);
    const { id, number } = created.json<{ id: string; number: string }>();
    expect(number).toBe('2026-001');

    // A second invoice for the same period finds nothing left; earlier lines are named.
    expect((await finalise('Joey')).json()).toEqual({ error: 'no_lines' });
    expect((await preview('Joey')).earlier).toEqual([
      { description: 'Babybox locks', invoiceNumber: '2026-001' },
      { description: 'Joey', invoiceNumber: '2026-001' },
    ]);
    expect((await finalise('Denise')).json<{ number: string }>().number).toBe('2026-002');

    // The PDF is stored under DATA_DIR/invoices and downloads with a safe ASCII name.
    expect(await readdir(path.join(t.config.dataDir, 'invoices'))).toEqual([
      '2026-001.pdf',
      '2026-002.pdf',
    ]);
    const pdf = await t.as(editor, { url: `/api/invoices/${id}/pdf` });
    expect(pdf.headers['content-disposition']).toBe(
      'attachment; filename="Factuur-2026-001-Joey.pdf"',
    );
    const text = pdfFlatText(pdf.rawPayload);
    expect(text).toContain('Factuurnummer 2026-001');
    expect(text).toContain('Voorbeeld 3D');
    expect(text).toContain('€ 18,85');
    expect(text).toContain('onder vermelding van 2026-001.');

    // The orders are locked: the suggestion became the sale price; changes are refused.
    const box = await detail('Babybox locks');
    expect(box.orders[0]).toMatchObject({
      salePrice: 18.85,
      priceSuggested: false,
      invoice: { id, number: '2026-001' },
    });
    const orderId = box.orders[0]?.id ?? '';
    for (const request of [
      { url: `/api/orders/${orderId}/sale-price`, payload: { salePrice: 30 } },
      {
        url: `/api/orders/${orderId}/overrides`,
        payload: { pricePerKg: 1, grams: null, printSeconds: null },
      },
    ]) {
      const response = await t.as(editor, { method: 'PUT', ...request });
      expect(response.json()).toEqual({ error: 'locked' });
    }
    // "Spoel voor de hele print" skips a locked order and keeps its cost (1.6).
    const costBefore = box.orders[0]?.cost?.totalCost ?? null;
    const spool = await t.as(editor, {
      method: 'PUT',
      url: `/api/prints/${box.id}/spool`,
      payload: { spoolId: null },
    });
    expect(spool.statusCode).toBe(200);
    expect(spool.json()).toEqual({ changed: 0, skipped: 1 });
    expect((await detail('Babybox locks')).orders[0]?.cost?.totalCost).toBe(costBefore);

    const line = box.assets?.find((a) => a.fileName === 'lock_PLA_3h27m.gcode')?.lines.at(0);
    const times = await t.as(editor, {
      method: 'PUT',
      url: `/api/prints/${box.id}/lines/${line?.id ?? ''}/times`,
      payload: { timesPrinted: 3 },
    });
    expect(times.json()).toEqual({ error: 'locked' });
    const bulk = await t.as(editor, {
      method: 'POST',
      url: '/api/prints/bulk',
      payload: { action: 'setPrice', ids: [box.id], salePrice: 50 },
    });
    expect(bulk.json()).toEqual({
      results: [
        { id: box.id, ok: false, error: 'locked', orderNumber: 1, invoiceNumber: '2026-001' },
      ],
    });
    // Payments still go on: the invoice is open until it is paid.
    expect(
      (
        await t.as(editor, {
          method: 'POST',
          url: `/api/orders/${orderId}/payments`,
          payload: { amount: 18.85 },
        })
      ).statusCode,
    ).toBe(201);

    // The register lists both, newest first.
    const register = (await t.as(editor, { url: '/api/invoices' })).json<{
      invoices: { number: string; customer: string; kind: string }[];
    }>().invoices;
    expect(register.map((i) => [i.number, i.customer, i.kind])).toEqual([
      ['2026-002', 'Denise', 'invoice'],
      ['2026-001', 'Joey', 'invoice'],
    ]);
    const filtered = (await t.as(editor, { url: '/api/invoices?q=deni' })).json<{
      invoices: unknown[];
    }>();
    expect(filtered.invoices).toHaveLength(1);

    // A new year starts at 001 again.
    t.clock.advance(90 * 24 * 3600 * 1000);
    editor = await t.login('editor@example.org');
    await t.as(editor, {
      method: 'POST',
      url: `/api/prints/${box.id}/orders`,
      payload: { items: [{ lineId: line?.id ?? '', timesPrinted: 1 }] },
    });
    const next = await finalise('Joey');
    expect(next.json<{ number: string }>().number).toBe('2027-001');
  });

  it('refuses to finalise without name and IBAN; footers follow the rules (GAP-037)', async () => {
    await t.as(admin, {
      method: 'PUT',
      url: '/api/settings/company',
      payload: { name: 'Voorbeeld 3D', iban: '', address: '', email: null, phone: null },
    });
    expect((await preview('Joey')) as Preview & { companyReady: boolean }).toMatchObject({
      companyReady: false,
    });
    expect((await finalise('Joey')).json()).toEqual({ error: 'company_incomplete' });
    // A concept still works, without the payment sentence.
    const concept = await t.as(editor, { url: '/api/customers/Joey/invoice/concept.pdf' });
    expect(concept.statusCode).toBe(200);
    expect(pdfFlatText(concept.rawPayload)).not.toContain('overmaken naar IBAN');

    await t.as(admin, {
      method: 'PUT',
      url: '/api/settings/company',
      payload: {
        name: 'Voorbeeld 3D',
        iban: 'NL00 BANK 0000 0000 00',
        address: '',
        email: null,
        phone: null,
      },
    });
    // Everything paid: the invoice says so instead of asking for € 0,00.
    await t.as(editor, { method: 'POST', url: '/api/outstanding/Joey/mark-paid' });
    const created = await finalise('Joey');
    expect(created.statusCode).toBe(201);
    const pdf = await t.as(editor, {
      url: `/api/invoices/${created.json<{ id: string }>().id}/pdf`,
    });
    const text = pdfFlatText(pdf.rawPayload);
    expect(text).toContain('Deze factuur is volledig betaald.');
    expect(text).not.toContain('overmaken');
    // The logo is readable for every signed-in role (it replaces the name in the AppShell).
    expect((await t.as(helper, { url: '/api/settings/logo' })).statusCode).toBe(404);
  });

  it('gives concurrent finalisations distinct numbers and one invoice per order', async () => {
    const [joey, denise] = await Promise.all([finalise('Joey'), finalise('Denise')]);
    const numbers = [joey, denise].map((r) => r.json<{ number: string }>().number).sort();
    expect(numbers).toEqual(['2026-001', '2026-002']);

    const box = await detail('Babybox locks');
    // "Spoel voor de hele print" skips a locked order and keeps its cost (1.6).
    const costBefore = box.orders[0]?.cost?.totalCost ?? null;
    const spool = await t.as(editor, {
      method: 'PUT',
      url: `/api/prints/${box.id}/spool`,
      payload: { spoolId: null },
    });
    expect(spool.statusCode).toBe(200);
    expect(spool.json()).toEqual({ changed: 0, skipped: 1 });
    expect((await detail('Babybox locks')).orders[0]?.cost?.totalCost).toBe(costBefore);

    const line = box.assets?.find((a) => a.fileName === 'lock_PLA_3h27m.gcode')?.lines.at(0);
    await t.as(editor, {
      method: 'POST',
      url: `/api/prints/${box.id}/orders`,
      payload: { items: [{ lineId: line?.id ?? '', timesPrinted: 1 }] },
    });
    const [first, second] = await Promise.all([finalise('Joey'), finalise('Joey')]);
    expect([first.statusCode, second.statusCode].sort()).toEqual([201, 409]);
    const register = (await t.as(editor, { url: '/api/invoices' })).json<{ invoices: unknown[] }>();
    expect(register.invoices).toHaveLength(3);
  });

  it('credits chosen lines (Admin) and writes off what was still open', async () => {
    const box = await firstOrderId('Babybox locks');
    await t.as(editor, {
      method: 'POST',
      url: `/api/orders/${box}/payments`,
      payload: { amount: 5 },
    });
    const { id } = (await finalise('Joey')).json<{ id: string }>();
    const original = await invoice(id);
    const boxLine = original.lines.find((l) => l.orderId === box);
    if (boxLine === undefined) throw new Error('line missing');

    expect(
      (
        await t.as(editor, {
          method: 'POST',
          url: `/api/invoices/${id}/credit`,
          payload: { lineIds: [boxLine.id] },
        })
      ).statusCode,
    ).toBe(403);
    const created = await t.as(admin, {
      method: 'POST',
      url: `/api/invoices/${id}/credit`,
      payload: { lineIds: [boxLine.id] },
    });
    expect(created.statusCode).toBe(201);
    const note = created.json<{ id: string; number: string }>();
    expect(note.number).toBe('2026-002');

    const credit = await invoice(note.id);
    expect(credit).toMatchObject({ kind: 'credit', total: -18.85 });
    expect((await invoice(id)).lines.find((l) => l.id === boxLine.id)?.credited).toBe(true);
    expect((await invoice(id)).creditNotes).toEqual([{ id: note.id, number: '2026-002' }]);

    // Written off for the credited amount, capped at what was open; paid stays paid.
    const order = (await detail('Babybox locks')).orders[0];
    expect(order).toMatchObject({
      status: 'writtenOff',
      paid: 5,
      remaining: 0,
      writtenOff: { amount: 13.85, reason: 'Creditnota 2026-002' },
    });

    const again = await t.as(admin, {
      method: 'POST',
      url: `/api/invoices/${id}/credit`,
      payload: { lineIds: [boxLine.id] },
    });
    expect(again.json()).toEqual({ error: 'already_credited' });
    const ofCredit = await t.as(admin, {
      method: 'POST',
      url: `/api/invoices/${note.id}/credit`,
      payload: { lineIds: [boxLine.id] },
    });
    expect(ofCredit.json()).toEqual({ error: 'not_an_invoice' });

    const pdf = await t.as(editor, { url: `/api/invoices/${note.id}/pdf` });
    expect(pdf.headers['content-disposition']).toBe(
      'attachment; filename="Creditnota-2026-002-Joey.pdf"',
    );
    const text = pdfFlatText(pdf.rawPayload);
    expect(text).toContain('Creditnummer 2026-002');
    expect(text).toContain('factuur 2026-001');
    expect(text).toContain('€ -18,85');
    expect(text).toContain('Deze creditnota corrigeert factuur 2026-001.');
    expect(
      (await t.as(editor, { url: '/api/invoices?kind=credit' })).json<{ invoices: unknown[] }>()
        .invoices,
    ).toHaveLength(1);
  });

  it('stores a PNG or SVG logo as PNG and puts it on the invoice', async () => {
    const upload = (body: Buffer, type: string, session = admin) =>
      t.as(session, {
        method: 'PUT',
        url: '/api/settings/logo',
        headers: { 'content-type': type },
        payload: body,
      });
    expect((await t.as(admin, { url: '/api/settings/logo' })).statusCode).toBe(404);
    expect((await upload(PNG, 'image/png')).statusCode).toBe(204);
    const stored = await t.as(admin, { url: '/api/settings/logo' });
    expect(stored.headers['content-type']).toBe('image/png');
    expect(stored.rawPayload.equals(PNG)).toBe(true);

    expect((await upload(SVG, 'image/svg+xml')).statusCode).toBe(204);
    const raster = (await t.as(admin, { url: '/api/settings/logo' })).rawPayload;
    expect(raster.subarray(1, 4).toString('latin1')).toBe('PNG');
    expect(raster.readUInt32BE(16)).toBe(800);

    expect((await upload(Buffer.from('<svg'), 'image/svg+xml')).json()).toEqual({
      error: 'invalid_image',
    });
    // An SVG this container cannot draw in full is refused with its reason,
    // rather than rasterised into a logo missing its text (GAP-104).
    const withText = Buffer.from(
      '<svg xmlns="http://www.w3.org/2000/svg" width="200" height="50"><text x="0" y="20">meels</text></svg>',
    );
    const refusedText = await upload(withText, 'image/svg+xml');
    expect(refusedText.statusCode).toBe(422);
    expect(refusedText.json()).toEqual({ error: 'svg_text' });
    const external = Buffer.from(
      '<svg xmlns="http://www.w3.org/2000/svg"><image href="https://example.test/a.png"/></svg>',
    );
    expect((await upload(external, 'image/svg+xml')).json()).toEqual({ error: 'svg_external' });
    // A refused upload leaves the stored logo as it was.
    expect((await t.as(admin, { url: '/api/settings/logo' })).rawPayload.readUInt32BE(16)).toBe(
      800,
    );
    expect((await upload(Buffer.from('not a png at all'), 'image/png')).json()).toEqual({
      error: 'invalid_image',
    });
    expect((await upload(Buffer.alloc(1024 * 1024 + 1), 'image/png')).statusCode).toBe(413);
    expect((await upload(PNG, 'image/gif')).statusCode).toBe(415);
    expect((await upload(PNG, 'image/png', editor)).statusCode).toBe(403);

    // With a logo the PDF draws an image in place of the company name.
    const pdf = await t.as(editor, { url: '/api/customers/Joey/invoice/concept.pdf' });
    expect(pdf.rawPayload.toString('latin1')).toContain('/Subtype /Image');
    expect(pdfPlainText(pdf.rawPayload)).not.toMatch(/^Voorbeeld 3D$/m);

    expect((await t.as(admin, { method: 'DELETE', url: '/api/settings/logo' })).statusCode).toBe(
      204,
    );
    expect((await t.as(admin, { url: '/api/settings/logo' })).statusCode).toBe(404);
  });

  it('shows Users Openstaand for their own klanten only, without actions', async () => {
    expect((await t.as(helper, { url: '/api/outstanding' })).json<Outstanding>().groups).toEqual(
      [],
    );
    const helperId = (
      await t.db
        .selectFrom('users')
        .select('id')
        .where('login', '=', 'helper@example.org')
        .executeTakeFirstOrThrow()
    ).id;
    await t.as(admin, {
      method: 'PATCH',
      url: '/api/access',
      payload: { changes: [{ userId: helperId, customerFolder: 'Joey', granted: true }] },
    });
    const mine = (await t.as(helper, { url: '/api/outstanding' })).json<Outstanding>();
    expect(mine.groups.map((g) => g.customer)).toEqual(['Joey']);
    expect(mine.customers).toBe(1);
    expect(
      (await t.as(helper, { method: 'POST', url: '/api/outstanding/Joey/mark-paid' })).statusCode,
    ).toBe(403);
    expect((await t.as(helper, { url: '/api/customers/Joey/reminder.pdf' })).statusCode).toBe(403);
  });
});

describe('safe download names', () => {
  it('keeps plain ASCII', () => {
    expect(safeFileName(['Factuur', '2026-001', 'Zoë & Daan / "test"'])).toBe(
      'Factuur-2026-001-Zoe-Daan-test.pdf',
    );
    expect(safeFileName(['Concept', '日本', '2026-10-05'])).toBe('Concept-2026-10-05.pdf');
    expect(safeFileName(['..', '///'])).toBe('document.pdf');
  });
});
