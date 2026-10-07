import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { useState } from 'react';
import { describe, expect, it } from 'vitest';
import { DatePicker } from './DatePicker';

function Field({ initial = null, min = null }: { initial?: string | null; min?: string | null }) {
  const [value, setValue] = useState<string | null>(initial);
  return (
    <>
      <DatePicker label="Van" value={value} onChange={setValue} min={min} />
      <output>{value ?? 'leeg'}</output>
    </>
  );
}

describe('DatePicker', () => {
  it('accepts a typed d-m-jjjj date and reverts unreadable text', async () => {
    render(<Field />);
    const input = screen.getByLabelText('Van');
    await userEvent.type(input, '5-10-2026{Enter}');
    expect(screen.getByRole('status')).toHaveTextContent('2026-10-05');
    expect(input).toHaveValue('5 okt 2026');
    expect(input).toHaveFocus();
    await userEvent.clear(input);
    await userEvent.type(input, '31-2-2026{Enter}');
    expect(input).toHaveValue('5 okt 2026');
  });

  it('opens with Alt+Down and moves by day, week and month with the keyboard', async () => {
    render(<Field initial="2026-10-05" min="2026-10-01" />);
    const input = screen.getByLabelText('Van');
    input.focus();
    await userEvent.keyboard('{Alt>}{ArrowDown}{/Alt}');
    const popover = screen.getByRole('dialog', { name: 'Kies een datum' });
    const grid = within(popover).getByRole('grid', { name: 'oktober 2026' });
    expect(within(grid).getByRole('gridcell', { name: '5 oktober 2026' })).toHaveFocus();
    expect(within(grid).getByRole('gridcell', { name: '5 oktober 2026' })).toHaveAttribute(
      'aria-selected',
      'true',
    );
    expect(within(grid).getByRole('gridcell', { name: '1 oktober 2026' })).toBeEnabled();
    await userEvent.keyboard('{ArrowRight}{ArrowDown}');
    expect(within(grid).getByRole('gridcell', { name: '13 oktober 2026' })).toHaveFocus();
    await userEvent.keyboard('{PageDown}');
    expect(within(popover).getByRole('gridcell', { name: '13 november 2026' })).toHaveFocus();
    await userEvent.keyboard('{Enter}');
    expect(screen.queryByRole('dialog')).toBeNull();
    expect(screen.getByRole('status')).toHaveTextContent('2026-11-13');
    expect(input).toHaveFocus();
  });

  it('opens from the calendar button, disables days before min and closes with Esc', async () => {
    render(<Field initial="2026-10-05" min="2026-10-03" />);
    const input = screen.getByLabelText('Van');
    // Typing in the field never opens the calendar.
    await userEvent.click(input);
    expect(screen.queryByRole('dialog')).toBeNull();
    const button = screen.getByRole('button', { name: 'Kies een datum' });
    await userEvent.click(button);
    expect(button).toHaveAttribute('aria-expanded', 'true');
    const popover = screen.getByRole('dialog', { name: 'Kies een datum' });
    expect(within(popover).getByRole('gridcell', { name: '2 oktober 2026' })).toBeDisabled();
    expect(within(popover).getByRole('gridcell', { name: '5 oktober 2026' })).toHaveFocus();
    await userEvent.keyboard('{Escape}');
    expect(screen.queryByRole('dialog')).toBeNull();
    expect(input).toHaveFocus();
    await userEvent.click(button);
    await userEvent.click(screen.getByRole('button', { name: 'Wissen' }));
    expect(screen.getByRole('status')).toHaveTextContent('leeg');
  });
});
