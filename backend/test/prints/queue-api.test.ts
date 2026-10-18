import { rm } from 'node:fs/promises';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { startTestApp, type Session, type TestApp } from '../helpers/app.js';
import { TEST_DATABASES } from '../helpers/databases.js';
import { makePrintsTree } from '../helpers/prints-tree.js';

describe.each(TEST_DATABASES)('queue and requests on $name', ({ url }) => {
  let t: TestApp;
  let root: string;
  let admin: Session;

  beforeEach(async () => {
    root = await makePrintsTree();
    t = await startTestApp(url, { PRINTS_ROOT: root });
    await t.app.services.indexer.indexAll();
    await t.addUser('owner@example.org', 'Admin');
    admin = await t.login('owner@example.org');
  });

  afterEach(async () => {
    await t.close();
    await rm(root, { recursive: true, force: true });
  });

  const queue = async () =>
    (await t.as(admin, { url: '/api/queue' })).json<{
      groups: {
        state: string;
        withoutFiles: number;
        rows: {
          id: string;
          name: string;
          hasFiles: boolean;
          requestState: string;
          waitingDays: number;
          source: { url: string; label: string } | null;
          sourceCount: number;
          note: string | null;
        }[];
      }[];
    }>();

  const addRequest = async (customer: string, name: string, state?: string) =>
    (
      await t.as(admin, {
        method: 'POST',
        url: '/api/requests',
        payload: { customer, name, ...(state === undefined ? {} : { state }) },
      })
    ).json<{ id: string }>().id;

  it('a request lives in the queue and nowhere else', async () => {
    const before = (await t.as(admin, { url: '/api/prints?limit=100' })).json<{
      total: number;
      items: unknown[];
    }>();

    const id = await addRequest('Koen', 'Lamp voor in de gang');

    // The queue has it, as "Nog niet besloten": asking is not deciding.
    const groups = (await queue()).groups;
    expect(groups.map((g) => g.state)).toEqual(['undecided']);
    expect(groups[0]?.rows.map((r) => r.name)).toEqual(['Lamp voor in de gang']);
    expect(groups[0]?.rows[0]?.hasFiles).toBe(false);
    expect(groups[0]?.withoutFiles).toBe(1);

    // GAP-123: not in the list, not in the total, not in the klant's count.
    const after = (await t.as(admin, { url: '/api/prints?limit=100' })).json<{
      total: number;
      items: { id: string }[];
    }>();
    expect(after.total).toBe(before.total);
    expect(after.items.some((p) => p.id === id)).toBe(false);

    const customers = (await t.as(admin, { url: '/api/customers' })).json<{
      customers: { folder: string; printCount: number }[];
    }>();
    const koen = customers.customers.find((c) => c.folder === 'Koen');
    const search = (await t.as(admin, { url: '/api/prints?q=Lamp' })).json<{ total: number }>();
    expect(search.total).toBe(0);
    expect(koen?.printCount).toBe(
      (await t.as(admin, { url: '/api/prints?limit=100&customer=Koen' })).json<{
        total: number;
      }>().total,
    );
  });

  it('re-indexing never archives a request for being absent', async () => {
    const id = await addRequest('Koen', 'Nog te ontwerpen kastje');
    await t.app.services.indexer.indexAll();
    // It has no folder, so the absent-sweep would have taken it.
    expect((await queue()).groups[0]?.rows.some((r) => r.id === id)).toBe(true);
  });

  it('groups by state, and inside a group the fileless rows come first', async () => {
    await addRequest('Koen', 'Bezig zonder bestanden', 'inProgress');
    // An existing print, given the same state, has files.
    const withFiles = (await t.as(admin, { url: '/api/prints?limit=100' })).json<{
      items: { id: string }[];
    }>().items[0];
    const detail = (await t.as(admin, { url: `/api/prints/${withFiles?.id ?? ''}` })).json<{
      orders: { id: string }[];
    }>();
    await t.as(admin, {
      method: 'PUT',
      url: `/api/orders/${detail.orders[0]?.id ?? ''}/state`,
      payload: { state: 'inProgress' },
    });

    const group = (await queue()).groups.find((g) => g.state === 'inProgress');
    expect(group?.rows.length).toBe(2);
    expect(group?.rows[0]?.hasFiles).toBe(false);
    expect(group?.withoutFiles).toBe(1);
  });

  it('shows a print once, however many of its orders carry a state', async () => {
    const print = (await t.as(admin, { url: '/api/prints?limit=100' })).json<{
      items: { id: string }[];
    }>().items[0];
    const id = print?.id ?? '';
    const detail = async () =>
      (await t.as(admin, { url: `/api/prints/${id}` })).json<{
        orders: { id: string }[];
        assets: { lines: { id: string }[] }[];
      }>();
    const first = await detail();
    // A nabestelling of the same print: a second order on one record.
    await t.as(admin, {
      method: 'POST',
      url: `/api/prints/${id}/orders`,
      payload: {
        items: [{ lineId: first.assets[0]?.lines[0]?.id ?? '', timesPrinted: 1 }],
      },
    });
    const both = (await detail()).orders;
    expect(both.length).toBe(2);
    // Both set to the same queue state, which the owner can do per order.
    for (const order of both) {
      await t.as(admin, {
        method: 'PUT',
        url: `/api/orders/${order.id}/state`,
        payload: { state: 'undecided' },
      });
    }
    const rows = (await queue()).groups.flatMap((group) => group.rows);
    // One print, one row: the Wachtrij lists work, and this is one job.
    expect(rows.filter((row) => row.id === id).length).toBe(1);
    expect(new Set(rows.map((row) => row.id)).size).toBe(rows.length);

    // Disagreeing orders: the least settled decides, and the print stays.
    await t.as(admin, {
      method: 'PUT',
      url: `/api/orders/${both[0]?.id ?? ''}/state`,
      payload: { state: 'inProgress' },
    });
    const mixed = await queue();
    expect(mixed.groups.find((g) => g.state === 'undecided')?.rows.some((r) => r.id === id)).toBe(
      true,
    );
    expect(mixed.groups.flatMap((g) => g.rows).filter((r) => r.id === id).length).toBe(1);

    // And an order outside the queue states never speaks for the print.
    await t.as(admin, {
      method: 'PUT',
      url: `/api/orders/${both[1]?.id ?? ''}/state`,
      payload: { state: 'declined' },
    });
    const after = (await queue()).groups.flatMap((g) => g.rows).filter((r) => r.id === id);
    expect(after.length).toBe(1);
    expect(after[0]?.requestState).toBe('inProgress');
  });

  it('links a request to the folder that appeared, and keeps the real print', async () => {
    const id = await addRequest('Koen', 'Wordt Bloembak clips');
    const target = await (async () => {
      const items = (await t.as(admin, { url: '/api/prints?limit=100' })).json<{
        items: { id: string; name: string }[];
      }>().items;
      return items.find((p) => p.name === 'Bloembak clips');
    })();

    // A price on the request moves across; the print itself is kept.
    const requestOrder = (await t.as(admin, { url: `/api/prints/${id}` })).json<{
      orders: { id: string }[];
    }>().orders[0];
    await t.as(admin, {
      method: 'PUT',
      url: `/api/orders/${requestOrder?.id ?? ''}/sale-price`,
      payload: { salePrice: 18.5 },
    });

    const linked = await t.as(admin, {
      method: 'POST',
      url: `/api/requests/${id}/link`,
      payload: { printId: target?.id ?? '' },
    });
    expect(linked.statusCode).toBe(204);

    // The request is gone and the print carries what it had.
    expect((await t.as(admin, { url: `/api/prints/${id}` })).statusCode).toBe(404);
    const after = (await t.as(admin, { url: `/api/prints/${target?.id ?? ''}` })).json<{
      orders: { price: number | null; requestState: string | null }[];
    }>();
    expect(after.orders.at(-1)?.price).toBe(18.5);
    expect(after.orders.at(-1)?.requestState).toBe('undecided');
  });

  it('shows a bron only on a fileless row, and a note on any row', async () => {
    const id = await addRequest('Koen', 'Lamp voor in de gang');
    await t.as(admin, {
      method: 'PUT',
      url: `/api/prints/${id}/source`,
      payload: { url: 'https://makerworld.com/en/models/38999' },
    });
    await t.as(admin, {
      method: 'PUT',
      url: `/api/prints/${id}/note`,
      payload: { note: 'In zwart printen' },
    });
    const row = (await queue()).groups.flatMap((group) => group.rows).find((one) => one.id === id);
    expect(row?.source).toEqual({
      url: 'https://makerworld.com/en/models/38999',
      label: 'makerworld.com/en/models/38999',
    });
    expect(row?.sourceCount).toBe(1);
    expect(row?.note).toBe('In zwart printen');

    /*
      Once the files are there the row's job is done and the bron is noise
      (PrintSource), but the note is about the work and outlives them
      (PrintNote). Linking is how files arrive for a request.
    */
    const target = (await t.as(admin, { url: '/api/prints?limit=100' }))
      .json<{
        items: { id: string; name: string }[];
      }>()
      .items.find((print) => print.name === 'Bloembak clips');
    await t.as(admin, {
      method: 'PUT',
      url: `/api/prints/${target?.id ?? ''}/note`,
      payload: { note: 'Twee stuks' },
    });
    await t.as(admin, {
      method: 'PUT',
      url: `/api/prints/${target?.id ?? ''}/source`,
      payload: { url: 'https://printables.com/model/1' },
    });
    await t.as(admin, {
      method: 'PUT',
      url: `/api/orders/${
        (await t.as(admin, { url: `/api/prints/${target?.id ?? ''}` })).json<{
          orders: { id: string }[];
        }>().orders[0]?.id ?? ''
      }/state`,
      payload: { state: 'inProgress' },
    });
    const withFiles = (await queue()).groups
      .flatMap((group) => group.rows)
      .find((one) => one.id === target?.id);
    expect(withFiles?.hasFiles).toBe(true);
    expect(withFiles?.source).toBeNull();
    expect(withFiles?.note).toBe('Twee stuks');
  });

  /*
    The ending of a fileless request (ScreenQueue 2.14, GAP-159). Clearing its
    status would leave it alive in the database and on no screen, because
    every query but the queue's filters `origin = 'indexed'` — which this test
    states as a fact rather than as a claim in prose.
  */
  it('deletes a request, and only a request', async () => {
    const id = await addRequest('Koen', 'Lamp voor in de gang');
    const response = await t.as(admin, { method: 'DELETE', url: `/api/requests/${id}` });
    expect(response.statusCode).toBe(204);

    const groups = (await queue()).groups;
    expect(groups.flatMap((group) => group.rows).some((row) => row.id === id)).toBe(false);
    expect((await t.as(admin, { url: `/api/prints/${id}` })).statusCode).toBe(404);

    // An indexed print belongs to the owner's disk: it is hidden, never deleted.
    const print = (await t.as(admin, { url: '/api/prints?limit=100' })).json<{
      items: { id: string }[];
    }>().items[0];
    const refused = await t.as(admin, {
      method: 'DELETE',
      url: `/api/requests/${print?.id ?? ''}`,
    });
    expect(refused.statusCode).toBe(422);
    expect(refused.json()).toEqual({ error: 'not_a_request' });
    expect((await t.as(admin, { url: `/api/prints/${print?.id ?? ''}` })).statusCode).toBe(200);
  });

  it('a cleared request state would strand the record, which is why it can be deleted', async () => {
    const id = await addRequest('Koen', 'Kastje voor de meterkast');
    await t.as(admin, {
      method: 'POST',
      url: '/api/prints/bulk',
      payload: { ids: [id], action: 'setRequestState', state: null },
    });
    // Off the queue...
    const groups = (await queue()).groups;
    expect(groups.flatMap((group) => group.rows).some((row) => row.id === id)).toBe(false);
    // ...and on no other list either: the leak 2.14 names.
    const items = (await t.as(admin, { url: '/api/prints?limit=100' })).json<{
      items: { id: string }[];
    }>().items;
    expect(items.some((item) => item.id === id)).toBe(false);
  });

  it('refuses to link something that is not a request', async () => {
    const items = (await t.as(admin, { url: '/api/prints?limit=100' })).json<{
      items: { id: string }[];
    }>().items;
    const a = items[0]?.id ?? '';
    const b = items[1]?.id ?? '';
    const response = await t.as(admin, {
      method: 'POST',
      url: `/api/requests/${a}/link`,
      payload: { printId: b },
    });
    expect(response.statusCode).toBe(422);
    expect(response.json()).toEqual({ error: 'not_a_request' });
  });
});
