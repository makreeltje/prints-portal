import { screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { makeUser, renderWithAuth, stubFetch } from '../test/render';
import { AccessPage } from './AccessPage';
import { UsersPage } from './UsersPage';

afterEach(() => {
  vi.unstubAllGlobals();
});

const owner = makeUser('Admin', { id: 'u-owner', displayName: 'owner@example.org' });
const helper = makeUser('User', { id: 'u-helper', displayName: 'helper' });
const editor = makeUser('Editor', { id: 'u-editor', displayName: 'Renate', origin: 'oidc' });

function desktopTable() {
  const table = document.querySelector('.pp-only-wide table');
  if (!(table instanceof HTMLElement)) throw new Error('no table');
  return within(table);
}

/** Both layouts are in the DOM; CSS shows one (pp-only-wide above 480px, pp-only-phone below). */
function layout(which: 'wide' | 'phone') {
  const element = document.querySelector(`.pp-only-${which}`);
  if (!(element instanceof HTMLElement)) throw new Error(`no ${which} layout`);
  return within(element);
}

describe('UsersPage', () => {
  it('lists users with role, origin and the last-Admin guard', async () => {
    stubFetch({ 'GET /api/users': () => ({ json: { users: [owner, helper, editor] } }) });
    renderWithAuth(<UsersPage localLogin />);
    const table = await waitFor(desktopTable);
    expect(table.getAllByRole('columnheader').map((th) => th.textContent)).toEqual([
      'Gebruiker',
      'Rol',
      'Herkomst',
      'Acties',
    ]);
    const ownerRole = table.getByRole('combobox', { name: 'Rol owner@example.org' });
    expect(ownerRole).toBeDisabled();
    expect(ownerRole).toHaveAccessibleDescription('Er moet minstens één Admin blijven.');
    expect(table.getByRole('combobox', { name: 'Rol helper' })).toBeEnabled();
    expect(table.getAllByText('Authentik')).toHaveLength(1);
    expect(table.getAllByText('Lokaal')).toHaveLength(2);
    // Wachtwoord resetten for local users only.
    expect(table.getByRole('button', { name: 'Wachtwoord resetten: helper' })).toBeInTheDocument();
    expect(table.queryByRole('button', { name: 'Wachtwoord resetten: Renate' })).toBeNull();
    expect(table.getByRole('button', { name: 'Verwijderen: owner@example.org' })).toHaveAttribute(
      'aria-disabled',
      'true',
    );
  });

  it('saves a role change immediately', async () => {
    const calls = stubFetch({
      'GET /api/users': () => ({ json: { users: [owner, helper] } }),
      'PATCH /api/users/u-helper': () => ({ json: { ...helper, role: 'Editor' } }),
    });
    renderWithAuth(<UsersPage localLogin />);
    const select = await waitFor(() =>
      desktopTable().getByRole('combobox', { name: 'Rol helper' }),
    );
    await userEvent.selectOptions(select, 'Editor');
    await screen.findByText('Opgeslagen');
    expect(calls.at(-1)).toMatchObject({ method: 'PATCH', body: { role: 'Editor' } });
    expect(select).toHaveValue('Editor');
  });

  it('rolls a failed role change back with an error toast', async () => {
    stubFetch({
      'GET /api/users': () => ({ json: { users: [owner, helper] } }),
      'PATCH /api/users/u-helper': () => ({ status: 500, json: { error: 'boom' } }),
    });
    renderWithAuth(<UsersPage localLogin />);
    const select = await waitFor(() =>
      desktopTable().getByRole('combobox', { name: 'Rol helper' }),
    );
    await userEvent.selectOptions(select, 'Admin');
    expect(await screen.findByRole('alert')).toHaveTextContent(
      'Opslaan mislukt, de wijziging is teruggedraaid.',
    );
    expect(select).toHaveValue('User');
  });

  it('deletes a user after confirming, with Annuleren focused first', async () => {
    stubFetch({
      'GET /api/users': () => ({ json: { users: [owner, helper] } }),
      'DELETE /api/users/u-helper': () => ({ status: 204 }),
    });
    renderWithAuth(<UsersPage localLogin />);
    await userEvent.click(
      await waitFor(() => desktopTable().getByRole('button', { name: 'Verwijderen: helper' })),
    );
    const dialog = screen.getByRole('alertdialog', { name: "Gebruiker 'helper' verwijderen?" });
    expect(dialog).toHaveAccessibleDescription('Deze gebruiker kan daarna niet meer inloggen.');
    expect(dialog.querySelector('.pp-dialog.sm')).not.toBeNull();
    expect(within(dialog).getByRole('button', { name: 'Annuleren' })).toHaveFocus();
    await userEvent.click(within(dialog).getByRole('button', { name: 'Verwijderen' }));
    await waitFor(() => {
      expect(desktopTable().queryByText('helper')).toBeNull();
    });
  });

  it('shows an error state with retry when loading fails', async () => {
    let fail = true;
    stubFetch({
      'GET /api/users': () => (fail ? { status: 500 } : { json: { users: [owner] } }),
    });
    renderWithAuth(<UsersPage localLogin />);
    const retry = await screen.findByRole('button', { name: 'Opnieuw proberen' });
    fail = false;
    await userEvent.click(retry);
    await waitFor(desktopTable);
  });
});

describe('UsersPage dialogs', () => {
  it('creates a user with a name, role and temporary password', async () => {
    const calls = stubFetch({
      'GET /api/users': () => ({ json: { users: [owner] } }),
      'POST /api/users': (body) => ({
        status: 201,
        json: makeUser('Editor', { id: 'u-new', displayName: (body as { login: string }).login }),
      }),
    });
    renderWithAuth(<UsersPage localLogin />);
    await userEvent.click(await screen.findByRole('button', { name: 'Gebruiker maken' }));
    const dialog = screen.getByRole('dialog', { name: 'Gebruiker maken' });
    const name = within(dialog).getByLabelText('E-mailadres of naam');
    expect(name).toHaveFocus();
    await userEvent.type(name, 'helper2');
    await userEvent.selectOptions(within(dialog).getByLabelText('Rol'), 'Editor');
    const password = within(dialog).getByLabelText('Tijdelijk wachtwoord');
    expect(password).toHaveAccessibleDescription(
      'Minstens 12 tekens. De gebruiker kiest bij de eerste keer inloggen een eigen wachtwoord.',
    );
    await userEvent.type(password, 'temporary-password{Enter}');
    expect(calls.at(-1)).toMatchObject({
      method: 'POST',
      body: { login: 'helper2', role: 'Editor', password: 'temporary-password' },
    });
    await waitFor(() => {
      expect(desktopTable().getByText('helper2')).toBeInTheDocument();
    });
    expect(screen.queryByRole('dialog', { name: 'Gebruiker maken' })).toBeNull();
  });

  it('shows "user exists" and "too short" as field errors', async () => {
    stubFetch({
      'GET /api/users': () => ({ json: { users: [owner] } }),
      'POST /api/users': () => ({ status: 409, json: { error: 'login_taken' } }),
    });
    renderWithAuth(<UsersPage localLogin />);
    await userEvent.click(await screen.findByRole('button', { name: 'Gebruiker maken' }));
    const dialog = screen.getByRole('dialog', { name: 'Gebruiker maken' });
    await userEvent.type(within(dialog).getByLabelText('E-mailadres of naam'), 'owner@example.org');
    await userEvent.type(within(dialog).getByLabelText('Tijdelijk wachtwoord'), 'short{Enter}');
    expect(within(dialog).getByLabelText('Tijdelijk wachtwoord')).toHaveAccessibleDescription(
      'Kies een wachtwoord van minstens 12 tekens.',
    );
    await userEvent.clear(within(dialog).getByLabelText('Tijdelijk wachtwoord'));
    await userEvent.type(
      within(dialog).getByLabelText('Tijdelijk wachtwoord'),
      'temporary-password{Enter}',
    );
    await waitFor(() => {
      expect(within(dialog).getByLabelText('E-mailadres of naam')).toHaveAccessibleDescription(
        'Deze gebruiker bestaat al.',
      );
    });
  });

  it('hides "Gebruiker maken" when local sign-in is off', async () => {
    stubFetch({ 'GET /api/users': () => ({ json: { users: [owner] } }) });
    renderWithAuth(<UsersPage localLogin={false} />);
    await waitFor(desktopTable);
    expect(screen.queryByRole('button', { name: 'Gebruiker maken' })).toBeNull();
    expect(screen.queryByRole('button', { name: /Wachtwoord resetten/ })).toBeNull();
  });

  it('resets a password with a temporary one typed by the Admin', async () => {
    const calls = stubFetch({
      'GET /api/users': () => ({ json: { users: [owner, helper] } }),
      'POST /api/users/u-helper/password': () => ({ status: 204 }),
    });
    renderWithAuth(<UsersPage localLogin />);
    await userEvent.click(
      await waitFor(() =>
        desktopTable().getByRole('button', { name: 'Wachtwoord resetten: helper' }),
      ),
    );
    const dialog = screen.getByRole('dialog', { name: "Wachtwoord resetten voor 'helper'" });
    const field = within(dialog).getByLabelText('Tijdelijk wachtwoord');
    expect(field).toHaveFocus();
    await userEvent.type(field, 'reset-by-admin-pw');
    await userEvent.click(within(dialog).getByRole('button', { name: 'Opslaan' }));
    expect(calls.at(-1)).toMatchObject({ body: { password: 'reset-by-admin-pw' } });
    expect(await screen.findByText('Opgeslagen')).toBeInTheDocument();
  });
});

describe('AccessPage', () => {
  const matrix = {
    customers: ['Esmee', 'Koen'],
    users: [
      { ...helper, customers: ['Koen'] },
      { ...editor, customers: ['Esmee', 'Koen'] },
      { ...owner, customers: ['Esmee', 'Koen'] },
    ],
  };

  it('shows Users with their grants, and Editors and Admins as always on', async () => {
    stubFetch({ 'GET /api/access': () => ({ json: matrix }) });
    renderWithAuth(<AccessPage />);
    const table = await waitFor(desktopTable);
    expect(table.getByRole('checkbox', { name: 'helper: Koen' })).toBeChecked();
    expect(table.getByRole('checkbox', { name: 'helper: Esmee' })).not.toBeChecked();
    for (const name of ['owner@example.org: Esmee', 'Renate: Esmee']) {
      const cell = table.getByRole('checkbox', { name });
      expect(cell).toBeChecked();
      expect(cell).toBeDisabled();
    }
    expect(
      table.getAllByRole('rowheader').map((th) => th.textContent.replace(/\s+/g, ' ').trim()),
    ).toEqual(['helper', 'Renate · Editor', 'owner@example.org · Admin']);
    expect(layout('wide').getByText('Admin en Editor hebben altijd toegang.')).toBeInTheDocument();
  });

  it('says there is nobody to grant access to when no account has the role User', async () => {
    stubFetch({
      'GET /api/access': () => ({
        json: { customers: ['Esmee', 'Koen'], users: [{ ...editor, customers: [] }] },
      }),
    });
    renderWithAuth(<AccessPage />);
    expect(await screen.findByText('Nog geen gebruikers om toegang te geven')).toBeInTheDocument();
    expect(
      screen.getByText('Alleen Admins en Editors bestaan nu; zij zien altijd elke klant.'),
    ).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Naar Gebruikers' })).toHaveAttribute(
      'href',
      '/gebruikers',
    );
    // No matrix to show, but the rule about Admins and Editors still holds.
    expect(screen.queryByRole('table')).toBeNull();
    expect(screen.getByText('Admin en Editor hebben altijd toegang.')).toBeInTheDocument();
  });

  it('saves a cell immediately', async () => {
    const calls = stubFetch({
      'GET /api/access': () => ({ json: matrix }),
      'PATCH /api/access': () => ({ status: 204 }),
    });
    renderWithAuth(<AccessPage />);
    const cell = await waitFor(() =>
      desktopTable().getByRole('checkbox', { name: 'helper: Esmee' }),
    );
    await userEvent.click(cell);
    expect(cell).toBeChecked();
    expect(calls.at(-1)?.body).toEqual({
      changes: [{ userId: 'u-helper', customerFolder: 'Esmee', granted: true }],
    });
  });

  it('reverts a failed cell and shows a toast', async () => {
    stubFetch({
      'GET /api/access': () => ({ json: matrix }),
      'PATCH /api/access': () => ({ status: 500 }),
    });
    renderWithAuth(<AccessPage />);
    const cell = await waitFor(() =>
      desktopTable().getByRole('checkbox', { name: 'helper: Koen' }),
    );
    await userEvent.click(cell);
    expect(await screen.findByRole('alert')).toHaveTextContent('Opslaan mislukt');
    expect(cell).toBeChecked();
  });

  it('grants a whole column from its menu', async () => {
    const calls = stubFetch({
      'GET /api/access': () => ({ json: matrix }),
      'PATCH /api/access': () => ({ status: 204 }),
    });
    renderWithAuth(<AccessPage />);
    // The column menu is named per klant since 2.0, so two menus on one screen
    // are told apart (GAP-098).
    const menu = await waitFor(() =>
      desktopTable().getByRole('button', { name: 'Kolomacties voor Esmee' }),
    );
    await userEvent.click(menu);
    // The cell carries has-pop while the menu is open, or the sticky first
    // column paints over the panel.
    expect(menu.closest('th')).toHaveClass('has-pop');
    const select = screen.getByRole('button', { name: 'Alles selecteren' });
    expect(select).toHaveFocus();
    await userEvent.click(select);
    expect(calls.at(-1)?.body).toEqual({
      changes: [{ userId: 'u-helper', customerFolder: 'Esmee', granted: true }],
    });
  });

  it('moves between cells with the arrow keys', async () => {
    stubFetch({ 'GET /api/access': () => ({ json: matrix }) });
    renderWithAuth(<AccessPage />);
    const first = await waitFor(() =>
      desktopTable().getByRole('checkbox', { name: 'helper: Esmee' }),
    );
    first.focus();
    await userEvent.keyboard('{ArrowRight}');
    expect(desktopTable().getByRole('checkbox', { name: 'helper: Koen' })).toHaveFocus();
  });
});

