import { act, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { ApiError } from '../api/client';
import { LOCAL_ONLY, renderApp, renderWithAuth, signedIn } from '../test/render';
import { LoginPage } from './LoginPage';

afterEach(() => {
  vi.useRealTimers();
});

function sidebarLinks() {
  const aside = document.querySelector('aside.pp-side');
  if (!(aside instanceof HTMLElement)) throw new Error('no sidebar');
  return within(aside)
    .getAllByRole('link')
    .map((link) => link.querySelector('.app-nav-label')?.textContent);
}

describe('routing by sign-in state and role', () => {
  it('sends a signed-out visitor to the login page from any path', () => {
    renderApp('/gebruikers', { status: 'signed-out', methods: LOCAL_ONLY });
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
    login: (email: string, password: string) => Promise<void>,
    methods = LOCAL_ONLY,
    path = '/login',
  ) =>
    renderWithAuth(<LoginPage methods={methods} />, {
      state: { status: 'signed-out', methods },
      path,
      auth: { login: vi.fn(login) },
    });

  async function fillAndSubmit() {
    await userEvent.type(screen.getByLabelText('E-mailadres'), 'helper@example.org');
    await userEvent.type(screen.getByLabelText('Wachtwoord'), 'secret{Enter}');
  }

  it('focuses the e-mail field and signs in with Enter', async () => {
    const login = vi.fn(() => Promise.resolve());
    renderLogin(login);
    expect(screen.getByLabelText('E-mailadres')).toHaveFocus();
    expect(screen.getByLabelText('Wachtwoord')).toHaveAttribute('autocomplete', 'current-password');
    await fillAndSubmit();
    expect(login).toHaveBeenCalledWith('helper@example.org', 'secret');
    expect(screen.queryByRole('button', { name: 'Inloggen met Authentik' })).toBeNull();
  });

  it('shows wrong credentials and keeps the e-mail address', async () => {
    renderLogin(() => Promise.reject(new ApiError(401, 'invalid_credentials')));
    await fillAndSubmit();
    expect(await screen.findByRole('alert')).toHaveTextContent(
      'Verkeerd e-mailadres of wachtwoord.',
    );
    expect(screen.getByLabelText('E-mailadres')).toHaveValue('helper@example.org');
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
    expect(screen.queryByLabelText('E-mailadres')).toBeNull();
    expect(screen.queryByText('of')).toBeNull();
    await userEvent.click(screen.getByRole('button', { name: 'Inloggen met Authentik' }));
    expect(assign).toHaveBeenCalledWith('/api/auth/oidc/login');
    expect(screen.getByRole('button', { name: 'Doorsturen naar Authentik…' })).toBeDisabled();
    vi.unstubAllGlobals();
  });

  it('shows both methods with the divider', () => {
    renderLogin(() => Promise.resolve(), { local: true, oidc: true });
    expect(screen.getByLabelText('E-mailadres')).toBeInTheDocument();
    expect(screen.getByText('of')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Inloggen met Authentik' })).toBeInTheDocument();
  });

  it('reports a failed Authentik sign-in', () => {
    renderLogin(() => Promise.resolve(), { local: false, oidc: true }, '/login?error=oidc');
    expect(screen.getByRole('alert')).toHaveTextContent('Er ging iets mis');
  });

  it('enables the button again after the minute', async () => {
    vi.useFakeTimers({ shouldAdvanceTime: true });
    renderLogin(() => Promise.reject(new ApiError(429, null)));
    const user = userEvent.setup({ advanceTimers: (ms) => vi.advanceTimersByTime(ms) });
    await user.type(screen.getByLabelText('E-mailadres'), 'a@example.org');
    await user.type(screen.getByLabelText('Wachtwoord'), 'x{Enter}');
    const button = await screen.findByRole('button', { name: 'Inloggen' });
    expect(button).toBeDisabled();
    act(() => {
      vi.advanceTimersByTime(60_000);
    });
    expect(button).toBeEnabled();
  });
});
