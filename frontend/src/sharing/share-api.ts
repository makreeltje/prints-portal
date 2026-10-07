import { api } from '../api/client';

export type ShareLinkStatus = 'active' | 'expired' | 'revoked';
export type ExpiryDays = 7 | 30 | 90 | null;

export interface ShareLink {
  id: string;
  customer: string;
  label: string;
  createdAt: string;
  expiresAt: string | null;
  revokedAt: string | null;
  status: ShareLinkStatus;
}

export interface CreatedShareLink {
  link: ShareLink;
  /** Shown once, right after creating the link. */
  token: string;
  url: string;
}

export interface BilledShareLine {
  id: string;
  description: string;
  project: string | null;
  date: string;
  /** null: "Prijs volgt". */
  price: number | null;
  paid: number;
  remaining: number | null;
  status: 'paid' | 'open' | 'partial' | 'noPrice';
  printId: string;
}

export interface PlainShareLine {
  id: string;
  description: string;
  project: string | null;
  date: string;
  printId: string;
}

interface ShareHead {
  studio: { name: string; hasLogo: boolean };
  customer: string;
  expiresAt: string | null;
}

/** How to pay; absent when nothing is open or the studio has no IBAN. */
export interface SharePayment {
  iban: string;
  name: string;
  amount: number;
  reference: string;
  email: string | null;
  phone: string | null;
}

export type ShareView =
  | (ShareHead & {
      billed: true;
      lines: BilledShareLine[];
      totals: { total: number; paid: number; open: number };
      pay: SharePayment | null;
    })
  | (ShareHead & { billed: false; lines: PlainShareLine[] });

export const shareKeys = {
  links: ['share-links'] as const,
  view: (token: string, onlyOpen: boolean) => ['share', token, onlyOpen] as const,
};

export const fetchShareLinks = () => api<{ links: ShareLink[] }>('/api/share-links');

export const createShareLink = (body: {
  customer: string;
  label: string;
  expiresInDays: ExpiryDays;
}) => api<CreatedShareLink>('/api/share-links', { method: 'POST', body });

export const revokeShareLink = (id: string) =>
  api(`/api/share-links/${id}/revoke`, { method: 'POST' });

const tokenPath = (token: string) => `/api/share/${encodeURIComponent(token)}`;

/** The public page data; a 404 means the link is unknown, expired or revoked. */
export const fetchShareView = (token: string, onlyOpen: boolean) =>
  api<ShareView>(`${tokenPath(token)}${onlyOpen ? '?onlyOpen=true' : ''}`, { quiet401: true });

export const overviewUrl = (token: string, onlyOpen: boolean) =>
  `${tokenPath(token)}/overview.pdf${onlyOpen ? '?onlyOpen=true' : ''}`;

export const shareLogoUrl = (token: string) => `${tokenPath(token)}/logo`;

export const shareThumbnailUrl = (token: string, printId: string) =>
  `${tokenPath(token)}/prints/${printId}/thumbnail`;
