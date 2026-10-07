import { screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Route, Routes } from 'react-router';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { renderWithAuth, signedIn, stubFetch } from '../test/render';
import type { ShareLink, ShareView } from './share-api';
import { SharePage } from './SharePage';
import { ShareLinksPage } from './ShareLinksPage';

const text = (value: string | null) => (value ?? '').replace(/\u00a0/g, ' ');

/*
 * These dates are relative ("morgen", "3 dagen geleden"), so the clock is
 * pinned: with the real one, adding an hour to "now" crosses midnight in the
 * last hour of the day and the suite fails nightly for an hour.
 */
const NOW = new Date('2026-06-15T12:00:00Z');
beforeEach(() => {
  vi.useFakeTimers({ shouldAdvanceTime: true, now: NOW });
});
afterEach(() => {
  vi.useRealTimers();
});

const inDays = (days: number) =>
  new Date(NOW.getTime() + days * 86_400_000 + 3_600_000).toISOString();

const TOKEN = 'q2Hk9-2vX7rTnP4aBd8sLw3eYcQ2Hk9-2vX7rTnP4aB';

const links: ShareLink[] = [
  {
    id: 'l1',
    customer: 'Joey',
    label: 'Q2 overzicht',
    createdAt: '2026-10-05T10:00:00.000Z',
    expiresAt: inDays(30),
    revokedAt: null,
    status: 'active',
  },
  {
    id: 'l2',
    customer: 'Joey',
    label: 'Kerst 2025',
    createdAt: '2025-12-01T10:00:00.000Z',
    expiresAt: inDays(-3),
    revokedAt: null,
    status: 'expired',
  },
  {
    id: 'l3',
    customer: 'Bas',
    label: 'Familie',
    createdAt: '2026-10-01T10:00:00.000Z',
    expiresAt: null,
    revokedAt: null,
    status: 'active',
  },
  {
    id: 'l4',
    customer: 'Denise',
    label: 'Oude link',
    createdAt: '2026-05-02T10:00:00.000Z',
    expiresAt: inDays(1),
    revokedAt: '2026-08-12T10:00:00.000Z',
    status: 'revoked',
  },
];

const customers = [
  { folder: 'Joey', printCount: 3, deleted: false, noBilling: false, openAmount: 10 },
  { folder: 'Bas', printCount: 1, deleted: false, noBilling: true, openAmount: null },
];

afterEach(() => {
  vi.unstubAllGlobals();
});

