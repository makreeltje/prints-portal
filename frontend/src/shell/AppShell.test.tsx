import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router';
import { describe, expect, it } from 'vitest';
import { AppRoutes } from '../App';

function renderAt(path: string) {
  return render(
    <MemoryRouter initialEntries={[path]}>
      <AppRoutes />
    </MemoryRouter>,
  );
}

describe('AppShell', () => {
  it('shows the main navigation in design-system order', () => {
    renderAt('/');
    const nav = screen.getByRole('navigation', { name: 'Hoofdmenu' });
    const labels = within(nav)
      .getAllByRole('link')
      .map((link) => link.textContent);
    expect(labels).toEqual([
      'Dashboard',
      'Openstaand',
      'Facturen',
      'Deel-links',
      'Toegang',
      'Gebruikers',
      'Instellingen',
      'API-docs',
    ]);
    expect(within(nav).getByText('Beheer')).toBeInTheDocument();
  });

  it('marks only the current page and renders its single h1', () => {
    renderAt('/openstaand');
    expect(screen.getByRole('link', { name: 'Openstaand' })).toHaveAttribute(
      'aria-current',
      'page',
    );
    expect(screen.getByRole('link', { name: 'Dashboard' })).not.toHaveAttribute('aria-current');
    expect(screen.getAllByRole('heading', { level: 1 })).toHaveLength(1);
    expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent('Openstaand');
    expect(document.title).toBe('Openstaand · 3D Prints Portal');
  });

  it('offers a skip link to the main content', () => {
    renderAt('/');
    const skip = screen.getByRole('link', { name: 'Naar inhoud' });
    expect(skip).toHaveAttribute('href', '#inhoud');
    expect(document.getElementById('inhoud')?.tagName).toBe('MAIN');
  });

  it('cycles the theme and remembers it per browser', async () => {
    const user = userEvent.setup();
    renderAt('/');
    const button = screen.getByRole('button', { name: /^Thema/ });
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
    expect(screen.getByRole('button', { name: /^Thema/ })).toHaveAccessibleName('Thema: Donker');
  });
});
