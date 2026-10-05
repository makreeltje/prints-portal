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
    tags: [{ id: 't1', name: 'cadeau', colour: '#e0a3ff', ink: '#141a33' }],
    hasThumbnail: true,
    colour: '#1a1a1a',
    version: 'v1',
    ...overrides,
  };
}

const customers = { customers: [{ folder: 'Joey', printCount: 1, deleted: false }] };
const tags = {
  tags: [{ id: 't1', name: 'cadeau', colour: '#e0a3ff', ink: '#141a33', printCount: 1 }],
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
    expect(within(card).getByText('Joey / Babybox locks')).toBeInTheDocument();
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
    renderDashboard('/', 'Editor');
    await screen.findByText('Nog geen prints');
    expect(screen.queryByLabelText('Toon verwijderde')).toBeNull();
    expect(screen.getAllByLabelText('Gearchiveerd tonen').length).toBeGreaterThan(0);
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
    ).toEqual(['Naam', 'Materiaal', 'Tijd', 'Gewicht', 'Status', 'Tags']);
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
            possibleDuplicate: true,
            duplicateOf: 'copy.gcode',
            slots: [
              { slot: 2, grams: 50, colour: '#ff7a1a', material: 'PETG' },
              { slot: 4, grams: 37, colour: '#e63946', material: 'PLA' },
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

describe('PrintDetailPage', () => {
  it('shows breadcrumb, name, tags, files with duplicates, exclusions and slots', async () => {
    stubFetch({ 'GET /api/prints/p1': () => ({ json: detail() }) });
    renderDetail('Editor');
    expect(
      await screen.findByRole('heading', { level: 1, name: 'Babybox locks' }),
    ).toBeInTheDocument();
    expect(screen.getByText('Joey / Babybox locks')).toBeInTheDocument();
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
    await userEvent.click(await screen.findByRole('button', { name: 'Verwijderen' }));
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
