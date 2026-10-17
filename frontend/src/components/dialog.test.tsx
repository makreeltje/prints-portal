import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { Dialog } from './Dialog';

/**
 * A backdrop click is reported by a native dialog as a click on the dialog
 * element itself, so the test fires it there (`ds-gap: GAP-147`).
 */
const clickBackdrop = async (dialog: HTMLElement) => {
  await userEvent.click(dialog);
};

describe('Dialog, closing by clicking beside it', () => {
  it('closes a dialog that has nothing to lose', async () => {
    const onClose = vi.fn();
    render(
      <Dialog open title="Alle klanten" footer={null} onClose={onClose}>
        <p>inhoud</p>
      </Dialog>,
    );
    await clickBackdrop(screen.getByRole('dialog'));
    expect(onClose).toHaveBeenCalledOnce();
  });

  it('does not close one holding a form', async () => {
    const onClose = vi.fn();
    render(
      <Dialog open title="Prijs" footer={null} onClose={onClose} onSubmit={() => undefined}>
        <input aria-label="Prijs" />
      </Dialog>,
    );
    await clickBackdrop(screen.getByRole('dialog'));
    expect(onClose).not.toHaveBeenCalled();
  });

  it('does not close a destructive confirmation', async () => {
    const onClose = vi.fn();
    render(
      <Dialog open alert title="Klant verwijderen?" footer={null} onClose={onClose}>
        <p>Dit kan niet ongedaan worden.</p>
      </Dialog>,
    );
    await clickBackdrop(screen.getByRole('alertdialog'));
    expect(onClose).not.toHaveBeenCalled();
  });

  it('leaves a click inside the panel alone', async () => {
    const onClose = vi.fn();
    render(
      <Dialog open title="Alle klanten" footer={null} onClose={onClose}>
        <p>inhoud</p>
      </Dialog>,
    );
    await userEvent.click(screen.getByText('inhoud'));
    expect(onClose).not.toHaveBeenCalled();
  });
});
