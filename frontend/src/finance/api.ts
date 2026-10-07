import { api } from '../api/client';
import type { Spool } from '../prints/types';

/** Calls behind the money screens (Admin and Editor; undo and settings are Admin-only). */
export interface SpoolList {
  configured: boolean;
  spools: Spool[];
}

export interface SpoolmanStatus {
  configured: boolean;
  url: string | null;
  reachable: boolean;
  spoolCount: number | null;
  lastSync: string | null;
}

export interface PrinterProfile {
  key: string;
  displayName: string;
  aliases: string[];
  videoPrefixes: string[];
  watts: number | null;
}

export interface Settings {
  pricing: {
    defaultMarkupPercent: number | null;
    tariffEurPerKwh: number | null;
    materialPricesPerKg: Record<string, number>;
  };
  printers: PrinterProfile[];
  company: {
    name: string;
    iban: string;
    address: string;
    email: string | null;
    phone: string | null;
  };
}

export type BulkAction =
  | { action: 'markPaid' }
  | { action: 'setPrice'; salePrice: number | null }
  | { action: 'setPrice'; suggested: true }
  | { action: 'assignSpool'; spoolId: number | null }
  | { action: 'delete' }
  | { action: 'addTags' | 'removeTags'; tagIds: string[] };

export interface BulkResult {
  id: string;
  ok: boolean;
  error?: string;
  /** For "Nabestelling {n} is al betaald." and "Staat op factuur {nummer}.". */
  orderNumber?: number;
  invoiceNumber?: string;
}

export const financeKeys = {
  spools: ['spools'] as const,
  spoolman: ['spoolman'] as const,
  settings: ['settings'] as const,
  markup: ['settings', 'markup'] as const,
};

export const fetchSpools = () => api<SpoolList>('/api/spools');
export const fetchSpoolmanStatus = () => api<SpoolmanStatus>('/api/spoolman/status');
export const refreshSpoolman = () =>
  api<SpoolmanStatus>('/api/spoolman/refresh', { method: 'POST' });

export const setPrintSpool = (printId: string, spoolId: number | null) =>
  api(`/api/prints/${printId}/spool`, { method: 'PUT', body: { spoolId } });

export const setLineOverride = (
  printId: string,
  lineId: string,
  change: { slot: number; spoolId?: number | null; pricePerKg?: number | null },
) => api(`/api/prints/${printId}/lines/${lineId}/override`, { method: 'PUT', body: change });

export const setLineExcluded = (printId: string, lineId: string, excluded: boolean | null) =>
  api(`/api/prints/${printId}/lines/${lineId}/excluded`, { method: 'PUT', body: { excluded } });

export const setTimesPrinted = (
  printId: string,
  lineId: string,
  timesPrinted: number,
  orderId?: string,
) =>
  api(`/api/prints/${printId}/lines/${lineId}/times`, {
    method: 'PUT',
    body: orderId === undefined ? { timesPrinted } : { timesPrinted, orderId },
  });

export const setOrderOverrides = (
  orderId: string,
  overrides: { pricePerKg: number | null; grams: number | null; printSeconds: number | null },
) => api(`/api/orders/${orderId}/overrides`, { method: 'PUT', body: overrides });

export const setSalePrice = (orderId: string, salePrice: number | null) =>
  api(`/api/orders/${orderId}/sale-price`, { method: 'PUT', body: { salePrice } });

export const addPayment = (orderId: string, amount: number) =>
  api(`/api/orders/${orderId}/payments`, { method: 'POST', body: { amount } });

export const undoPayment = (orderId: string) =>
  api(`/api/orders/${orderId}/payments/undo`, { method: 'POST' });

export const writeOff = (orderId: string, reason: string | null) =>
  api(`/api/orders/${orderId}/write-off`, { method: 'POST', body: { reason } });

export const undoWriteOff = (orderId: string) =>
  api(`/api/orders/${orderId}/write-off`, { method: 'DELETE' });

/** "Nabestelling maken": the chosen files or plates and how often each is printed. */
export const createOrder = (
  printId: string,
  items: readonly { lineId: string; timesPrinted: number }[],
) => api<{ id: string }>(`/api/prints/${printId}/orders`, { method: 'POST', body: { items } });

/** "Nabestelling verwijderen". */
export const deleteOrder = (orderId: string) => api(`/api/orders/${orderId}`, { method: 'DELETE' });

export const fetchSettings = () => api<Settings>('/api/settings');

export const saveSettings = <K extends keyof Settings>(key: K, value: Settings[K]) =>
  api<Settings>(`/api/settings/${key}`, { method: 'PUT', body: value });

export const fetchMarkup = () =>
  api<{ defaultMarkupPercent: number | null }>('/api/settings/markup');

export const logoUrl = '/api/settings/logo';
export const uploadLogo = (file: File) =>
  api(logoUrl, { method: 'PUT', raw: { data: file, type: file.type } });
export const removeLogo = () => api(logoUrl, { method: 'DELETE' });

export const setNoBilling = (folder: string, noBilling: boolean) =>
  api(`/api/customers/${encodeURIComponent(folder)}/billing`, {
    method: 'PUT',
    body: { noBilling },
  });

export const runBulk = (ids: readonly string[], action: BulkAction) =>
  api<{ results: BulkResult[] }>('/api/prints/bulk', {
    method: 'POST',
    body: { ids, ...action },
  });
