import { screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it } from 'vitest';
import { renderWithAuth, signedIn, stubFetch } from '../test/render';
import type { QueueGroup } from './api-queue';
import { QueuePage } from './QueuePage';

const groups: QueueGroup[] = [
  {
    state: 'undecided',
    withoutFiles: 1,
    rows: [
      {
        id: 'r1',
        name: 'Vitrinekast inzet',
        customerFolder: 'Wouter',
        projectFolder: null,
        hasFiles: false,
        waitingDays: 118,
        price: null,
        requestState: 'undecided',
      },
      {
        id: 'r2',
        name: 'Kabelgoot bureau',
        customerFolder: 'Anouk',
        projectFolder: 'Kabelgoot bureau',
        hasFiles: true,
        waitingDays: 40,
        price: 12.5,
        requestState: 'undecided',
      },
    ],
  },
  {
    state: 'inProgress',
    withoutFiles: 0,
    rows: [
      {
        id: 'r3',
        name: 'Babybox locks',
        customerFolder: 'Joey',
        projectFolder: 'Babybox locks',
        hasFiles: true,
        waitingDays: 3,
        price: null,
        requestState: 'inProgress',
      },
    ],
  },
];

const render = (body: { groups: QueueGroup[] }) => {
  const stub = stubFetch({
    'GET /api/queue': () => ({ json: body }),
    'GET /api/customers': () => ({ json: { customers: [{ folder: 'Joey', printCount: 2 }] } }),
    'GET /api/prints': () => ({
      json: { total: 1, items: [{ id: 'p9', name: 'Babybox locks' }] },
    }),
    'POST /api/requests': () => ({ status: 201, json: { id: 'new' } }),
    'POST /api/requests/r1/link': () => ({ status: 204 }),
  });
  renderWithAuth(<QueuePage />, { state: signedIn('Admin') });
  return { calls: stub };
};

describe('Wachtrij', () => {
  it('groups by state, counts them, and names the oldest', async () => {
    render({ groups });
    const undecided = (await screen.findByRole('heading', { name: 'Nog niet besloten' })).closest(
      'details',
    );
    if (!(undecided instanceof HTMLElement)) throw new Error('group missing');
    expect(within(undecided).getByText('2 aanvragen')).toBeInTheDocument();
    expect(within(undecided).getByText('waarvan 1 zonder bestanden')).toBeInTheDocument();

    // The group with nothing missing says nothing about it.
    const inProgress = screen.getByRole('heading', { name: 'Mee bezig' }).closest('details');
    if (!(inProgress instanceof HTMLElement)) throw new Error('group missing');
    expect(within(inProgress).queryByText(/zonder bestanden/)).toBeNull();
    expect(within(inProgress).getByText('1 aanvraag')).toBeInTheDocument();
  });

  it('escalates the age badge in three steps, with an icon as well as a colour', async () => {
    render({ groups });
    const late = (await screen.findByText('118 dagen geleden gevraagd')).closest('.pp-badge');
    const middle = screen.getByText('40 dagen geleden gevraagd').closest('.pp-badge');
    const fresh = screen.getByText('3 dagen geleden gevraagd').closest('.pp-badge');
    expect(late).toHaveClass('unpaid');
    expect(middle).toHaveClass('warning');
    expect(fresh).toHaveClass('neutral');
    expect(late?.querySelector('svg')).toBeInTheDocument();
  });

  it('offers "Bestanden koppelen" only where there are none', async () => {
    render({ groups });
    await screen.findByText('Vitrinekast inzet');
    const fileless = screen.getByText('Vitrinekast inzet').closest('.pp-line');
    const withFiles = screen.getByText('Kabelgoot bureau').closest('.pp-line');
    if (!(fileless instanceof HTMLElement) || !(withFiles instanceof HTMLElement)) {
      throw new Error('lines missing');
    }
    expect(within(fileless).getByText('Nog geen bestanden')).toBeInTheDocument();
    expect(within(fileless).getByRole('button', { name: 'Bestanden koppelen' })).toBeEnabled();
    expect(within(withFiles).queryByRole('button', { name: 'Bestanden koppelen' })).toBeNull();
  });

  it('adds a request with a klant and what was asked', async () => {
    const stub = render({ groups });
    await userEvent.click(await screen.findByRole('button', { name: 'Aanvraag toevoegen' }));
    const dialog = screen.getByRole('dialog');
    // Nothing to save until both are given.
    const save = within(dialog).getByRole('button', { name: 'Aanvraag toevoegen' });
    expect(save).toBeDisabled();
    await userEvent.selectOptions(within(dialog).getByRole('combobox'), 'Joey');
    await userEvent.type(within(dialog).getByRole('textbox'), 'Lamp voor in de gang');
    expect(save).toBeEnabled();
    await userEvent.click(save);
    await waitFor(() => {
      expect(stub.calls.some((call) => call.path === '/api/requests')).toBe(true);
    });
    expect(stub.calls.find((call) => call.path === '/api/requests')?.body).toEqual({
      customer: 'Joey',
      name: 'Lamp voor in de gang',
    });
  });

  it('links a request to a folder that already exists', async () => {
    const stub = render({ groups });
    await userEvent.click(
      (await screen.findAllByRole('button', { name: 'Bestanden koppelen' }))[0] as HTMLElement,
    );
    const dialog = screen.getByRole('dialog');
    expect(
      within(dialog).getByRole('heading', {
        name: 'Bestanden koppelen aan Vitrinekast inzet',
      }),
    ).toBeInTheDocument();
    await userEvent.selectOptions(within(dialog).getByRole('combobox'), 'p9');
    await userEvent.click(within(dialog).getByRole('button', { name: 'Bestanden koppelen' }));
    await waitFor(() => {
      expect(stub.calls.some((call) => call.path === '/api/requests/r1/link')).toBe(true);
    });
    expect(stub.calls.find((call) => call.path === '/api/requests/r1/link')?.body).toEqual({
      printId: 'p9',
    });
  });

  it('has an empty state when nothing is queued', async () => {
    render({ groups: [] });
    expect(await screen.findByText('Niets in de wachtrij')).toBeInTheDocument();
    expect(screen.getByText('Nieuwe aanvragen komen hier te staan.')).toBeInTheDocument();
  });
});
