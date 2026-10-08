import { act, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Route, Routes } from 'react-router';
import { describe, expect, it } from 'vitest';
import { FakeWebSocket } from '../test/setup';
import { renderApp, renderWithAuth, signedIn, stubFetch } from '../test/render';
import { DashboardPage } from './DashboardPage';
import { LiveProvider } from './live';
import { PrintDetailPage } from './PrintDetailPage';
import type { PrintDetail, PrintSummary } from './types';

function summary(overrides: Partial<PrintSummary> = {}): PrintSummary {
  return {
    id: 'p1',
    name: 'Babybox locks',
    customerFolder: 'Joey',
    projectFolder: 'Babybox locks',
    material: 'PLA',
    printSeconds: 4800,
    grams: 87,
    printDate: '2026-10-01T10:00:00.000Z',
    discoveredAt: '2026-10-01T10:00:00.000Z',
    status: 'indexed',
    deletedAt: null,
    tags: [{ id: 't1', name: 'cadeau', colour: 'lilac', ink: null }],
    hasThumbnail: true,
    colour: '#1a1a1a',
    money: null,
    lacks: [],
    version: 'v1',
    ...overrides,
  };
}

const customers = { customers: [{ folder: 'Joey', printCount: 1, deleted: false }] };
const tags = {
  tags: [{ id: 't1', name: 'cadeau', colour: 'lilac', ink: null, printCount: 1 }],
};

function renderDashboard(path = '/', role: 'Admin' | 'Editor' | 'User' = 'Admin') {
  return renderWithAuth(
    <LiveProvider onSessionEnded={() => undefined}>
      <DashboardPage />
    </LiveProvider>,
    { state: signedIn(role), path },
  );
}

