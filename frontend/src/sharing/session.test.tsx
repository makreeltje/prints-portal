import { screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Route, Routes } from 'react-router';
import { describe, expect, it } from 'vitest';
import { renderWithAuth, stubFetch } from '../test/render';
import type { PrintSummary } from '../prints/types';
import type { ShareView } from './share-api';
import { ShareSessionRoutes } from './ShareSessionRoutes';

const TOKEN = 'q2Hk9-2vX7rTnP4aBd8sLw3eYcQ2Hk9-2vX7rTnP4aB';

const view: ShareView = {
  billed: true,
  studio: { name: 'Voorbeeld 3D', hasLogo: false },
  customer: 'Anouk',
  expiresAt: '2026-12-01T12:00:00.000Z',
  lines: [],
  totals: { total: 0, paid: 0, open: 0 },
  pay: null,
};

const print = (id: string, name: string): PrintSummary =>
  ({
    id,
    name,
    customerFolder: 'Anouk',
    projectFolder: name,
    material: 'PLA',
    printSeconds: 3600,
    grams: 42,
    printDate: '2026-09-12',
    discoveredAt: '2026-09-12T10:00:00.000Z',
    status: 'indexed',
    deletedAt: null,
    tags: [{ id: 't1', name: 'cadeau', colour: '#9ece6a', ink: '#141a33' }],
    hasThumbnail: false,
    colour: '#9ece6a',
    lacks: ['3mf'],
    version: 'v1',
    money: { status: 'open', price: 11.89, paid: 0, remaining: 11.89, cost: null },
  }) as unknown as PrintSummary;

const session = (overrides: Record<string, () => { status?: number; json?: unknown }> = {}) =>
  stubFetch({
    [`POST /api/share/${TOKEN}/session`]: () => ({
      json: { csrfToken: 'csrf', customer: 'Anouk', expiresAt: view.expiresAt },
    }),
    [`GET /api/share/${TOKEN}`]: () => ({ json: view }),
    'GET /api/prints': () => ({
      json: { total: 2, items: [print('p1', 'Bloembak clips'), print('p2', 'Dopje')] },
    }),
    'POST /api/auth/logout': () => ({ status: 204 }),
    ...overrides,
  });

const render = (path = `/share/${TOKEN}`) =>
  renderWithAuth(
    <Routes>
      <Route path="/share/:token/*" element={<ShareSessionRoutes />} />
    </Routes>,
    { path },
  );

