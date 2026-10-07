import { api } from '../api/client';

export interface OutstandingLine {
  orderId: string;
  orderNumber: number;
  printId: string;
  printName: string;
  project: string | null;
  archived: boolean;
  status: 'open' | 'partial';
  price: number;
  paid: number;
  remaining: number;
  since: string;
  daysOpen: number;
  invoiceNumber: string | null;
}

export interface OutstandingGroup {
  customer: string;
  total: number;
  count: number;
  oldestDays: number;
  lines: OutstandingLine[];
}

export interface Outstanding {
  total: number;
  customers: number;
  oldest: { printName: string; orderNumber: number; days: number } | null;
  groups: OutstandingGroup[];
}

export interface InvoicePreview {
  lines: {
    orderId: string;
    printId: string;
    description: string;
    project: string | null;
    date: string;
    grams: number | null;
    amount: number;
    paid: number;
    status: 'paid' | 'open' | 'partial';
  }[];
  total: number;
  paid: number;
  open: number;
  excluded: string[];
  earlier: { description: string; invoiceNumber: string }[];
  nextNumber: string;
}

export interface InvoiceSummary {
  id: string;
  number: string;
  kind: 'invoice' | 'credit';
  customer: string;
  issuedOn: string;
  total: number;
  paid: number;
  open: number;
  creditsNumber: string | null;
}

export interface InvoiceDetail {
  id: string;
  number: string;
  kind: 'invoice' | 'credit';
  customer: string;
  issuedOn: string;
  total: number;
  lines: { id: string; description: string; amount: number; credited: boolean }[];
  creditNotes: { id: string; number: string }[];
  nextNumber: string;
}

export const billingKeys = {
  outstanding: ['outstanding'] as const,
  invoices: ['invoices'] as const,
  preview: (customer: string, onlyOpen: boolean) =>
    ['invoices', 'preview', customer, onlyOpen] as const,
  invoice: (id: string) => ['invoices', 'detail', id] as const,
};

const customerPath = (customer: string) => `/api/customers/${encodeURIComponent(customer)}`;

export const fetchOutstanding = () => api<Outstanding>('/api/outstanding');

export const markCustomerPaid = (customer: string) =>
  api<{ orders: number; amount: number }>(
    `/api/outstanding/${encodeURIComponent(customer)}/mark-paid`,
    { method: 'POST' },
  );

export const reminderUrl = (customer: string) => `${customerPath(customer)}/reminder.pdf`;

export const fetchInvoicePreview = (customer: string, onlyOpen: boolean) =>
  api<InvoicePreview>(`${customerPath(customer)}/invoice/preview?onlyOpen=${String(onlyOpen)}`);

export const conceptUrl = (customer: string, onlyOpen: boolean) =>
  `${customerPath(customer)}/invoice/concept.pdf?onlyOpen=${String(onlyOpen)}`;

export const finaliseInvoice = (
  customer: string,
  body: { onlyOpen: boolean; expectedTotal: number; expectedLines: number },
) =>
  api<{ id: string; number: string }>(`${customerPath(customer)}/invoices`, {
    method: 'POST',
    body,
  });

export const fetchInvoices = () => api<{ invoices: InvoiceSummary[] }>('/api/invoices');

export const fetchInvoice = (id: string) => api<InvoiceDetail>(`/api/invoices/${id}`);

export const invoicePdfUrl = (id: string) => `/api/invoices/${id}/pdf`;

export const createCreditNote = (id: string, lineIds: readonly string[]) =>
  api<{ id: string; number: string }>(`/api/invoices/${id}/credit`, {
    method: 'POST',
    body: { lineIds },
  });
