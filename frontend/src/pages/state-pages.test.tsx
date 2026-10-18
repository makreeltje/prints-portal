import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { LiveContext, type LiveStatus } from '../prints/live-context';
import { renderWithAuth } from '../test/render';
import { FirstRunState } from './FirstRunState';
import { OfflineBanner } from './OfflineBanner';
import { ForbiddenState, GlobalErrorState } from './StatePages';

const live = (status: LiveStatus) => (
  <LiveContext.Provider value={{ status, flashing: new Set(), doneFlashing: () => undefined }}>
    <OfflineBanner />
  </LiveContext.Provider>
);

describe('state pages', () => {
  it('shows the 403 state with a way back to the dashboard', () => {
    renderWithAuth(<ForbiddenState />);
    expect(
      screen.getByRole('heading', { level: 1, name: 'Geen toegang tot deze klant' }),
    ).toBeInTheDocument();
    expect(
      screen.getByText('Je hebt geen toegang tot deze klant. Vraag een beheerder om toegang.'),
    ).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Naar dashboard' })).toHaveAttribute('href', '/');
    expect(document.querySelector('.pp-state')).not.toBeNull();
  });

  it('shows the global error with retry', async () => {
    const onRetry = vi.fn();
    renderWithAuth(<GlobalErrorState onRetry={onRetry} />);
    expect(screen.getByRole('heading', { level: 1, name: 'Er ging iets mis' })).toBeInTheDocument();
    await userEvent.click(screen.getByRole('button', { name: 'Opnieuw proberen' }));
    expect(onRetry).toHaveBeenCalledOnce();
    expect(screen.getByRole('link', { name: 'Naar dashboard' })).toBeInTheDocument();
  });

  it('shows the first run page with the folder convention', async () => {
    const onReindex = vi.fn();
    renderWithAuth(<FirstRunState onReindex={onReindex} />);
    expect(screen.getByRole('heading', { level: 1, name: 'Nog geen prints' })).toBeInTheDocument();
    expect(
      screen.getByText(
        'Zet je bestanden in mappen per klant en project, en start daarna een index.',
      ),
    ).toBeInTheDocument();
    // The diagram names the two folder levels the indexer expects.
    expect(screen.getByText('klant')).toBeInTheDocument();
    expect(screen.getByText('project')).toBeInTheDocument();
    expect(document.querySelector('.pp-tree')?.textContent).toContain('Bloembak_clips.gcode');
    await userEvent.click(screen.getByRole('button', { name: 'Opnieuw indexeren' }));
    expect(onReindex).toHaveBeenCalledOnce();
  });

  it('offers no index button to a role that may not start one', () => {
    renderWithAuth(<FirstRunState />);
    expect(screen.queryByRole('button', { name: 'Opnieuw indexeren' })).toBeNull();
  });

  it('shows the offline bar only while the connection is down', () => {
    const view = renderWithAuth(live('live'));
    expect(screen.queryByText(/Verbinding verbroken/)).toBeNull();
    view.unmount();

    renderWithAuth(live('reconnecting'));
    const bar = document.querySelector('.pp-alert.banner');
    expect(bar).toHaveTextContent('Verbinding verbroken — opnieuw verbinden…');
    expect(bar).toHaveClass('warning');
    // Announced, not just drawn.
    expect(bar).toHaveAttribute('role', 'status');
  });

  it('stays quiet while the first connection is still being made', () => {
    renderWithAuth(live('connecting'));
    expect(screen.queryByText(/Verbinding verbroken/)).toBeNull();
    expect(document.querySelector('.pp-alert.banner')).toBeNull();
  });
});
