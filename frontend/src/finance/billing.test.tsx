import { screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it } from 'vitest';
import { renderWithAuth, signedIn, stubFetch } from '../test/render';
import type { Outstanding } from './billing-api';
import { InvoiceExportDialog } from './InvoiceExportDialog';
import { InvoicesPage } from './InvoicesPage';
import { OutstandingPage } from './OutstandingPage';

const text = (value: string | null) => (value ?? '').replace(/\u00a0/g, ' ');

const outstanding: Outstanding = {
  total: 64.67,
  customers: 2,
  oldest: { printName: 'Telefoonhouder', orderNumber: 1, days: 20 },
  groups: [
    {
      customer: 'Denise',
      total: 24,
      count: 1,
      oldestDays: 20,
      lines: [
        {
          orderId: 'o3',
          orderNumber: 1,
          printId: 'p3',
          printName: 'Telefoonhouder',
          project: 'Telefoonhouder',
          archived: false,
          status: 'open',
          price: 24,
          paid: 0,
          remaining: 24,
          since: '2026-09-16',
          daysOpen: 20,
          invoiceNumber: null,
        },
      ],
    },
    {
      customer: 'Joey',
      total: 40.67,
      count: 2,
      oldestDays: 12,
      lines: [
        {
          orderId: 'o1',
          orderNumber: 1,
          printId: 'p1',
          printName: 'Babybox locks',
          project: 'Babybox locks',
          archived: true,
          status: 'partial',
          price: 11.89,
          paid: 5,
          remaining: 6.89,
          since: '2026-09-24',
          daysOpen: 12,
          invoiceNumber: null,
        },
        {
          orderId: 'o2',
          orderNumber: 1,
          printId: 'p2',
          printName: 'Kerstversiering 2026',
          project: null,
          archived: false,
          status: 'open',
          price: 33.78,
          paid: 0,
          remaining: 33.78,
          since: '2026-09-30',
          daysOpen: 6,
          invoiceNumber: null,
        },
      ],
    },
  ],
};

/** OutstandingGroup 1.9 is a `<details>`: open a klant's group and return it. */
async function openGroup(name: string): Promise<HTMLElement> {
  const group = await screen.findByRole('group', { name });
  const summary = group.querySelector('summary');
  if (summary !== null && !(group as HTMLDetailsElement).open) await userEvent.click(summary);
  return group;
}