describe('a deel-linksessie (GAP-165)', () => {
  it('mints a session and gives the visitor one head bar and two destinations', async () => {
    const calls = session();
    render();
    const head = await screen.findByRole('banner');
    expect(
      calls.some((call) => call.path === `/api/share/${TOKEN}/session` && call.method === 'POST'),
    ).toBe(true);
    expect(head).toHaveClass('pp-guesthead');
    // The studio comes from the share view the Overzicht fetches anyway, so
    // the head costs no request of its own and fills in a tick later.
    expect(await within(head).findByText('Voorbeeld 3D')).toBeInTheDocument();
    const nav = within(head).getByRole('navigation');
    expect(
      within(nav)
        .getAllByRole('link')
        .map((a) => a.textContent),
    ).toEqual(['Overzicht', 'Prints']);
    // What a visitor has no account for, and the two refusals (§1, §2).
    for (const gone of ['Thema', 'Uitloggen', 'API-docs', 'Openstaand', 'Wachtrij']) {
      expect(within(head).queryByText(gone)).toBeNull();
    }
    const exit = within(head).getByRole('button', { name: 'Sessie afsluiten' });
    expect(exit).toBeInTheDocument();
    /*
      GAP-172: at 480px and below the button is a `--pp-tap` square and the
      words are *visually* hidden, so the accessible name has to come from a
      `.lbl` span that is there at every width — not from an aria-label that
      only exists on the phone.
    */
    expect(exit).toHaveClass('pp-guestexit');
    expect(exit.querySelector('.lbl')?.textContent).toBe('Sessie afsluiten');
  });

  it('lands on the Overzicht, which keeps everything but its studio head', async () => {
    session();
    render();
    expect(
      await screen.findByRole('heading', { level: 1, name: 'Overzicht voor Anouk' }),
    ).toBeInTheDocument();
    // The studio is in the head bar now, so the column does not name it twice.
    expect(document.querySelectorAll('.pp-share-head .pp-brand')).toHaveLength(0);
    expect(document.querySelectorAll('.pp-guesthead .pp-brand')).toHaveLength(1);
    // "Download overzicht" is the use the link was serving all along.
    expect(screen.getByRole('link', { name: /Download overzicht/ })).toBeInTheDocument();
  });

  it('shows Prints without the klant axis, and keeps the token in every link', async () => {
    session();
    render();
    await screen.findByRole('banner');
    await userEvent.click(screen.getByRole('link', { name: 'Prints' }));
    expect(await screen.findByRole('heading', { level: 1, name: 'Prints' })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Bloembak clips' })).toHaveAttribute(
      'href',
      `/share/${TOKEN}/prints/p1`,
    );
    // Gone: the FilterBar, the tags, the tint, the checkbox, the meta line and
    // the "Ontbreekt" chip — exactly the facts an Overzicht line carries.
    expect(screen.queryByRole('searchbox')).toBeNull();
    expect(document.querySelectorAll('.pp-tag')).toHaveLength(0);
    expect(document.querySelectorAll('.pp-thumb.tinted')).toHaveLength(0);
    expect(document.querySelectorAll('.pp-print input[type="checkbox"]')).toHaveLength(0);
    expect(document.querySelectorAll('.pp-print .pp-meta')).toHaveLength(0);
    expect(document.querySelectorAll('.pp-lacks')).toHaveLength(0);
    // Kept: the price and the status badge.
    expect(screen.getAllByText(/11,89/u)).toHaveLength(2);
  });

  /*
    GAP-178, resolved in 2.15: no page boundary. The Overzicht one tap away
    lists every print of this klant on one page, so a page size of 24 against
    a klant with 36 made the two screens disagree about which print is the
    last one.
  */
  it('renders the klant\'s whole list with no "Meer laden" and no count line', async () => {
    const many = Array.from({ length: 36 }, (_, i) =>
      print(`p${String(i + 1)}`, `Print ${String(i + 1)}`),
    );
    const calls = session({
      'GET /api/prints': () => ({ json: { total: many.length, items: many } }),
    });
    render(`/share/${TOKEN}/prints`);
    await screen.findByRole('heading', { level: 1, name: 'Prints' });
    await waitFor(() => {
      expect(document.querySelectorAll('.pp-print')).toHaveLength(36);
    });
    expect(screen.queryByRole('button', { name: 'Meer laden' })).toBeNull();
    expect(screen.queryByText(/van 36 prints/u)).toBeNull();
    expect(screen.queryByText('Alle prints geladen')).toBeNull();
    expect(document.querySelector('.pp-more')).toBeNull();
    // One request, asking for the server's whole ceiling rather than a page.
    const lists = calls.filter((call) => call.path.startsWith('/api/prints?'));
    expect(lists).toHaveLength(1);
    expect(lists[0]?.path).toContain('limit=100');
  });

  it('closes the session on request, and says so on a page of its own', async () => {
    const calls = session();
    render();
    await screen.findByRole('banner');
    await userEvent.click(screen.getByRole('button', { name: 'Sessie afsluiten' }));
    const confirm = screen.getByRole('dialog');
    expect(
      within(confirm).getByText('Je kunt daarna alleen terug met de link die je hebt gekregen.'),
    ).toBeInTheDocument();
    await userEvent.click(within(confirm).getByRole('button', { name: 'Afsluiten' }));
    expect(
      await screen.findByRole('heading', { name: 'Je bent afgemeld van dit overzicht' }),
    ).toBeInTheDocument();
    expect(calls.some((call) => call.path === '/api/auth/logout')).toBe(true);
    // Drawn without the shell: a nav of dead links is worse than no nav.
    expect(screen.queryByRole('banner')).toBeNull();
    // No way back in: that would need the token the session no longer has.
    expect(screen.queryByRole('button')).toBeNull();
  });

  it('shows one page for a link that does not work, and no shell', async () => {
    session({ [`POST /api/share/${TOKEN}/session`]: () => ({ status: 404, json: {} }) });
    render();
    expect(
      await screen.findByRole('heading', { name: 'Deze link is verlopen of ingetrokken' }),
    ).toBeInTheDocument();
    expect(screen.queryByRole('banner')).toBeNull();
  });

  it('ends the session at the visitor’s next action when the link dies', async () => {
    let alive = true;
    session({
      // A revoked link stops resolving the session cookie, so the next
      // request answers 401 — the same ending, at the visitor's next action
      // and never on a timer.
      'GET /api/prints': () =>
        alive
          ? { json: { total: 1, items: [print('p1', 'Bloembak clips')] } }
          : { status: 401, json: {} },
    });
    render();
    await screen.findByRole('banner');
    alive = false;
    await userEvent.click(screen.getByRole('link', { name: 'Prints' }));
    await waitFor(() => {
      expect(screen.queryByRole('banner')).toBeNull();
    });
    expect(
      screen.getByRole('heading', { name: 'Deze link is verlopen of ingetrokken' }),
    ).toBeInTheDocument();
  });
});
