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
    const created = await create('Koen');
    expect(created.token).toMatch(/^[A-Za-z0-9_-]{43}$/);
    expect(created.url).toBe(`http://localhost:80/share/${created.token}`);
    expect(created.link).toMatchObject({
      customer: 'Koen',
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
        payload: { customer: 'Koen', label: 'x', expiresInDays: 7 },
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
      payload: { customer: 'Koen', label: '   ', expiresInDays: 7 },
    });
    expect(blank.statusCode).toBe(400);
    const odd = await t.as(admin, {
      method: 'POST',
      url: '/api/share-links',
      payload: { customer: 'Koen', label: 'x', expiresInDays: 14 },
    });
    expect(odd.statusCode).toBe(400);
  });

  describe('a link as a way in (GAP-165)', () => {
    /** The session a visitor gets from a valid token. */
    const enter = async (token: string) => {
      const response = await t.as(null, { method: 'POST', url: `/api/share/${token}/session` });
      if (response.statusCode !== 200) return null;
      const cookie = response.cookies.find((c) => c.name === 'pp_session');
      if (cookie === undefined) throw new Error('no session cookie');
      return {
        cookie: `pp_session=${cookie.value}`,
        csrfToken: response.json<{ csrfToken: string }>().csrfToken,
      };
    };

    it('lets the visitor use the portal, scoped to that klant and read-only', async () => {
      await start();
      const { token } = await create('Koen');
      const visitor = await enter(token);
      if (visitor === null) throw new Error('no session');

      // The portal's own screens, not the share page.
      const list = (await t.as(visitor, { url: '/api/prints?limit=100' })).json<{
        items: PrintSummary[];
      }>();
      expect(list.items.length).toBeGreaterThan(0);
      expect(new Set(list.items.map((item) => item.customerFolder))).toEqual(new Set(['Koen']));
      // Only their own klant, and nothing of anyone else's.
      const customers = (await t.as(visitor, { url: '/api/customers' })).json<{
        customers: { folder: string }[];
      }>();
      expect(customers.customers.map((one) => one.folder)).toEqual(['Koen']);

      // The viewer yes, the file no: the owner's decision, and `MANAGE` already.
      const print = list.items[0];
      expect(
        (await t.as(visitor, { url: `/api/prints/${print?.id ?? ''}/model` })).statusCode,
      ).not.toBe(403);
      const detail = (
        await t.as(visitor, { url: `/api/prints/${print?.id ?? ''}` })
      ).json<PrintDetail>();
      const assetId = detail.assets?.[0]?.id ?? '';
      expect((await t.as(visitor, { url: `/api/assets/${assetId}/download` })).statusCode).toBe(
        403,
      );

      // Nothing an operator does.
      expect((await t.as(visitor, { url: '/api/queue' })).statusCode).toBe(403);
      expect((await t.as(visitor, { url: '/api/share-links' })).statusCode).toBe(403);
      expect((await t.as(visitor, { url: '/api/settings' })).statusCode).toBe(403);
      expect(
        (await t.as(visitor, { method: 'POST', url: '/api/admin/reindex', payload: {} }))
          .statusCode,
      ).toBe(403);
    });

    it('sees another klant neither in a list nor by id', async () => {
      await start();
      const { token } = await create('Koen');
      const visitor = await enter(token);
      if (visitor === null) throw new Error('no session');
      const others = (await t.as(admin, { url: '/api/prints?limit=100' }))
        .json<{
          items: PrintSummary[];
        }>()
        .items.filter((item) => item.customerFolder !== 'Koen');
      expect(others.length).toBeGreaterThan(0);
      expect((await t.as(visitor, { url: `/api/prints/${others[0]?.id ?? ''}` })).statusCode).toBe(
        403,
      );
    });

    it('is refused by a token that does not work, exactly like the page', async () => {
      await start();
      // 404 for a malformed token too: unknown, malformed, expired and
      // revoked must stay indistinguishable (ScreenSharePage 1.6).
      expect(
        (await t.as(null, { method: 'POST', url: '/api/share/nope/session' })).statusCode,
      ).toBe(404);
      const dead = await create('Koen');
      await t.as(admin, { method: 'POST', url: `/api/share-links/${dead.link.id}/revoke` });
      expect(await enter(dead.token)).toBeNull();
    });

    it('ends the moment the link is revoked, with the visitor already inside', async () => {
      await start();
      const { token, link } = await create('Koen');
      const visitor = await enter(token);
      if (visitor === null) throw new Error('no session');
      expect((await t.as(visitor, { url: '/api/prints?limit=100' })).statusCode).toBe(200);
      await t.as(admin, { method: 'POST', url: `/api/share-links/${link.id}/revoke` });
      // Not at the next sign-in: now.
      expect((await t.as(visitor, { url: '/api/prints?limit=100' })).statusCode).toBe(401);
    });

    it('needs the CSRF header for a write, like any other session', async () => {
      await start();
      const { token } = await create('Koen');
      const visitor = await enter(token);
      if (visitor === null) throw new Error('no session');
      const id =
        (await t.as(visitor, { url: '/api/prints?limit=100' })).json<{ items: PrintSummary[] }>()
          .items[0]?.id ?? '';
      // Without the header: refused as CSRF. With it: refused as forbidden,
      // which is the role answering rather than the guard.
      const bare = await t.as(null, {
        method: 'PUT',
        url: `/api/prints/${id}/note`,
        payload: { note: 'x' },
        headers: { cookie: visitor.cookie },
      });
      expect(bare.statusCode).toBe(403);
      expect(bare.json<{ error: string }>().error).toBe('csrf');
      const withHeader = await t.as(visitor, {
        method: 'PUT',
        url: `/api/prints/${id}/note`,
        payload: { note: 'x' },
      });
      expect(withHeader.statusCode).toBe(403);
      expect(withHeader.json<{ error: string }>().error).toBe('forbidden');
    });

    /*
      "Sessie afsluiten" (ScreenShareSession §1): deel-links are opened on
      borrowed phones and in family group chats, so the visitor needs a way
      out that is not clearing the browser. It drops the session cookie, not
      an account — there is none.
    */
    it('ends when the visitor closes it, and the link still works afterwards', async () => {
      await start();
      const { token } = await create('Koen');
      const visitor = await enter(token);
      if (visitor === null) throw new Error('no session');
      expect((await t.as(visitor, { url: '/api/prints?limit=100' })).statusCode).toBe(200);

      const out = await t.as(visitor, { method: 'POST', url: '/api/auth/logout' });
      expect(out.statusCode).toBe(204);
      expect((await t.as(visitor, { url: '/api/prints?limit=100' })).statusCode).toBe(401);

      // The link is a key, not a one-shot: opening it again mints a new one.
      const again = await enter(token);
      expect(again).not.toBeNull();
      expect((await t.as(again, { url: '/api/prints?limit=100' })).statusCode).toBe(200);
    });

    /*
      "Download overzicht" is the use the link was serving before it became a
      key, and the PDF hangs off the Overzicht (changelog 2.14, warning 1).
    */
    it('keeps the Overzicht PDF working for a visitor who is inside', async () => {
      await start();
      const { token } = await create('Koen');
      const visitor = await enter(token);
      if (visitor === null) throw new Error('no session');
      const pdf = await t.as(visitor, { url: `/api/share/${token}/overview.pdf` });
      expect(pdf.statusCode).toBe(200);
      expect(pdf.headers['content-type']).toBe('application/pdf');
    });
  });

  it('shows one line per order with the customer price only, never cost', async () => {
    await start();
    const box = await orderOf('Bloembak clips');
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
    const { token } = await create('Koen');
    const response = await t.as(null, { url: `/api/share/${token}` });
    expect(response.statusCode).toBe(200);
    expect(response.headers['cache-control']).toBe('private, no-store');
    const data = response.json<ShareView>();
    expect(data).toMatchObject({
      billed: true,
      customer: 'Koen',
      studio: { name: 'Voorbeeld 3D', hasLogo: false },
    });
    // The label is internal: it never reaches the klant (ScreenSharePage 1.9).
    expect(response.body).not.toContain('Q4 overzicht');
    if (!data.billed) throw new Error('billed view expected');
    expect(data.lines.map((line) => line.description)).toEqual(['Bloembak clips', 'Koen']);
    expect(data.lines[0]).toMatchObject({
      price: 20,
      paid: 5,
      remaining: 15,
      status: 'partial',
      project: 'Bloembak clips',
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
      url: `/api/orders/${(await orderOf('Koen')).orderId}/payments`,
      payload: { amount: data.lines[1]?.remaining ?? 0 },
    });
    const open = await view(token, '?onlyOpen=true&from=2000-01-01&customer=Esmee&markup=1');
    expect(open.customer).toBe('Koen');
    expect(open.lines.map((line) => line.description)).toEqual(['Bloembak clips']);
  });

  it('hides written-off orders and deleted prints, keeps archived ones, and says Prijs volgt', async () => {
    await start();
    const box = await orderOf('Bloembak clips');
    await t.as(editor, {
      method: 'POST',
      url: `/api/orders/${box.orderId}/write-off`,
      payload: {},
    });
    const { token } = await create('Koen');
    expect((await view(token)).lines.map((line) => line.description)).toEqual(['Koen']);

    const loose = await orderOf('Koen');
    await rm(`${root}/Koen/loose_PLA_31m55s.gcode`);
    await t.app.services.indexer.indexAll();
    const archived = await view(token);
    expect(archived.lines.map((line) => line.description)).toEqual(['Koen']);
    await t.as(editor, { method: 'DELETE', url: `/api/prints/${loose.printId}` });
    expect((await view(token)).lines).toEqual([]);
    // Once every print of the klant is deleted, the link answers like an unknown one.
    await t.as(editor, { method: 'DELETE', url: `/api/prints/${box.printId}` });
    expect((await t.as(null, { url: `/api/share/${token}` })).statusCode).toBe(404);

    const veerle = await create('Veerle');
    const plain = await view(veerle.token);
    if (!plain.billed) throw new Error('billed view expected');
    expect(plain.lines).toEqual([
      expect.objectContaining({ description: 'Empty', price: null, status: 'noPrice' }),
    ]);
    expect(plain.totals).toEqual({ total: 0, paid: 0, open: 0 });
  });

  it('answers unknown, malformed, expired and revoked tokens the same way', async () => {
    await start();
    const week = await create('Koen', 7);
    const never = await create('Koen', null, 'Altijd');
    const revoked = await create('Esmee', 90);
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
      ['Esmee', 'Q4 overzicht', 'revoked'],
      ['Koen', 'Altijd', 'active'],
      ['Koen', 'Q4 overzicht', 'expired'],
    ]);
  });

  it("shows a print's bron once, and never a note", async () => {
    await start();
    const print = (await t.as(admin, { url: '/api/prints?limit=100&customer=Koen' })).json<{
      items: { id: string; name: string }[];
    }>().items[0];
    const id = print?.id ?? '';
    await t.as(admin, {
      method: 'PUT',
      url: `/api/prints/${id}/source`,
      payload: { url: 'https://makerworld.com/en/models/38999' },
    });
    await t.as(admin, {
      method: 'PUT',
      url: `/api/prints/${id}/note`,
      payload: { note: 'In zwart printen, de vorige was wit' },
    });
    /*
      A nabestelling on the same print, so the print has two lines on the
      share page: the bron goes on the first and must not repeat on the rest.
    */
    const printLines = (await t.as(admin, { url: `/api/prints/${id}` }))
      .json<{
        assets: { lines: { id: string }[] }[];
      }>()
      .assets.flatMap((asset) => asset.lines);
    await t.as(admin, {
      method: 'POST',
      url: `/api/prints/${id}/orders`,
      payload: { items: printLines.map((line) => ({ lineId: line.id, timesPrinted: 1 })) },
    });

    const { token } = await create('Koen');
    const response = await t.as(null, { url: `/api/share/${token}` });
    const lines = response.json<{ lines: { printId: string; source: unknown }[] }>().lines;
    const mine = lines.filter((line) => line.printId === id);
    expect(mine.length).toBeGreaterThan(1);
    expect(mine[0]?.source).toEqual({
      url: 'https://makerworld.com/en/models/38999',
      label: 'makerworld.com/en/models/38999',
    });
    // Every later line of the same print carries nothing.
    expect(mine.slice(1).every((line) => line.source === null)).toBe(true);

    // The note is internal: not in the payload at all, under any key.
    expect(response.body).not.toMatch(/zwart printen/);
    expect(response.body).not.toMatch(/"note"/);
  });

  it('gives a niet-factureren klant the print list without amounts and no PDF', async () => {
    await start();
    await t.as(admin, {
      method: 'PUT',
      url: '/api/customers/Esmee/billing',
      payload: { noBilling: true },
    });
    const { token } = await create('Esmee');
    const response = await t.as(null, { url: `/api/share/${token}?onlyOpen=true` });
    const data = response.json<ShareView>();
    expect(data.billed).toBe(false);
    expect(data.lines.length).toBeGreaterThan(0);
    for (const line of data.lines) {
      // `source` is the one field GAP-152 added here: the klant does see a
      // bron (the owner's decision). The note never reaches this payload.
      expect(Object.keys(line).sort()).toEqual([
        'date',
        'description',
        'id',
        'printId',
        'project',
        'source',
      ]);
    }
    expect(response.body).not.toMatch(/"note"/);
    expect(response.body).not.toMatch(/price|paid|total|open/i);
    const pdf = await t.as(null, { url: `/api/share/${token}/overview.pdf` });
    expect(pdf.statusCode).toBe(404);
  });

  it('renders the Overzicht PDF with Geldig tot, and without it for Nooit', async () => {
    await start();
    const { token } = await create('Koen', 30, 'Q4 overzicht');
    const response = await t.as(null, { url: `/api/share/${token}/overview.pdf` });
    expect(response.statusCode).toBe(200);
    expect(response.headers['content-type']).toBe('application/pdf');
    expect(response.headers['content-disposition']).toBe(
      'attachment; filename="Overzicht-Koen-2026-10-05.pdf"',
    );
    const text = pdfPlainText(response.rawPayload);
    for (const part of [
      'Overzicht',
      'Geldig tot',
      '4 nov 2026',
      'Bloembak clips',
      'Dit is een overzicht, geen factuur.',
      'onder vermelding van Koen.',
    ]) {
      expect(text).toContain(part);
    }
    expect(text).not.toMatch(/kosten|marge|gcode/i);

    const never = await create('Koen', null, 'Altijd');
    const noExpiry = pdfPlainText(
      (await t.as(null, { url: `/api/share/${never.token}/overview.pdf` })).rawPayload,
    );
    expect(noExpiry).not.toContain('Geldig tot');

    const veerle = await create('Veerle');
    const pending = pdfPlainText(
      (await t.as(null, { url: `/api/share/${veerle.token}/overview.pdf` })).rawPayload,
    );
    expect(pending).toContain('Prijs volgt');
  });

  it('renders the Overzicht PDF on a fresh install, before Bedrijfsgegevens is filled in', async () => {
    await start({}, { company: false });
    const { token } = await create('Koen');
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
    // Veerle's print has no files, so no price at all.
    const { token } = await create('Veerle');
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
    const { token } = await create('Koen');
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
    const { token } = await create('Koen');

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
      reference: 'Koen',
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
    const { token } = await create('Koen');
    const mine = await view(token);
    const printId = mine.lines[0]?.printId;
    expect(printId).toBeTypeOf('string');

    // Another klant's print is not reachable with this token: the same 404.
    const others = (await t.as(admin, { url: '/api/prints?limit=100' })).json<{
      items: PrintSummary[];
    }>();
    const foreign = others.items.find((print) => print.customerFolder !== 'Koen');
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
    const { token } = await create('Koen');
    const codes: number[] = [];
    for (let index = 0; index < 4; index += 1) {
      codes.push((await t.as(null, { url: `/api/share/${token}` })).statusCode);
    }
    expect(codes).toEqual([200, 200, 200, 429]);
    // Guessing tokens counts as well.
    expect((await t.as(null, { url: `/api/share/${'B'.repeat(43)}` })).statusCode).toBe(429);
  });
});