describe('phone cards', () => {
  it('shows one card per user with a labelled role select and the actions', async () => {
    stubFetch({ 'GET /api/users': () => ({ json: { users: [owner, helper, editor] } }) });
    renderWithAuth(<UsersPage localLogin />);
    await waitFor(desktopTable);
    const phone = layout('phone');
    expect(phone.getAllByLabelText('Rol')).toHaveLength(3);
    expect(phone.getByRole('combobox', { name: 'Rol owner@example.org' })).toBeDisabled();
    expect(phone.getByRole('button', { name: 'Verwijderen: helper' })).toHaveTextContent(
      'Verwijderen',
    );
    expect(phone.getByRole('button', { name: 'Wachtwoord resetten: helper' })).toBeInTheDocument();
    expect(phone.queryByRole('button', { name: 'Wachtwoord resetten: Renate' })).toBeNull();
  });

  it('changes a role from a card', async () => {
    const calls = stubFetch({
      'GET /api/users': () => ({ json: { users: [owner, helper] } }),
      'PATCH /api/users/u-helper': () => ({ json: { ...helper, role: 'Editor' } }),
    });
    renderWithAuth(<UsersPage localLogin />);
    await waitFor(desktopTable);
    await userEvent.selectOptions(
      layout('phone').getByRole('combobox', { name: 'Rol helper' }),
      'Editor',
    );
    expect(calls.at(-1)).toMatchObject({ method: 'PATCH', body: { role: 'Editor' } });
  });

  it('shows access as one card per user with klant checkboxes', async () => {
    const calls = stubFetch({
      'GET /api/access': () => ({
        json: {
          customers: ['Esmee', 'Koen'],
          users: [
            { ...helper, customers: ['Koen'] },
            { ...editor, customers: ['Esmee', 'Koen'] },
          ],
        },
      }),
      'PATCH /api/access': () => ({ status: 204 }),
    });
    renderWithAuth(<AccessPage />);
    await waitFor(desktopTable);
    const phone = layout('phone');
    expect(phone.getByRole('checkbox', { name: 'Renate: Esmee' })).toBeDisabled();
    const cell = phone.getByRole('checkbox', { name: 'helper: Esmee' });
    await userEvent.click(cell);
    expect(calls.at(-1)?.body).toEqual({
      changes: [{ userId: 'u-helper', customerFolder: 'Esmee', granted: true }],
    });
    expect(phone.getByText('Admin en Editor hebben altijd toegang.')).toBeInTheDocument();
  });
});