describe('DashboardPage', () => {
  it('shows customer cards, the filter bar and print cards with name, place, meta and tags', async () => {
    stubFetch({
      'GET /api/prints': () => ({ json: { items: [summary()], total: 1 } }),
      'GET /api/customers': () => ({ json: customers }),
      'GET /api/tags': () => ({ json: tags }),
    });
    renderDashboard();
    const card = (await screen.findByRole('link', { name: 'Babybox locks' })).closest('article');
    if (card === null) throw new Error('no card');
    expect(within(card).getByText('Joey')).toBeInTheDocument();
    expect(within(card).getByText('1 u 20 min')).toBeInTheDocument();
    expect(within(card).getByText('87 g')).toBeInTheDocument();
    expect(within(card).getByText('cadeau')).toBeInTheDocument();
    expect(card.querySelector('.pp-thumb.tinted img')).toHaveAttribute(
      'src',
      '/api/prints/p1/thumbnail?v=v1',
    );
    expect(screen.getByRole('link', { name: 'Babybox locks' })).toHaveAttribute(
      'href',
      '/prints/p1',
    );
    expect(screen.getAllByText('1 van 1 prints').length).toBeGreaterThan(0);
    expect(screen.getByText('Alle prints geladen')).toBeInTheDocument();
  });

  it('sends the filters to the API and keeps them in the URL', async () => {
    const calls = stubFetch({
      'GET /api/prints': () => ({ json: { items: [summary()], total: 1 } }),
      'GET /api/customers': () => ({ json: customers }),
      'GET /api/tags': () => ({ json: tags }),
    });
    renderDashboard('/?klant=Joey&tag=t1&gearchiveerd=1');
    await screen.findByRole('link', { name: 'Babybox locks' });
    const query = calls.find((c) => c.path.startsWith('/api/prints?'))?.path ?? '';
    expect(query).toContain('customer=Joey');
    expect(query).toContain('tag=t1');
    expect(query).toContain('archived=true');
    // Active tag chips with the AND hint.
    expect(screen.getByText('Toont prints met alle gekozen tags (EN)')).toBeInTheDocument();
    expect(screen.getAllByRole('button', { name: 'cadeau verwijderen' }).length).toBeGreaterThan(0);
  });

  it('only offers "Toon verwijderde" to Admins', async () => {
    // With prints indexed, so the filter bar is there to be checked.
    stubFetch({
      'GET /api/prints': () => ({ json: { items: [summary()], total: 1 } }),
      'GET /api/customers': () => ({ json: customers }),
      'GET /api/tags': () => ({ json: tags }),
    });
    renderDashboard('/', 'Editor');
    await screen.findByText('Babybox locks');
    expect(screen.queryByLabelText('Toon verwijderde')).toBeNull();
    expect(screen.getAllByLabelText('Gearchiveerd tonen').length).toBeGreaterThan(0);
  });

  it('leaves the filter bar out while nothing is indexed', async () => {
    stubFetch({
      'GET /api/prints': () => ({ json: { items: [], total: 0 } }),
      'GET /api/customers': () => ({ json: { customers: [] } }),
      'GET /api/tags': () => ({ json: tags }),
      'GET /healthz': () => ({ json: { checks: { printsRoot: { status: 'up' } } } }),
    });
    renderDashboard('/', 'Admin');
    await screen.findByText('Nog geen prints');
    // Nothing to filter, so no filter bar and no count line.
    expect(screen.queryByLabelText('Gearchiveerd tonen')).toBeNull();
    expect(screen.queryByText(/van 0 prints/)).toBeNull();
    expect(screen.getByRole('button', { name: 'Opnieuw indexeren' })).toBeInTheDocument();
  });

  it('shows "Geen resultaten" with Filters wissen when a filter matches nothing', async () => {
    renderDashboard('/?q=zzz');
    expect(await screen.findByText('Geen resultaten')).toBeInTheDocument();
    await userEvent.click(
      within(screen.getByText('Geen resultaten').closest('.pp-empty') as HTMLElement).getByRole(
        'button',
        { name: 'Filters wissen' },
      ),
    );
    expect(await screen.findByText('Nog geen prints')).toBeInTheDocument();
  });

  it('shows "Prints-map niet bereikbaar" when the prints folder is down', async () => {
    stubFetch({
      'GET /api/prints': () => ({ json: { items: [], total: 0 } }),
      'GET /api/customers': () => ({ json: { customers: [] } }),
      'GET /api/tags': () => ({ json: { tags: [] } }),
      'GET /healthz': () => ({
        json: { status: 'degraded', checks: { printsRoot: { status: 'down' } } },
      }),
    });
    renderDashboard();
    expect(await screen.findByText('Prints-map niet bereikbaar')).toBeInTheDocument();
  });

  it('switches to the list view', async () => {
    stubFetch({
      'GET /api/prints': () => ({ json: { items: [summary()], total: 1 } }),
      'GET /api/customers': () => ({ json: customers }),
      'GET /api/tags': () => ({ json: tags }),
    });
    renderDashboard('/?weergave=lijst');
    const table = await screen.findByRole('table');
    expect(
      within(table)
        .getAllByRole('columnheader')
        .map((th) => th.textContent),
    ).toEqual(['', 'Voorbeeld', 'Naam', 'Materiaal', 'Tijd', 'Gewicht', 'Status', 'Tags']);
  });

  it('lets Admins restore a deleted print', async () => {
    const calls = stubFetch({
      'GET /api/prints': () => ({
        json: {
          items: [summary({ status: 'deleted', deletedAt: '2026-10-02T10:00:00.000Z' })],
          total: 1,
        },
      }),
      'GET /api/customers': () => ({ json: customers }),
      'GET /api/tags': () => ({ json: tags }),
      'POST /api/prints/p1/restore': () => ({ status: 204 }),
    });
    renderDashboard('/?verwijderd=1');
    await userEvent.click(await screen.findByRole('button', { name: 'Herstellen' }));
    expect(calls.some((c) => c.method === 'POST' && c.path === '/api/prints/p1/restore')).toBe(
      true,
    );
  });

  it('draws palette tags with data-c and older free colours with their own ink', async () => {
    stubFetch({
      'GET /api/prints': () => ({
        json: {
          items: [
            summary({
              tags: [
                { id: 't1', name: 'cadeau', colour: 'lilac', ink: null },
                { id: 't2', name: 'oud', colour: '#e11d48', ink: '#ffffff' },
                { id: 't3', name: 'proef', colour: null, ink: null },
              ],
            }),
          ],
          total: 1,
        },
      }),
      'GET /api/customers': () => ({ json: customers }),
      'GET /api/tags': () => ({ json: tags }),
    });
    renderDashboard();
    const card = (await screen.findByRole('link', { name: 'Babybox locks' })).closest('article');
    if (card === null) throw new Error('no card');
    expect(within(card).getByText('cadeau')).toHaveAttribute('data-c', 'lilac');
    expect(within(card).getByText('oud')).toHaveStyle({ '--tag': '#e11d48' });
    expect(within(card).getByText('proef')).toHaveClass('pp-tag', 'none');
  });

  it('dims deleted and archived prints in cards and mutes them in the list', async () => {
    stubFetch({
      'GET /api/prints': () => ({
        json: {
          items: [
            summary({ status: 'deleted', deletedAt: '2026-10-02T10:00:00.000Z' }),
            summary({ id: 'p2', name: 'Oud', status: 'archived' }),
          ],
          total: 2,
        },
      }),
      'GET /api/customers': () => ({ json: customers }),
      'GET /api/tags': () => ({ json: tags }),
    });
    const view = renderDashboard('/?verwijderd=1');
    await screen.findAllByRole('link', { name: 'Babybox locks' });
    const cards = view.container.querySelectorAll('article.pp-print');
    expect(cards[0]).toHaveClass('is-deleted');
    expect(cards[1]).toHaveClass('is-archived');
    view.unmount();

    const list = renderDashboard('/?verwijderd=1&weergave=lijst');
    const table = await screen.findByRole('table');
    const rows = within(table).getAllByRole('row').slice(1);
    expect(rows[0]).toHaveClass('is-deleted');
    expect(rows[1]).toHaveClass('is-archived');
    list.unmount();
  });

  it('shows the klant chips with counts and filters from a chip or the overview', async () => {
    const calls = stubFetch({
      'GET /api/prints': () => ({ json: { items: [summary()], total: 12 } }),
      'GET /api/customers': () => ({
        json: {
          customers: [
            { folder: 'Joey', printCount: 12, deleted: false },
            { folder: 'Anouk', printCount: 1, deleted: false },
          ],
        },
      }),
      'GET /api/tags': () => ({ json: tags }),
    });
    renderDashboard('/', 'User');
    const chipsGroup = await screen.findByRole('group', { name: 'Klanten' });
    // CustomerChips 1.9: one row on every width, the cards behind "Overzicht".
    expect(within(chipsGroup).getByRole('button', { name: /^Joey/ })).toBeInTheDocument();
    expect(within(chipsGroup).getByRole('button', { name: /^Anouk/ })).toBeInTheDocument();
    // Users cannot delete customers.
    expect(screen.queryByRole('menuitem', { name: 'Klant verwijderen' })).toBeNull();

    await userEvent.click(within(chipsGroup).getByRole('button', { name: /^Joey/ }));
    await waitFor(() => {
      expect(calls.some((c) => c.path.includes('customer=Joey'))).toBe(true);
    });
    const chips = screen.getByRole('group', { name: 'Klanten' });
    expect(within(chips).getByRole('button', { name: /^Joey/ })).toHaveAttribute(
      'aria-pressed',
      'true',
    );
    await userEvent.click(within(chips).getByRole('button', { name: 'Alle klanten' }));
    expect(within(chips).getByRole('button', { name: 'Alle klanten' })).toHaveAttribute(
      'aria-pressed',
      'true',
    );
  });

  it('lets Editors delete a whole klant after confirmation', async () => {
    const calls = stubFetch({
      'GET /api/prints': () => ({ json: { items: [summary()], total: 12 } }),
      'GET /api/customers': () => ({
        json: { customers: [{ folder: 'Joey', printCount: 12, deleted: false }] },
      }),
      'GET /api/tags': () => ({ json: tags }),
      'DELETE /api/customers/Joey': () => ({ status: 204, json: { deleted: 12 } }),
    });
    renderDashboard('/?klant=Joey', 'Editor');
    // Delete lives in the tile's menu now (OverflowMenu 1.9), inside "Overzicht".
    await userEvent.click(await screen.findByRole('button', { name: /Klantenoverzicht/ }));
    await userEvent.click(
      within(screen.getByRole('dialog')).getByRole('button', { name: 'Meer acties' }),
    );
    await userEvent.click(screen.getByRole('menuitem', { name: 'Klant verwijderen' }));
    const dialog = screen.getByRole('alertdialog', { name: "Klant 'Joey' verwijderen?" });
    expect(dialog).toHaveAccessibleDescription(
      'Alle 12 prints van deze klant worden verborgen. De financiële gegevens blijven bewaard en een beheerder kan de klant herstellen.',
    );
    await userEvent.click(within(dialog).getByRole('button', { name: 'Verwijderen' }));
    await waitFor(() => {
      expect(calls.some((c) => c.method === 'DELETE' && c.path === '/api/customers/Joey')).toBe(
        true,
      );
    });
  });

  it('offers Factuur in the tile menu and in the phone toolbar', async () => {
    stubFetch({
      'GET /api/prints': () => ({ json: { items: [summary()], total: 12 } }),
      'GET /api/customers': () => ({
        json: { customers: [{ folder: 'Joey', printCount: 12, deleted: false }] },
      }),
      'GET /api/tags': () => ({ json: tags }),
      'GET /api/customers/Joey/invoice/preview': () => ({
        json: {
          lines: [],
          total: 0,
          paid: 0,
          open: 0,
          excluded: [],
          earlier: [],
          nextNumber: '2026-001',
          companyReady: true,
        },
      }),
    });
    renderDashboard('/?klant=Joey', 'Editor');
    // The toolbar keeps its own Factuur button; the tile's moved into the menu.
    await userEvent.click(await screen.findByRole('button', { name: 'Factuur' }));
    expect(screen.getByRole('dialog', { name: 'Factuur maken voor Joey' })).toBeInTheDocument();
  });

  it('lets Admins restore a deleted klant from the tile menu', async () => {
    const calls = stubFetch({
      'GET /api/prints': () => ({ json: { items: [], total: 0 } }),
      'GET /api/customers': () => ({
        json: { customers: [{ folder: 'Bas', printCount: 4, deleted: true }] },
      }),
      'GET /api/tags': () => ({ json: tags }),
      'GET /healthz': () => ({ json: { checks: { printsRoot: { status: 'up' } } } }),
      'POST /api/customers/Bas/restore': () => ({ json: { restored: 4 } }),
    });
    const view = renderDashboard('/?verwijderd=1');
    await userEvent.click(await screen.findByRole('button', { name: /Klantenoverzicht/ }));
    expect(view.container.querySelector('.pp-cust')).toHaveClass('is-deleted');
    await userEvent.click(
      within(screen.getByRole('dialog')).getByRole('button', { name: 'Meer acties' }),
    );
    await userEvent.click(screen.getByRole('menuitem', { name: 'Herstellen' }));
    await waitFor(() => {
      expect(calls.some((c) => c.path === '/api/customers/Bas/restore')).toBe(true);
    });
  });

  it('subscribes to live updates, refetches and flashes the changed card', async () => {
    let version = 'v1';
    stubFetch({
      'GET /api/prints': () => ({ json: { items: [summary({ version })], total: 1 } }),
      'GET /api/customers': () => ({ json: customers }),
      'GET /api/tags': () => ({ json: tags }),
    });
    renderDashboard();
    await screen.findByRole('link', { name: 'Babybox locks' });
    const socket = FakeWebSocket.last;
    if (socket === undefined) throw new Error('no socket');
    expect(socket.url).toMatch(/\/api\/live$/);
    act(() => {
      socket.open();
    });
    expect(JSON.parse(socket.sent[0] ?? '{}')).toEqual({ type: 'subscribe', customers: 'all' });
    act(() => {
      socket.receive({ type: 'subscribed', customers: 'all' });
    });
    version = 'v2';
    act(() => {
      socket.receive({ type: 'print:updated', printId: 'p1', customerFolder: 'Joey' });
    });
    await waitFor(() => {
      expect(document.querySelector('article.pp-print.flash')).not.toBeNull();
    });
    await waitFor(() => {
      expect(document.querySelector('.pp-thumb img')).toHaveAttribute(
        'src',
        '/api/prints/p1/thumbnail?v=v2',
      );
    });
  });

  it('shows the live indicator in the shell and announces a lost connection once', async () => {
    renderApp('/');
    const socket = FakeWebSocket.last;
    if (socket === undefined) throw new Error('no socket');
    act(() => {
      socket.open();
      socket.receive({ type: 'subscribed', customers: 'all' });
    });
    expect(await screen.findAllByText('Live')).not.toHaveLength(0);
    act(() => {
      socket.drop();
    });
    expect(
      await screen.findAllByText('Verbinding verbroken — opnieuw verbinden…'),
    ).not.toHaveLength(0);
  });
});

