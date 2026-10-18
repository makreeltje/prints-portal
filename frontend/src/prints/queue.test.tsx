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
        source: {
          url: 'https://makerworld.com/en/models/38999',
          label: 'makerworld.com/en/models/38999',
        },
        sourceCount: 2,
        note: null,
      },
      {
        id: 'r2',
        name: 'Kabelgoot bureau',
        customerFolder: 'Anouk',
        projectFolder: 'Kabelgoot bureau',
        hasFiles: true,
        waitingDays: 10,
        price: 12.5,
        requestState: 'undecided',
        source: null,
        sourceCount: 0,
        note: 'In zwart printen, de vorige was wit',
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
        source: null,
        sourceCount: 0,
        note: null,
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
    'PUT /api/prints/new/source': () => ({ status: 204 }),
    'PUT /api/prints/new/note': () => ({ status: 204 }),
    'POST /api/requests/r1/link': () => ({ status: 204 }),
    'POST /api/prints/bulk': () => ({ json: { results: [{ id: 'r1', ok: true }] } }),
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
    const without = within(undecided).getByText('waarvan 1 zonder bestanden');
    expect(without).toBeInTheDocument();
    /*
      Both muted lines belong to `.ttl`, not to `.amt`: a sentence in the
      figure slot sized a column the heading shares and left it 109px on a
      phone (GAP-155, 2.12). `.amt` stays, and stays empty.
    */
    expect(without.closest('.ttl')).not.toBeNull();
    const amt = undecided.querySelector('summary .amt');
    expect(amt).not.toBeNull();
    expect(amt?.textContent).toBe('');
    // The age badge is back on this screen, in the words Openstaand uses.
    expect(within(undecided).getByText('oudste 118 dagen').closest('.age')).toBeInTheDocument();

    // The group with nothing missing says nothing about it.
    const inProgress = screen.getByRole('heading', { name: 'Mee bezig' }).closest('details');
    if (!(inProgress instanceof HTMLElement)) throw new Error('group missing');
    expect(within(inProgress).queryByText(/zonder bestanden/)).toBeNull();
    expect(within(inProgress).getByText('1 aanvraag')).toBeInTheDocument();
  });

  it('takes a job off the queue by clearing its status', async () => {
    const { calls } = render({ groups });
    const row = (await screen.findByText('Vitrinekast inzet')).closest('.pp-line');
    if (!(row instanceof HTMLElement)) throw new Error('row missing');
    await userEvent.click(within(row).getByRole('button', { name: 'Uit de wachtrij halen' }));
    await waitFor(() => {
      expect(calls.some((call) => call.path === '/api/prints/bulk')).toBe(true);
    });
    // The same null the detail page writes: nothing new is stored (GAP-159).
    expect(calls.find((call) => call.path === '/api/prints/bulk')?.body).toEqual({
      ids: ['r1'],
      action: 'setRequestState',
      state: null,
    });
  });

  it('escalates the age badge in three steps, with an icon as well as a colour', async () => {
    render({ groups });
    const late = (await screen.findByText('118 dagen geleden gevraagd')).closest('.pp-badge');
    // 7 and 21 days, the owner's own steps for a job waiting (GAP-145).
    const middle = screen.getByText('10 dagen geleden gevraagd').closest('.pp-badge');
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
    await userEvent.type(
      within(dialog).getByRole('textbox', { name: 'Wat is er gevraagd?' }),
      'Lamp voor in de gang',
    );
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

  it('shows a bron only where there are no files, and a note anywhere', async () => {
    render({ groups });
    await screen.findByText('Vitrinekast inzet');
    const fileless = screen.getByText('Vitrinekast inzet').closest('.pp-line');
    const withFiles = screen.getByText('Kabelgoot bureau').closest('.pp-line');
    if (!(fileless instanceof HTMLElement) || !(withFiles instanceof HTMLElement)) {
      throw new Error('lines missing');
    }

    // The bron: the host and path, never the scheme, and the new tab is said
    // out loud in the accessible name rather than left to the icon.
    const link = within(fileless).getByRole('link', {
      name: 'makerworld.com/en/models/38999, opent in een nieuw tabblad',
    });
    expect(link).toHaveAttribute('href', 'https://makerworld.com/en/models/38999');
    expect(link).toHaveAttribute('rel', expect.stringContaining('noopener'));
    expect(link).toHaveTextContent('makerworld.com/en/models/38999');
    // Two brons, one line: the counter stands for the rest.
    expect(within(fileless).getByText('+1')).toBeInTheDocument();

    // With files the row's job is done, so no bron — but the note stays,
    // because the work outlives the arrival of the files.
    expect(
      within(withFiles).queryByRole('link', { name: /opent in een nieuw tabblad/ }),
    ).toBeNull();
    expect(within(withFiles).getByText('In zwart printen, de vorige was wit')).toBeInTheDocument();
    expect(within(fileless).queryByText(/zwart printen/)).toBeNull();
  });

  it('carries a bron and a note straight from "Aanvraag toevoegen"', async () => {
    const stub = render({ groups });
    await userEvent.click(await screen.findByRole('button', { name: 'Aanvraag toevoegen' }));
    const dialog = screen.getByRole('dialog');
    await userEvent.selectOptions(within(dialog).getByRole('combobox'), 'Joey');
    await userEvent.type(
      within(dialog).getByRole('textbox', { name: 'Wat is er gevraagd?' }),
      'Lamp',
    );
    await userEvent.type(
      within(dialog).getByRole('textbox', { name: 'Bron' }),
      'https://printables.com/model/1',
    );
    const boxes = within(dialog).getAllByRole('textbox');
    console.log(
      'NAMES:',
      boxes.map((b) => b.getAttribute('aria-label') ?? b.closest('label')?.textContent),
    );
    await userEvent.type(within(dialog).getByRole('textbox', { name: 'Notitie' }), 'In zwart');
    // The dialog says, where it is typed, that a klant never sees the note.
    expect(
      within(dialog).getByText('Alleen voor jou. Niet zichtbaar op de deel-link.'),
    ).toBeInTheDocument();

    await userEvent.click(within(dialog).getByRole('button', { name: 'Aanvraag toevoegen' }));
    await waitFor(() => {
      expect(stub.calls.some((call) => call.path === '/api/prints/new/note')).toBe(true);
    });
    expect(stub.calls.find((call) => call.path === '/api/prints/new/source')?.body).toEqual({
      url: 'https://printables.com/model/1',
    });
    expect(stub.calls.find((call) => call.path === '/api/prints/new/note')?.body).toEqual({
      note: 'In zwart',
    });
  });

  it('refuses a bron that is not a full link, before anything is sent', async () => {
    const stub = render({ groups });
    await userEvent.click(await screen.findByRole('button', { name: 'Aanvraag toevoegen' }));
    const dialog = screen.getByRole('dialog');
    await userEvent.selectOptions(within(dialog).getByRole('combobox'), 'Joey');
    await userEvent.type(
      within(dialog).getByRole('textbox', { name: 'Wat is er gevraagd?' }),
      'Lamp',
    );
    await userEvent.type(
      within(dialog).getByRole('textbox', { name: 'Bron' }),
      'printables.com/model/1',
    );
    await userEvent.click(within(dialog).getByRole('button', { name: 'Aanvraag toevoegen' }));
    expect(
      within(dialog).getByText('Vul een volledige link in, met https:// ervoor.'),
    ).toBeInTheDocument();
    expect(within(dialog).getByRole('textbox', { name: 'Bron' })).toHaveAttribute(
      'aria-invalid',
      'true',
    );
    expect(stub.calls.some((call) => call.path === '/api/requests')).toBe(false);
  });

  it('has an empty state when nothing is queued', async () => {
    render({ groups: [] });
    expect(await screen.findByText('Niets in de wachtrij')).toBeInTheDocument();
    expect(screen.getByText('Nieuwe aanvragen komen hier te staan.')).toBeInTheDocument();
  });
});
