import { rm } from 'node:fs/promises';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import type { PrintDetail, PrintSummary } from '../../src/prints/types.js';
import { startTestApp, type Session, type TestApp } from '../helpers/app.js';
import { TEST_DATABASES } from '../helpers/databases.js';
import { makePrintsTree, putText } from '../helpers/prints-tree.js';

/** Spoolman v0.27.0 answers, trimmed to the fields the app reads. */
const SPOOLS = [
  {
    id: 7,
    price: 25,
    initial_weight: 1000,
    remaining_weight: 640,
    archived: false,
    filament: {
      name: 'PLA+ Zwart',
      material: 'PLA',
      price: 22,
      weight: 1000,
      color_hex: '1A1A1A',
      vendor: { name: 'eSun' },
    },
  },
  {
    id: 9,
    price: null,
    initial_weight: null,
    archived: false,
    filament: {
      name: 'Silk Dual',
      material: 'PLA',
      price: 30,
      weight: 750,
      multi_color_hexes: 'D4AF37,C0C0C0',
      multi_color_direction: 'coaxial',
      vendor: null,
    },
  },
];

describe.each(TEST_DATABASES)('finance API on $name', ({ url }) => {
  let t: TestApp;
  let root: string;
  let admin: Session;
  let editor: Session;
  let helper: Session;
  let spoolmanUp: boolean;

  const fakeSpoolman = ((input: string | URL | Request) => {
    const target = input instanceof Request ? input.url : input.toString();
    if (!spoolmanUp) return Promise.reject(new Error('connect ECONNREFUSED'));
    const one = /\/api\/v1\/spool\/(\d+)$/.exec(target);
    if (one !== null) {
      const spool = SPOOLS.find((s) => s.id === Number(one[1]));
      return Promise.resolve(
        spool === undefined
          ? new Response('{"message":"not found"}', { status: 404 })
          : Response.json(spool),
      );
    }
    return Promise.resolve(Response.json(SPOOLS));
  }) as typeof fetch;

  beforeEach(async () => {
    spoolmanUp = true;
    root = await makePrintsTree();
    t = await startTestApp(
      url,
      { PRINTS_ROOT: root, SPOOLMAN_URL: 'http://spoolman.test:7912' },
      { spoolmanFetch: fakeSpoolman },
    );
    await t.addUser('owner@example.org', 'Admin');
    await t.addUser('editor@example.org', 'Editor');
    const helperId = await t.addUser('helper@example.org', 'User');
    admin = await t.login('owner@example.org');
    editor = await t.login('editor@example.org');
    helper = await t.login('helper@example.org');
    await t.as(admin, {
      method: 'PATCH',
      url: '/api/access',
      payload: { changes: [{ userId: helperId, customerFolder: 'Koen', granted: true }] },
    });
    // Prices: PLA € 20/kg, € 0,25/kWh, K1 Max 350 W, markup 400 %.
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
    await t.app.services.indexer.indexAll();
  });

  afterEach(async () => {
    await t.close();
    await rm(root, { recursive: true, force: true });
  });

  const list = async (session: Session) =>
    (await t.as(session, { url: '/api/prints?limit=100&archived=true' })).json<{
      items: PrintSummary[];
    }>().items;
  const idOf = async (name: string) => {
    const found = (await list(admin)).find((item) => item.name === name);
    if (found === undefined) throw new Error(`no print ${name}`);
    return found.id;
  };
  const detail = async (session: Session, name: string) =>
    (await t.as(session, { url: `/api/prints/${await idOf(name)}` })).json<PrintDetail>();
  const firstOrder = async (name: string) => {
    const order = (await detail(admin, name)).orders[0];
    if (order === undefined) throw new Error('no order');
    return order;
  };

  it('calculates the cost per order from the files, settings and printer profile', async () => {
    const box = await detail(editor, 'Bloembak clips');
    const order = box.orders[0];
    // 173,49 g × € 20/kg = € 3,47; 3 u 24 min 54 s × 350 W = 1,195 kWh × € 0,25 = € 0,30.
    expect(order?.cost).toMatchObject({
      materialCost: 3.47,
      electricityCost: 0.3,
      totalCost: 3.77,
      energyKwh: 1.195,
      missing: [],
      excludedCount: 2,
    });
    expect(order?.cost?.lines).toHaveLength(1);
    expect(order?.cost?.lines[0]).toMatchObject({
      fileName: 'lock_PLA_3h27m.gcode',
      timesPrinted: 1,
      slots: [{ slot: 1, grams: 173.49, pricePerKg: 20, source: 'estimated', cost: 3.47 }],
    });
    // No sale price yet: the markup suggestion is the price, marked as suggested.
    expect(order).toMatchObject({
      status: 'open',
      price: 18.85,
      salePrice: null,
      priceSuggested: true,
      suggestion: { salePrice: 18.85, reason: null },
      remaining: 18.85,
    });
    expect(box.money).toMatchObject({ status: 'open', price: 18.85, cost: 3.77, orderCount: 1 });
  });

  it('recalculates when times printed, exclusions and overrides change', async () => {
    const box = await detail(editor, 'Bloembak clips');
    const gcode = box.assets
      ?.flatMap((a) => a.lines.map((l) => ({ file: a.fileName, ...l })))
      .find((l) => l.file === 'lock_PLA_3h27m.gcode');
    const next = box.assets
      ?.flatMap((a) => a.lines.map((l) => ({ file: a.fileName, ...l })))
      .find((l) => l.file === 'next_PLA_11m.gcode');
    if (gcode === undefined || next === undefined) throw new Error('lines missing');

    expect(
      (
        await t.as(editor, {
          method: 'PUT',
          url: `/api/prints/${box.id}/lines/${gcode.id}/times`,
          payload: { timesPrinted: 2 },
        })
      ).statusCode,
    ).toBe(204);
    let order = await firstOrder('Bloembak clips');
    expect(order.cost?.materialCost).toBe(6.94);
    expect((await detail(editor, 'Bloembak clips')).grams).toBe(346.98);

    await t.as(editor, {
      method: 'PUT',
      url: `/api/prints/${box.id}/lines/${next.id}/excluded`,
      payload: { excluded: false },
    });
    order = await firstOrder('Bloembak clips');
    // + 3,03 g (two slots) × € 20/kg = € 0,06
    expect(order.cost?.materialCost).toBe(7);

    await t.as(editor, {
      method: 'PUT',
      url: `/api/prints/${box.id}/lines/${gcode.id}/override`,
      payload: { slot: 0, pricePerKg: 30 },
    });
    order = await firstOrder('Bloembak clips');
    expect(order.cost?.lines.find((l) => l.lineId === gcode.id)?.slots[0]).toMatchObject({
      pricePerKg: 30,
      source: 'manual',
    });

    // "Kosten aanpassen": manual grams and time replace the files; back to calculated clears them.
    await t.as(editor, {
      method: 'PUT',
      url: `/api/orders/${order.id}/overrides`,
      payload: { pricePerKg: 24, grams: 100, printSeconds: 3600 },
    });
    order = await firstOrder('Bloembak clips');
    expect(order.cost).toMatchObject({
      grams: 100,
      gramsSource: 'manual',
      materialCost: 2.4,
      printSeconds: 3600,
      timeSource: 'manual',
      electricityCost: 0.09,
    });
    await t.as(editor, {
      method: 'PUT',
      url: `/api/orders/${order.id}/overrides`,
      payload: { pricePerKg: null, grams: null, printSeconds: null },
    });
    expect((await firstOrder('Bloembak clips')).cost?.gramsSource).toBe('files');
  });

  it('assigns a Spoolman spool as a snapshot and tints the print with it', async () => {
    const id = await idOf('Bloembak clips');
    const spools = (await t.as(editor, { url: '/api/spools' })).json<{
      configured: boolean;
      spools: { id: number; name: string; pricePerKg: number | null; colours: string[] }[];
    }>();
    expect(spools.configured).toBe(true);
    expect(spools.spools).toMatchObject([
      { id: 7, name: 'eSun PLA+ Zwart', pricePerKg: 25, colours: [] },
      // No spool price: filament € 30 for 750 g.
      { id: 9, name: 'Silk Dual', pricePerKg: 40, colours: ['#d4af37', '#c0c0c0'] },
    ]);

    expect(
      (
        await t.as(editor, {
          method: 'PUT',
          url: `/api/prints/${id}/spool`,
          payload: { spoolId: 7 },
        })
      ).statusCode,
    ).toBe(200);
    // Nothing is on a final invoice yet, so every order follows the print's spool.
    expect(
      (
        await t.as(editor, {
          method: 'PUT',
          url: `/api/prints/${id}/spool`,
          payload: { spoolId: 7 },
        })
      ).json(),
    ).toEqual({ changed: 1, skipped: 0 });
    const box = await detail(editor, 'Bloembak clips');
    expect(box.spool).toMatchObject({
      id: 7,
      name: 'eSun PLA+ Zwart',
      pricePerKg: 25,
      colour: '#1a1a1a',
    });
    expect(box.colour).toBe('#1a1a1a');
    expect(box.orders[0]?.cost).toMatchObject({ materialCost: 4.34, totalCost: 4.64 });
    expect(box.orders[0]?.cost?.lines[0]?.slots[0]?.source).toBe('spoolman');

    // The snapshot keeps the price when Spoolman goes away.
    spoolmanUp = false;
    t.app.services.spoolman.refresh();
    expect((await firstOrder('Bloembak clips')).cost?.materialCost).toBe(4.34);
    expect((await t.as(editor, { url: '/api/spools' })).statusCode).toBe(503);
    expect((await t.as(editor, { url: '/api/spoolman/status' })).json()).toMatchObject({
      configured: true,
      reachable: false,
    });
    expect(
      (
        await t.as(editor, {
          method: 'PUT',
          url: `/api/prints/${id}/spool`,
          payload: { spoolId: 7 },
        })
      ).json(),
    ).toEqual({ error: 'spoolman_unavailable' });
    // Clearing works without Spoolman.
    expect(
      (
        await t.as(editor, {
          method: 'PUT',
          url: `/api/prints/${id}/spool`,
          payload: { spoolId: null },
        })
      ).statusCode,
    ).toBe(200);
  });

  it('records sale prices, partial payments, refuses overpayment and undoes the last payment', async () => {
    const order = await firstOrder('Bloembak clips');
    const call = (session: Session, method: string, path: string, payload?: object) =>
      t.as(session, { method: method as 'POST', url: `/api/orders/${order.id}${path}`, payload });

    expect((await call(editor, 'PUT', '/sale-price', { salePrice: 11.89 })).statusCode).toBe(204);
    expect((await call(editor, 'POST', '/payments', { amount: 5 })).statusCode).toBe(201);
    let now = await firstOrder('Bloembak clips');
    expect(now).toMatchObject({ status: 'partial', price: 11.89, paid: 5, remaining: 6.89 });

    expect((await call(editor, 'POST', '/payments', { amount: 7 })).json()).toEqual({
      error: 'overpayment',
    });
    expect((await call(editor, 'PUT', '/sale-price', { salePrice: 4 })).json()).toEqual({
      error: 'price_below_paid',
    });

    expect((await call(editor, 'POST', '/payments', { amount: 6.89 })).statusCode).toBe(201);
    now = await firstOrder('Bloembak clips');
    expect(now).toMatchObject({ status: 'paid', remaining: 0 });
    expect(now.payments?.map((p) => p.amount)).toEqual([5, 6.89]);
    expect((await call(editor, 'POST', '/payments', { amount: 1 })).json()).toEqual({
      error: 'nothing_open',
    });

    // Undo is Admin-only and reverses only the last payment.
    expect((await call(editor, 'POST', '/payments/undo')).statusCode).toBe(403);
    expect((await call(admin, 'POST', '/payments/undo')).statusCode).toBe(204);
    now = await firstOrder('Bloembak clips');
    expect(now).toMatchObject({ status: 'partial', paid: 5, remaining: 6.89 });
    expect(now.payments?.[1]).toMatchObject({ amount: 6.89, undoneBy: 'owner@example.org' });
    expect(now.payments?.[1]?.undoneAt).not.toBeNull();

    // Users see the price and status only.
    const seen = await detail(helper, 'Bloembak clips');
    expect(seen.orders).toEqual([
      {
        id: order.id,
        number: 1,
        createdAt: order.createdAt,
        date: order.date,
        status: 'partial',
        requestState: null,
        price: 11.89,
      },
    ]);
    expect(seen.money).toMatchObject({ status: 'partial', price: 11.89, cost: null });
    expect(seen.markupPercent).toBeNull();
  });

  it('a declined request owes nothing, keeps its price and leaves every total', async () => {
    const order = await firstOrder('Bloembak clips');
    const call = (method: string, path: string, payload?: object) =>
      t.as(editor, { method: method as 'PUT', url: `/api/orders/${order.id}${path}`, payload });

    expect((await call('PUT', '/sale-price', { salePrice: 24.5 })).statusCode).toBe(204);
    const openBefore = (await t.as(editor, { url: '/api/outstanding' })).json<{
      groups: { lines: { orderId: string }[] }[];
    }>();
    expect(openBefore.groups.flatMap((g) => g.lines).some((l) => l.orderId === order.id)).toBe(
      true,
    );

    expect((await call('PUT', '/state', { state: 'declined' })).statusCode).toBe(204);
    const declined = await firstOrder('Bloembak clips');
    // The price is history, not a debt: kept, but nothing is owed.
    expect(declined).toMatchObject({ status: 'declined', price: 24.5, remaining: null });

    const openAfter = (await t.as(editor, { url: '/api/outstanding' })).json<{
      groups: { lines: { orderId: string }[] }[];
    }>();
    expect(openAfter.groups.flatMap((g) => g.lines).some((l) => l.orderId === order.id)).toBe(
      false,
    );

    /*
      Named in the draft's exclusions rather than silently dropped — and in its
      own list, because a declined order has a price and must not be announced
      as one "zonder verkoopprijs" (GAP-140).
    */
    const preview = (await t.as(admin, { url: '/api/customers/Koen/invoice/preview' })).json<{
      lines: unknown[];
      excluded: string[];
      declined: string[];
    }>();
    expect(preview.declined.some((d) => d.includes('Bloembak clips'))).toBe(true);
    expect(preview.excluded.some((d) => d.includes('Bloembak clips'))).toBe(false);

    // Any state may follow any other, with no confirmation (owner's rule).
    expect((await call('PUT', '/state', { state: 'undecided' })).statusCode).toBe(204);
    expect(await firstOrder('Bloembak clips')).toMatchObject({ status: 'open', price: 24.5 });
    expect((await call('PUT', '/state', { state: null })).statusCode).toBe(204);
    expect(await firstOrder('Bloembak clips')).toMatchObject({ status: 'open' });

    expect((await call('PUT', '/state', { state: 'nonsense' })).statusCode).toBe(400);
  });

  it('writes off the remainder only, and lets Admins undo it', async () => {
    const order = await firstOrder('Bloembak clips');
    await t.as(editor, {
      method: 'PUT',
      url: `/api/orders/${order.id}/sale-price`,
      payload: { salePrice: 11.89 },
    });
    await t.as(editor, {
      method: 'POST',
      url: `/api/orders/${order.id}/payments`,
      payload: { amount: 5 },
    });
    expect(
      (
        await t.as(editor, {
          method: 'POST',
          url: `/api/orders/${order.id}/write-off`,
          payload: { reason: 'Vriendenprijs' },
        })
      ).statusCode,
    ).toBe(204);
    let now = await firstOrder('Bloembak clips');
    expect(now).toMatchObject({
      status: 'writtenOff',
      paid: 5,
      remaining: 0,
      writtenOff: { amount: 6.89, by: 'editor@example.org', reason: 'Vriendenprijs' },
    });
    expect(
      (await t.as(editor, { method: 'DELETE', url: `/api/orders/${order.id}/write-off` }))
        .statusCode,
    ).toBe(403);
    expect(
      (await t.as(admin, { method: 'DELETE', url: `/api/orders/${order.id}/write-off` }))
        .statusCode,
    ).toBe(204);
    now = await firstOrder('Bloembak clips');
    expect(now).toMatchObject({ status: 'partial', writtenOff: null, remaining: 6.89 });
  });

  it('keeps niet-factureren klanten out of prices and payments', async () => {
    expect(
      (
        await t.as(editor, {
          method: 'PUT',
          url: '/api/customers/Koen/billing',
          payload: { noBilling: true },
        })
      ).statusCode,
    ).toBe(403);
    await t.as(admin, {
      method: 'PUT',
      url: '/api/customers/Koen/billing',
      payload: { noBilling: true },
    });
    const box = await detail(editor, 'Bloembak clips');
    expect(box.noBilling).toBe(true);
    expect(box.orders[0]).toMatchObject({ status: 'notBilled', price: null });
    expect(box.orders[0]?.cost?.totalCost).toBe(3.77);
    const order = box.orders[0];
    expect(
      (
        await t.as(editor, {
          method: 'POST',
          url: `/api/orders/${order?.id ?? ''}/payments`,
          payload: { amount: 1 },
        })
      ).json(),
    ).toEqual({ error: 'not_billed' });
    const customers = (await t.as(editor, { url: '/api/customers' })).json<{
      customers: { folder: string; noBilling: boolean; openAmount: number | null }[];
    }>().customers;
    expect(customers.find((c) => c.folder === 'Koen')).toMatchObject({
      noBilling: true,
      openAmount: null,
    });
    // Esmee: Keychain (two copies) and Board game, priced by markup.
    expect(customers.find((c) => c.folder === 'Esmee')?.openAmount).toBeGreaterThan(0);
  });

  it('makes a Nabestelling with its own price and payments', async () => {
    const box = await detail(editor, 'Bloembak clips');
    const first = box.orders[0];
    const gcode = box.assets?.flatMap((a) => a.lines).find((l) => !l.excluded);
    if (first === undefined || gcode === undefined) throw new Error('setup');
    await t.as(editor, {
      method: 'PUT',
      url: `/api/orders/${first.id}/sale-price`,
      payload: { salePrice: 11.89 },
    });
    // A file added after order 1 was priced waits for a Nabestelling.
    await putText(
      root,
      'Koen/Bloembak clips/spare_PLA_11m.gcode',
      '; total filament used [g] = 10\n; filament_type = PLA\n',
    );
    await t.app.services.indexer.indexProject({
      customerFolder: 'Koen',
      projectFolder: 'Bloembak clips',
    });
    const withSpare = await detail(editor, 'Bloembak clips');
    const spare = withSpare.assets?.find((a) => a.fileName === 'spare_PLA_11m.gcode')?.lines.at(0);
    expect(spare).toMatchObject({ inOrder: false, timesPrinted: 0 });

    const created = await t.as(editor, {
      method: 'POST',
      url: `/api/prints/${box.id}/orders`,
      payload: {
        items: [
          { lineId: spare?.id ?? '', timesPrinted: 1 },
          { lineId: gcode.id, timesPrinted: 2 },
        ],
      },
    });
    expect(created.statusCode).toBe(201);
    const after = await detail(editor, 'Bloembak clips');
    expect(after.orders.map((o) => o.number)).toEqual([1, 2]);
    const second = after.orders[1];
    // 10 g + 2 × 173,49 g at € 20/kg
    expect(second?.cost?.materialCost).toBe(7.14);
    expect(second).toMatchObject({ status: 'open', salePrice: null });
    expect(after.assets?.find((a) => a.fileName === 'spare_PLA_11m.gcode')?.lines[0]).toMatchObject(
      { inOrder: true, timesPrinted: 1 },
    );
    // Order 1 is unchanged; the print shows the least settled status and both prices.
    expect(after.orders[0]?.cost?.materialCost).toBe(3.47);
    expect(after.money).toMatchObject({ status: 'open', orderCount: 2 });
    expect(after.money?.price).toBeCloseTo(11.89 + (second?.price ?? 0), 2);

    // "Nabestelling verwijderen": never order 1, not with a payment or write-off.
    const del = (orderId: string, session = editor) =>
      t.as(session, { method: 'DELETE', url: `/api/orders/${orderId}` });
    expect((await del(first.id)).json()).toEqual({ error: 'first_order' });
    expect((await del(second?.id ?? '', helper)).statusCode).toBe(403);
    await t.as(editor, {
      method: 'POST',
      url: `/api/orders/${second?.id ?? ''}/payments`,
      payload: { amount: 1 },
    });
    expect((await del(second?.id ?? '')).json()).toEqual({ error: 'has_payment' });
    await t.as(admin, { method: 'POST', url: `/api/orders/${second?.id ?? ''}/payments/undo` });
    await t.as(editor, {
      method: 'POST',
      url: `/api/orders/${second?.id ?? ''}/write-off`,
      payload: {},
    });
    expect((await del(second?.id ?? '')).json()).toEqual({ error: 'written_off' });
    await t.as(admin, { method: 'DELETE', url: `/api/orders/${second?.id ?? ''}/write-off` });
    expect((await del(second?.id ?? '')).statusCode).toBe(204);
    const removed = await detail(editor, 'Bloembak clips');
    expect(removed.orders.map((o) => o.number)).toEqual([1]);
    // Its files are back in no order; the reprinted G-code keeps its order-1 count.
    expect(
      removed.assets?.find((a) => a.fileName === 'spare_PLA_11m.gcode')?.lines[0],
    ).toMatchObject({ inOrder: false, timesPrinted: 0 });
    expect(removed.money).toMatchObject({ orderCount: 1, price: 11.89 });
  });

  it('sets the request state in bulk, on the newest order, per print', async () => {
    const box = await idOf('Bloembak clips');
    const keychain = await idOf('Keychain');
    const send = (ids: string[], state: string | null) =>
      t.as(editor, {
        method: 'POST',
        url: '/api/prints/bulk',
        payload: { action: 'setRequestState', ids, state },
      });

    expect((await send([box, keychain], 'undecided')).json()).toEqual({
      results: [
        { id: box, ok: true },
        { id: keychain, ok: true },
      ],
    });
    expect((await firstOrder('Bloembak clips')).requestState).toBe('undecided');
    expect((await firstOrder('Keychain')).requestState).toBe('undecided');

    // Clearing is as ordinary as setting: no confirmation, no special path.
    expect((await send([box], null)).json()).toEqual({ results: [{ id: box, ok: true }] });
    expect((await firstOrder('Bloembak clips')).requestState).toBeNull();

    expect((await send([box], 'nonsense')).statusCode).toBe(400);
  });

  it('runs bulk actions with a result per print', async () => {
    const box = await idOf('Bloembak clips');
    const keychain = await idOf('Keychain');
    const empty = await idOf('Empty');
    const response = await t.as(editor, {
      method: 'POST',
      url: '/api/prints/bulk',
      payload: { action: 'markPaid', ids: [box, keychain, empty] },
    });
    expect(response.json()).toEqual({
      results: [
        { id: box, ok: true },
        { id: keychain, ok: true },
        // No files, so no cost and no price.
        { id: empty, ok: false, error: 'no_price' },
      ],
    });
    expect((await firstOrder('Bloembak clips')).status).toBe('paid');

    const priced = await t.as(editor, {
      method: 'POST',
      url: '/api/prints/bulk',
      payload: { action: 'setPrice', ids: [empty], salePrice: 2.5 },
    });
    expect(priced.json()).toEqual({ results: [{ id: empty, ok: true }] });
    expect((await firstOrder('Empty')).price).toBe(2.5);

    // The price goes on the newest order; a paid one fails with its number.
    const again = await t.as(editor, {
      method: 'POST',
      url: '/api/prints/bulk',
      payload: { action: 'setPrice', ids: [box], salePrice: 30 },
    });
    expect(again.json()).toEqual({
      results: [{ id: box, ok: false, error: 'paid', orderNumber: 1 }],
    });
    // "Voorstel uit marge per print": each print its own suggestion; no cost is skipped.
    const board = await idOf('Board game');
    const suggested = await t.as(editor, {
      method: 'POST',
      url: '/api/prints/bulk',
      payload: { action: 'setPrice', ids: [board, empty], suggested: true },
    });
    expect(suggested.json<{ results: unknown[] }>().results).toEqual([
      { id: board, ok: true },
      { id: empty, ok: false, error: 'no_cost', orderNumber: 1 },
    ]);
    const boardOrder = await firstOrder('Board game');
    expect(boardOrder).toMatchObject({ priceSuggested: false });
    expect(boardOrder.salePrice).toBe(boardOrder.suggestion?.salePrice);
    expect(
      (
        await t.as(editor, {
          method: 'POST',
          url: '/api/prints/bulk',
          payload: { action: 'setPrice', ids: [board] },
        })
      ).json(),
    ).toEqual({ error: 'missing_price' });
  });

  it('keeps 0 and null apart in request bodies', async () => {
    const order = await firstOrder('Empty');
    await t.as(editor, {
      method: 'PUT',
      url: `/api/orders/${order.id}/sale-price`,
      payload: { salePrice: 0 },
    });
    expect(await firstOrder('Empty')).toMatchObject({ salePrice: 0, price: 0, status: 'paid' });
    await t.as(editor, {
      method: 'PUT',
      url: `/api/orders/${order.id}/sale-price`,
      payload: { salePrice: null },
    });
    expect(await firstOrder('Empty')).toMatchObject({ salePrice: null, status: 'noPrice' });
  });

  it('serves a quick calculation', async () => {
    const response = await t.as(editor, {
      method: 'POST',
      url: '/api/calculate',
      payload: { grams: 100, printSeconds: 3600, material: 'PLA', printerModel: 'K1 Max' },
    });
    expect(response.json()).toMatchObject({
      materialCost: 2,
      electricityCost: 0.09,
      totalCost: 2.09,
      missing: [],
    });
  });
});