function detail(overrides: Partial<PrintDetail> = {}): PrintDetail {
  return {
    ...summary(),
    printerModel: 'Creality K1 Max',
    archivedAt: null,
    hasModel: false,
    models: [],
    noBilling: false,
    markupPercent: null,
    spool: null,
    orders: [
      {
        id: 'o1',
        number: 1,
        createdAt: '2026-10-01T10:00:00.000Z',
        date: '2026-09-12T10:00:00.000Z',
        status: 'open',
        price: 11.89,
        salePrice: 11.89,
        paid: 0,
        remaining: 11.89,
        writtenOff: null,
        payments: [],
        items: [
          { lineId: 'l1', timesPrinted: 2 },
          { lineId: 'l2', timesPrinted: 1 },
        ],
        invoice: null,
      },
    ],
    assets: [
      {
        id: 'a1',
        fileName: 'Babybox_locks_v3_plate1_1h20m.gcode',
        subPath: '',
        type: 'gcode',
        sizeBytes: 2_400_000,
        lastWriteUtc: '2026-10-01T10:00:00.000Z',
        recordedAt: null,
        parseError: null,
        lines: [
          {
            id: 'l1',
            plateIndex: 0,
            grams: 87,
            printSeconds: 4800,
            material: 'PLA',
            printerModel: null,
            excluded: false,
            autoExclusionReason: null,
            timesPrinted: 2,
            inOrder: true,
            spool: null,
            manualPricePerKg: null,
            possibleDuplicate: true,
            duplicateOf: 'copy.gcode',
            slots: [
              {
                slot: 2,
                grams: 50,
                colour: '#ff7a1a',
                material: 'PETG',
                spool: null,
                manualPricePerKg: null,
              },
              {
                slot: 4,
                grams: 37,
                colour: '#e63946',
                material: 'PLA',
                spool: null,
                manualPricePerKg: null,
              },
            ],
          },
        ],
      },
      {
        id: 'a2',
        fileName: 'next.gcode',
        subPath: 'Test',
        type: 'gcode',
        sizeBytes: 900,
        lastWriteUtc: '2026-10-01T10:00:00.000Z',
        recordedAt: null,
        parseError: null,
        lines: [
          {
            id: 'l2',
            plateIndex: 0,
            grams: null,
            printSeconds: null,
            material: null,
            printerModel: null,
            excluded: true,
            autoExclusionReason: 'folder:Test',
            timesPrinted: 1,
            inOrder: true,
            spool: null,
            manualPricePerKg: null,
            possibleDuplicate: false,
            duplicateOf: null,
            slots: [],
          },
        ],
      },
    ],
    ...overrides,
  };
}

