import { api } from '../api/client';
import type { TagPaletteKey } from './tag-palette';
import type { Customer, PrintDetail, PrintFilter, PrintSummary, Tag, TagWithCount } from './types';

export const PAGE_SIZE = 24;
/**
 * The server's own ceiling (`MAX_PAGE_SIZE`). A session's Prints is not paged
 * (GAP-178), so it asks in chunks of this size and keeps going until it has
 * the klant's whole list — one request for every klant in this library, and
 * still correct for a klant who one day has more than a hundred prints.
 */
const MAX_PAGE_SIZE = 100;

/** Query keys: every live event invalidates `['prints']` and the print's own key. */
export const keys = {
  all: ['prints'] as const,
  list: (filter: PrintFilter) => ['prints', 'list', filter] as const,
  /** The unpaged list a session's Prints reads; a different shape, so a different key. */
  listAll: (filter: PrintFilter) => ['prints', 'list', 'all', filter] as const,
  customers: (archived: boolean, deleted: boolean) =>
    ['prints', 'customers', archived, deleted] as const,
  detail: (id: string) => ['prints', 'detail', id] as const,
  tags: ['tags'] as const,
};

function listQuery(filter: PrintFilter, offset: number, limit = PAGE_SIZE): string {
  const params = new URLSearchParams();
  if (filter.customer !== null) params.set('customer', filter.customer);
  for (const tag of filter.tagIds) params.append('tag', tag);
  if (filter.search.trim() !== '') params.set('q', filter.search.trim());
  if (filter.archived) params.set('archived', 'true');
  if (filter.deleted) params.set('deleted', 'true');
  if (filter.sort !== 'newest') params.set('sort', filter.sort);
  if (filter.status !== null) params.set('status', filter.status);
  params.set('offset', String(offset));
  params.set('limit', String(limit));
  return params.toString();
}

export function fetchPrints(filter: PrintFilter, offset: number) {
  return api<{ items: PrintSummary[]; total: number }>(`/api/prints?${listQuery(filter, offset)}`);
}

/**
 * Every print the filter matches, in one result and with no page boundary: a
 * session's Prints renders the klant's whole list, because the Overzicht one
 * tap away has listed all of it since 1.0 and the two screens may never
 * disagree about which print is the last one (GAP-178, ScreenShareSession §5).
 *
 * It loops rather than asking for one large page, so a klant past the server's
 * ceiling gets their whole list instead of a silent truncation; the loop also
 * stops on a short or empty page, so a count that shifts between requests
 * cannot spin it.
 */
export async function fetchAllPrints(filter: PrintFilter) {
  const items: PrintSummary[] = [];
  let total: number;
  do {
    const page = await api<{ items: PrintSummary[]; total: number }>(
      `/api/prints?${listQuery(filter, items.length, MAX_PAGE_SIZE)}`,
    );
    total = page.total;
    items.push(...page.items);
    // A short page is the last one; that also stops a count that moved.
    if (page.items.length < MAX_PAGE_SIZE) break;
  } while (items.length < total);
  return { items, total };
}

export function fetchCustomers(archived: boolean, deleted: boolean) {
  const params = new URLSearchParams();
  if (archived) params.set('archived', 'true');
  if (deleted) params.set('deleted', 'true');
  return api<{ customers: Customer[] }>(`/api/customers?${params.toString()}`);
}

export function fetchPrint(id: string) {
  return api<PrintDetail>(`/api/prints/${id}`);
}

export function fetchTags() {
  return api<{ tags: TagWithCount[] }>('/api/tags');
}

export const thumbnailUrl = (print: { id: string; version: string }) =>
  `/api/prints/${print.id}/thumbnail?v=${encodeURIComponent(print.version)}`;
/** The picture of one model file, not of its print (GAP-094). */
export const modelThumbnailUrl = (printId: string, assetId: string) =>
  `/api/prints/${printId}/model-thumbnail?asset=${encodeURIComponent(assetId)}`;
export const modelUrl = (print: { id: string; version: string }, assetId?: string) =>
  `/api/prints/${print.id}/model?v=${encodeURIComponent(print.version)}${
    assetId === undefined ? '' : `&asset=${encodeURIComponent(assetId)}`
  }`;
export const downloadUrl = (assetId: string) => `/api/assets/${assetId}/download`;
/**
 * The timelapse, played in place. Not `downloadUrl`: that route is Admin and
 * Editor only, while a klant may watch the film of their own print and may not
 * save the folder's files (GAP-175).
 */
export const videoUrl = (printId: string, assetId: string) =>
  `/api/prints/${printId}/video?asset=${encodeURIComponent(assetId)}`;

export const deletePrint = (id: string) => api(`/api/prints/${id}`, { method: 'DELETE' });
export const restorePrint = (id: string) => api(`/api/prints/${id}/restore`, { method: 'POST' });
export const restoreCustomer = (folder: string) =>
  api(`/api/customers/${encodeURIComponent(folder)}/restore`, { method: 'POST' });
export const setPrintTags = (id: string, tagIds: string[]) =>
  api(`/api/prints/${id}/tags`, { method: 'PUT', body: { tagIds } });
export const createTag = (name: string, colour: TagPaletteKey | null = null) =>
  api<Tag>('/api/tags', { method: 'POST', body: { name, colour } });
export const updateTag = (id: string, changes: { name?: string; colour?: TagPaletteKey | null }) =>
  api<Tag>(`/api/tags/${id}`, { method: 'PATCH', body: changes });
export const deleteTag = (id: string) => api(`/api/tags/${id}`, { method: 'DELETE' });
export const deleteCustomer = (folder: string) =>
  api(`/api/customers/${encodeURIComponent(folder)}`, { method: 'DELETE' });

/** "Bron": the typed link. Null clears it; the folder's entries are untouched. */
export const setPrintSource = (id: string, url: string | null) =>
  api(`/api/prints/${id}/source`, { method: 'PUT', body: { url } });

/** "Notitie": internal prose. Null clears it (GAP-138: absence is a value). */
export const setPrintNote = (id: string, note: string | null) =>
  api(`/api/prints/${id}/note`, { method: 'PUT', body: { note } });
