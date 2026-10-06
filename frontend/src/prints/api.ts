import { api } from '../api/client';
import type { TagPaletteKey } from './tag-palette';
import type { Customer, PrintDetail, PrintFilter, PrintSummary, Tag, TagWithCount } from './types';

export const PAGE_SIZE = 24;

/** Query keys: every live event invalidates `['prints']` and the print's own key. */
export const keys = {
  all: ['prints'] as const,
  list: (filter: PrintFilter) => ['prints', 'list', filter] as const,
  customers: (archived: boolean, deleted: boolean) =>
    ['prints', 'customers', archived, deleted] as const,
  detail: (id: string) => ['prints', 'detail', id] as const,
  tags: ['tags'] as const,
};

function listQuery(filter: PrintFilter, offset: number): string {
  const params = new URLSearchParams();
  if (filter.customer !== null) params.set('customer', filter.customer);
  for (const tag of filter.tagIds) params.append('tag', tag);
  if (filter.search.trim() !== '') params.set('q', filter.search.trim());
  if (filter.archived) params.set('archived', 'true');
  if (filter.deleted) params.set('deleted', 'true');
  params.set('offset', String(offset));
  params.set('limit', String(PAGE_SIZE));
  return params.toString();
}

export function fetchPrints(filter: PrintFilter, offset: number) {
  return api<{ items: PrintSummary[]; total: number }>(`/api/prints?${listQuery(filter, offset)}`);
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
export const modelUrl = (print: { id: string; version: string }) =>
  `/api/prints/${print.id}/model?v=${encodeURIComponent(print.version)}`;
export const downloadUrl = (assetId: string) => `/api/assets/${assetId}/download`;

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
