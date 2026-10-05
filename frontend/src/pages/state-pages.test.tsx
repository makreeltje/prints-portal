import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { renderWithAuth } from '../test/render';
import { ForbiddenState, GlobalErrorState } from './StatePages';

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
});