function renderDetail(role: 'Admin' | 'Editor' | 'User' = 'Admin') {
  return renderWithAuth(
    <Routes>
      <Route path="/prints/:id" element={<PrintDetailPage />} />
      <Route path="/" element={<h1>Dashboard</h1>} />
    </Routes>,
    { state: signedIn(role), path: '/prints/p1' },
  );
}

describe('one target per row (GAP-091, GAP-093)', () => {
  it('stretches the name link over the whole row and keeps the checkbox above it', async () => {
    stubFetch({
      'GET /api/prints': () => ({ json: { items: [summary()], total: 1 } }),
      'GET /api/customers': () => ({ json: customers }),
      'GET /api/tags': () => ({ json: tags }),
    });
    renderDashboard();
    // Two switches exist, one per width; either one does.
    await screen.findAllByRole('button', { name: 'Lijst' });
    await userEvent.click(screen.getAllByRole('button', { name: 'Lijst' })[0] as HTMLElement);
    // Both layouts live in the DOM at once, so scope to the table.
    const link = await waitFor(() => {
      const found = document.querySelector('.pp-table .pp-rowlink');
      if (found === null) throw new Error('no row link yet');
      return found;
    });
    // The grid and the list behave the same: one real link, stretched.
    expect(link).toHaveTextContent('Babybox locks');
    const row = link.closest('tr');
    expect(row).not.toBeNull();
    // Every other control sits above that link rather than under it.
    const checkbox = within(row as HTMLElement).getByRole('checkbox');
    expect(checkbox).toHaveClass('app-above-link');
  });
});