describe('ShareLinksPage', () => {
  it('groups the links per klant with their expiry and status', async () => {
    stubFetch({ 'GET /api/share-links': () => ({ json: { links } }) });
    renderWithAuth(<ShareLinksPage />, { state: signedIn('Admin') });
    await screen.findByRole('region', { name: 'Joey' });
    // ScreenShareLinks 1.9: the page opens on Actief, so a klant whose links
    // are all dead is not listed until "Alle".
    expect(
      screen.getAllByRole('region').map((region) => region.getAttribute('aria-label')),
    ).toEqual(['Bas', 'Joey']);
    await userEvent.click(screen.getByRole('button', { name: /^Alle/ }));
    expect(
      screen.getAllByRole('region').map((region) => region.getAttribute('aria-label')),
    ).toEqual(['Bas', 'Denise', 'Joey']);
    const joey = screen.getByRole('region', { name: 'Joey' });
    const rows = within(joey).getAllByRole('listitem');
    expect(within(rows[0] as HTMLElement).getByText('Over 30 dagen')).toBeInTheDocument();
    expect(within(joey).queryByText('Over 1 dagen')).toBeNull();
    expect(within(rows[0] as HTMLElement).getByText('Actief')).toBeInTheDocument();
    expect(within(rows[1] as HTMLElement).getByText('3 dagen geleden')).toBeInTheDocument();
    expect(within(rows[1] as HTMLElement).getByText('Verlopen')).toBeInTheDocument();
    expect(within(rows[1] as HTMLElement).queryByRole('button')).toBeNull();
    const bas = screen.getByRole('region', { name: 'Bas' });
    expect(within(bas).getByText('Verloopt niet')).toHaveClass('never');
    const denise = screen.getByRole('region', { name: 'Denise' });
    expect(within(denise).getAllByText('Ingetrokken')).toHaveLength(2);
    expect(within(denise).queryByRole('button', { name: 'Intrekken' })).toBeNull();
  });

  it('revokes a link after confirming with its label', async () => {
    const calls = stubFetch({
      'GET /api/share-links': () => ({ json: { links } }),
      'POST /api/share-links/l1/revoke': () => ({ status: 204 }),
    });
    renderWithAuth(<ShareLinksPage />, { state: signedIn('Admin') });
    const joey = await screen.findByRole('region', { name: 'Joey' });
    await userEvent.click(within(joey).getByRole('button', { name: 'Intrekken' }));
    const dialog = screen.getByRole('alertdialog', { name: "Deel-link 'Q2 overzicht' intrekken?" });
    await userEvent.click(within(dialog).getByRole('button', { name: 'Intrekken' }));
    await waitFor(() => {
      expect(calls.some((c) => c.path === '/api/share-links/l1/revoke')).toBe(true);
    });
  });

  it('creates a link, shows it once and asks before closing without copying', async () => {
    const calls = stubFetch({
      'GET /api/share-links': () => ({ json: { links: [] } }),
      'GET /api/customers': () => ({ json: { customers } }),
      'POST /api/share-links': () => ({
        status: 201,
        json: {
          link: { ...links[2], id: 'new' },
          token: TOKEN,
          url: `https://prints.example.nl/share/${TOKEN}`,
        },
      }),
    });
    const writeText = vi.fn(() => Promise.resolve());
    Object.defineProperty(navigator, 'clipboard', { value: { writeText }, configurable: true });
    renderWithAuth(<ShareLinksPage />, { state: signedIn('Admin') });
    expect(await screen.findByText('Nog geen Deel-links')).toBeInTheDocument();
    await userEvent.click(screen.getByRole('button', { name: 'Deel-link maken' }));

    const dialog = screen.getByRole('dialog', { name: 'Deel-link maken' });
    const klant = within(dialog).getByLabelText('Klant');
    await waitFor(() => {
      expect(klant).toHaveValue('Joey');
    });
    await userEvent.selectOptions(klant, 'Bas');
    expect(klant).toHaveAccessibleDescription(
      'Deze klant wordt niet gefactureerd. De link toont alleen de printlijst, zonder bedragen.',
    );
    await userEvent.click(within(dialog).getByRole('button', { name: 'Maken' }));
    expect(within(dialog).getByText('Dit veld is verplicht.')).toBeInTheDocument();
    await userEvent.type(within(dialog).getByLabelText('Label'), 'Familie');
    await userEvent.selectOptions(within(dialog).getByLabelText('Verloopt'), 'Nooit');
    expect(within(dialog).getByText('De link blijft werken tot je hem intrekt.')).toBeVisible();
    await userEvent.click(within(dialog).getByRole('button', { name: 'Maken' }));
    await waitFor(() => {
      expect(calls.find((c) => c.method === 'POST')?.body).toEqual({
        customer: 'Bas',
        label: 'Familie',
        expiresInDays: null,
      });
    });

    const reveal = await screen.findByRole('dialog', { name: 'Deel-link gemaakt' });
    expect(within(reveal).getByText(`https://prints.example.nl/share/${TOKEN}`)).toBeVisible();
    expect(within(reveal).getByRole('alert')).toHaveTextContent(
      'Deze link zie je maar één keer. Kopieer hem nu.',
    );
    // Closing before copying asks first; Terug returns to the link.
    await userEvent.click(within(reveal).getByRole('button', { name: 'Sluiten' }));
    const ask = screen.getByRole('alertdialog', { name: 'Sluiten zonder kopiëren?' });
    await userEvent.click(within(ask).getByRole('button', { name: 'Terug' }));
    const again = screen.getByRole('dialog', { name: 'Deel-link gemaakt' });
    await userEvent.click(within(again).getByRole('button', { name: 'Kopiëren' }));
    expect(writeText).toHaveBeenCalledWith(`https://prints.example.nl/share/${TOKEN}`);
    expect(within(again).getByRole('button', { name: 'Gekopieerd' })).toBeInTheDocument();
    await userEvent.click(within(again).getByRole('button', { name: 'Sluiten' }));
    expect(screen.queryByRole('dialog')).toBeNull();
  });
});

const billed: ShareView = {
  billed: true,
  studio: { name: 'Voorbeeld 3D', hasLogo: false },
  customer: 'Joey',
  expiresAt: inDays(30),
  lines: [
    {
      id: 'o1',
      description: 'Babybox locks',
      project: 'Babybox locks',
      date: '2026-09-12',
      price: 11.89,
      paid: 5,
      remaining: 6.89,
      status: 'partial',
      printId: 'p1',
    },
    {
      id: 'o2',
      description: 'Dopje',
      project: null,
      date: '2026-10-04',
      price: null,
      paid: 0,
      remaining: null,
      status: 'noPrice',
      printId: 'p1',
    },
  ],
  totals: { total: 11.89, paid: 5, open: 6.89 },
  pay: null,
};

function renderShare() {
  return renderWithAuth(
    <Routes>
      <Route path="/share/:token" element={<SharePage />} />
    </Routes>,
    { path: `/share/${TOKEN}` },
  );
}

