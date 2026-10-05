import { act, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it } from 'vitest';
import { renderApp, signedIn } from '../test/render';

const FULL_NAV = [
  'Dashboard',
  'Openstaand',
  'Facturen',
  'Deel-links',
  'Toegang',
  'Gebruikers',
  'Instellingen',
  'API-docs',
];

function renderAt(path: string) {
  return renderApp(path, signedIn('Admin'));
}

/** Sidebar, phone bottom bar and drawer all render; CSS decides which is visible. */
function sidebar() {
  const aside = document.querySelector('aside.pp-side');
  if (!(aside instanceof HTMLElement)) throw new Error('sidebar missing');
  return within(aside);
}

function drawer() {
  const dialog = document.querySelector('dialog.app-drawer');
  if (!(dialog instanceof HTMLDialogElement)) throw new Error('drawer missing');
  return dialog;
}

function linkLabels(container: HTMLElement) {
  return within(container)
    .getAllByRole('link', { hidden: true })
    .map((link) => link.querySelector('.app-nav-label')?.textContent ?? link.textContent);
}

describe('AppShell sidebar', () => {
  it('shows the main navigation in design-system order', () => {
    renderAt('/');
    const nav = sidebar().getByRole('navigation', { name: 'Hoofdmenu' });
    expect(linkLabels(nav)).toEqual(FULL_NAV);
    expect(within(nav).getByText('Beheer')).toBeInTheDocument();
  });

  it('marks only the current page and renders its single h1', () => {
    renderAt('/openstaand');
    expect(sidebar().getByRole('link', { name: 'Openstaand' })).toHaveAttribute(
      'aria-current',
      'page',
    );
    expect(sidebar().getByRole('link', { name: 'Dashboard' })).not.toHaveAttribute('aria-current');
    expect(screen.getAllByRole('heading', { level: 1 })).toHaveLength(1);
    expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent('Openstaand');
    expect(document.title).toBe('Openstaand · 3D Prints Portal');
  });

  it('keeps the link name when the tablet rail hides the label', () => {
    renderAt('/');
    const link = sidebar().getByRole('link', { name: 'Instellingen' });
    expect(link.querySelector('.app-rail-tip')).toHaveAttribute('aria-hidden', 'true');
  });

  it('offers a skip link to the main content', () => {
    renderAt('/');
    const skip = screen.getByRole('link', { name: 'Naar inhoud' });
    expect(skip).toHaveAttribute('href', '#inhoud');
    expect(document.getElementById('inhoud')?.tagName).toBe('MAIN');
  });
});

describe('theme switch', () => {
  it('cycles the theme and remembers it per browser', async () => {
    const user = userEvent.setup();
    renderAt('/');
    const button = sidebar().getByRole('button', { name: /^Thema/ });
    expect(button).toHaveAccessibleName('Thema: Systeem');
    expect(document.documentElement.hasAttribute('data-theme')).toBe(false);

    await user.click(button);
    expect(button).toHaveAccessibleName('Thema: Licht');
    expect(document.documentElement.dataset.theme).toBe('light');
    expect(window.localStorage.getItem('prints-portal.theme')).toBe('light');

    await user.click(button);
    expect(document.documentElement.dataset.theme).toBe('dark');

    await user.click(button);
    expect(document.documentElement.hasAttribute('data-theme')).toBe(false);
    expect(window.localStorage.getItem('prints-portal.theme')).toBeNull();
  });

  it('starts from the stored theme', () => {
    window.localStorage.setItem('prints-portal.theme', 'dark');
    renderAt('/');
    expect(document.documentElement.dataset.theme).toBe('dark');
    expect(sidebar().getByRole('button', { name: /^Thema/ })).toHaveAccessibleName('Thema: Donker');
  });
});

describe('phone bars and drawer', () => {
  it('has a bottom bar with Dashboard, Openstaand, Facturen and Meer', () => {
    renderAt('/facturen');
    const bar = document.querySelector('nav.app-bottomnav');
    if (!(bar instanceof HTMLElement)) throw new Error('bottom bar missing');
    expect(
      within(bar)
        .getAllByRole('link')
        .map((link) => link.textContent),
    ).toEqual(['Dashboard', 'Openstaand', 'Facturen']);
    expect(within(bar).getByRole('link', { name: 'Facturen' })).toHaveAttribute(
      'aria-current',
      'page',
    );
    expect(within(bar).getByRole('button', { name: 'Meer' })).toBeInTheDocument();
  });

  it('opens the drawer from Meer with the full navigation', async () => {
    const user = userEvent.setup();
    renderAt('/');
    expect(drawer().open).toBe(false);

    const more = screen.getByRole('button', { name: 'Meer' });
    await user.click(more);
    expect(drawer().open).toBe(true);
    expect(more).toHaveAttribute('aria-expanded', 'true');
    expect(linkLabels(drawer())).toEqual(FULL_NAV);
  });

  it('opens from the menu button and closes after navigating', async () => {
    const user = userEvent.setup();
    renderAt('/');
    await user.click(screen.getByRole('button', { name: 'Menu' }));
    expect(drawer().open).toBe(true);

    await user.click(within(drawer()).getByRole('link', { name: 'Instellingen' }));
    expect(drawer().open).toBe(false);
    expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent('Instellingen');
  });

  it('closes when the browser closes the dialog (Esc) and can open again', async () => {
    const user = userEvent.setup();
    renderAt('/');
    await user.click(screen.getByRole('button', { name: 'Meer' }));
    act(() => {
      drawer().close();
    });
    expect(screen.getByRole('button', { name: 'Meer' })).toHaveAttribute('aria-expanded', 'false');

    await user.click(screen.getByRole('button', { name: 'Meer' }));
    expect(drawer().open).toBe(true);
  });

  it('closes on a backdrop click', async () => {
    const user = userEvent.setup();
    renderAt('/');
    await user.click(screen.getByRole('button', { name: 'Meer' }));
    await user.click(drawer());
    expect(drawer().open).toBe(false);
  });

  it('opens Meer with the Space key', async () => {
    const user = userEvent.setup();
    renderAt('/');
    screen.getByRole('button', { name: 'Meer' }).focus();
    await user.keyboard(' ');
    expect(drawer().open).toBe(true);
  });
});