describe('missing-files chip (GAP-090)', () => {
  it('is absent when nothing is missing, so most tiles are unchanged', async () => {
    stubFetch({
      'GET /api/prints': () => ({ json: { items: [summary({ lacks: [] })], total: 1 } }),
      'GET /api/customers': () => ({ json: customers }),
      'GET /api/tags': () => ({ json: tags }),
    });
    renderDashboard();
    await screen.findByRole('link', { name: 'Babybox locks' });
    expect(document.querySelector('.pp-lacks')).toBeNull();
  });

  it('names the missing types in the fixed order, whatever order they arrive in', async () => {
    stubFetch({
      'GET /api/prints': () => ({
        json: { items: [summary({ lacks: ['stl', 'gcode', '3mf'] })], total: 1 },
      }),
      'GET /api/customers': () => ({ json: customers }),
      'GET /api/tags': () => ({ json: tags }),
    });
    renderDashboard();
    await screen.findByRole('link', { name: 'Babybox locks' });
    const chip = document.querySelector('.pp-lacks');
    expect(chip).not.toBeNull();
    // The backend sends the fixed order; the chip renders what it is given.
    // The card shows one slashed icon per missing type; the sentence is the name.
    expect(chip?.textContent).not.toContain('Ontbreekt:');
    expect(chip?.querySelectorAll('svg').length).toBe(3);
    expect(
      screen.getByLabelText(
        'Deze print heeft geen STL-bestand, geen G-code-bestand en geen 3MF-bestand.',
      ),
    ).toBeInTheDocument();
  });

  it('shows a tooltip on hover and hides it on Escape', async () => {
    stubFetch({
      'GET /api/prints': () => ({ json: { items: [summary({ lacks: ['gcode'] })], total: 1 } }),
      'GET /api/customers': () => ({ json: customers }),
      'GET /api/tags': () => ({ json: tags }),
    });
    renderDashboard();
    await screen.findByRole('link', { name: 'Babybox locks' });
    const chip = document.querySelector('.pp-lacks');
    if (chip === null) throw new Error('no chip');
    expect(screen.queryByRole('tooltip', { hidden: true })).toBeNull();
    // Not the native title: the bubble is ours, and it appears at once.
    expect(chip.getAttribute('title')).toBeNull();
    await userEvent.hover(chip);
    const tip = await screen.findByRole('tooltip', { hidden: true });
    // 2.2: one visible short form; the sentence is the accessible name.
    expect(tip).toHaveTextContent('Ontbreekt: G-code');
    expect(chip.getAttribute('aria-label')).toBe('Deze print heeft geen G-code-bestand.');
    await userEvent.keyboard('{Escape}');
    await waitFor(() => {
      expect(screen.queryByRole('tooltip', { hidden: true })).toBeNull();
    });
  });

  it('shows a single missing type without a list', async () => {
    stubFetch({
      'GET /api/prints': () => ({ json: { items: [summary({ lacks: ['gcode'] })], total: 1 } }),
      'GET /api/customers': () => ({ json: customers }),
      'GET /api/tags': () => ({ json: tags }),
    });
    renderDashboard();
    await screen.findByRole('link', { name: 'Babybox locks' });
    const one = document.querySelector('.pp-lacks');
    expect(one?.querySelectorAll('svg').length).toBe(1);
    expect(screen.getByLabelText('Deze print heeft geen G-code-bestand.')).toBeInTheDocument();
  });
});

