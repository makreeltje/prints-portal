import type { RawData, WebSocket } from 'ws';
import { customerScope, scopeAllows, type CustomerScope } from '../auth/access.js';
import type { AppDatabase } from '../db/connection.js';
import type { Role } from '../db/schema.js';

/**
 * Live updates. Every change to a print goes out as one small event; the
 * client refetches what it shows. A socket only receives events for
 * customers it subscribed to and may see (scope checked on every subscribe
 * and re-checked on every send, so revoked access stops events at once).
 */
export type LiveEventType = 'print:created' | 'print:updated' | 'print:deleted';

export interface LiveEvent {
  type: LiveEventType;
  printId: string;
  customerFolder: string;
}

/** Client → server. `customers: "all"` subscribes to everything the user may see. */
export interface SubscribeMessage {
  type: 'subscribe';
  customers: 'all' | string[];
}

interface Client {
  socket: WebSocket;
  userId: string;
  role: Role;
  sessionIdHash: string;
  scope: CustomerScope;
  /** null: every customer in scope. */
  subscribed: ReadonlySet<string> | null;
}

export interface HubLogger {
  debug(obj: object, msg: string): void;
  warn(obj: object, msg: string): void;
}

/** WebSocket close code when the session behind a socket has ended. */
export const CLOSE_SESSION_ENDED = 4401;

export class RealtimeHub {
  private readonly clients = new Set<Client>();

  constructor(
    private readonly db: AppDatabase,
    private readonly logger?: HubLogger,
  ) {}

  get size(): number {
    return this.clients.size;
  }

  async add(
    socket: WebSocket,
    user: { id: string; role: Role },
    sessionIdHash: string,
  ): Promise<void> {
    const client: Client = {
      socket,
      userId: user.id,
      role: user.role,
      sessionIdHash,
      scope: await customerScope(this.db, user),
      subscribed: new Set(),
    };
    this.clients.add(client);
    socket.on('close', () => {
      this.clients.delete(client);
    });
    socket.on('message', (data) => {
      void this.onMessage(client, rawToText(data));
    });
    this.send(client, { type: 'hello' });
  }

  /** Sends an event to every subscribed socket that may see the customer. */
  broadcast(event: LiveEvent): void {
    for (const client of this.clients) {
      if (!scopeAllows(client.scope, event.customerFolder)) continue;
      if (client.subscribed !== null && !client.subscribed.has(event.customerFolder)) continue;
      this.send(client, event);
    }
  }

  /** Re-reads scopes after grants or roles changed (cheap: a few sockets at most). */
  async refreshUser(userId: string, role?: Role): Promise<void> {
    for (const client of this.clients) {
      if (client.userId !== userId) continue;
      if (role !== undefined) client.role = role;
      client.scope = await customerScope(this.db, { id: userId, role: client.role });
    }
  }

  /** Closes sockets whose session ended (expired, signed out, user removed). */
  closeWhere(predicate: (sessionIdHash: string, userId: string) => boolean, reason: string): void {
    for (const client of this.clients) {
      if (predicate(client.sessionIdHash, client.userId)) {
        client.socket.close(CLOSE_SESSION_ENDED, reason);
        this.clients.delete(client);
      }
    }
  }

  sessionHashes(): string[] {
    return [...new Set([...this.clients].map((client) => client.sessionIdHash))];
  }

  closeAll(): void {
    for (const client of this.clients) client.socket.close(1001, 'server shutting down');
    this.clients.clear();
  }

  private async onMessage(client: Client, text: string): Promise<void> {
    let message: unknown;
    try {
      message = JSON.parse(text);
    } catch {
      return;
    }
    if (!isSubscribe(message)) return;
    // Re-read the scope: grants may have changed since the socket opened.
    client.scope = await customerScope(this.db, { id: client.userId, role: client.role });
    client.subscribed =
      message.customers === 'all'
        ? null
        : new Set(message.customers.filter((folder) => scopeAllows(client.scope, folder)));
    this.send(client, {
      type: 'subscribed',
      customers: client.subscribed === null ? 'all' : [...client.subscribed],
    });
  }

  private send(client: Client, payload: object): void {
    if (client.socket.readyState !== client.socket.OPEN) return;
    client.socket.send(JSON.stringify(payload), (error) => {
      if (error !== undefined) this.logger?.warn({ err: error }, 'live update not delivered');
    });
  }
}

function isSubscribe(value: unknown): value is SubscribeMessage {
  if (typeof value !== 'object' || value === null) return false;
  const { type, customers } = value as Record<string, unknown>;
  return (
    type === 'subscribe' &&
    (customers === 'all' ||
      (Array.isArray(customers) &&
        customers.length <= 1000 &&
        customers.every((folder) => typeof folder === 'string' && folder.length <= 255)))
  );
}

function rawToText(data: RawData): string {
  if (Array.isArray(data)) return Buffer.concat(data).toString('utf8');
  if (Buffer.isBuffer(data)) return data.toString('utf8');
  return Buffer.from(new Uint8Array(data)).toString('utf8');
}
