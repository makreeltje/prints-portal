import { api } from '../api/client';
import type { RequestState } from './types';

/** One row of the Wachtrij (ScreenQueue 2.10). */
export interface QueueRow {
  id: string;
  name: string;
  customerFolder: string;
  projectFolder: string | null;
  hasFiles: boolean;
  waitingDays: number;
  price: number | null;
  requestState: Exclude<RequestState, 'declined'>;
  /** The first bron and how many it stands for; only on a fileless row. */
  source: { url: string; label: string } | null;
  sourceCount: number;
  /** The note, on any row — the work outlives the files (PrintNote). */
  note: string | null;
}

export interface QueueGroup {
  state: Exclude<RequestState, 'declined'>;
  rows: QueueRow[];
  withoutFiles: number;
}

export const queueKeys = { all: ['queue'] as const };

export const fetchQueue = () => api<{ groups: QueueGroup[] }>('/api/queue');

export const addRequest = (customer: string, name: string) =>
  api<{ id: string }>('/api/requests', { method: 'POST', body: { customer, name } });

export const linkRequest = (requestId: string, printId: string) =>
  api(`/api/requests/${requestId}/link`, { method: 'POST', body: { printId } });
