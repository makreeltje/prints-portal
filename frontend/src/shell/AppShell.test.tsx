import { screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { renderApp, signedIn } from '../test/render';

const FULL_NAV = [
  'Dashboard',
  'Wachtrij',
  'Openstaand',
  'Facturen',
  'Tags',
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

function backdrop() {
  const element = document.querySelector('.pp-app > .pp-drawer-backdrop');
  if (!(element instanceof HTMLElement)) throw new Error('drawer missing');
  return element;
}

function drawer() {
  const element = backdrop().querySelector('.pp-drawer[role="dialog"]');
  if (!(element instanceof HTMLElement)) throw new Error('drawer missing');
  return element;
}

const isOpen = () => !backdrop().hidden;

function linkLabels(container: HTMLElement) {
  return within(container)
    .getAllByRole('link', { hidden: true })
    .map((link) => link.querySelector('.lbl')?.textContent ?? link.textContent);
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

  it('follows the AppShell markup: .lbl labels, data-tip for the rail, brand initial', () => {
    renderAt('/');
    const link = sidebar().getByRole('link', { name: 'Instellingen' });
    expect(link).toHaveAttribute('data-tip', 'Instellingen');
    expect(link.querySelector('.lbl')).toHaveTextContent('Instellingen');
    expect(document.querySelector('.pp-side .pp-brand .ini')).toHaveTextContent('3');
    expect(document.querySelector('.pp-side .pp-brand .full')).toHaveTextContent(
      '3D Prints Portal',
    );
    // Every part of the shell is a child of .pp-app (one DOM for every size).
    const app = document.querySelector('.pp-app');
    expect(
      [...(app?.children ?? [])].map(
        (child) => `${child.tagName.toLowerCase()}.${child.className}`,
      ),
    ).toEqual([
      'aside.pp-side',
      'header.pp-phone-top',
      'main.pp-main app-main',
      'nav.pp-bottomnav',
      'div.pp-drawer-backdrop',
    ]);
  });

  it('replaces the studio name with the uploaded logo once it has loaded', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn((input: string, init: RequestInit = {}) =>
        Promise.resolve(
          new Response(null, {
            status: input === '/api/settings/logo' && init.method === 'HEAD' ? 200 : 404,
          }),
        ),
      ),
    );
    vi.stubGlobal(
      'Image',
      class {
        onload: (() => void) | null = null;
        set src(_value: string) {
          setTimeout(() => this.onload?.(), 0);
        }
      },
    );
    renderAt('/');
    // The name shows while the logo loads.
    expect(document.querySelector('.pp-phone-top b')).toHaveTextContent('3D Prints Portal');
    await waitFor(() => {
      expect(document.querySelector('.pp-side .pp-brand')).toHaveClass('has-logo');
    });
    const logos = screen.getAllByRole('img', { name: '3D Prints Portal', hidden: true });
    expect(logos.map((logo) => logo.className)).toEqual([
      'logo pp-logo',
      'pp-logo',
      'logo pp-logo',
    ]);
    expect(logos[0]).toHaveAttribute('src', expect.stringMatching(/^\/api\/settings\/logo\?v=/));
    // The icon rail keeps the initial.
    expect(document.querySelector('.pp-side .pp-brand .ini')).toHaveTextContent('3');
    expect(document.querySelector('.pp-phone-top b')).toBeNull();
    vi.unstubAllGlobals();
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
    expect(button).toHaveAccessibleName('Thema: Systeem. Wissel naar Licht.');
    expect(document.documentElement.hasAttribute('data-theme')).toBe(false);

    await user.click(button);
    expect(button).toHaveAccessibleName('Thema: Licht. Wissel naar Donker.');
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
    expect(sidebar().getByRole('button', { name: /^Thema/ })).toHaveAccessibleName(
      'Thema: Donker. Wissel naar Systeem.',
    );
  });
});

describe('phone bars and drawer', () => {
  it('has a bottom bar with Dashboard, Wachtrij, Openstaand and Meer', () => {
    renderAt('/facturen');
    const bar = document.querySelector('nav.pp-bottomnav');
    if (!(bar instanceof HTMLElement)) throw new Error('bottom bar missing');
    expect(
      within(bar)
        .getAllByRole('link')
        .map((link) => link.textContent),
    ).toEqual(['Dashboard', 'Wachtrij', 'Openstaand']);
    /*
      Facturen is not on the bar at 360px (AppShell 2.10): the bar keeps four
      items, Wachtrij takes its slot, and Facturen is reached from Meer.
    */
    expect(within(bar).queryByRole('link', { name: 'Facturen' })).toBeNull();
    expect(within(bar).getByRole('button', { name: 'Meer' })).toBeInTheDocument();
  });

  it('opens the drawer from Meer with the full navigation', async () => {
    const user = userEvent.setup();
    renderAt('/');
    expect(isOpen()).toBe(false);

    const more = screen.getByRole('button', { name: 'Meer' });
    await user.click(more);
    expect(isOpen()).toBe(true);
    expect(drawer()).toHaveAttribute('aria-modal', 'true');
    expect(more).toHaveAttribute('aria-expanded', 'true');
    expect(linkLabels(drawer())).toEqual(FULL_NAV);
    // Focus moves in; the rest of the shell is inert while the drawer is open.
    expect(drawer()).toContainElement(document.activeElement as HTMLElement);
    expect(document.querySelector('main')).toHaveAttribute('inert');
  });

  it('opens from the menu button and closes after navigating', async () => {
    const user = userEvent.setup();
    renderAt('/');
    await user.click(screen.getByRole('button', { name: 'Menu' }));
    expect(isOpen()).toBe(true);

    await user.click(within(drawer()).getByRole('link', { name: 'Instellingen' }));
    expect(isOpen()).toBe(false);
    expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent('Instellingen');
  });

  it('closes with Esc, returns focus to the trigger and can open again', async () => {
    const user = userEvent.setup();
    renderAt('/');
    const more = screen.getByRole('button', { name: 'Meer' });
    await user.click(more);
    await user.keyboard('{Escape}');
    expect(isOpen()).toBe(false);
    expect(more).toHaveAttribute('aria-expanded', 'false');
    expect(more).toHaveFocus();

    await user.click(more);
    expect(isOpen()).toBe(true);
  });

  it('keeps Tab inside the drawer', async () => {
    const user = userEvent.setup();
    renderAt('/');
    await user.click(screen.getByRole('button', { name: 'Meer' }));
    const focusable = drawer().querySelectorAll<HTMLElement>('a[href], button');
    focusable[focusable.length - 1]?.focus();
    await user.tab();
    expect(document.activeElement).toBe(focusable[0]);
    await user.tab({ shift: true });
    expect(document.activeElement).toBe(focusable[focusable.length - 1]);
  });

  it('closes on a backdrop click', async () => {
    const user = userEvent.setup();
    renderAt('/');
    await user.click(screen.getByRole('button', { name: 'Meer' }));
    await user.click(backdrop());
    expect(isOpen()).toBe(false);
  });

  it('opens Meer with the Space key', async () => {
    const user = userEvent.setup();
    renderAt('/');
    screen.getByRole('button', { name: 'Meer' }).focus();
    await user.keyboard(' ');
    expect(isOpen()).toBe(true);
  });
});