describe('OutstandingPage', () => {
  it('shows tiles and groups, and marks a klant paid after confirming', async () => {
    const calls = stubFetch({
      'GET /api/outstanding': () => ({ json: outstanding }),
      'POST /api/outstanding/Joey/mark-paid': () => ({ json: { orders: 2, amount: 40.67 } }),
    });
    renderWithAuth(<OutstandingPage />, { state: signedIn('Editor'), path: '/openstaand' });
    const joey = await openGroup('Joey');
    expect(screen.getAllByText('Totaal openstaand').length).toBeGreaterThan(0);
    expect(screen.getByText('uit 3 prints')).toBeInTheDocument();
    expect(screen.getByText('Telefoonhouder · Denise')).toBeInTheDocument();
    // Oldest klant first; partial lines show the remainder of the price.
    const groups = screen.getAllByRole('group').map((r) => r.getAttribute('aria-labelledby'));
    expect(groups).toHaveLength(2);
    // The count alone since 2.12; the age is the badge's beside it (GAP-154).
    expect(within(joey).getByText('2 prints')).toBeInTheDocument();
    expect(within(joey).getByText('oudste 12 dagen')).toBeInTheDocument();
    expect(text(within(joey).getByText(/^van /).textContent)).toBe('van € 11,89');
    expect(within(joey).getByText('Gearchiveerd')).toBeInTheDocument();
    // Three age steps now (GAP-080): neutral to 30 days, warning to 90, unpaid above.
    expect(within(joey).getAllByText('12 dagen open')[0]?.closest('.pp-badge')).toHaveClass(
      'neutral',
    );
    expect(within(joey).getByRole('link', { name: 'Herinnering (PDF)' })).toHaveAttribute(
      'href',
      '/api/customers/Joey/reminder.pdf',
    );

    await userEvent.click(within(joey).getByRole('button', { name: 'Alles als betaald' }));
    const dialog = screen.getByRole('dialog', {
      name: 'Alles als betaald markeren voor Joey (2 prints)?',
    });
    expect(text(dialog.textContent)).toContain(
      'Het openstaande bedrag van € 40,67 wordt als betaald geregistreerd.',
    );
    await userEvent.click(within(dialog).getByRole('button', { name: 'Alles als betaald' }));
    await waitFor(() => {
      expect(calls.some((c) => c.method === 'POST')).toBe(true);
    });
  });

  it('asks for the amount when marking one line paid, the remainder by default', async () => {
    const calls = stubFetch({
      'GET /api/outstanding': () => ({ json: outstanding }),
      'POST /api/orders/o1/payments': () => ({ json: {} }),
    });
    renderWithAuth(<OutstandingPage />, { state: signedIn('Editor') });
    const joey = await openGroup('Joey');
    const line = within(joey).getByText('Babybox locks').closest('li') as HTMLElement;
    await userEvent.click(within(line).getByRole('button', { name: 'Markeer als betaald' }));
    const dialog = screen.getByRole('dialog', { name: 'Markeer als betaald' });
    expect(within(dialog).getByText('Babybox locks')).toBeInTheDocument();
    const amount = within(dialog).getByLabelText('Betaald bedrag');
    expect(amount).toHaveValue('6,89');
    await userEvent.clear(amount);
    await userEvent.type(amount, '7');
    expect(text(within(dialog).getByText(/kan niet hoger/).textContent)).toBe(
      'Een betaling kan niet hoger zijn dan het openstaande bedrag (€ 6,89).',
    );
    await userEvent.click(within(dialog).getByRole('button', { name: 'Markeer als betaald' }));
    expect(calls.some((c) => c.method === 'POST')).toBe(false);
    await userEvent.clear(amount);
    await userEvent.type(amount, '5');
    await userEvent.click(within(dialog).getByRole('button', { name: 'Markeer als betaald' }));
    await waitFor(() => {
      expect(calls.find((c) => c.method === 'POST')?.body).toEqual({ amount: 5 });
    });
  });

  it('is read-only for Users and says when nothing is open', async () => {
    stubFetch({ 'GET /api/outstanding': () => ({ json: outstanding }) });
    const view = renderWithAuth(<OutstandingPage />, { state: signedIn('User') });
    await openGroup('Joey');
    expect(screen.queryByRole('button')).toBeNull();
    expect(screen.queryByRole('link')).toBeNull();
    view.unmount();

    stubFetch({
      'GET /api/outstanding': () => ({
        json: { total: 0, customers: 0, oldest: null, groups: [] },
      }),
    });
    renderWithAuth(<OutstandingPage />, { state: signedIn('Editor') });
    expect(await screen.findByText('Niets openstaand')).toBeInTheDocument();
    expect(screen.getByText('Alle prints zijn betaald.')).toBeInTheDocument();
  });
});