describe('PrintDetailPage', () => {
  it('shows breadcrumb, name, tags, files with duplicates, exclusions and slots', async () => {
    stubFetch({ 'GET /api/prints/p1': () => ({ json: detail() }) });
    renderDetail('Editor');
    expect(
      await screen.findByRole('heading', { level: 1, name: 'Babybox locks' }),
    ).toBeInTheDocument();
    // "Joey" is both the breadcrumb and the Klant row of "Deze print" (GAP-095).
    expect(document.querySelector('.pp-crumb')).toHaveTextContent('Joey');
    expect(screen.getByRole('region', { name: 'Deze print' })).toHaveTextContent('Joey');
    const files = screen.getByRole('region', { name: 'Bestanden' });
    expect(within(files).getByText('2 bestanden')).toBeInTheDocument();
    expect(within(files).getByText('× 2')).toBeInTheDocument();
    expect(within(files).getByText('Mogelijk dubbel')).toBeInTheDocument();
    expect(
      within(files).getByText('Zelfde bestand als copy.gcode. Gebruik liever Aantal keer geprint.'),
    ).toBeInTheDocument();
    expect(within(files).getByText('Telt niet mee: map Test')).toBeInTheDocument();
    expect(within(files).getByText('Slot 2')).toBeInTheDocument();
    expect(within(files).getAllByText('slicer')).toHaveLength(2);
    expect(within(files).getByText('geen gewicht of tijd')).toBeInTheDocument();
    expect(
      within(files).getByRole('link', { name: 'Downloaden: Babybox_locks_v3_plate1_1h20m.gcode' }),
    ).toHaveAttribute('href', '/api/assets/a1/download');
    expect(screen.getByText('Geen 3D-model beschikbaar')).toBeInTheDocument();
  });

  it('makes the file controls read-only for an order on a final invoice', async () => {
    const base = detail();
    const first = base.orders[0];
    if (first === undefined) throw new Error('fixture');
    stubFetch({
      'GET /api/prints/p1': () => ({
        json: detail({ orders: [{ ...first, invoice: { id: 'i7', number: '2026-007' } }] }),
      }),
    });
    renderDetail('Editor');
    expect(await screen.findByText('Op factuur 2026-007.')).toBeInTheDocument();
    // The locked controls live in the order's own list now, not in the print's
    // inventory: an order shows only what it bills (GAP-097).
    const files = screen.getByRole('region', { name: 'In deze bestelling' });
    const help = 'Staat op een definitieve factuur en kan niet meer worden gewijzigd.';
    expect(within(files).getByText(help)).toBeInTheDocument();
    expect(within(files).queryByRole('textbox', { name: 'Aantal keer geprint' })).toBeNull();
    for (const toggle of within(files).getAllByRole('switch', {
      name: 'Telt niet mee in kosten',
    })) {
      expect(toggle).toBeDisabled();
      expect(toggle).toHaveAccessibleDescription(help);
    }
  });

  it('lists the orders newest first and makes or deletes a Nabestelling', async () => {
    const base = detail();
    const first = base.orders[0];
    const assets = base.assets ?? [];
    if (first === undefined) throw new Error('fixture');
    const withRepeat = detail({
      orders: [
        { ...first, status: 'paid', paid: 11.89, remaining: 0 },
        {
          ...first,
          id: 'o2',
          number: 2,
          date: '2026-10-06T10:00:00.000Z',
          status: 'open',
          price: 5,
          items: [{ lineId: 'l1', timesPrinted: 3 }],
        },
      ],
      assets: [
        ...assets,
        {
          id: 'a3',
          fileName: 'spare.gcode',
          subPath: '',
          type: 'gcode',
          sizeBytes: 100,
          lastWriteUtc: '2026-10-06T10:00:00.000Z',
          recordedAt: null,
          parseError: null,
          lines: [
            {
              ...(assets[0]?.lines[0] as NonNullable<(typeof assets)[0]['lines'][0]>),
              id: 'l3',
              timesPrinted: 0,
              inOrder: false,
              possibleDuplicate: false,
              duplicateOf: null,
              slots: [],
            },
          ],
        },
      ],
    });
    const calls = stubFetch({
      'GET /api/prints/p1': () => ({ json: withRepeat }),
      'POST /api/prints/p1/orders': () => ({ status: 201, json: { id: 'o3' } }),
      'DELETE /api/orders/o2': () => ({ status: 204 }),
    });
    const view = renderDetail('Editor');
    await screen.findByRole('heading', { level: 1, name: 'Babybox locks' });
    const sections = view.container.querySelectorAll('details.pp-order');
    expect([...sections].map((s) => s.querySelector('.ttl b')?.textContent)).toEqual([
      'Nabestelling 2',
      'Bestelling 1',
    ]);
    // Settled orders start closed; the newest unsettled one is the current order.
    expect(sections[0]).toHaveAttribute('open');
    expect(sections[0]).toHaveClass('is-open-order');
    expect(sections[1]).not.toHaveAttribute('open');
    // The reprinted file shows this order's count.
    expect(within(sections[0] as HTMLElement).getByText('× 3')).toBeInTheDocument();
    // A file in no order: alert, badge and hint.
    expect(
      screen.getByText(
        '1 nieuw bestand staat in geen bestelling. Voeg het toe aan een nabestelling.',
      ),
    ).toBeInTheDocument();
    expect(screen.getByText('Niet in een bestelling')).toBeInTheDocument();

    await userEvent.click(
      screen.getAllByRole('button', { name: 'Nabestelling maken' })[0] as HTMLElement,
    );
    const dialog = screen.getByRole('dialog', { name: 'Nabestelling maken' });
    expect(within(dialog).getByRole('checkbox', { name: 'spare.gcode' })).toBeChecked();
    expect(
      within(dialog).getByRole('checkbox', { name: 'Babybox_locks_v3_plate1_1h20m.gcode' }),
    ).not.toBeChecked();
    await userEvent.click(within(dialog).getByRole('checkbox', { name: 'spare.gcode' }));
    await userEvent.click(within(dialog).getByRole('button', { name: 'Nabestelling maken' }));
    expect(within(dialog).getByRole('alert')).toHaveTextContent('Kies minstens één bestand.');
    await userEvent.click(
      within(dialog).getByRole('checkbox', { name: 'Babybox_locks_v3_plate1_1h20m.gcode' }),
    );
    const qty = within(dialog).getByRole('textbox', {
      name: 'Aantal keer geprint: Babybox_locks_v3_plate1_1h20m.gcode',
    });
    // Starts at the count of its latest order.
    expect(qty).toHaveValue('3');
    await userEvent.clear(qty);
    await userEvent.type(qty, '4');
    await userEvent.click(within(dialog).getByRole('button', { name: 'Nabestelling maken' }));
    await waitFor(() => {
      expect(calls.find((c) => c.method === 'POST')?.body).toEqual({
        items: [{ lineId: 'l1', timesPrinted: 4 }],
      });
    });

    await userEvent.click(screen.getByRole('button', { name: 'Nabestelling verwijderen' }));
    const confirm = screen.getByRole('alertdialog', { name: 'Nabestelling 2 verwijderen?' });
    await userEvent.click(within(confirm).getByRole('button', { name: 'Verwijderen' }));
    await waitFor(() => {
      expect(calls.some((c) => c.method === 'DELETE')).toBe(true);
    });
  });

  it('removes a tag from the print for Editors', async () => {
    const calls = stubFetch({
      'GET /api/prints/p1': () => ({ json: detail() }),
      'PUT /api/prints/p1/tags': () => ({ status: 204 }),
    });
    renderDetail('Editor');
    await userEvent.click(await screen.findByRole('button', { name: 'cadeau verwijderen' }));
    expect(calls.at(-2)).toMatchObject({ method: 'PUT', body: { tagIds: [] } });
  });

  it('deletes after confirmation and returns to the dashboard', async () => {
    const calls = stubFetch({
      'GET /api/prints/p1': () => ({ json: detail() }),
      'DELETE /api/prints/p1': () => ({ status: 204 }),
    });
    renderDetail('Editor');
    await userEvent.click(await screen.findByRole('button', { name: 'Meer acties' }));
    await userEvent.click(screen.getByRole('menuitem', { name: 'Verwijderen' }));
    const dialog = screen.getByRole('alertdialog', { name: "Print 'Babybox locks' verwijderen?" });
    expect(dialog).toHaveAccessibleDescription(
      'Verwijderen verbergt de print, maar bewaart de financiële gegevens.',
    );
    await userEvent.click(within(dialog).getByRole('button', { name: 'Verwijderen' }));
    expect(await screen.findByRole('heading', { name: 'Dashboard' })).toBeInTheDocument();
    expect(calls.some((c) => c.method === 'DELETE')).toBe(true);
  });

  it('gives Users the summary only: no files, no delete, read-only tags', async () => {
    stubFetch({ 'GET /api/prints/p1': () => ({ json: detail({ assets: null }) }) });
    renderDetail('User');
    await screen.findByRole('heading', { level: 1, name: 'Babybox locks' });
    expect(screen.queryByRole('region', { name: 'Bestanden' })).toBeNull();
    expect(screen.queryByRole('button', { name: 'Verwijderen' })).toBeNull();
    expect(screen.queryByRole('button', { name: 'cadeau verwijderen' })).toBeNull();
  });

  it('shows the 403 state for another customer', async () => {
    stubFetch({ 'GET /api/prints/p1': () => ({ status: 403, json: { error: 'no_access' } }) });
    renderDetail('User');
    expect(
      await screen.findByRole('heading', { level: 1, name: 'Geen toegang tot deze klant' }),
    ).toBeInTheDocument();
  });

  it('shows archived and deleted notes; Admins can restore', async () => {
    const calls = stubFetch({
      'GET /api/prints/p1': () => ({
        json: detail({ status: 'deleted', deletedAt: '2026-10-04T23:30:00.000Z' }),
      }),
      'POST /api/prints/p1/restore': () => ({ status: 204 }),
    });
    renderDetail('Admin');
    expect(await screen.findByText('Verwijderd op 5 okt 2026.')).toBeInTheDocument();
    await userEvent.click(screen.getByRole('button', { name: 'Herstellen' }));
    expect(calls.some((c) => c.path === '/api/prints/p1/restore')).toBe(true);
  });
});
