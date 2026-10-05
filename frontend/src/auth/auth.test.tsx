import { act, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { ApiError } from '../api/client';
import { LOCAL_ONLY, renderApp, renderWithAuth, signedIn } from '../test/render';
import { LoginPage } from './LoginPage';
import { NewPasswordPage } from './NewPasswordPage';

afterEach(() => {
  vi.useRealTimers();
});

function sidebarLinks() {
  const aside = document.querySelector('aside.pp-side');
  if (!(aside instanceof HTMLElement)) throw new Error('no sidebar');
  return within(aside)
    .getAllByRole('link')
    .map((link) => link.querySelector('.lbl')?.textContent);
}

describe('routing by sign-in state and role', () => {
  it('sends a signed-out visitor to the login page from any path', () => {
    renderApp('/gebruikers', { status: 'signed-out', methods: LOCAL_ONLY, expired: false });
    expect(screen.getByRole('heading', { level: 1, name: 'Inloggen' })).toBeInTheDocument();
    expect(document.querySelector('aside')).toBeNull();
  });

  it.each([
    ['User', ['Dashboard', 'Openstaand', 'API-docs']],
    ['Editor', ['Dashboard', 'Openstaand', 'Facturen', 'API-docs']],
    [
      'Admin',
      [
        'Dashboard',
        'Openstaand',
        'Facturen',
        'Deel-links',
        'Toegang',
        'Gebruikers',
        'Instellingen',
        'API-docs',
      ],
    ],
  ] as const)('shows a %s only their navigation', (role, expected) => {
    renderApp('/', signedIn(role));
    expect(sidebarLinks()).toEqual(expected);
    const aside = document.querySelector('aside.pp-side') as HTMLElement;
    expect(within(aside).queryAllByText('Beheer')).toHaveLength(role === 'Admin' ? 1 : 0);
  });

  it.each(['/gebruikers', '/toegang', '/instellingen', '/deel-links', '/facturen'])(
    'sends a User away from %s',
    (path) => {
      renderApp(path, signedIn('User'));
      expect(screen.getByRole('heading', { level: 1, name: 'Dashboard' })).toBeInTheDocument();
    },
  );

  it('shows the user badge and signs out', async () => {
    const { auth } = renderApp('/', signedIn('Editor'));
    const aside = document.querySelector('aside.pp-side') as HTMLElement;
    expect(within(aside).getByText('editor@example.org')).toBeInTheDocument();
    expect(within(aside).getByText('Editor')).toBeInTheDocument();
    await userEvent.click(within(aside).getByRole('button', { name: 'Uitloggen' }));
    expect(auth.logout).toHaveBeenCalledOnce();
  });
});

describe('LoginPage', () => {
  const renderLogin = (
    login: (name: string, password: string) => Promise<void>,
    methods = LOCAL_ONLY,
    path = '/login',
    expired = false,
  ) =>
    renderWithAuth(<LoginPage methods={methods} expired={expired} />, {
      state: { status: 'signed-out', methods, expired },
      path,
      auth: { login: vi.fn(login) },
    });

  async function fillAndSubmit() {
    await userEvent.type(screen.getByLabelText('E-mailadres of naam'), 'helper@example.org');
    await userEvent.type(screen.getByLabelText('Wachtwoord'), 'secret{Enter}');
  }

  it('focuses the e-mail field and signs in with Enter', async () => {
    const login = vi.fn(() => Promise.resolve());
    renderLogin(login);
    expect(screen.getByLabelText('E-mailadres of naam')).toHaveFocus();
    expect(screen.getByLabelText('Wachtwoord')).toHaveAttribute('autocomplete', 'current-password');
    await fillAndSubmit();
    expect(login).toHaveBeenCalledWith('helper@example.org', 'secret');
    expect(screen.queryByRole('button', { name: 'Inloggen met Authentik' })).toBeNull();
  });

  it('shows wrong credentials and keeps the e-mail address', async () => {
    renderLogin(() => Promise.reject(new ApiError(401, 'invalid_credentials')));
    await fillAndSubmit();
    expect(await screen.findByRole('alert')).toHaveTextContent(
      'Verkeerd e-mailadres, naam of wachtwoord.',
    );
    expect(screen.getByLabelText('E-mailadres of naam')).toHaveValue('helper@example.org');
    expect(screen.getByLabelText('Wachtwoord')).toHaveValue('');
  });

  it('disables the button for a minute after too many attempts', async () => {
    renderLogin(() => Promise.reject(new ApiError(429, null)));
    await fillAndSubmit();
    expect(await screen.findByRole('alert')).toHaveTextContent('Te veel pogingen');
    const button = screen.getByRole('button', { name: 'Inloggen' });
    expect(button).toBeDisabled();
  });

  it('offers only Authentik when local login is off', async () => {
    const assign = vi.fn();
    vi.stubGlobal('location', { assign });
    renderLogin(() => Promise.resolve(), { local: false, oidc: true });
    expect(screen.queryByLabelText('E-mailadres of naam')).toBeNull();
    expect(screen.queryByText('of')).toBeNull();
    await userEvent.click(screen.getByRole('button', { name: 'Inloggen met Authentik' }));
    expect(assign).toHaveBeenCalledWith('/api/auth/oidc/login');
    expect(screen.getByRole('button', { name: 'Doorsturen naar Authentik…' })).toBeDisabled();
    vi.unstubAllGlobals();
  });

  it('shows both methods with the divider', () => {
    renderLogin(() => Promise.resolve(), { local: true, oidc: true });
    expect(screen.getByLabelText('E-mailadres of naam')).toBeInTheDocument();
    expect(screen.getByText('of')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Inloggen met Authentik' })).toBeInTheDocument();
  });

  it('reports a failed Authentik sign-in', () => {
    renderLogin(() => Promise.resolve(), { local: false, oidc: true }, '/login?error=oidc');
    expect(screen.getByRole('alert')).toHaveTextContent(
      'Inloggen met Authentik is mislukt. Probeer het opnieuw.',
    );
  });

  it('says when the session ended', () => {
    renderLogin(() => Promise.resolve(), LOCAL_ONLY, '/login', true);
    expect(
      screen.getByText('Je sessie is verlopen. Log opnieuw in.').closest('.pp-alert'),
    ).toHaveAttribute('role', 'status');
  });

  it('accepts a plain name as well as an e-mail address', async () => {
    const login = vi.fn(() => Promise.resolve());
    renderLogin(login);
    const field = screen.getByLabelText('E-mailadres of naam');
    expect(field).toHaveAttribute('type', 'text');
    expect(field).toHaveAttribute('autocomplete', 'username');
    await userEvent.type(field, 'helper2');
    await userEvent.type(screen.getByLabelText('Wachtwoord'), 'secret{Enter}');
    expect(login).toHaveBeenCalledWith('helper2', 'secret');
  });

  it('enables the button again after the minute', async () => {
    vi.useFakeTimers({ shouldAdvanceTime: true });
    renderLogin(() => Promise.reject(new ApiError(429, null)));
    const user = userEvent.setup({ advanceTimers: (ms) => vi.advanceTimersByTime(ms) });
    await user.type(screen.getByLabelText('E-mailadres of naam'), 'a@example.org');
    await user.type(screen.getByLabelText('Wachtwoord'), 'x{Enter}');
    const button = await screen.findByRole('button', { name: 'Inloggen' });
    expect(button).toBeDisabled();
    act(() => {
      vi.advanceTimersByTime(60_000);
    });
    expect(button).toBeEnabled();
  });
});

describe('NewPasswordPage', () => {
  const signedInTemporary = () => ({ ...signedIn('User'), mustChangePassword: true });

  it('replaces every page until a new password is chosen', () => {
    renderApp('/gebruikers', signedInTemporary());
    expect(
      screen.getByRole('heading', { level: 1, name: 'Nieuw wachtwoord kiezen' }),
    ).toBeInTheDocument();
    expect(document.querySelector('aside')).toBeNull();
    expect(screen.getByLabelText('Nieuw wachtwoord')).toHaveFocus();
    expect(screen.getByLabelText('Nieuw wachtwoord')).toHaveAccessibleDescription(
      'Minstens 12 tekens.',
    );
  });

  it('checks length and repetition before saving', async () => {
    const changePassword = vi.fn(() => Promise.resolve());
    renderWithAuth(<NewPasswordPage />, { state: signedInTemporary(), auth: { changePassword } });
    await userEvent.type(screen.getByLabelText('Nieuw wachtwoord'), 'short');
    await userEvent.type(screen.getByLabelText('Herhaal wachtwoord'), 'other{Enter}');
    expect(screen.getByLabelText('Nieuw wachtwoord')).toHaveAccessibleDescription(
      'Kies een wachtwoord van minstens 12 tekens.',
    );
    expect(screen.getByLabelText('Herhaal wachtwoord')).toHaveAccessibleDescription(
      'De wachtwoorden zijn niet gelijk.',
    );
    expect(changePassword).not.toHaveBeenCalled();

    await userEvent.clear(screen.getByLabelText('Nieuw wachtwoord'));
    await userEvent.clear(screen.getByLabelText('Herhaal wachtwoord'));
    await userEvent.type(screen.getByLabelText('Nieuw wachtwoord'), 'my-own-long-password');
    await userEvent.type(screen.getByLabelText('Herhaal wachtwoord'), 'my-own-long-password');
    await userEvent.click(screen.getByRole('button', { name: 'Opslaan' }));
    expect(changePassword).toHaveBeenCalledWith('my-own-long-password');
  });

  it('can sign out instead', async () => {
    const { auth } = renderWithAuth(<NewPasswordPage />, { state: signedInTemporary() });
    await userEvent.click(screen.getByRole('button', { name: 'Uitloggen' }));
    expect(auth.logout).toHaveBeenCalledOnce();
  });
});