describe('SharePage', () => {
  it('shows the orders with customer prices, totals and the overview download', async () => {
    const calls = stubFetch({
      [`GET /api/share/${TOKEN}`]: () => ({ json: billed }),
      [`GET /api/share/${TOKEN}?onlyOpen=true`]: () => ({
        json: { ...billed, lines: [billed.lines[0]] },
      }),
    });
    renderShare();
    expect(
      await screen.findByRole('heading', { level: 1, name: 'Overzicht voor Joey' }),
    ).toBeInTheDocument();
    expect(screen.getAllByRole('heading', { level: 1 })).toHaveLength(1);
    expect(screen.getByText('Voorbeeld 3D')).toBeInTheDocument();
    // The link label is internal: the klant never sees it (ScreenSharePage 1.9).
    expect(screen.queryByText('Q2 overzicht')).not.toBeInTheDocument();
    expect(screen.getByText(/^Deze link verloopt over 30 dagen \(/)).toBeInTheDocument();
    const items = screen.getAllByRole('listitem');
    expect(items).toHaveLength(2);
    expect(text(within(items[0] as HTMLElement).getByText(/11,89/).textContent)).toBe('€ 11,89');
    expect(within(items[0] as HTMLElement).getByText('Deels betaald')).toBeInTheDocument();
    expect(text(within(items[0] as HTMLElement).getByText(/^Nog/).textContent)).toBe(
      'Nog € 6,89 open',
    );
    expect(within(items[1] as HTMLElement).getByText('Prijs volgt')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Download overzicht' })).toHaveAttribute(
      'href',
      `/api/share/${TOKEN}/overview.pdf`,
    );
    expect(
      screen.getByText('Prijzen in euro. Prints zonder prijs staan niet in de totalen.'),
    ).toBeInTheDocument();

    await userEvent.click(screen.getByRole('switch', { name: 'Alleen openstaand' }));
    await waitFor(() => {
      expect(screen.getAllByRole('listitem')).toHaveLength(1);
    });
    expect(calls.at(-1)?.path).toBe(`/api/share/${TOKEN}?onlyOpen=true`);
    expect(screen.getByRole('link', { name: 'Download overzicht' })).toHaveAttribute(
      'href',
      `/api/share/${TOKEN}/overview.pdf?onlyOpen=true`,
    );
  });

  it('says tomorrow instead of "over 1 dagen" and leaves the notice out for Nooit', async () => {
    stubFetch({
      [`GET /api/share/${TOKEN}`]: () => ({ json: { ...billed, expiresAt: inDays(1) } }),
    });
    const view = renderShare();
    expect(await screen.findByText(/^Deze link verloopt morgen \(/)).toBeInTheDocument();
    view.unmount();
    stubFetch({ [`GET /api/share/${TOKEN}`]: () => ({ json: { ...billed, expiresAt: null } }) });
    renderShare();
    await screen.findByRole('heading', { level: 1 });
    expect(screen.queryByText(/verloopt/)).toBeNull();
  });

  it('leaves the totals out while no print has a price', async () => {
    const unpriced = {
      ...billed,
      lines: [billed.lines[1]],
      totals: { total: 0, paid: 0, open: 0 },
      pay: null,
    };
    stubFetch({
      [`GET /api/share/${TOKEN}`]: () => ({ json: unpriced }),
      [`GET /api/share/${TOKEN}?onlyOpen=true`]: () => ({ json: unpriced }),
    });
    renderShare();
    expect(await screen.findByText('Prijs volgt')).toBeInTheDocument();
    // No zeros: the totals card is gone, the list and the footnote stay.
    expect(screen.queryByText('Totaal')).toBeNull();
    expect(screen.queryByText(/€/)).toBeNull();
    expect(
      screen.getByText('Prijzen in euro. Prints zonder prijs staan niet in de totalen.'),
    ).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Download overzicht' })).toBeInTheDocument();
    // With "Alleen openstaand" on, the empty state wins.
    await userEvent.click(screen.getByRole('switch', { name: 'Alleen openstaand' }));
    expect(await screen.findByText('Er staat niets open.')).toBeInTheDocument();
  });

  it('shows only Print, Project and Datum for a niet-factureren klant', async () => {
    stubFetch({
      [`GET /api/share/${TOKEN}`]: () => ({
        json: {
          billed: false,
          studio: { name: 'Voorbeeld 3D', hasLogo: false },
          customer: 'Bas',
          label: 'Familie',
          expiresAt: null,
          lines: [{ id: 'o1', description: 'Cable organizer', project: null, date: '2026-10-02' }],
        },
      }),
    });
    renderShare();
    expect(
      await screen.findByText('Hier zie je de prints die voor je gemaakt zijn.'),
    ).toBeInTheDocument();
    expect(screen.getByRole('table')).toBeInTheDocument();
    expect(screen.getAllByRole('columnheader').map((th) => th.textContent)).toEqual([
      'Print',
      'Project',
      'Datum',
    ]);
    expect(screen.queryByRole('switch')).toBeNull();
    expect(screen.queryByRole('link', { name: 'Download overzicht' })).toBeNull();
    expect(screen.queryByText(/€/)).toBeNull();
  });

  it('shows the same friendly page for a link that does not work', async () => {
    stubFetch({
      [`GET /api/share/${TOKEN}`]: () => ({ status: 404, json: { error: 'not_found' } }),
    });
    renderShare();
    expect(
      await screen.findByRole('heading', {
        level: 1,
        name: 'Deze link is verlopen of ingetrokken',
      }),
    ).toBeInTheDocument();
    expect(
      screen.getByText('Vraag degene die je de link stuurde om een nieuwe.'),
    ).toBeInTheDocument();
    expect(screen.queryByRole('link')).toBeNull();
  });
});
