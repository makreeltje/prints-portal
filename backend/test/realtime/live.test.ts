import type { AddressInfo } from 'node:net';
import { rm } from 'node:fs/promises';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import WebSocket from 'ws';
import { CLOSE_SESSION_ENDED } from '../../src/realtime/hub.js';
import { startTestApp, type Session, type TestApp } from '../helpers/app.js';
import { makePrintsTree } from '../helpers/prints-tree.js';

describe('live updates', () => {
  let t: TestApp;
  let root: string;
  let base: string;
  let admin: Session;
  let helper: Session;
  const sockets: WebSocket[] = [];

  beforeEach(async () => {
    root = await makePrintsTree();
    t = await startTestApp('sqlite::memory:', { PRINTS_ROOT: root });
    await t.app.services.indexer.indexAll();
    await t.addUser('owner@example.org', 'Admin');
    const helperId = await t.addUser('helper@example.org', 'User');
    admin = await t.login('owner@example.org');
    helper = await t.login('helper@example.org');
    await t.as(admin, {
      method: 'PATCH',
      url: '/api/access',
      payload: { changes: [{ userId: helperId, customerFolder: 'Joey', granted: true }] },
    });
    await t.app.listen({ port: 0, host: '127.0.0.1' });
    base = `ws://127.0.0.1:${String((t.app.server.address() as AddressInfo).port)}`;
  });

  afterEach(async () => {
    for (const socket of sockets) socket.terminate();
    sockets.length = 0;
    await t.close();
    await rm(root, { recursive: true, force: true });
  });

  /** Opens a socket and collects every message; resolves once the server said hello. */
  async function connect(session: Session | null, origin?: string) {
    const headers: Record<string, string> = {};
    if (session !== null) headers.cookie = session.cookie;
    if (origin !== undefined) headers.origin = origin;
    const socket = new WebSocket(`${base}/api/live`, { headers });
    sockets.push(socket);
    const messages: Record<string, unknown>[] = [];
    socket.on('message', (data) => {
      messages.push(JSON.parse((data as Buffer).toString('utf8')) as Record<string, unknown>);
    });
    const opened = await new Promise<boolean>((resolve) => {
      socket.once('open', () => {
        resolve(true);
      });
      socket.once('unexpected-response', () => {
        resolve(false);
      });
      socket.once('error', () => {
        resolve(false);
      });
    });
    return { socket, messages, opened };
  }

  async function until(check: () => boolean, ms = 3000) {
    const start = Date.now();
    while (!check()) {
      if (Date.now() - start > ms) throw new Error('timed out');
      await new Promise((resolve) => setTimeout(resolve, 20));
    }
  }

  const printOf = async (name: string) => {
    const list = (await t.as(admin, { url: '/api/prints?limit=100' })).json<{
      items: { id: string; name: string; customerFolder: string }[];
    }>();
    const found = list.items.find((item) => item.name === name);
    if (found === undefined) throw new Error(name);
    return found;
  };

  it('refuses anonymous connections', async () => {
    const { opened } = await connect(null);
    expect(opened).toBe(false);
  });

  it('refuses another origin', async () => {
    const { socket, opened } = await connect(admin, 'https://evil.example');
    if (opened) {
      const code = await new Promise<number>((resolve) => {
        socket.once('close', (c) => {
          resolve(c);
        });
      });
      expect(code).toBe(1008);
    }
  });

  it('sends events for subscribed customers in scope, with a small payload', async () => {
    const adminLive = await connect(admin, base.replace('ws:', 'http:'));
    const helperLive = await connect(helper);
    await until(() => adminLive.messages.length > 0 && helperLive.messages.length > 0);
    adminLive.socket.send(JSON.stringify({ type: 'subscribe', customers: 'all' }));
    // A User asking for everything gets only what they may see.
    helperLive.socket.send(JSON.stringify({ type: 'subscribe', customers: ['Joey', 'Denise'] }));
    await until(() => helperLive.messages.some((m) => m.type === 'subscribed'));
    expect(helperLive.messages.find((m) => m.type === 'subscribed')).toEqual({
      type: 'subscribed',
      customers: ['Joey'],
    });
    await until(() => adminLive.messages.some((m) => m.type === 'subscribed'));

    const keychain = await printOf('Keychain');
    const lock = await printOf('Babybox locks');
    await t.as(admin, { method: 'DELETE', url: `/api/prints/${keychain.id}` });
    await t.as(admin, { method: 'DELETE', url: `/api/prints/${lock.id}` });
    await until(() => adminLive.messages.filter((m) => m.type === 'print:deleted').length === 2);
    await until(() => helperLive.messages.some((m) => m.type === 'print:deleted'));
    expect(helperLive.messages.filter((m) => m.type === 'print:deleted')).toEqual([
      { type: 'print:deleted', printId: lock.id, customerFolder: 'Joey' },
    ]);
  });

  it('forwards indexer changes', async () => {
    const live = await connect(admin);
    await until(() => live.messages.length > 0);
    live.socket.send(JSON.stringify({ type: 'subscribe', customers: ['Wouter'] }));
    await until(() => live.messages.some((m) => m.type === 'subscribed'));
    const { put } = await import('../helpers/prints-tree.js');
    await put(root, 'Wouter/Empty/stand_PLA_1h.gcode', 'orca-single-slot.gcode');
    await t.app.services.indexer.indexAll();
    await until(() => live.messages.some((m) => m.type === 'print:updated'));
    expect(live.messages.find((m) => m.type === 'print:updated')).toMatchObject({
      customerFolder: 'Wouter',
    });
  });

  it('closes the socket when the session ends', async () => {
    const live = await connect(helper);
    await until(() => live.messages.length > 0);
    const closed = new Promise<number>((resolve) => {
      live.socket.once('close', (code) => {
        resolve(code);
      });
    });
    await t.as(helper, { method: 'POST', url: '/api/auth/logout' });
    t.app.services.hub.closeWhere(() => true, 'test'); // the 60 s check, run now
    expect(await closed).toBe(CLOSE_SESSION_ENDED);
  });
});
