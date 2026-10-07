import { rm } from 'node:fs/promises';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import type { PrintDetail, PrintSummary } from '../../src/prints/types.js';
import type { ShareLinkSummary } from '../../src/sharing/links.js';
import type { ShareView } from '../../src/sharing/overview.js';
import { startTestApp, type Session, type TestApp } from '../helpers/app.js';
import { TEST_DATABASES } from '../helpers/databases.js';
import { pdfPlainText } from '../helpers/pdf-text.js';
import { makePrintsTree } from '../helpers/prints-tree.js';

/** A 1 × 1 transparent PNG. */
const PNG = Buffer.from(
  'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==',
  'base64',
);
const DAY = 24 * 3600 * 1000;

interface Created {
  link: ShareLinkSummary;
  token: string;
  url: string;
}

describe.each(TEST_DATABASES)('Deel-links on $name', ({ url }) => {
  let t: TestApp;
  let root: string;
  let admin: Session;
  let editor: Session;
  let helper: Session;

  const start = async (env: Record<string, string> = {}, options: { company?: boolean } = {}) => {
    t = await startTestApp(url, { PRINTS_ROOT: root, ...env });
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
    if (options.company !== false) {
      await t.as(admin, {
        method: 'PUT',
        url: '/api/settings/company',
        payload: {
          name: 'Voorbeeld 3D',
          iban: 'NL00 BANK 0000 0000 00',
          address: 'Voorbeeldstraat 1',
          email: null,
          phone: null,
        },
      });
    }
    await t.app.services.indexer.indexAll();
  };

  beforeEach(async () => {
    root = await makePrintsTree();
  });

  afterEach(async () => {
    await t.close();
    await rm(root, { recursive: true, force: true });
  });

  const create = async (
    customer: string,
    expiresInDays: 7 | 30 | 90 | null = 30,
    label = 'Q4 overzicht',
  ) => {
    const response = await t.as(admin, {
      method: 'POST',
      url: '/api/share-links',
      payload: { customer, label, expiresInDays },
    });
    expect(response.statusCode).toBe(201);
    return response.json<Created>();
  };
  const view = async (token: string, query = '') =>
    (await t.as(null, { url: `/api/share/${token}${query}` })).json<ShareView>();
  const orderOf = async (name: string) => {
    const items = (await t.as(admin, { url: '/api/prints?limit=100' })).json<{
      items: PrintSummary[];
    }>().items;
    const id = items.find((item) => item.name === name)?.id ?? '';
    const detail = (await t.as(admin, { url: `/api/prints/${id}` })).json<PrintDetail>();
    return { printId: id, orderId: detail.orders[0]?.id ?? '' };
  };

  it('creates a link once with its token, lists it without and lets only Admins manage', async () => {
    await start();
    const created = await create('Joey');
    expect(created.token).toMatch(/^[A-Za-z0-9_-]{43}$/);
    expect(created.url).toBe(`http://localhost:80/share/${created.token}`);
    expect(created.link).toMatchObject({
      customer: 'Joey',
      label: 'Q4 overzicht',
      status: 'active',
      expiresAt: '2026-11-04T10:00:00.000Z',
    });

    const list = await t.as(admin, { url: '/api/share-links' });
    expect(list.statusCode).toBe(200);
    expect(list.body).not.toContain(created.token);
    expect(list.body).not.toMatch(/token/i);
    expect(list.json<{ links: ShareLinkSummary[] }>().links).toEqual([created.link]);

    for (const session of [editor, helper]) {
      expect((await t.as(session, { url: '/api/share-links' })).statusCode).toBe(403);
      const denied = await t.as(session, {
        method: 'POST',
        url: '/api/share-links',
        payload: { customer: 'Joey', label: 'x', expiresInDays: 7 },
      });
      expect(denied.statusCode).toBe(403);
    }
    // Unknown klant, empty label and an expiry outside the choices are refused.
    const unknown = await t.as(admin, {
      method: 'POST',
      url: '/api/share-links',
      payload: { customer: 'Nobody', label: 'x', expiresInDays: 7 },
    });
    expect(unknown.statusCode).toBe(404);
    const blank = await t.as(admin, {
      method: 'POST',
      url: '/api/share-links',
      payload: { customer: 'Joey', label: '   ', expiresInDays: 7 },
    });
    expect(blank.statusCode).toBe(400);
    const odd = await t.as(admin, {
      method: 'POST',
      url: '/api/share-links',
      payload: { customer: 'Joey', label: 'x', expiresInDays: 14 },
    });
    expect(odd.statusCode).toBe(400);
  });

  it('shows one line per order with the customer price only, never cost', async () => {
    await start();
    const box = await orderOf('Babybox locks');
    await t.as(editor, {
      method: 'PUT',
      url: `/api/orders/${box.orderId}/sale-price`,
      payload: { salePrice: 20 },
    });
    await t.as(editor, {
      method: 'POST',
      url: `/api/orders/${box.orderId}/payments`,
      payload: { amount: 5 },
    });
    const { token } = await create('Joey');
    const response = await t.as(null, { url: `/api/share/${token}` });
    expect(response.statusCode).toBe(200);
    expect(response.headers['cache-control']).toBe('private, no-store');
    const data = response.json<ShareView>();
    expect(data).toMatchObject({
      billed: true,
      customer: 'Joey',
      studio: { name: 'Voorbeeld 3D', hasLogo: false },
    });
    // The label is internal: it never reaches the klant (ScreenSharePage 1.9).
    expect(response.body).not.toContain('Q4 overzicht');
    if (!data.billed) throw new Error('billed view expected');
    expect(data.lines.map((line) => line.description)).toEqual(['Babybox locks', 'Joey']);
    expect(data.lines[0]).toMatchObject({
      price: 20,
      paid: 5,
      remaining: 15,
      status: 'partial',
      project: 'Babybox locks',
    });
    // No internal values in the response at all.
    for (const word of ['cost', 'gram', 'markup', 'margin', 'note', 'gcode', 'fileName', 'spool']) {
      expect(response.body.toLowerCase()).not.toContain(word.toLowerCase());
    }
    expect(data.totals.paid).toBe(5);
    expect(Math.round(data.totals.open * 100)).toBe(
      Math.round((data.totals.total - data.totals.paid) * 100),
    );

    // "Alleen openstaand", and extra invoice-style parameters are ignored.
    await t.as(editor, {
      method: 'POST',
      url: `/api/orders/${(await orderOf('Joey')).orderId}/payments`,
      payload: { amount: data.lines[1]?.remaining ?? 0 },
    });
    const open = await view(token, '?onlyOpen=true&from=2000-01-01&customer=Denise&markup=1');
    expect(open.customer).toBe('Joey');
    expect(open.lines.map((line) => line.description)).toEqual(['Babybox locks']);
  });

  it('hides written-off orders and deleted prints, keeps archived ones, and says Prijs volgt', async () => {
    await start();
    const box = await orderOf('Babybox locks');
    await t.as(editor, {
      method: 'POST',
      url: `/api/orders/${box.orderId}/write-off`,
      payload: {},
    });
    const { token } = await create('Joey');
    expect((await view(token)).lines.map((line) => line.description)).toEqual(['Joey']);

    const loose = await orderOf('Joey');
    await rm(`${root}/Joey/loose_PLA_31m55s.gcode`);
    await t.app.services.indexer.indexAll();
    const archived = await view(token);
    expect(archived.lines.map((line) => line.description)).toEqual(['Joey']);
    await t.as(editor, { method: 'DELETE', url: `/api/prints/${loose.printId}` });
    expect((await view(token)).lines).toEqual([]);
    // Once every print of the klant is deleted, the link answers like an unknown one.
    await t.as(editor, { method: 'DELETE', url: `/api/prints/${box.printId}` });
    expect((await t.as(null, { url: `/api/share/${token}` })).statusCode).toBe(404);

    const wouter = await create('Wouter');
    const plain = await view(wouter.token);
    if (!plain.billed) throw new Error('billed view expected');
    expect(plain.lines).toEqual([
      expect.objectContaining({ description: 'Empty', price: null, status: 'noPrice' }),
    ]);
    expect(plain.totals).toEqual({ total: 0, paid: 0, open: 0 });
  });

  it('answers unknown, malformed, expired and revoked tokens the same way', async () => {
    await start();
    const week = await create('Joey', 7);
    const never = await create('Joey', null, 'Altijd');
    const revoked = await create('Denise', 90);
    const revoke = await t.as(admin, {
      method: 'POST',
      url: `/api/share-links/${revoked.link.id}/revoke`,
    });
    expect(revoke.statusCode).toBe(204);
    expect(
      (await t.as(admin, { method: 'POST', url: `/api/share-links/${revoked.link.id}/revoke` }))
        .statusCode,
    ).toBe(404);
    t.clock.advance(8 * DAY);

    const answers = await Promise.all(
      [week.token, revoked.token, 'A'.repeat(43), 'short', `${never.token.slice(0, 42)}!`].flatMap(
        (token) => [
          t.as(null, { url: `/api/share/${encodeURIComponent(token)}` }),
          t.as(null, { url: `/api/share/${encodeURIComponent(token)}/overview.pdf` }),
          t.as(null, { url: `/api/share/${encodeURIComponent(token)}/logo` }),
        ],
      ),
    );
    for (const answer of answers) {
      expect(answer.statusCode).toBe(404);
      expect(answer.body).toBe('{"error":"not_found"}');
    }
    // A link without expiry still works.
    expect((await t.as(null, { url: `/api/share/${never.token}` })).statusCode).toBe(200);
    admin = await t.login('owner@example.org');
    const statuses = (await t.as(admin, { url: '/api/share-links' }))
      .json<{ links: ShareLinkSummary[] }>()
      .links.map((link) => [link.customer, link.label, link.status])
      .sort();
    expect(statuses).toEqual([
      ['Denise', 'Q4 overzicht', 'revoked'],
      ['Joey', 'Altijd', 'active'],
      ['Joey', 'Q4 overzicht', 'expired'],
    ]);
  });

  it('gives a niet-factureren klant the print list without amounts and no PDF', async () => {
    await start();
    await t.as(admin, {
      method: 'PUT',
      url: '/api/customers/Denise/billing',
      payload: { noBilling: true },
    });
    const { token } = await create('Denise');
    const response = await t.as(null, { url: `/api/share/${token}?onlyOpen=true` });
    const data = response.json<ShareView>();
    expect(data.billed).toBe(false);
    expect(data.lines.length).toBeGreaterThan(0);
    for (const line of data.lines) {
      expect(Object.keys(line).sort()).toEqual(['date', 'description', 'id', 'printId', 'project']);
    }
    expect(response.body).not.toMatch(/price|paid|total|open/i);
    const pdf = await t.as(null, { url: `/api/share/${token}/overview.pdf` });
    expect(pdf.statusCode).toBe(404);
  });

  it('renders the Overzicht PDF with Geldig tot, and without it for Nooit', async () => {
    await start();
    const { token } = await create('Joey', 30, 'Q4 overzicht');
    const response = await t.as(null, { url: `/api/share/${token}/overview.pdf` });
    expect(response.statusCode).toBe(200);
    expect(response.headers['content-type']).toBe('application/pdf');
    expect(response.headers['content-disposition']).toBe(
      'attachment; filename="Overzicht-Joey-2026-10-05.pdf"',
    );
    const text = pdfPlainText(response.rawPayload);
    for (const part of [
      'Overzicht',
      'Geldig tot',
      '4 nov 2026',
      'Babybox locks',
      'Dit is een overzicht, geen factuur.',
      'onder vermelding van Joey.',
    ]) {
      expect(text).toContain(part);
    }
    expect(text).not.toMatch(/kosten|marge|gcode/i);

    const never = await create('Joey', null, 'Altijd');
    const noExpiry = pdfPlainText(
      (await t.as(null, { url: `/api/share/${never.token}/overview.pdf` })).rawPayload,
    );
    expect(noExpiry).not.toContain('Geldig tot');

    const wouter = await create('Wouter');
    const pending = pdfPlainText(
      (await t.as(null, { url: `/api/share/${wouter.token}/overview.pdf` })).rawPayload,
    );
    expect(pending).toContain('Prijs volgt');
  });

  it('renders the Overzicht PDF on a fresh install, before Bedrijfsgegevens is filled in', async () => {
    await start({}, { company: false });
    const { token } = await create('Joey');
    const response = await t.as(null, { url: `/api/share/${token}/overview.pdf` });
    expect(response.statusCode).toBe(200);
    const text = pdfPlainText(response.rawPayload);
    expect(text).toContain('Overzicht');
    expect(text).toContain('Dit is een overzicht, geen factuur.');
    // Without a name and IBAN there is nothing to pay to, so no payment sentence.
    expect(text).not.toContain('overmaken');
  });

  it('leaves the totals block out of the PDF while no print has a price', async () => {
    await start();
    // Wouter's print has no files, so no price at all.
    const { token } = await create('Wouter');
    const text = pdfPlainText(
      (await t.as(null, { url: `/api/share/${token}/overview.pdf` })).rawPayload,
    );
    expect(text).toContain('Prijs volgt');
    expect(text).toContain('Dit is een overzicht, geen factuur.');
    for (const word of ['Totaal', 'Betaald', 'Openstaand', 'overmaken']) {
      expect(text).not.toContain(word);
    }
  });

  it('serves the logo through a working link only', async () => {
    await start();
    const { token } = await create('Joey');
    expect((await t.as(null, { url: `/api/share/${token}/logo` })).statusCode).toBe(404);
    await t.as(admin, {
      method: 'PUT',
      url: '/api/settings/logo',
      headers: { 'content-type': 'image/png' },
      payload: PNG,
    });
    const logo = await t.as(null, { url: `/api/share/${token}/logo` });
    expect(logo.statusCode).toBe(200);
    expect(logo.headers['content-type']).toBe('image/png');
    expect((await view(token)).studio.hasLogo).toBe(true);
  });

  it('gives the payment details only while something is open and an IBAN is set', async () => {
    await start();
    const { token } = await create('Joey');

    // Without an IBAN there is nothing to pay into: no block, no empty frame.
    await t.as(admin, {
      method: 'PUT',
      url: '/api/settings/company',
      payload: {
        name: 'Voorbeeld 3D',
        iban: '',
        address: 'Voorbeeldstraat 1',
        email: null,
        phone: null,
      },
    });
    const before = await view(token);
    if (!before.billed) throw new Error('billed view expected');
    expect(before.totals.open).toBeGreaterThan(0);
    expect(before.pay).toBeNull();

    await t.as(admin, {
      method: 'PUT',
      url: '/api/settings/company',
      payload: {
        name: 'Voorbeeld 3D',
        iban: 'NL00 BANK 0000 0000 00',
        address: 'Voorbeeldstraat 1',
        email: 'hallo@voorbeeld.nl',
        phone: null,
      },
    });
    const withIban = await view(token);
    if (!withIban.billed) throw new Error('billed view expected');
    expect(withIban.pay).toMatchObject({
      iban: 'NL00 BANK 0000 0000 00',
      name: 'Voorbeeld 3D',
      // The amount is the open total, and the reference is the klant.
      amount: withIban.totals.open,
      reference: 'Joey',
      email: 'hallo@voorbeeld.nl',
      phone: null,
    });

    // Nothing open: no payment block either. Settle every line that is open.
    for (const line of withIban.lines) {
      if (line.remaining === null || line.remaining <= 0) continue;
      await t.as(admin, {
        method: 'POST',
        url: `/api/orders/${line.id}/payments`,
        payload: { amount: line.remaining },
      });
    }
    const settled = await view(token);
    if (!settled.billed) throw new Error('billed view expected');
    expect(settled.totals.open).toBe(0);
    expect(settled.pay).toBeNull();
  });

  it("serves a line thumbnail only for a print of this link's klant", async () => {
    await start();
    const { token } = await create('Joey');
    const mine = await view(token);
    const printId = mine.lines[0]?.printId;
    expect(printId).toBeTypeOf('string');

    // Another klant's print is not reachable with this token: the same 404.
    const others = (await t.as(admin, { url: '/api/prints?limit=100' })).json<{
      items: PrintSummary[];
    }>();
    const foreign = others.items.find((print) => print.customerFolder !== 'Joey');
    expect(foreign).toBeDefined();
    const refused = await t.as(null, {
      url: `/api/share/${token}/prints/${foreign?.id ?? ''}/thumbnail`,
    });
    expect(refused.statusCode).toBe(404);
    expect(refused.json()).toEqual({ error: 'not_found' });

    // And a dead token reaches nothing at all.
    const dead = await t.as(null, {
      url: `/api/share/deadtoken/prints/${printId ?? ''}/thumbnail`,
    });
    expect(dead.statusCode).toBe(404);
  });

  it('rate-limits the public endpoints per address', async () => {
    await start({ RATE_LIMIT_SHARE: '3' });
    const { token } = await create('Joey');
    const codes: number[] = [];
    for (let index = 0; index < 4; index += 1) {
      codes.push((await t.as(null, { url: `/api/share/${token}` })).statusCode);
    }
    expect(codes).toEqual([200, 200, 200, 429]);
    // Guessing tokens counts as well.
    expect((await t.as(null, { url: `/api/share/${'B'.repeat(43)}` })).statusCode).toBe(429);
  });
});
