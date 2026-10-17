import { randomUUID } from 'node:crypto';
import type { Kysely } from 'kysely';
import type { Database, PrintRecordTable } from '../db/schema.js';
import { emptyOrder } from '../finance/orders.js';
import type { RequestState } from '../finance/state.js';

/**
 * A request: work asked for before anything exists on disk.
 *
 * The indexer is otherwise the only writer of print records, because a record
 * meant "a folder is there". A request arrives before the folder — someone
 * asks while the owner is away from his laptop, and he makes the folder days
 * later, if the job goes ahead at all. So the app creates this one, and the
 * indexer leaves it alone (`origin = 'request'`).
 *
 * It carries the same order as any print, so the price and the request state
 * built in 2.9 work on it with no special case. When the files finally exist,
 * the request is linked to the folder's record rather than merged blindly:
 * see `linkRequest`.
 */
export class RequestError extends Error {
  override name = 'RequestError';
}

export interface NewRequest {
  customerFolder: string;
  name: string;
  state: RequestState | null;
}

export async function createRequest(
  db: Kysely<Database>,
  input: NewRequest,
  now: string,
): Promise<PrintRecordTable> {
  const name = input.name.trim();
  const customer = input.customerFolder.trim();
  if (name === '' || customer === '') throw new RequestError('name_required');
  const id = randomUUID();
  return db.transaction().execute(async (trx) => {
    await trx
      .insertInto('print_records')
      .values({
        id,
        /*
          A key that cannot collide with a folder's: the real ones are
          "<customer>/<project>", and a request has no project yet. If it were
          named after what the owner typed, making the folder later with the
          same name would collide with the record waiting for it.
        */
        record_key: `request:${id}`,
        customer_folder: customer,
        project_folder: null,
        display_name: name,
        status: 'indexed',
        origin: 'request',
        discovered_at: now,
        last_seen_at: now,
        archived_at: null,
        deleted_at: null,
        deleted_by: null,
        part_name: null,
        material: null,
        printer_model: null,
        print_date: null,
        total_grams: null,
        total_print_seconds: null,
        updated_at: now,
      })
      .execute();
    const order = emptyOrder(randomUUID(), id, 1, now, null);
    await trx
      .insertInto('print_orders')
      .values({ ...order, request_state: input.state, request_state_at: input.state && now })
      .execute();
    const made = await trx
      .selectFrom('print_records')
      .selectAll()
      .where('id', '=', id)
      .executeTakeFirstOrThrow();
    return made;
  });
}

/**
 * Point a request at the folder that has since appeared.
 *
 * The indexed record wins: it owns the files, the thumbnails and the identity
 * the rest of the app knows. What moves across is what only the request has —
 * the price it was quoted at and where it stands — and only into a slot that
 * is still empty, so linking can never overwrite something the owner set on
 * the real print. The request record then goes.
 */
export async function linkRequest(
  db: Kysely<Database>,
  requestId: string,
  printId: string,
  now: string,
): Promise<void> {
  await db.transaction().execute(async (trx) => {
    const request = await trx
      .selectFrom('print_records')
      .selectAll()
      .where('id', '=', requestId)
      .executeTakeFirst();
    if (request === undefined || request.origin !== 'request') {
      throw new RequestError('not_a_request');
    }
    const target = await trx
      .selectFrom('print_records')
      .selectAll()
      .where('id', '=', printId)
      .executeTakeFirst();
    if (target === undefined) throw new RequestError('print_not_found');
    if (target.origin !== 'indexed') throw new RequestError('target_is_a_request');
    if (target.status === 'deleted') throw new RequestError('print_not_found');

    const from = await trx
      .selectFrom('print_orders')
      .selectAll()
      .where('print_record_id', '=', requestId)
      .orderBy('number')
      .executeTakeFirst();
    const to = await trx
      .selectFrom('print_orders')
      .selectAll()
      .where('print_record_id', '=', printId)
      .orderBy('number', 'desc')
      .executeTakeFirst();
    if (from !== undefined && to !== undefined && to.invoice_id === null) {
      await trx
        .updateTable('print_orders')
        .set({
          // Only into an empty slot: the owner may already have priced this one.
          sale_price_cents: to.sale_price_cents ?? from.sale_price_cents,
          sale_price_set_at:
            to.sale_price_cents === null ? from.sale_price_set_at : to.sale_price_set_at,
          sale_price_set_by:
            to.sale_price_cents === null ? from.sale_price_set_by : to.sale_price_set_by,
          request_state: to.request_state ?? from.request_state,
          request_state_at: to.request_state === null ? from.request_state_at : to.request_state_at,
          updated_at: now,
        })
        .where('id', '=', to.id)
        .execute();
    }
    // The record goes with its order; nothing of the request is kept.
    await trx.deleteFrom('print_records').where('id', '=', requestId).execute();
  });
}
