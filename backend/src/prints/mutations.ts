import { normalizeHexColor, normalizeTagName, tagKey } from '../core/tags.js';
import type { AppDatabase } from '../db/connection.js';
import type { TagDto } from './types.js';

/**
 * Soft delete (plan, "Soft delete"): status Deleted hides a print from every
 * list and check but keeps it and its financials. The indexer never revives
 * it. Restore sets it back to Indexed; the caller then re-indexes it, which
 * archives it again if its folder is gone.
 */
export async function deletePrint(
  db: AppDatabase,
  id: string,
  userId: string,
  now: Date,
): Promise<{ customerFolder: string } | null> {
  const row = await db
    .selectFrom('print_records')
    .select(['customer_folder', 'status'])
    .where('id', '=', id)
    .executeTakeFirst();
  if (row === undefined || row.status === 'deleted') return null;
  await db
    .updateTable('print_records')
    .set({
      status: 'deleted',
      deleted_at: now.toISOString(),
      deleted_by: userId,
      updated_at: now.toISOString(),
    })
    .where('id', '=', id)
    .execute();
  return { customerFolder: row.customer_folder };
}

export async function restorePrint(
  db: AppDatabase,
  id: string,
  now: Date,
): Promise<{ customerFolder: string; projectFolder: string | null } | null> {
  const row = await db
    .selectFrom('print_records')
    .select(['customer_folder', 'project_folder', 'status'])
    .where('id', '=', id)
    .executeTakeFirst();
  if (row === undefined || row.status !== 'deleted') return null;
  await db
    .updateTable('print_records')
    .set({ status: 'indexed', deleted_at: null, deleted_by: null, updated_at: now.toISOString() })
    .where('id', '=', id)
    .execute();
  return { customerFolder: row.customer_folder, projectFolder: row.project_folder };
}

/** Deletes every print of a customer that is not deleted yet; returns their ids. */
export async function deleteCustomer(
  db: AppDatabase,
  customerFolder: string,
  userId: string,
  now: Date,
): Promise<string[]> {
  return db.transaction().execute(async (trx) => {
    const rows = await trx
      .selectFrom('print_records')
      .select('id')
      .where('customer_folder', '=', customerFolder)
      .where('status', '!=', 'deleted')
      .execute();
    const ids = rows.map((row) => row.id);
    if (ids.length > 0) {
      await trx
        .updateTable('print_records')
        .set({
          status: 'deleted',
          deleted_at: now.toISOString(),
          deleted_by: userId,
          updated_at: now.toISOString(),
        })
        .where('id', 'in', ids)
        .execute();
    }
    return ids;
  });
}

/** Restores every deleted print of a customer; returns their ids. */
export async function restoreCustomer(
  db: AppDatabase,
  customerFolder: string,
  now: Date,
): Promise<{ id: string; projectFolder: string | null }[]> {
  return db.transaction().execute(async (trx) => {
    const rows = await trx
      .selectFrom('print_records')
      .select(['id', 'project_folder'])
      .where('customer_folder', '=', customerFolder)
      .where('status', '=', 'deleted')
      .execute();
    if (rows.length > 0) {
      await trx
        .updateTable('print_records')
        .set({
          status: 'indexed',
          deleted_at: null,
          deleted_by: null,
          updated_at: now.toISOString(),
        })
        .where(
          'id',
          'in',
          rows.map((row) => row.id),
        )
        .execute();
    }
    return rows.map((row) => ({ id: row.id, projectFolder: row.project_folder }));
  });
}

export class TagConflictError extends Error {
  override name = 'TagConflictError';
}

export async function listTags(db: AppDatabase): Promise<(TagDto & { printCount: number })[]> {
  const rows = await db
    .selectFrom('tags')
    .leftJoin('print_tags', 'print_tags.tag_id', 'tags.id')
    .select([
      'tags.id',
      'tags.name',
      'tags.colour',
      'tags.name_key',
      (eb) => eb.fn.count<number | string>('print_tags.print_record_id').as('count'),
    ])
    .groupBy(['tags.id', 'tags.name', 'tags.colour', 'tags.name_key'])
    .orderBy('tags.name_key')
    .execute();
  return rows.map((row) => ({
    id: row.id,
    name: row.name,
    colour: row.colour,
    printCount: Number(row.count),
  }));
}

export async function createTag(
  db: AppDatabase,
  input: { name: string; colour?: string | null },
  now: Date,
): Promise<TagDto> {
  const name = normalizeTagName(input.name);
  const key = tagKey(name);
  const existing = await db
    .selectFrom('tags')
    .select('id')
    .where('name_key', '=', key)
    .executeTakeFirst();
  if (existing !== undefined) throw new TagConflictError('tag exists');
  const tag = { id: crypto.randomUUID(), name, colour: normalizeHexColor(input.colour) };
  await db
    .insertInto('tags')
    .values({ ...tag, name_key: key, created_at: now.toISOString() })
    .execute();
  return tag;
}

export async function updateTag(
  db: AppDatabase,
  id: string,
  input: { name?: string; colour?: string | null },
): Promise<TagDto | null> {
  const current = await db.selectFrom('tags').selectAll().where('id', '=', id).executeTakeFirst();
  if (current === undefined) return null;
  const name = input.name === undefined ? current.name : normalizeTagName(input.name);
  const key = tagKey(name);
  if (key !== current.name_key) {
    const clash = await db
      .selectFrom('tags')
      .select('id')
      .where('name_key', '=', key)
      .executeTakeFirst();
    if (clash !== undefined) throw new TagConflictError('tag exists');
  }
  const colour = input.colour === undefined ? current.colour : normalizeHexColor(input.colour);
  await db.updateTable('tags').set({ name, name_key: key, colour }).where('id', '=', id).execute();
  return { id, name, colour };
}

/** Removes a tag; returns the prints that carried it (for live updates). */
export async function deleteTag(db: AppDatabase, id: string): Promise<string[] | null> {
  const tag = await db.selectFrom('tags').select('id').where('id', '=', id).executeTakeFirst();
  if (tag === undefined) return null;
  const prints = await db
    .selectFrom('print_tags')
    .select('print_record_id')
    .where('tag_id', '=', id)
    .execute();
  await db.deleteFrom('tags').where('id', '=', id).execute();
  return prints.map((row) => row.print_record_id);
}

export class UnknownTagError extends Error {
  override name = 'UnknownTagError';
}

/** Replaces the tags of a print. */
export async function setPrintTags(
  db: AppDatabase,
  printId: string,
  tagIds: readonly string[],
  now: Date,
): Promise<void> {
  const unique = [...new Set(tagIds)];
  await db.transaction().execute(async (trx) => {
    if (unique.length > 0) {
      const found = await trx.selectFrom('tags').select('id').where('id', 'in', unique).execute();
      if (found.length !== unique.length) throw new UnknownTagError('unknown tag');
    }
    await trx.deleteFrom('print_tags').where('print_record_id', '=', printId).execute();
    if (unique.length > 0) {
      await trx
        .insertInto('print_tags')
        .values(unique.map((tagId) => ({ print_record_id: printId, tag_id: tagId })))
        .execute();
    }
    // A tag change is a change to the print (live updates, cache versions).
    await trx
      .updateTable('print_records')
      .set({ updated_at: now.toISOString() })
      .where('id', '=', printId)
      .execute();
  });
}
