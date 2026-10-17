import type { FastifyInstance, FastifyReply, FastifyRequest } from 'fastify';
import { calculateCost } from '../core/cost.js';
import { suggestSalePrice } from '../core/pricing.js';
import { toCents } from '../core/money.js';
import type { AppDatabase } from '../db/connection.js';
import type { Role } from '../db/schema.js';
import type { Indexer } from '../indexing/indexer.js';
import { deletePrint, setPrintTags, UnknownTagError } from '../prints/mutations.js';
import type { LiveEvent, RealtimeHub } from '../realtime/hub.js';
import { recalculateAll } from './costs.js';
import {
  addPayment,
  deleteRepeatOrder,
  FinanceError,
  setLineOverride,
  setNoBilling,
  setOrderOverrides,
  setPayLink,
  setPrintSpool,
  setSalePrice,
  setTimesPrinted,
  undoLastPayment,
  undoWriteOff,
  writeOff,
  setRequestState,
} from './mutations.js';
import { emptyOrder, itemKey } from './orders.js';
import { REQUEST_STATES, parseRequestState } from './state.js';
import { ordersWithMoney } from './read.js';
import { readSettings, writeSetting, type Settings } from './settings.js';
import { SpoolmanUnavailableError, type SpoolmanClient } from './spoolman.js';
import type { SpoolSnapshot } from './spools.js';

export interface FinanceRouteDependencies {
  db: AppDatabase;
  indexer: Indexer;
  hub: RealtimeHub;
  spoolman: SpoolmanClient;
  now: () => Date;
}

const MANAGE: readonly Role[] = ['Admin', 'Editor'];
const ADMIN: readonly Role[] = ['Admin'];
const UUID = { type: 'string', pattern: '^[0-9a-fA-F-]{36}$' } as const;
/** Euros with at most two decimals, below ten million. */
const EUROS = { type: 'number', minimum: 0, maximum: 9_999_999 } as const;
/**
 * A type union, not anyOf: Fastify coerces types, and inside anyOf `null`
 * becomes 0 or false (or the other way round). A union leaves values that
 * already match alone.
 */
const nullable = <T extends { type: string }>(schema: T) =>
  ({ ...schema, type: [schema.type, 'null'] }) as const;

const printParams = { type: 'object', required: ['id'], properties: { id: UUID } } as const;
const lineParams = {
  type: 'object',
  required: ['id', 'lineId'],
  properties: { id: UUID, lineId: UUID },
} as const;
const orderParams = {
  type: 'object',
  required: ['orderId'],
  properties: { orderId: UUID },
} as const;

/**
 * Financials (M6): spools, cost overrides, times printed, exclusions, sale
 * price, payments, write-offs, settings, "niet factureren" and bulk actions.
 * Admins and Editors work with money; undoing a payment or a write-off and
 * every setting are Admin-only (plan). Users have no access to any of it.
 */
