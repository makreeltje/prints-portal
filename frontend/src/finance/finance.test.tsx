import { screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import type { Cost, Order, PrintSummary, Spool } from '../prints/types';
import { renderWithAuth, signedIn, stubFetch } from '../test/render';
import { LiveProvider } from '../prints/live';
import { DashboardPage } from '../prints/DashboardPage';
import { CostBreakdown } from './CostBreakdown';
import { PaymentPanel, type PaymentActions } from './PaymentPanel';
import { SettingsPage } from './SettingsPage';
import { SpoolPicker } from './SpoolPicker';

const text = (value: string) => value.replace(/\s/g, ' ');

function cost(overrides: Partial<Cost> = {}): Cost {
  return {
    materialCost: 4,
    electricityCost: 0.26,
    totalCost: 4.26,
    grams: 177,
    gramsSource: 'files',
    printPricePerKg: null,
    printPriceSource: null,
    printSeconds: 15_120,
    timeSource: 'files',
    energyKwh: 1.05,
    tariffEurPerKwh: 0.25,
    missing: [],
    excludedCount: 2,
    lines: [
      {
        lineId: 'l1',
        fileName: 'Babybox_locks.gcode',
        plateIndex: 0,
        counted: true,
        timesPrinted: 2,
        grams: 174,
        materialCost: 3.92,
        slots: [{ slot: 1, grams: 174, pricePerKg: 22.5, source: 'spoolman', cost: 3.92 }],
      },
      {
        lineId: 'l2',
        fileName: 'Multicolour_deksel.gcode',
        plateIndex: 0,
        counted: true,
        timesPrinted: 1,
        grams: 3.03,
        materialCost: 0.08,
        slots: [
          { slot: 2, grams: 1.65, pricePerKg: 24, source: 'spoolman', cost: 0.04 },
          { slot: 4, grams: 1.38, pricePerKg: 30, source: 'manual', cost: 0.04 },
        ],
      },
    ],
    ...overrides,
  };
}

function order(overrides: Partial<Order> = {}): Order {
  return {
    id: 'o1',
    number: 1,
    date: '2026-09-12T10:00:00.000Z',
    createdAt: '2026-10-01T10:00:00.000Z',
    status: 'open',
    requestState: null,
    price: 21.3,
    salePrice: null,
    priceSuggested: true,
    suggestion: { salePrice: 21.3, reason: null },
    paid: 0,
    remaining: 21.3,
    writtenOff: null,
    payments: [],
    overrides: { pricePerKg: null, grams: null, printSeconds: null },
    cost: cost(),
    items: [],
    ...overrides,
  };
}

function actions(): PaymentActions & Record<string, ReturnType<typeof vi.fn>> {
  return {
    setSalePrice: vi.fn(() => Promise.resolve()),
    addPayment: vi.fn(() => Promise.resolve()),
    writeOff: vi.fn(() => Promise.resolve()),
    undoPayment: vi.fn(() => Promise.resolve()),
    undoWriteOff: vi.fn(() => Promise.resolve()),
  };
}

const renderPanel = (
  o: Order,
  role: 'Admin' | 'Editor' | 'User' = 'Editor',
  a = actions(),
  notBilled = false,
) => {
  renderWithAuth(
    <PaymentPanel
      order={o}
      printName="Babybox locks"
      markupPercent={400}
      notBilled={notBilled}
      cost={4.26}
      role={role}
      actions={a}
    />,
    { state: signedIn(role), path: '/' },
  );
  return a;
};

describe('PaymentPanel', () => {
  it('suggests the price from the markup and saves it', async () => {
    const a = renderPanel(order());
    const price = screen.getByLabelText('Verkoopprijs');
    expect(price).toHaveValue('21,30');
    expect(screen.getByText('voorgesteld')).toBeInTheDocument();
    await userEvent.clear(price);
    await userEvent.type(price, '11,89');
    expect(screen.queryByText('voorgesteld')).toBeNull();
    await userEvent.click(screen.getByRole('button', { name: 'Voorstel uit marge (400%)' }));
    expect(price).toHaveValue('21,30');
    await userEvent.clear(price);
    await userEvent.type(price, '11,89');
    await userEvent.click(screen.getByRole('button', { name: 'Opslaan' }));
    expect(a.setSalePrice).toHaveBeenCalledWith(11.89);
  });

  it('records a payment and refuses more than what is open', async () => {
    const a = renderPanel(order({ salePrice: 11.89, price: 11.89, remaining: 11.89 }));
    const amount = screen.getByLabelText('Betaald bedrag');
    expect(amount).toHaveValue('11,89');
    await userEvent.clear(amount);
    await userEvent.type(amount, '12');
    await userEvent.click(screen.getByRole('button', { name: 'Markeer als betaald' }));
    expect(screen.getByText('Vul een bedrag in, bijvoorbeeld 11,89.')).toBeInTheDocument();
    expect(a.addPayment).not.toHaveBeenCalled();
    await userEvent.clear(amount);
    await userEvent.type(amount, '5');
    await userEvent.click(screen.getByRole('button', { name: 'Markeer als betaald' }));
    expect(a.addPayment).toHaveBeenCalledWith(5);
  });

  it('shows a partial payment and writes off only the rest', async () => {
    const a = renderPanel(
      order({
        status: 'partial',
        salePrice: 11.89,
        price: 11.89,
        paid: 5,
        remaining: 6.89,
        payments: [
          {
            id: 'p1',
            amount: 5,
            paidAt: '2026-10-02T10:00:00.000Z',
            by: 'editor',
            undoneAt: null,
            undoneBy: null,
          },
        ],
      }),
    );
    expect(screen.getByText('Deels betaald')).toBeInTheDocument();
    expect(screen.getByText('Betaald € 5,00 van € 11,89')).toBeInTheDocument();
    expect(text(screen.getByText(/Nog .* open/).textContent)).toBe('Nog € 6,89 open');
    expect(screen.getByText('2 okt 2026')).toBeInTheDocument();
    await userEvent.click(screen.getByRole('button', { name: 'Afschrijven' }));
    const dialog = screen.getByRole('alertdialog');
    expect(text(within(dialog).getByRole('heading').textContent)).toBe('Afschrijven (€ 6,89)?');
    expect(text(dialog.textContent)).toContain(
      "De rest van 'Babybox locks' (€ 6,89) wordt afgeschreven.",
    );
    expect(text(dialog.textContent)).toContain(
      'Al betaald: € 5,00. Alleen de rest wordt afgeschreven.',
    );
    await userEvent.type(within(dialog).getByLabelText('Reden'), 'Vriendenprijs');
    await userEvent.click(within(dialog).getByRole('button', { name: 'Afschrijven' }));
    expect(a.writeOff).toHaveBeenCalledWith('Vriendenprijs');
  });

  it('locks the price once the order is on a final invoice, payments still work', async () => {
    const a = renderPanel(
      order({
        salePrice: 11.89,
        price: 11.89,
        remaining: 11.89,
        priceSuggested: false,
        invoice: { id: 'i7', number: '2026-007' },
      }),
    );
    expect(screen.getByText('Op factuur 2026-007')).toHaveClass('pp-badge', 'info');
    const price = screen.getByLabelText('Verkoopprijs');
    expect(price).toBeDisabled();
    expect(price).toHaveAccessibleDescription(
      'Staat op een definitieve factuur en kan niet meer worden gewijzigd.',
    );
    expect(screen.queryByRole('button', { name: 'Opslaan' })).toBeNull();
    expect(screen.queryByRole('button', { name: 'Voorstel uit marge (400%)' })).toBeNull();
    await userEvent.click(screen.getByRole('button', { name: 'Markeer als betaald' }));
    expect(a.addPayment).toHaveBeenCalledWith(11.89);
  });

  it('lets only Admins undo a payment', () => {
    const paid = order({
      status: 'paid',
      salePrice: 11.89,
      price: 11.89,
      paid: 11.89,
      remaining: 0,
      payments: [
        {
          id: 'p1',
          amount: 11.89,
          paidAt: '2026-10-05T10:00:00.000Z',
          by: 'editor',
          undoneAt: null,
          undoneBy: null,
        },
      ],
    });
    renderPanel(paid, 'Editor');
    expect(screen.getByText('Betaald op 5 okt 2026')).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Betaling ongedaan maken' })).toBeNull();
  });

  it('confirms an undo for Admins', async () => {
    const a = renderPanel(
      order({
        status: 'paid',
        price: 11.89,
        paid: 11.89,
        remaining: 0,
        payments: [
          {
            id: 'p1',
            amount: 11.89,
            paidAt: '2026-10-05T10:00:00.000Z',
            by: null,
            undoneAt: null,
            undoneBy: null,
          },
        ],
      }),
      'Admin',
    );
    expect(screen.getByText('Alleen zichtbaar voor beheerders.')).toBeInTheDocument();
    await userEvent.click(screen.getByRole('button', { name: 'Betaling ongedaan maken' }));
    const dialog = screen.getByRole('alertdialog', { name: 'Betaling ongedaan maken?' });
    await userEvent.click(within(dialog).getByRole('button', { name: 'Betaling ongedaan maken' }));
    expect(a.undoPayment).toHaveBeenCalled();
  });

  it('shows the written-off details', () => {
    renderPanel(
      order({
        status: 'writtenOff',
        price: 11.89,
        paid: 5,
        remaining: 0,
        writtenOff: {
          amount: 6.89,
          at: '2026-10-05T10:00:00.000Z',
          by: 'owner',
          reason: 'Klant betaalt de rest niet',
        },
      }),
      'Admin',
    );
    expect(screen.getByText('Afgeschreven', { selector: '.pp-badge' })).toBeInTheDocument();
    expect(screen.getByText('Klant betaalt de rest niet')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Afschrijving ongedaan maken' })).toBeInTheDocument();
  });

  it('shows cost only for niet factureren and price only for Users', () => {
    renderPanel(order(), 'Editor', actions(), true);
    expect(screen.getByText('Deze klant wordt niet gefactureerd.')).toBeInTheDocument();
    expect(screen.queryByLabelText('Verkoopprijs')).toBeNull();
  });

  it('is read-only for Users', () => {
    renderPanel(
      {
        id: 'o1',
        number: 1,
        createdAt: '',
        date: '',
        status: 'open',
        requestState: null,
        price: 11.89,
      },
      'User',
    );
    expect(screen.getByText('Je ziet alleen prijs en status.')).toBeInTheDocument();
    expect(screen.queryByRole('textbox')).toBeNull();
    expect(screen.queryByRole('button')).toBeNull();
  });
});

describe('CostBreakdown', () => {
  it('shows each file and slot with its calculation and source', () => {
    renderWithAuth(<CostBreakdown cost={cost()} notBilled={false} manual={false} />, {
      state: signedIn('Editor'),
      path: '/',
    });
    const table = screen.getByRole('table');
    const rows = within(table)
      .getAllByRole('row')
      .map((row) => text(row.textContent));
    expect(rows).toEqual([
      'PostBerekeningBronBedrag',
      'Materiaal€ 4,00',
      'onderdeel van Materiaal Babybox_locks.gcode2 × 87 g × € 22,50/kgSpoolman€ 3,92',
      'onderdeel van Materiaal Multicolour_deksel.gcode3,03 g€ 0,08',
      'onderdeel van Multicolour_deksel.gcode Slot 21,65 g × € 24,00/kgSpoolman€ 0,04',
      'onderdeel van Multicolour_deksel.gcode Slot 41,38 g × € 30,00/kgHandmatig€ 0,04',
      'Stroom1,05 kWh × € 0,25/kWhGeschat€ 0,26',
      'Totaalkosten€ 4,26',
    ]);
    expect(screen.getByText('Niet meegeteld: 2 bestanden')).toBeInTheDocument();
  });

  it('marks a missing printer profile and an incomplete total', () => {
    renderWithAuth(
      <CostBreakdown
        cost={cost({ missing: ['printerProfile'], electricityCost: null, energyKwh: null })}
        notBilled
        manual={false}
        onAdjust={() => undefined}
        printerModel="Creality K2"
      />,
      { state: signedIn('Editor'), path: '/' },
    );
    // CostBreakdown 1.9: one line naming the input and where to set it, and
    // never the old "Kosten ontbreken" repeat (GAP-073, GAP-076).
    expect(screen.getByText(/Geen vermogen voor Creality K2\./)).toBeInTheDocument();
    expect(screen.queryByText('Kosten ontbreken')).not.toBeInTheDocument();
    expect(screen.getByText('Onvolledig')).toBeInTheDocument();
    // Niet factureren: the title reads "Kosten".
    expect(screen.getByRole('heading', { name: 'Kosten' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Aanpassen' })).toBeInTheDocument();
  });
});

const ESUN: Spool = {
  id: 7,
  name: 'eSun PLA+ Zwart',
  vendor: 'eSun',
  material: 'PLA',
  colour: '#1a1a1a',
  colours: [],
  multiColourDirection: null,
  pricePerKg: 22.5,
};

const POLY: Spool = {
  id: 9,
  name: 'Polymaker PETG Oranje',
  vendor: 'Polymaker',
  material: 'PETG',
  colour: '#ff7a1a',
  colours: [],
  multiColourDirection: null,
  pricePerKg: 24,
};

const SPOOLS: Spool[] = [ESUN, POLY];

describe('SpoolPicker', () => {
  it('filters as you type and picks with the keyboard', async () => {
    stubFetch({ 'GET /api/spools': () => ({ json: { configured: true, spools: SPOOLS } }) });
    const onChange = vi.fn(() => Promise.resolve());
    renderWithAuth(<SpoolPicker value={null} onChange={onChange} />, {
      state: signedIn('Editor'),
      path: '/',
    });
    await userEvent.click(screen.getByRole('button', { name: /Kies een spoel/ }));
    const combo = screen.getByRole('combobox');
    await waitFor(() => {
      expect(combo).toHaveFocus();
    });
    expect(await screen.findByRole('option', { name: /eSun PLA\+ Zwart/ })).toBeInTheDocument();
    await userEvent.type(combo, 'petg');
    expect(screen.queryByRole('option', { name: /eSun/ })).toBeNull();
    // Polymaker first, then "Geen spoel".
    await userEvent.keyboard('{Enter}');
    expect(onChange).toHaveBeenCalledWith(9);
  });

  it('tells two spools of the same filament apart, and marks the archive', async () => {
    const twins: Spool[] = [
      { ...ESUN, id: 13, remainingWeight: 1000 },
      { ...ESUN, id: 11, remainingWeight: 294.35 },
      { ...ESUN, id: 4, remainingWeight: 0, archived: true },
    ];
    stubFetch({ 'GET /api/spools': () => ({ json: { configured: true, spools: twins } }) });
    const onChange = vi.fn(() => Promise.resolve());
    renderWithAuth(<SpoolPicker value={null} onChange={onChange} />, {
      state: signedIn('Editor'),
      path: '/',
    });
    await userEvent.click(screen.getByRole('button', { name: /Kies een spoel/ }));
    // Same name and colour three times: the grams are what tells them apart.
    expect(await screen.findByRole('option', { name: /1000 g over/ })).toBeInTheDocument();
    expect(screen.getByRole('option', { name: /294 g over/ })).toBeInTheDocument();
    const archived = screen.getByRole('option', { name: /archief/ });
    expect(archived).toHaveTextContent('0 g over');
    // It is choosable: that is the whole point of asking for the archive.
    await userEvent.click(archived);
    expect(onChange).toHaveBeenCalledWith(4);
  });

  it('finds the archive by typing its own word', async () => {
    stubFetch({
      'GET /api/spools': () => ({
        json: {
          configured: true,
          spools: [ESUN, { ...POLY, archived: true }] satisfies Spool[],
        },
      }),
    });
    renderWithAuth(<SpoolPicker value={null} onChange={() => Promise.resolve()} />, {
      state: signedIn('Editor'),
      path: '/',
    });
    await userEvent.click(screen.getByRole('button', { name: /Kies een spoel/ }));
    await userEvent.type(screen.getByRole('combobox'), 'archief');
    expect(screen.queryByRole('option', { name: /eSun/ })).toBeNull();
    expect(screen.getByRole('option', { name: /Polymaker/ })).toBeInTheDocument();
  });

  it('says when Spoolman cannot be reached', async () => {
    stubFetch({
      'GET /api/spools': () => ({ status: 503, json: { error: 'spoolman_unavailable' } }),
    });
    renderWithAuth(<SpoolPicker value={null} onChange={() => Promise.resolve()} />, {
      state: signedIn('Editor'),
      path: '/',
    });
    await userEvent.click(screen.getByRole('button', { name: /Kies een spoel/ }));
    expect(await screen.findByText('Niet bereikbaar')).toBeInTheDocument();
    // "Geen spoel" stays available.
    expect(screen.getByRole('option', { name: 'Geen spoel' })).toBeInTheDocument();
    await userEvent.keyboard('{Escape}');
    expect(screen.queryByRole('combobox')).toBeNull();
  });
});

describe('BulkActionBar', () => {
  const print = (id: string, name: string): PrintSummary => ({
    id,
    name,
    customerFolder: 'Joey',
    projectFolder: name,
    material: 'PLA',
    printSeconds: 60,
    grams: 1,
    printDate: null,
    discoveredAt: '2026-10-01T10:00:00.000Z',
    status: 'indexed',
    deletedAt: null,
    tags: [],
    hasThumbnail: false,
    colour: null,
    money: {
      status: 'open',
      price: 11.89,
      priceSuggested: false,
      paid: 0,
      writtenOff: 0,
      remaining: 11.89,
      orderCount: 1,
      cost: 2,
    },
    lacks: [],
    version: 'v1',
  });

  it('marks the selection as paid after confirming the count', async () => {
    const calls = stubFetch({
      'GET /api/prints': () => ({
        json: { items: [print('p1', 'Box'), print('p2', 'Lamp')], total: 2 },
      }),
      'GET /api/customers': () => ({ json: { customers: [] } }),
      'GET /api/tags': () => ({ json: { tags: [] } }),
      'POST /api/prints/bulk': () => ({
        json: {
          results: [
            { id: 'p1', ok: true },
            { id: 'p2', ok: true },
          ],
        },
      }),
    });
    renderWithAuth(
      <LiveProvider onSessionEnded={() => undefined}>
        <DashboardPage />
      </LiveProvider>,
      { state: signedIn('Editor'), path: '/' },
    );
    await userEvent.click(await screen.findByRole('checkbox', { name: 'Selecteer Box' }));
    await userEvent.click(screen.getByRole('checkbox', { name: 'Selecteer Lamp' }));
    const bar = screen.getByRole('region', { name: 'Acties voor selectie' });
    expect(within(bar).getByText('2 geselecteerd')).toBeInTheDocument();
    expect(within(bar).queryByRole('button', { name: 'Spoel toewijzen' })).toBeNull();
    await userEvent.click(
      within(bar).getAllByRole('button', { name: 'Markeer als betaald' })[0] as HTMLElement,
    );
    const dialog = screen.getByRole('dialog', { name: '2 prints als betaald markeren?' });
    await userEvent.click(within(dialog).getByRole('button', { name: 'Markeer als betaald' }));
    await waitFor(() => {
      expect(calls.find((c) => c.method === 'POST')?.body).toEqual({
        ids: ['p1', 'p2'],
        action: 'markPaid',
      });
    });
    await waitFor(() => {
      expect(screen.queryByRole('region', { name: 'Acties voor selectie' })).toBeNull();
    });
  });

  it('sets a price on the newest orders and lists the prints that failed (GAP-034)', async () => {
    const calls = stubFetch({
      'GET /api/prints': () => ({
        json: { items: [print('p1', 'Box'), print('p2', 'Lamp'), print('p3', 'Hoes')], total: 3 },
      }),
      'GET /api/customers': () => ({ json: { customers: [] } }),
      'GET /api/tags': () => ({ json: { tags: [] } }),
      'GET /api/settings/markup': () => ({ json: { defaultMarkupPercent: 400 } }),
      'POST /api/prints/bulk': () => ({
        json: {
          results: [
            { id: 'p1', ok: true },
            { id: 'p2', ok: false, error: 'paid', orderNumber: 2 },
            { id: 'p3', ok: false, error: 'locked', orderNumber: 1, invoiceNumber: '2026-004' },
          ],
        },
      }),
    });
    renderWithAuth(
      <LiveProvider onSessionEnded={() => undefined}>
        <DashboardPage />
      </LiveProvider>,
      { state: signedIn('Editor'), path: '/' },
    );
    for (const name of ['Box', 'Lamp', 'Hoes']) {
      await userEvent.click(await screen.findByRole('checkbox', { name: `Selecteer ${name}` }));
    }
    const bar = screen.getByRole('region', { name: 'Acties voor selectie' });
    await userEvent.click(
      within(bar).getAllByRole('button', { name: 'Prijs instellen' })[0] as HTMLElement,
    );
    const dialog = screen.getByRole('dialog', { name: 'Prijs instellen voor 3 prints' });
    expect(
      within(dialog).getByText('De prijs komt op de nieuwste bestelling van elke print.'),
    ).toBeInTheDocument();
    await userEvent.click(
      within(dialog).getByRole('radio', { name: 'Voorstel uit marge per print (400%)' }),
    );
    await userEvent.click(within(dialog).getByRole('button', { name: 'Prijs instellen' }));
    await waitFor(() => {
      expect(calls.find((c) => c.method === 'POST')?.body).toEqual({
        ids: ['p1', 'p2', 'p3'],
        action: 'setPrice',
        suggested: true,
      });
    });
    const alert = await screen.findByRole('alert');
    expect(alert).toHaveTextContent('2 prints niet bijgewerkt');
    expect(within(alert).getByText('Nabestelling 2 is al betaald.')).toBeInTheDocument();
    expect(within(alert).getByText('Staat op factuur 2026-004.')).toBeInTheDocument();
    expect(await screen.findByText('1 van 3 bijgewerkt')).toBeInTheDocument();
    // The selection stays so the failed prints can be handled.
    expect(screen.getByRole('region', { name: 'Acties voor selectie' })).toBeInTheDocument();
  });

  it('shows the price and payment badge on cards, and no selection for Users', async () => {
    stubFetch({
      'GET /api/prints': () => ({ json: { items: [print('p1', 'Box')], total: 1 } }),
      'GET /api/customers': () => ({ json: { customers: [] } }),
      'GET /api/tags': () => ({ json: { tags: [] } }),
    });
    renderWithAuth(
      <LiveProvider onSessionEnded={() => undefined}>
        <DashboardPage />
      </LiveProvider>,
      { state: signedIn('User'), path: '/' },
    );
    const card = (await screen.findByRole('link', { name: 'Box' })).closest('article');
    if (card === null) throw new Error('no card');
    expect(text(within(card).getByText(/11,89/).textContent)).toBe('€ 11,89');
    expect(within(card).getByText('Open')).toBeInTheDocument();
    expect(within(card).queryByRole('checkbox')).toBeNull();
  });
});

describe('SettingsPage', () => {
  it('saves the Standaardmarge and flags a klant as niet factureren', async () => {
    const calls = stubFetch({
      'GET /api/settings': () => ({
        json: {
          pricing: { defaultMarkupPercent: 400, tariffEurPerKwh: 0.25, materialPricesPerKg: {} },
          printers: [],
          company: { name: 'Studio', iban: '', address: '', email: null, phone: null },
        },
      }),
      'PUT /api/settings/pricing': (body) => ({
        json: { pricing: body, printers: [], company: {} },
      }),
      'GET /api/customers': () => ({
        json: {
          customers: [
            { folder: 'Joey', printCount: 12, deleted: false, noBilling: false, openAmount: 0 },
          ],
        },
      }),
      'PUT /api/customers/Joey/billing': () => ({ status: 204 }),
      'HEAD /api/settings/logo': () => ({ status: 404 }),
      'GET /api/spoolman/status': () => ({
        json: {
          configured: true,
          url: 'http://spoolman.local:7912',
          reachable: true,
          spoolCount: 24,
          lastSync: '2026-10-05T12:05:00.000Z',
        },
      }),
    });
    renderWithAuth(<SettingsPage />, { state: signedIn('Admin'), path: '/instellingen' });
    const markup = await screen.findByLabelText('Standaardmarge');
    expect(markup).toHaveValue('400');
    await userEvent.clear(markup);
    await userEvent.type(markup, '350');
    const pricing = screen.getByRole('region', { name: 'Prijzen' });
    await userEvent.click(within(pricing).getByRole('button', { name: 'Opslaan' }));
    await waitFor(() => {
      expect(calls.find((c) => c.path === '/api/settings/pricing')?.body).toEqual({
        defaultMarkupPercent: 350,
        tariffEurPerKwh: 0.25,
        materialPricesPerKg: {},
      });
    });

    await userEvent.click(await screen.findByRole('switch', { name: 'Niet factureren' }));
    await waitFor(() => {
      expect(calls.find((c) => c.path === '/api/customers/Joey/billing')?.body).toEqual({
        noBilling: true,
      });
    });
    expect(screen.getByText('Verbonden')).toBeInTheDocument();
    expect(screen.getByText(/24 spoelen · laatste sync 14:05/)).toBeInTheDocument();
  });

  it('edits Stroomtarief, Materiaalprijzen and printers (GAP-033)', async () => {
    const printer = {
      key: 'k1max',
      displayName: 'Creality K1 Max',
      aliases: ['K1 Max'],
      videoPrefixes: ['k1max_'],
      watts: 350,
    };
    const calls = stubFetch({
      'GET /api/settings': () => ({
        json: {
          pricing: {
            defaultMarkupPercent: null,
            tariffEurPerKwh: 0.3,
            materialPricesPerKg: { PLA: 22.5 },
          },
          printers: [printer],
          company: { name: '', iban: '', address: '', email: null, phone: null },
        },
      }),
      'PUT /api/settings/pricing': (body) => ({
        json: { pricing: body, printers: [], company: {} },
      }),
      'PUT /api/settings/printers': (body) => ({
        json: { pricing: {}, printers: body, company: {} },
      }),
      'GET /api/customers': () => ({ json: { customers: [] } }),
      'HEAD /api/settings/logo': () => ({ status: 404 }),
      'GET /api/spoolman/status': () => ({ json: { configured: false } }),
    });
    renderWithAuth(<SettingsPage />, { state: signedIn('Admin'), path: '/instellingen' });
    const tariff = await screen.findByLabelText('Stroomtarief');
    expect(tariff).toHaveValue('0,30');
    await userEvent.clear(tariff);
    await userEvent.type(tariff, '0,3x');
    const pricing = screen.getByRole('region', { name: 'Prijzen' });
    await userEvent.click(within(pricing).getByRole('button', { name: 'Materiaal toevoegen' }));
    const names = within(pricing).getAllByRole('textbox', { name: 'Materiaal' });
    await userEvent.type(names[1] as HTMLElement, 'pla');
    await userEvent.click(within(pricing).getByRole('button', { name: 'Opslaan' }));
    expect(within(pricing).getByText('Vul een bedrag in, bijvoorbeeld 0,30.')).toBeInTheDocument();
    expect(within(pricing).getByText('Dit materiaal staat er al.')).toBeInTheDocument();
    expect(calls.some((c) => c.path === '/api/settings/pricing')).toBe(false);

    await userEvent.clear(tariff);
    await userEvent.type(tariff, '0,28');
    await userEvent.clear(names[1] as HTMLElement);
    await userEvent.type(names[1] as HTMLElement, 'PETG');
    await userEvent.type(
      within(pricing).getByRole('textbox', { name: 'Prijs per kg: PETG' }),
      '24',
    );
    await userEvent.click(within(pricing).getByRole('button', { name: 'Opslaan' }));
    await waitFor(() => {
      expect(calls.find((c) => c.path === '/api/settings/pricing')?.body).toEqual({
        defaultMarkupPercent: null,
        tariffEurPerKwh: 0.28,
        materialPricesPerKg: { PLA: 22.5, PETG: 24 },
      });
    });

    const printers = screen.getByRole('region', { name: 'Printers' });
    const watts = within(printers).getByLabelText('Vermogen');
    await userEvent.clear(watts);
    await userEvent.type(watts, '350,5');
    await userEvent.type(
      within(printers).getByRole('textbox', { name: 'Alias toevoegen' }),
      'K1MAX{Enter}',
    );
    await userEvent.click(within(printers).getByRole('button', { name: 'Opslaan' }));
    expect(
      within(printers).getByText('Vul een aantal watt in, bijvoorbeeld 350.'),
    ).toBeInTheDocument();
    await userEvent.clear(watts);
    await userEvent.type(watts, '360');
    await userEvent.click(within(printers).getByRole('button', { name: 'Opslaan' }));
    await waitFor(() => {
      expect(calls.find((c) => c.path === '/api/settings/printers')?.body).toEqual([
        { ...printer, aliases: ['K1 Max', 'K1MAX'], watts: 360 },
      ]);
    });
  });
});
