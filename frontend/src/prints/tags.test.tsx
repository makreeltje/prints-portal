import { screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Route, Routes } from 'react-router';
import { describe, expect, it } from 'vitest';
import { renderWithAuth, signedIn, stubFetch } from '../test/render';
import { PrintDetailPage } from './PrintDetailPage';
import { TagsPage } from './TagsPage';
import type { PrintDetail, TagWithCount } from './types';

const cadeau: TagWithCount = {
  id: 't1',
  name: 'cadeau',
  colour: 'lilac',
  ink: null,
  printCount: 4,
};
const kerst: TagWithCount = { id: 't2', name: 'Kerst', colour: null, ink: null, printCount: 1 };

function detail(): PrintDetail {
  return {
    id: 'p1',
    name: 'Babybox locks',
    customerFolder: 'Joey',
    projectFolder: 'Babybox locks',
    material: 'PLA',
    printSeconds: 4800,
    grams: 87,
    printDate: null,
    discoveredAt: '2026-10-01T10:00:00.000Z',
    status: 'indexed',
    deletedAt: null,
    tags: [{ id: 't1', name: 'cadeau', colour: 'lilac', ink: null }],
    hasThumbnail: false,
    colour: null,
    version: 'v1',
    printerModel: null,
    archivedAt: null,
    hasModel: false,
    assets: [],
  };
}

function renderDetail(role: 'Admin' | 'Editor' | 'User' = 'Editor') {
  return renderWithAuth(
    <Routes>
      <Route path="/prints/:id" element={<PrintDetailPage />} />
    </Routes>,
    { state: signedIn(role), path: '/prints/p1' },
  );
}

describe('TagEditor', () => {
  it('searches, toggles tags and creates a new one', async () => {
    const calls = stubFetch({
      'GET /api/prints/p1': () => ({ json: detail() }),
      'GET /api/tags': () => ({ json: { tags: [cadeau, kerst] } }),
      'PUT /api/prints/p1/tags': () => ({ status: 204 }),
      'POST /api/tags': (body) => ({
        status: 201,
        json: { id: 't3', name: (body as { name: string }).name, colour: null, ink: null },
      }),
    });
    renderDetail();
    await userEvent.click(await screen.findByRole('button', { name: 'Tag toevoegen' }));
    const editor = screen.getByRole('dialog', { name: 'Tags bewerken' });
    const search = within(editor).getByRole('searchbox', { name: 'Zoek of maak een tag' });
    await waitFor(() => {
      expect(search).toHaveFocus();
    });
    expect(await within(editor).findByRole('checkbox', { name: 'cadeau' })).toBeChecked();

    await userEvent.click(within(editor).getByRole('checkbox', { name: 'Kerst' }));
    await waitFor(() => {
      expect(calls.find((c) => c.method === 'PUT')?.body).toEqual({ tagIds: ['t1', 't2'] });
    });

    await userEvent.type(search, 'prio');
    expect(within(editor).queryByRole('checkbox')).toBeNull();
    await userEvent.click(within(editor).getByRole('button', { name: "Tag 'prio' maken" }));
    await waitFor(() => {
      expect(calls.find((c) => c.method === 'POST')?.body).toEqual({ name: 'prio', colour: null });
    });
    await waitFor(() => {
      expect(calls.filter((c) => c.method === 'PUT').at(-1)?.body).toEqual({
        tagIds: ['t1', 't3'],
      });
    });
  });

  it('shows the existing tag, not a create row, for a name in another case', async () => {
    stubFetch({
      'GET /api/prints/p1': () => ({ json: detail() }),
      'GET /api/tags': () => ({ json: { tags: [cadeau, kerst] } }),
    });
    renderDetail();
    await userEvent.click(await screen.findByRole('button', { name: 'Tag toevoegen' }));
    const editor = screen.getByRole('dialog', { name: 'Tags bewerken' });
    await within(editor).findByRole('checkbox', { name: 'Kerst' });
    await userEvent.type(within(editor).getByRole('searchbox'), 'kerst');
    expect(within(editor).getByRole('checkbox', { name: 'Kerst' })).toBeInTheDocument();
    expect(within(editor).queryByRole('button', { name: /maken/ })).toBeNull();

    await userEvent.clear(within(editor).getByRole('searchbox'));
    await userEvent.type(within(editor).getByRole('searchbox'), 'x'.repeat(65));
    expect(within(editor).getByText('Een tag mag maximaal 64 tekens hebben.')).toBeInTheDocument();
    expect(within(editor).queryByRole('button', { name: /maken/ })).toBeNull();

    await userEvent.keyboard('{Escape}');
    expect(screen.queryByRole('dialog', { name: 'Tags bewerken' })).toBeNull();
    expect(screen.getByRole('button', { name: 'Tag toevoegen' })).toHaveFocus();
  });

  it('is not offered to Users', async () => {
    stubFetch({ 'GET /api/prints/p1': () => ({ json: { ...detail(), assets: null } }) });
    renderDetail('User');
    await screen.findByRole('heading', { level: 1, name: 'Babybox locks' });
    expect(screen.queryByRole('button', { name: 'Tag toevoegen' })).toBeNull();
  });
});