describe('InvoiceExportDialog', () => {
  const preview = (onlyOpen: boolean) => ({
    lines: onlyOpen ? [{ orderId: 'o1' }] : [{ orderId: 'o1' }, { orderId: 'o2' }],
    total: onlyOpen ? 6.89 : 45.67,
    paid: onlyOpen ? 0 : 5,
    open: onlyOpen ? 6.89 : 40.67,
    excluded: ['Dopje', 'Houder blauw'],
    declined: [],
    earlier: [],
    nextNumber: '2026-008',
    companyReady: true,
  });

  it('says why a print is left out, and never calls a declined one price-less', async () => {
    const many = ['Een', 'Twee', 'Drie', 'Vier', 'Vijf', 'Zes', 'Zeven'];
    stubFetch({
      'GET /api/customers/Joey/invoice/preview': () => ({
        json: { ...preview(false), excluded: ['Dopje'], declined: many },
      }),
    });
    renderWithAuth(<InvoiceExportDialog customer="Joey" onClose={() => undefined} />);

    // The two reasons are different sentences; the declined one is not a warning.
    const declined = await screen.findByText(/niet doorgegaan en worden niet gefactureerd/i);
    expect(declined.closest('.pp-alert')).toBeNull();
    expect(declined.textContent).toContain('7 prints');
    // Five names, then the rest counted: an unbounded list would put 83 in one sentence.
    expect(declined.textContent).toContain('Een, Twee, Drie, Vier, Vijf en 2 andere');
    expect(declined.textContent).not.toContain('Zes');

    // The price-less sentence keeps its warning, and does not claim the declined ones.
    const omitted = screen.getByText(/zonder verkoopprijs is weggelaten/i);
    expect(omitted.closest('.pp-alert')).not.toBeNull();
    expect(omitted.textContent).toContain('1 print');
    expect(omitted.textContent).not.toContain('Een');
  });

  it('previews, downloads a concept and finalises after confirming', async () => {
    const calls = stubFetch({
      'GET /api/customers/Joey/invoice/preview': () => ({ json: preview(false) }),
      'GET /api/customers/Joey/invoice/preview?onlyOpen=true': () => ({ json: preview(true) }),
      'POST /api/customers/Joey/invoices': () => ({
        status: 201,
        json: { id: 'i1', number: '2026-008' },
      }),
    });
    let closed = false;
    renderWithAuth(
      <InvoiceExportDialog
        customer="Joey"
        onClose={() => {
          closed = true;
        }}
      />,
      { state: signedIn('Editor') },
    );
    const dialog = screen.getByRole('dialog', { name: 'Factuur maken voor Joey' });
    expect(await within(dialog).findByText('2')).toBeInTheDocument();
    expect(text(within(dialog).getByText(/45,67/).textContent)).toBe('€ 45,67');
    expect(within(dialog).getByRole('alert')).toHaveTextContent(
      '2 prints zonder verkoopprijs zijn weggelaten: Dopje, Houder blauw.',
    );
    expect(within(dialog).getAllByRole('link', { name: 'Concept downloaden' })[0]).toHaveAttribute(
      'href',
      '/api/customers/Joey/invoice/concept.pdf?onlyOpen=false',
    );

    await userEvent.click(within(dialog).getByRole('checkbox', { name: 'Alleen openstaand' }));
    expect((await within(dialog).findAllByText(/6,89/)).length).toBeGreaterThan(0);
    expect(within(dialog).getByText('1')).toBeInTheDocument();

    await userEvent.click(
      within(dialog).getAllByRole('button', { name: 'Definitief maken' })[0] as HTMLElement,
    );
    const confirm = screen.getByRole('dialog', { name: 'Definitief maken?' });
    expect(text(confirm.textContent)).toContain(
      'Je maakt een factuur voor Joey met 1 prints, totaal € 6,89. De factuur krijgt nummer 2026-008',
    );
    await userEvent.click(within(confirm).getByRole('button', { name: 'Definitief maken' }));
    await waitFor(() => {
      expect(closed).toBe(true);
    });
    expect(calls.find((c) => c.method === 'POST')?.body).toEqual({
      onlyOpen: true,
      expectedTotal: 6.89,
      expectedLines: 1,
    });
  });

  it('sends the period from the date fields and refuses an end before the start', async () => {
    const calls = stubFetch({
      'GET /api/customers/Joey/invoice/preview': () => ({ json: preview(false) }),
    });
    renderWithAuth(<InvoiceExportDialog customer="Joey" onClose={() => undefined} />, {
      state: signedIn('Editor'),
    });
    const dialog = screen.getByRole('dialog', { name: 'Factuur maken voor Joey' });
    await within(dialog).findByText('2');
    expect(
      within(dialog).getByText('De periode werkt op de datum van de bestelling.'),
    ).toBeVisible();
    const from = within(dialog).getByLabelText('Van');
    await userEvent.type(from, '1-9-2026{Enter}');
    await waitFor(() => {
      expect(calls.at(-1)?.path).toBe(
        '/api/customers/Joey/invoice/preview?onlyOpen=false&from=2026-09-01',
      );
    });
    expect(from).toHaveValue('1 sep 2026');
    const to = within(dialog).getByLabelText('Tot en met');
    await userEvent.type(to, '31-8-2026{Enter}');
    expect(await within(dialog).findByText('Kies een datum binnen de periode.')).toBeVisible();
    expect(to).toHaveAttribute('aria-invalid', 'true');
    for (const button of within(dialog).getAllByRole('button', { name: 'Definitief maken' })) {
      expect(button).toBeDisabled();
    }
  });

  it('blocks Definitief maken while the company has no name or IBAN', async () => {
    stubFetch({
      'GET /api/customers/Joey/invoice/preview': () => ({
        json: { ...preview(false), excluded: [], companyReady: false },
      }),
    });
    renderWithAuth(<InvoiceExportDialog customer="Joey" onClose={() => undefined} />, {
      state: signedIn('Admin'),
    });
    const dialog = screen.getByRole('dialog', { name: 'Factuur maken voor Joey' });
    const alert = await within(dialog).findByRole('alert');
    expect(alert).toHaveTextContent('Naam en IBAN ontbreken.');
    expect(within(alert).getByRole('link', { name: 'Naar Instellingen' })).toHaveAttribute(
      'href',
      '/instellingen',
    );
    const finalise = within(dialog).getAllByRole('button', { name: 'Definitief maken' })[0];
    expect(finalise).toHaveAttribute('aria-disabled', 'true');
    await userEvent.click(finalise as HTMLElement);
    expect(screen.queryByRole('dialog', { name: 'Definitief maken?' })).toBeNull();
    expect(
      within(dialog).getAllByRole('link', { name: 'Concept downloaden' }).length,
    ).toBeGreaterThan(0);
  });

  it('disables both actions when there is nothing to invoice', async () => {
    stubFetch({
      'GET /api/customers/Wouter/invoice/preview': () => ({
        json: { ...preview(false), lines: [], total: 0, paid: 0, open: 0, excluded: [] },
      }),
    });
    renderWithAuth(<InvoiceExportDialog customer="Wouter" onClose={() => undefined} />, {
      state: signedIn('Editor'),
    });
    const dialog = screen.getByRole('dialog', { name: 'Factuur maken voor Wouter' });
    expect(await within(dialog).findByText('Geen regels in deze periode.')).toBeInTheDocument();
    for (const button of within(dialog).getAllByRole('button', { name: 'Definitief maken' })) {
      expect(button).toBeDisabled();
    }
    expect(within(dialog).queryByRole('link', { name: 'Concept downloaden' })).toBeNull();
  });
});