export function registerFinanceRoutes(app: FastifyInstance, deps: FinanceRouteDependencies): void {
  const { db, indexer, hub, spoolman, now } = deps;
  const iso = () => now().toISOString();
  const userId = (request: FastifyRequest) => {
    if (request.auth === null) throw new Error('session missing after guard');
    return request.auth.user.id;
  };
  const isAdmin = (request: FastifyRequest) => request.auth?.user.role === 'Admin';
  const broadcast = (type: LiveEvent['type'], printId: string, customerFolder: string) => {
    hub.broadcast({ type, printId, customerFolder });
  };

  /** A print Admins and Editors may change: it exists and is not deleted (Admins see those). */
  async function printFor(request: FastifyRequest, reply: FastifyReply, id: string) {
    const print = await db
      .selectFrom('print_records')
      .select(['id', 'customer_folder', 'status'])
      .where('id', '=', id)
      .executeTakeFirst();
    if (print === undefined || (print.status === 'deleted' && !isAdmin(request))) {
      await reply.code(404).send({ error: 'not_found' });
      return null;
    }
    return print;
  }

  async function orderFor(request: FastifyRequest, reply: FastifyReply, orderId: string) {
    const order = await db
      .selectFrom('print_orders')
      .select('print_record_id')
      .where('id', '=', orderId)
      .executeTakeFirst();
    if (order === undefined) {
      await reply.code(404).send({ error: 'not_found' });
      return null;
    }
    return printFor(request, reply, order.print_record_id);
  }

  async function financeError(reply: FastifyReply, error: unknown): Promise<FastifyReply> {
    if (error instanceof FinanceError) {
      return reply.code(error.code === 'not_found' ? 404 : 409).send({ error: error.code });
    }
    if (error instanceof SpoolmanUnavailableError) {
      return reply.code(503).send({ error: 'spoolman_unavailable' });
    }
    throw error;
  }

  /** Snapshot of a Spoolman spool; null id clears. */
  async function snapshotOf(spoolId: number | null): Promise<SpoolSnapshot | null | 'missing'> {
    if (spoolId === null) return null;
    const spool = await spoolman.getSpool(spoolId);
    return spool === null ? 'missing' : spoolman.snapshot(spool);
  }

  // ---------------------------------------------------------------- Spoolman

  app.get('/api/spools', { config: { auth: MANAGE } }, async (_request, reply) => {
    if (!spoolman.configured) return { configured: false, spools: [] };
    try {
      return { configured: true, spools: await spoolman.listSpools() };
    } catch (error) {
      return financeError(reply, error);
    }
  });

  app.get('/api/spoolman/status', { config: { auth: MANAGE } }, () => spoolman.status());

  app.post('/api/spoolman/refresh', { config: { auth: MANAGE } }, () => {
    spoolman.refresh();
    return spoolman.status();
  });

  // ----------------------------------------------------- spools and overrides

  app.put<{ Params: { id: string }; Body: { spoolId: number | null } }>(
    '/api/prints/:id/spool',
    {
      config: { auth: MANAGE },
      schema: {
        params: printParams,
        body: {
          type: 'object',
          required: ['spoolId'],
          additionalProperties: false,
          properties: { spoolId: nullable({ type: 'integer', minimum: 1 }) },
        },
      },
    },
    async (request, reply) => {
      const print = await printFor(request, reply, request.params.id);
      if (print === null) return reply;
      try {
        const snapshot = await snapshotOf(request.body.spoolId);
        if (snapshot === 'missing') return await reply.code(400).send({ error: 'unknown_spool' });
        const result = await setPrintSpool(db, print.id, snapshot, iso());
        broadcast('print:updated', print.id, print.customer_folder);
        return await reply.send(result);
      } catch (error) {
        return financeError(reply, error);
      }
    },
  );

  app.put<{
    Params: { id: string; lineId: string };
    Body: { slot: number; spoolId?: number | null; pricePerKg?: number | null };
  }>(
    '/api/prints/:id/lines/:lineId/override',
    {
      config: { auth: MANAGE },
      schema: {
        params: lineParams,
        body: {
          type: 'object',
          required: ['slot'],
          additionalProperties: false,
          properties: {
            // 0: the whole file or plate; 1…n: one filament slot.
            slot: { type: 'integer', minimum: 0, maximum: 64 },
            spoolId: nullable({ type: 'integer', minimum: 1 }),
            pricePerKg: nullable({ type: 'number', minimum: 0, maximum: 10_000 }),
          },
        },
      },
    },
    async (request, reply) => {
      const print = await printFor(request, reply, request.params.id);
      if (print === null) return reply;
      const { slot, spoolId, pricePerKg } = request.body;
      try {
        const change: { spool?: SpoolSnapshot | null; manualPricePerKg?: number | null } = {};
        if (spoolId !== undefined) {
          const snapshot = await snapshotOf(spoolId);
          if (snapshot === 'missing') return await reply.code(400).send({ error: 'unknown_spool' });
          change.spool = snapshot;
        }
        if (pricePerKg !== undefined) change.manualPricePerKg = pricePerKg;
        await setLineOverride(db, print.id, request.params.lineId, slot, change, iso());
      } catch (error) {
        return financeError(reply, error);
      }
      broadcast('print:updated', print.id, print.customer_folder);
      return reply.code(204).send();
    },
  );

  app.put<{ Params: { id: string; lineId: string }; Body: { excluded: boolean | null } }>(
    '/api/prints/:id/lines/:lineId/excluded',
    {
      config: { auth: MANAGE },
      schema: {
        params: lineParams,
        body: {
          type: 'object',
          required: ['excluded'],
          additionalProperties: false,
          // null: back to the automatic rule.
          properties: { excluded: nullable({ type: 'boolean' }) },
        },
      },
    },
    async (request, reply) => {
      const print = await printFor(request, reply, request.params.id);
      if (print === null) return reply;
      const { excluded } = request.body;
      const updated = await db
        .updateTable('print_lines')
        .set({ user_excluded: excluded === null ? null : excluded ? 1 : 0 })
        .where('id', '=', request.params.lineId)
        .where('asset_id', 'in', (eb) =>
          eb.selectFrom('print_assets').select('id').where('print_record_id', '=', print.id),
        )
        .executeTakeFirst();
      if (updated.numUpdatedRows === 0n) {
        // MariaDB reports 0 when nothing changed; check the line exists.
        const exists = await db
          .selectFrom('print_lines')
          .select('id')
          .where('id', '=', request.params.lineId)
          .executeTakeFirst();
        if (exists === undefined) return reply.code(404).send({ error: 'not_found' });
      }
      await indexer.recalculateRecord(print.id);
      broadcast('print:updated', print.id, print.customer_folder);
      return reply.code(204).send();
    },
  );

  app.put<{
    Params: { id: string; lineId: string };
    Body: { timesPrinted: number; orderId?: string };
  }>(
    '/api/prints/:id/lines/:lineId/times',
    {
      config: { auth: MANAGE },
      schema: {
        params: lineParams,
        body: {
          type: 'object',
          required: ['timesPrinted'],
          additionalProperties: false,
          properties: {
            timesPrinted: { type: 'integer', minimum: 1, maximum: 1000 },
            orderId: UUID,
          },
        },
      },
    },
    async (request, reply) => {
      const print = await printFor(request, reply, request.params.id);
      if (print === null) return reply;
      try {
        await setTimesPrinted(
          db,
          print.id,
          request.params.lineId,
          request.body.orderId ?? null,
          request.body.timesPrinted,
          iso(),
        );
      } catch (error) {
        return financeError(reply, error);
      }
      await indexer.recalculateRecord(print.id);
      broadcast('print:updated', print.id, print.customer_folder);
      return reply.code(204).send();
    },
  );

  // ----------------------------------------------------------------- orders

  /** "Nabestelling maken": a new order with the chosen files and how often each was printed. */
  app.post<{
    Params: { id: string };
    Body: { items: { lineId: string; timesPrinted: number }[] };
  }>(
    '/api/prints/:id/orders',
    {
      config: { auth: MANAGE },
      schema: {
        params: printParams,
        body: {
          type: 'object',
          required: ['items'],
          additionalProperties: false,
          properties: {
            items: {
              type: 'array',
              minItems: 1,
              maxItems: 500,
              items: {
                type: 'object',
                required: ['lineId', 'timesPrinted'],
                additionalProperties: false,
                properties: {
                  lineId: UUID,
                  timesPrinted: { type: 'integer', minimum: 1, maximum: 1000 },
                },
              },
            },
          },
        },
      },
    },
    async (request, reply) => {
      const print = await printFor(request, reply, request.params.id);
      if (print === null) return reply;
      const lineIds = [...new Set(request.body.items.map((item) => item.lineId))];
      const lines = await db
        .selectFrom('print_lines as l')
        .innerJoin('print_assets as a', 'a.id', 'l.asset_id')
        .select(['l.id', 'a.path_hash', 'l.plate_index'])
        .where('a.print_record_id', '=', print.id)
        .where('l.id', 'in', lineIds)
        .execute();
      if (lines.length !== lineIds.length) return reply.code(400).send({ error: 'unknown_line' });
      const orderId = crypto.randomUUID();
      const stamp = iso();
      await db.transaction().execute(async (trx) => {
        const last = await trx
          .selectFrom('print_orders')
          .select((eb) => eb.fn.max('number').as('number'))
          .where('print_record_id', '=', print.id)
          .executeTakeFirst();
        const number = (last?.number ?? 0) + 1;
        await trx
          .insertInto('print_orders')
          .values(emptyOrder(orderId, print.id, number, stamp, userId(request)))
          .execute();
        const seen = new Set<string>();
        for (const item of request.body.items) {
          const line = lines.find((l) => l.id === item.lineId);
          if (line === undefined) continue;
          const key = itemKey(line.path_hash, line.plate_index);
          if (seen.has(key)) continue;
          seen.add(key);
          await trx
            .insertInto('order_items')
            .values({
              order_id: orderId,
              path_hash: line.path_hash,
              plate_index: line.plate_index,
              times_printed: item.timesPrinted,
            })
            .execute();
        }
      });
      await indexer.recalculateRecord(print.id);
      broadcast('print:updated', print.id, print.customer_folder);
      return reply.code(201).send({ id: orderId });
    },
  );

  app.put<{
    Params: { orderId: string };
    Body: { pricePerKg: number | null; grams: number | null; printSeconds: number | null };
  }>(
    '/api/orders/:orderId/overrides',
    {
      config: { auth: MANAGE },
      schema: {
        params: orderParams,
        body: {
          type: 'object',
          required: ['pricePerKg', 'grams', 'printSeconds'],
          additionalProperties: false,
          properties: {
            pricePerKg: nullable({ type: 'number', minimum: 0, maximum: 10_000 }),
            grams: nullable({ type: 'number', minimum: 0, maximum: 1_000_000 }),
            printSeconds: nullable({ type: 'integer', minimum: 0, maximum: 31_536_000 }),
          },
        },
      },
    },
    async (request, reply) => {
      const print = await orderFor(request, reply, request.params.orderId);
      if (print === null) return reply;
      try {
        await setOrderOverrides(db, request.params.orderId, request.body, iso());
      } catch (error) {
        return financeError(reply, error);
      }
      broadcast('print:updated', print.id, print.customer_folder);
      return reply.code(204).send();
    },
  );

  app.put<{ Params: { orderId: string }; Body: { salePrice: number | null } }>(
    '/api/orders/:orderId/sale-price',
    {
      config: { auth: MANAGE },
      schema: {
        params: orderParams,
        body: {
          type: 'object',
          required: ['salePrice'],
          additionalProperties: false,
          properties: { salePrice: nullable(EUROS) },
        },
      },
    },
    async (request, reply) => {
      const print = await orderFor(request, reply, request.params.orderId);
      if (print === null) return reply;
      const { salePrice } = request.body;
      try {
        await setSalePrice(
          db,
          request.params.orderId,
          salePrice === null ? null : toCents(salePrice),
          userId(request),
          iso(),
        );
      } catch (error) {
        return financeError(reply, error);
      }
      await touch(print.id);
      broadcast('print:updated', print.id, print.customer_folder);
      return reply.code(204).send();
    },
  );

  /** Where a request stands: null clears it back to "as before". */
  app.put<{ Params: { orderId: string }; Body: { state: string | null } }>(
    '/api/orders/:orderId/state',
    {
      config: { auth: MANAGE },
      schema: {
        params: orderParams,
        body: {
          type: 'object',
          required: ['state'],
          properties: { state: { type: ['string', 'null'], enum: [...REQUEST_STATES, null] } },
        },
      },
    },
    async (request, reply) => {
      const print = await orderFor(request, reply, request.params.orderId);
      if (print === null) return reply;
      try {
        await setRequestState(
          db,
          request.params.orderId,
          parseRequestState(request.body.state),
          iso(),
        );
      } catch (error) {
        return financeError(reply, error);
      }
      await indexer.recalculateRecord(print.id);
      broadcast('print:updated', print.id, print.customer_folder);
      return reply.code(204).send();
    },
  );

  app.post<{ Params: { orderId: string }; Body: { amount: number } }>(
    '/api/orders/:orderId/payments',
    {
      config: { auth: MANAGE },
      schema: {
        params: orderParams,
        body: {
          type: 'object',
          required: ['amount'],
          additionalProperties: false,
          properties: { amount: { ...EUROS, exclusiveMinimum: 0 } },
        },
      },
    },
    async (request, reply) => {
      const print = await orderFor(request, reply, request.params.orderId);
      if (print === null) return reply;
      try {
        await addPayment(
          db,
          request.params.orderId,
          toCents(request.body.amount),
          userId(request),
          iso(),
        );
      } catch (error) {
        return financeError(reply, error);
      }
      await touch(print.id);
      broadcast('print:updated', print.id, print.customer_folder);
      return reply.code(201).send();
    },
  );

  app.post<{ Params: { orderId: string } }>(
    '/api/orders/:orderId/payments/undo',
    { config: { auth: ADMIN }, schema: { params: orderParams } },
    async (request, reply) => {
      const print = await orderFor(request, reply, request.params.orderId);
      if (print === null) return reply;
      try {
        await undoLastPayment(db, request.params.orderId, userId(request), iso());
      } catch (error) {
        return financeError(reply, error);
      }
      await touch(print.id);
      broadcast('print:updated', print.id, print.customer_folder);
      return reply.code(204).send();
    },
  );

  app.post<{ Params: { orderId: string }; Body: { reason?: string | null } }>(
    '/api/orders/:orderId/write-off',
    {
      config: { auth: MANAGE },
      schema: {
        params: orderParams,
        body: {
          type: 'object',
          additionalProperties: false,
          properties: { reason: nullable({ type: 'string', maxLength: 500 }) },
        },
      },
    },
    async (request, reply) => {
      const print = await orderFor(request, reply, request.params.orderId);
      if (print === null) return reply;
      const reason = request.body.reason?.trim() ?? '';
      try {
        await writeOff(
          db,
          request.params.orderId,
          reason === '' ? null : reason,
          userId(request),
          iso(),
        );
      } catch (error) {
        return financeError(reply, error);
      }
      await touch(print.id);
      broadcast('print:updated', print.id, print.customer_folder);
      return reply.code(204).send();
    },
  );

  app.delete<{ Params: { orderId: string } }>(
    '/api/orders/:orderId/write-off',
    { config: { auth: ADMIN }, schema: { params: orderParams } },
    async (request, reply) => {
      const print = await orderFor(request, reply, request.params.orderId);
      if (print === null) return reply;
      try {
        await undoWriteOff(db, request.params.orderId, iso());
      } catch (error) {
        return financeError(reply, error);
      }
      await touch(print.id);
      broadcast('print:updated', print.id, print.customer_folder);
      return reply.code(204).send();
    },
  );

  /** "Nabestelling verwijderen". */
  app.delete<{ Params: { orderId: string } }>(
    '/api/orders/:orderId',
    { config: { auth: MANAGE }, schema: { params: orderParams } },
    async (request, reply) => {
      const print = await orderFor(request, reply, request.params.orderId);
      if (print === null) return reply;
      try {
        await deleteRepeatOrder(db, request.params.orderId, iso());
      } catch (error) {
        return financeError(reply, error);
      }
      await indexer.recalculateRecord(print.id);
      broadcast('print:updated', print.id, print.customer_folder);
      return reply.code(204).send();
    },
  );

  /** The print's version changes with its money, so lists and thumbnails refresh. */
  async function touch(recordId: string): Promise<void> {
    await db
      .updateTable('print_records')
      .set({ updated_at: iso() })
      .where('id', '=', recordId)
      .execute();
  }

  // -------------------------------------------------------------- calculate

  /** Quick estimate without a print: grams, time, material, printer, optional €/kg. */
  app.post<{
    Body: {
      grams: number;
      printSeconds?: number | null;
      material?: string | null;
      printerModel?: string | null;
      pricePerKg?: number | null;
    };
  }>(
    '/api/calculate',
    {
      config: { auth: MANAGE },
      schema: {
        body: {
          type: 'object',
          required: ['grams'],
          additionalProperties: false,
          properties: {
            grams: { type: 'number', minimum: 0, maximum: 1_000_000 },
            printSeconds: nullable({ type: 'integer', minimum: 0, maximum: 31_536_000 }),
            material: nullable({ type: 'string', maxLength: 64 }),
            printerModel: nullable({ type: 'string', maxLength: 255 }),
            pricePerKg: nullable({ type: 'number', minimum: 0, maximum: 10_000 }),
          },
        },
      },
    },
    async (request) => {
      const settings = await readSettings(db);
      const body = request.body;
      const breakdown = calculateCost(
        {
          lines: [],
          spoolPricePerKg: null,
          manualPricePerKg: body.pricePerKg ?? null,
          manualGrams: body.grams,
          manualPrintTimeSeconds: body.printSeconds ?? null,
          material: body.material ?? null,
          printerModel: body.printerModel ?? null,
          metadataGrams: null,
        },
        {
          materialPricesPerKg: settings.pricing.materialPricesPerKg,
          tariffEurPerKwh: settings.pricing.tariffEurPerKwh,
          printers: settings.printers,
        },
      );
      return { ...breakdown, lines: undefined };
    },
  );

  // --------------------------------------------------------------- settings

  app.get('/api/settings', { config: { auth: ADMIN } }, () => readSettings(db));

  /** Standaardmarge for "Voorstel uit marge per print" (BulkDialogs); Editors may read it. */
  app.get('/api/settings/markup', { config: { auth: MANAGE } }, async () => ({
    defaultMarkupPercent: (await readSettings(db)).pricing.defaultMarkupPercent,
  }));

  const settingsSchemas: Record<keyof Settings, object> = {
    pricing: {
      type: 'object',
      required: ['defaultMarkupPercent', 'tariffEurPerKwh', 'materialPricesPerKg'],
      additionalProperties: false,
      properties: {
        defaultMarkupPercent: nullable({ type: 'number', minimum: 0, maximum: 10_000 }),
        tariffEurPerKwh: nullable({ type: 'number', minimum: 0, maximum: 10 }),
        materialPricesPerKg: {
          type: 'object',
          maxProperties: 100,
          propertyNames: { minLength: 1, maxLength: 64 },
          additionalProperties: { type: 'number', minimum: 0, maximum: 10_000 },
        },
      },
    },
    printers: {
      type: 'array',
      maxItems: 50,
      items: {
        type: 'object',
        required: ['key', 'displayName', 'aliases', 'videoPrefixes', 'watts'],
        additionalProperties: false,
        properties: {
          key: { type: 'string', minLength: 1, maxLength: 64 },
          displayName: { type: 'string', minLength: 1, maxLength: 120 },
          aliases: {
            type: 'array',
            maxItems: 20,
            items: { type: 'string', minLength: 1, maxLength: 120 },
          },
          videoPrefixes: {
            type: 'array',
            maxItems: 20,
            items: { type: 'string', minLength: 1, maxLength: 64 },
          },
          watts: nullable({ type: 'number', minimum: 0, maximum: 10_000 }),
        },
      },
    },
    company: {
      type: 'object',
      required: ['name', 'iban', 'address'],
      additionalProperties: false,
      properties: {
        name: { type: 'string', maxLength: 200 },
        iban: { type: 'string', maxLength: 40 },
        address: { type: 'string', maxLength: 500 },
        email: nullable({ type: 'string', maxLength: 254 }),
        phone: nullable({ type: 'string', maxLength: 40 }),
      },
    },
  };

  for (const key of ['pricing', 'printers', 'company'] as const) {
    app.put<{ Body: Settings[typeof key] }>(
      `/api/settings/${key}`,
      { config: { auth: ADMIN }, schema: { body: settingsSchemas[key] } },
      async (request, reply) => {
        let body = request.body;
        if (key === 'printers') {
          const keys = (body as Settings['printers']).map((p) => p.key.toLowerCase());
          if (new Set(keys).size !== keys.length) {
            return reply.code(400).send({ error: 'duplicate_printer' });
          }
        }
        if (key === 'company') {
          const company = body as Settings['company'];
          body = { ...company, email: company.email ?? null, phone: company.phone ?? null };
        }
        await writeSetting(db, key, body, userId(request), iso());
        // Markup only changes prices, which are derived on read; the rest changes costs.
        if (key === 'pricing' || key === 'printers') await recalculateAll(db, iso());
        return readSettings(db);
      },
    );
  }

  app.put<{ Params: { folder: string }; Body: { noBilling: boolean } }>(
    '/api/customers/:folder/billing',
    {
      config: { auth: ADMIN },
      schema: {
        params: {
          type: 'object',
          required: ['folder'],
          properties: { folder: { type: 'string', minLength: 1, maxLength: 255 } },
        },
        body: {
          type: 'object',
          required: ['noBilling'],
          additionalProperties: false,
          properties: { noBilling: { type: 'boolean' } },
        },
      },
    },
    async (request, reply) => {
      const exists = await db
        .selectFrom('print_records')
        .select('id')
        .where('customer_folder', '=', request.params.folder)
        .executeTakeFirst();
      if (exists === undefined) return reply.code(404).send({ error: 'not_found' });
      await setNoBilling(db, request.params.folder, request.body.noBilling, iso());
      const prints = await db
        .selectFrom('print_records')
        .select('id')
        .where('customer_folder', '=', request.params.folder)
        .where('status', '!=', 'deleted')
        .execute();
      for (const print of prints) broadcast('print:updated', print.id, request.params.folder);
      return reply.code(204).send();
    },
  );

  app.put<{ Params: { folder: string }; Body: { payLink: string | null } }>(
    '/api/customers/:folder/pay-link',
    {
      config: { auth: ADMIN },
      schema: {
        params: {
          type: 'object',
          required: ['folder'],
          properties: { folder: { type: 'string', minLength: 1, maxLength: 255 } },
        },
        body: {
          type: 'object',
          required: ['payLink'],
          additionalProperties: false,
          properties: { payLink: { type: ['string', 'null'], maxLength: 2048 } },
        },
      },
    },
    async (request, reply) => {
      const exists = await db
        .selectFrom('print_records')
        .select('id')
        .where('customer_folder', '=', request.params.folder)
        .executeTakeFirst();
      if (exists === undefined) return reply.code(404).send({ error: 'not_found' });
      const raw = request.body.payLink?.trim() ?? '';
      // Only a link the browser will actually open, and never one that runs
      // script: this URL is put in front of a customer.
      if (raw !== '' && !/^https:\/\/[^\s]+$/i.test(raw)) {
        return reply.code(422).send({ error: 'invalid_pay_link' });
      }
      await setPayLink(db, request.params.folder, raw === '' ? null : raw, iso());
      return reply.code(204).send();
    },
  );

  // ------------------------------------------------------------------- bulk

  type BulkBody =
    | { action: 'markPaid'; ids: string[] }
    | { action: 'setPrice'; ids: string[]; salePrice?: number | null; suggested?: boolean }
    | { action: 'assignSpool'; ids: string[]; spoolId: number | null }
    | { action: 'delete'; ids: string[] }
    | { action: 'addTags' | 'removeTags'; ids: string[]; tagIds: string[] };

  /** One action for many prints; every print gets its own result, failures do not stop the rest. */
  app.post<{ Body: BulkBody }>(
    '/api/prints/bulk',
    {
      config: { auth: MANAGE },
      schema: {
        body: {
          type: 'object',
          required: ['action', 'ids'],
          properties: {
            action: {
              type: 'string',
              enum: [
                'markPaid',
                'setPrice',
                'assignSpool',
                'delete',
                'addTags',
                'removeTags',
                'setRequestState',
              ],
            },
            ids: { type: 'array', minItems: 1, maxItems: 200, items: UUID },
            salePrice: nullable(EUROS),
            // "Voorstel uit marge per print": each print gets its own suggested price.
            suggested: { type: 'boolean' },
            spoolId: nullable({ type: 'integer', minimum: 1 }),
            tagIds: { type: 'array', maxItems: 50, items: UUID },
          },
        },
      },
    },
    async (request, reply) => {
      const body = request.body;
      const ids = [...new Set(body.ids)];
      let spool: SpoolSnapshot | null = null;
      if (body.action === 'assignSpool') {
        try {
          const snapshot = await snapshotOf(body.spoolId);
          if (snapshot === 'missing') return await reply.code(400).send({ error: 'unknown_spool' });
          spool = snapshot;
        } catch (error) {
          return financeError(reply, error);
        }
      }
      if (body.action === 'setPrice' && body.suggested !== true && body.salePrice === undefined) {
        return reply.code(400).send({ error: 'missing_price' });
      }
      const results: {
        id: string;
        ok: boolean;
        error?: string;
        orderNumber?: number;
        invoiceNumber?: string;
      }[] = [];
      for (const id of ids) {
        const print = await db
          .selectFrom('print_records')
          .select(['id', 'customer_folder', 'status'])
          .where('id', '=', id)
          .executeTakeFirst();
        if (print === undefined || (print.status === 'deleted' && !isAdmin(request))) {
          results.push({ id, ok: false, error: 'not_found' });
          continue;
        }
        try {
          await bulkOne(request, body, print.id, spool);
          results.push({ id, ok: true });
          broadcast(
            body.action === 'delete' ? 'print:deleted' : 'print:updated',
            print.id,
            print.customer_folder,
          );
        } catch (error) {
          if (error instanceof FinanceError) {
            results.push({ id, ok: false, error: error.code, ...error.detail });
          } else if (error instanceof UnknownTagError) {
            results.push({ id, ok: false, error: 'unknown_tag' });
          } else throw error;
        }
      }
      return { results };
    },
  );

  async function bulkOne(
    request: FastifyRequest,
    body: BulkBody,
    recordId: string,
    spool: SpoolSnapshot | null,
  ): Promise<void> {
    const stamp = iso();
    switch (body.action) {
      case 'markPaid': {
        const orders = (await ordersWithMoney(db, [recordId])).get(recordId) ?? [];
        const open = orders.filter((o) => (o.money.remainingCents ?? 0) > 0);
        if (orders.some((o) => o.noBilling)) throw new FinanceError('not_billed');
        if (open.length === 0) {
          throw new FinanceError(
            orders.some((o) => o.money.remainingCents === null) ? 'no_price' : 'nothing_open',
          );
        }
        for (const o of open) {
          await addPayment(db, o.order.id, o.money.remainingCents ?? 0, userId(request), stamp);
        }
        await touch(recordId);
        return;
      }
      case 'setPrice': {
        // Owner decision (GAP-034): the newest order; paid, written-off or invoiced fails.
        const orders = (await ordersWithMoney(db, [recordId])).get(recordId) ?? [];
        const newest = orders.at(-1);
        if (newest === undefined) throw new FinanceError('not_found');
        const orderNumber = newest.order.number;
        if (newest.noBilling) throw new FinanceError('not_billed');
        if (newest.order.invoice_id !== null) {
          const invoice = await db
            .selectFrom('invoices')
            .select('number')
            .where('id', '=', newest.order.invoice_id)
            .executeTakeFirst();
          throw new FinanceError('locked', { orderNumber, invoiceNumber: invoice?.number ?? '' });
        }
        if (newest.money.status === 'paid') throw new FinanceError('paid', { orderNumber });
        if (newest.money.status === 'writtenOff') {
          throw new FinanceError('written_off', { orderNumber });
        }
        let cents: number | null;
        if (body.suggested === true) {
          const suggestion = suggestSalePrice(
            newest.order.total_cost_cents === null ? null : newest.order.total_cost_cents / 100,
            (await readSettings(db)).pricing.defaultMarkupPercent,
          );
          if (!suggestion.ok) throw new FinanceError('no_cost', { orderNumber });
          cents = toCents(suggestion.salePrice);
        } else {
          cents =
            body.salePrice === null || body.salePrice === undefined
              ? null
              : toCents(body.salePrice);
        }
        await setSalePrice(db, newest.order.id, cents, userId(request), stamp);
        await touch(recordId);
        return;
      }
      case 'assignSpool':
        await setPrintSpool(db, recordId, spool, stamp);
        return;
      case 'delete': {
        const deleted = await deletePrint(db, recordId, userId(request), now());
        if (deleted === null) throw new FinanceError('not_found');
        return;
      }
      case 'addTags':
      case 'removeTags': {
        const current = await db
          .selectFrom('print_tags')
          .select('tag_id')
          .where('print_record_id', '=', recordId)
          .execute();
        const have = new Set(current.map((row) => row.tag_id));
        for (const tagId of body.tagIds) {
          if (body.action === 'addTags') have.add(tagId);
          else have.delete(tagId);
        }
        await setPrintTags(db, recordId, [...have], now());
        return;
      }
    }
  }
}