describe('TagsPage', () => {
  const renderPage = () =>
    renderWithAuth(<TagsPage />, { state: signedIn('Editor'), path: '/tags' });

  it('lists tags with chip and count', async () => {
    stubFetch({ 'GET /api/tags': () => ({ json: { tags: [cadeau, kerst] } }) });
    renderPage();
    expect(await screen.findByText('4 prints')).toBeInTheDocument();
    expect(screen.getByText('1 print')).toBeInTheDocument();
    expect(screen.getByText('cadeau')).toHaveAttribute('data-c', 'lilac');
    expect(
      screen.getByText(
        'Tags zijn voor alle klanten gelijk. Een naam is uniek, hoofdletters tellen niet.',
      ),
    ).toBeInTheDocument();
  });

  it('renames and recolours in place with the palette', async () => {
    const calls = stubFetch({
      'GET /api/tags': () => ({ json: { tags: [cadeau, kerst] } }),
      'PATCH /api/tags/t1': (body) => ({ json: { ...cadeau, ...(body as object) } }),
    });
    renderPage();
    await userEvent.click(await screen.findByRole('button', { name: 'cadeau bewerken' }));
    const name = screen.getByRole('textbox', { name: 'Naam' });
    expect(name).toHaveValue('cadeau');
    const palette = screen.getByRole('radiogroup', { name: 'Kleur' });
    expect(within(palette).getAllByRole('radio')).toHaveLength(11);
    expect(within(palette).getByRole('radio', { name: 'lilac' })).toHaveAttribute(
      'aria-checked',
      'true',
    );

    // Another tag's name in another case is refused before saving.
    await userEvent.clear(name);
    await userEvent.type(name, 'kerst');
    await userEvent.click(screen.getByRole('button', { name: 'Opslaan' }));
    expect(screen.getByText('Deze tag bestaat al.')).toBeInTheDocument();
    expect(name).toHaveAccessibleDescription('Deze tag bestaat al.');

    await userEvent.clear(name);
    await userEvent.type(name, 'Cadeau');
    // Arrow keys move the choice; "Geen kleur" is the last option.
    within(palette).getByRole('radio', { name: 'lilac' }).focus();
    await userEvent.keyboard('{ArrowRight}');
    expect(within(palette).getByRole('radio', { name: 'grey' })).toHaveAttribute(
      'aria-checked',
      'true',
    );
    await userEvent.click(within(palette).getByRole('radio', { name: 'rose' }));
    await userEvent.click(screen.getByRole('button', { name: 'Opslaan' }));
    await waitFor(() => {
      expect(calls.find((c) => c.method === 'PATCH')?.body).toEqual({
        name: 'Cadeau',
        colour: 'rose',
      });
    });
  });

  it('keeps an older free colour when only the name changes', async () => {
    const legacy = { ...kerst, colour: '#e11d48', ink: '#ffffff' };
    const calls = stubFetch({
      'GET /api/tags': () => ({ json: { tags: [legacy] } }),
      'PATCH /api/tags/t2': () => ({ json: legacy }),
    });
    renderPage();
    await userEvent.click(await screen.findByRole('button', { name: 'Kerst bewerken' }));
    await userEvent.type(screen.getByRole('textbox', { name: 'Naam' }), 'boom');
    await userEvent.click(screen.getByRole('button', { name: 'Opslaan' }));
    await waitFor(() => {
      expect(calls.find((c) => c.method === 'PATCH')?.body).toEqual({ name: 'Kerstboom' });
    });
  });

  it('creates a tag and shows the server conflict', async () => {
    const calls = stubFetch({
      'GET /api/tags': () => ({ json: { tags: [] } }),
      'POST /api/tags': () => ({ status: 409, json: { error: 'tag_exists' } }),
    });
    renderPage();
    expect(await screen.findByText('Nog geen tags.')).toBeInTheDocument();
    await userEvent.click(screen.getAllByRole('button', { name: 'Tag maken' })[0] as HTMLElement);
    await userEvent.type(screen.getByRole('textbox', { name: 'Naam' }), 'prio');
    await userEvent.click(screen.getByRole('radio', { name: 'teal' }));
    await userEvent.click(screen.getByRole('button', { name: 'Opslaan' }));
    expect(await screen.findByText('Deze tag bestaat al.')).toBeInTheDocument();
    expect(calls.find((c) => c.method === 'POST')?.body).toEqual({ name: 'prio', colour: 'teal' });
  });

  it('deletes after confirmation', async () => {
    const calls = stubFetch({
      'GET /api/tags': () => ({ json: { tags: [cadeau] } }),
      'DELETE /api/tags/t1': () => ({ status: 204 }),
    });
    renderPage();
    await userEvent.click(await screen.findByRole('button', { name: 'cadeau verwijderen' }));
    const dialog = screen.getByRole('alertdialog', { name: "Tag 'cadeau' verwijderen?" });
    expect(dialog).toHaveAccessibleDescription(
      'De tag wordt van 4 prints verwijderd. De prints zelf blijven bestaan.',
    );
    await userEvent.click(within(dialog).getByRole('button', { name: 'Verwijderen' }));
    await waitFor(() => {
      expect(calls.some((c) => c.method === 'DELETE')).toBe(true);
    });
  });
});