describe('InvoicesPage', () => {
  const invoices = [
    {
      id: 'c1',
      number: '2026-009',
      kind: 'credit',
      customer: 'Joey',
      issuedOn: '2026-10-05',
      total: -11.89,
      paid: 0,
      open: 0,
      creditsNumber: '2026-008',
    },
    {
      id: 'i1',
      number: '2026-008',
      kind: 'invoice',
      customer: 'Joey',
      issuedOn: '2026-10-05',
      total: 56.67,
      paid: 16,
      open: 40.67,
      creditsNumber: null,
    },
    {
      id: 'i2',
      number: '2026-007',
      kind: 'invoice',
      customer: 'Wouter',
      issuedOn: '2026-09-28',
      total: 24,
      paid: 0,
      open: 24,
      creditsNumber: null,
    },
  ];

  it('lists, filters and credits chosen lines (Admin)', async () => {
    const calls = stubFetch({
      'GET /api/invoices': () => ({ json: { invoices } }),
      'GET /api/invoices/i1': () => ({
        json: {
          id: 'i1',
          number: '2026-008',
          kind: 'invoice',
          customer: 'Joey',
          issuedOn: '2026-10-05',
          total: 56.67,
          lines: [
            { id: 'l1', description: 'Babybox locks', amount: 11.89, credited: true },
            { id: 'l2', description: 'Kerstversiering 2026', amount: 24.5, credited: false },
            { id: 'l3', description: 'Cable organizer', amount: 9.28, credited: false },
          ],
          creditNotes: [{ id: 'c1', number: '2026-009' }],
          nextNumber: '2026-010',
        },
      }),
      'POST /api/invoices/i1/credit': () => ({
        status: 201,
        json: { id: 'c2', number: '2026-010' },
      }),
    });
    renderWithAuth(<InvoicesPage />, { state: signedIn('Admin'), path: '/facturen' });
    const table = await screen.findByRole('table');
    expect(within(table).getAllByRole('row')).toHaveLength(4);
    expect(within(table).getByText('betreft 2026-008')).toBeInTheDocument();
    expect(text(within(table).getByText(/-11,89/).textContent)).toBe('€ -11,89');
    expect(within(table).getByRole('link', { name: 'Downloaden 2026-008' })).toHaveAttribute(
      'href',
      '/api/invoices/i1/pdf',
    );

    await userEvent.type(screen.getByRole('searchbox', { name: 'Zoeken' }), 'wout');
    expect(within(table).getAllByRole('row')).toHaveLength(2);
    await userEvent.clear(screen.getByRole('searchbox', { name: 'Zoeken' }));
    await userEvent.selectOptions(screen.getByRole('combobox', { name: 'Type' }), 'credit');
    expect(within(table).getAllByRole('row')).toHaveLength(2);
    await userEvent.selectOptions(screen.getByRole('combobox', { name: 'Type' }), '');

    // Only invoices can be credited; lines already credited are not offered.
    const rowFor = (number: string) => within(table).getByText(number).closest('tr') as HTMLElement;
    expect(within(rowFor('2026-009')).queryByRole('button')).toBeNull();
    await userEvent.click(
      within(rowFor('2026-008')).getByRole('button', { name: 'Creditnota maken' }),
    );
    const dialog = screen.getByRole('dialog', { name: 'Creditnota maken voor factuur 2026-008' });
    expect(
      await within(dialog).findByRole('checkbox', { name: 'Kerstversiering 2026' }),
    ).toBeChecked();
    expect(within(dialog).queryByRole('checkbox', { name: 'Babybox locks' })).toBeNull();
    expect(within(dialog).getByText('2026-010')).toBeInTheDocument();
    await userEvent.click(within(dialog).getByRole('checkbox', { name: 'Cable organizer' }));
    expect(text(within(dialog).getByText(/-24,50/).textContent)).toBe('€ -24,50');
    await userEvent.click(within(dialog).getByRole('button', { name: 'Creditnota maken' }));
    await waitFor(() => {
      expect(calls.find((c) => c.method === 'POST')?.body).toEqual({ lineIds: ['l2'] });
    });
  });

  it('offers no credit notes to Editors and shows the empty state', async () => {
    const view = (() => {
      stubFetch({ 'GET /api/invoices': () => ({ json: { invoices } }) });
      return renderWithAuth(<InvoicesPage />, { state: signedIn('Editor') });
    })();
    await screen.findByRole('table');
    expect(screen.queryByRole('button', { name: 'Creditnota maken' })).toBeNull();
    view.unmount();
    stubFetch({ 'GET /api/invoices': () => ({ json: { invoices: [] } }) });
    renderWithAuth(<InvoicesPage />, { state: signedIn('Editor') });
    expect(await screen.findByText('Nog geen facturen')).toBeInTheDocument();
    expect(screen.getByText('Maak een factuur vanaf het dashboard.')).toBeInTheDocument();
  });
});
