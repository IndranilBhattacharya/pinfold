import * as React from 'react';
import { describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen } from '@testing-library/react';
import { renderToString } from 'react-dom/server';
import { describePinfoldConformance } from '@pinfold/testing';
import { datepickerMeta } from '@pinfold/core/meta';
import { DatePicker } from './DatePicker';
import { useDatePicker } from './useDatePicker';
import { defineDatePicker } from './define';

const dayButton = (iso: string) => document.querySelector<HTMLButtonElement>(`[data-date="${iso}"]`)!;

describe('DatePicker', () => {
  it('shows the value in the locale; typed text in the locale order becomes the value', () => {
    const onChange = vi.fn();
    render(<DatePicker label="Due" locale="en-GB" defaultValue="2026-11-08" onChange={onChange} />);
    const input = screen.getByRole('textbox', { name: 'Due' }) as HTMLInputElement;
    expect(input.value).toBe('8 Nov 2026');
    fireEvent.change(input, { target: { value: '24/12/2026' } });
    fireEvent.keyDown(input, { key: 'Enter' });
    expect(onChange).toHaveBeenLastCalledWith('2026-12-24');
    expect(input.value).toBe('24 Dec 2026');
  });

  it('text that is not a date says what is expected and links it', () => {
    render(<DatePicker label="Due" locale="en-GB" />);
    const input = screen.getByRole('textbox', { name: 'Due' });
    expect(input.getAttribute('placeholder')).toBe('dd/mm/yyyy');
    fireEvent.change(input, { target: { value: '31/02/2026' } });
    fireEvent.blur(input);
    expect(input.getAttribute('aria-invalid')).toBe('true');
    const message = document.getElementById(input.getAttribute('aria-describedby')!.split(' ').pop()!)!;
    expect(message.textContent).toBe('Enter a date like dd/mm/yyyy.');
  });

  it('the button opens the calendar dialog; a day chosen closes it and returns focus', () => {
    const onChange = vi.fn();
    render(<DatePicker label="Due" locale="en-GB" defaultValue="2026-11-08" onChange={onChange} />);
    const button = screen.getByRole('button', { name: 'Choose a date' });
    expect(button.getAttribute('aria-haspopup')).toBe('dialog');
    fireEvent.click(button);
    screen.getByRole('dialog', { name: 'Due' });
    fireEvent.click(dayButton('2026-11-20'));
    expect(onChange).toHaveBeenLastCalledWith('2026-11-20');
    expect(screen.queryByRole('dialog')).toBeNull();
    expect(document.activeElement).toBe(screen.getByRole('textbox', { name: 'Due' }));
  });

  it('ArrowDown opens with focus on the chosen day; a range submits as start/end', () => {
    const { container } = render(
      <form>
        <DatePicker label="Stay" name="stay" mode="range" locale="en-GB" defaultValue={{ start: '2026-11-08', end: '2026-11-12' }} />
      </form>,
    );
    const input = screen.getByRole('textbox', { name: 'Stay' }) as HTMLInputElement;
    expect(input.value).toBe('8 Nov 2026 – 12 Nov 2026');
    expect(new FormData(container.querySelector('form')!).get('stay')).toBe('2026-11-08/2026-11-12');
    input.focus();
    fireEvent.keyDown(input, { key: 'ArrowDown' });
    expect(document.activeElement!.getAttribute('data-date')).toBe('2026-11-08');
  });

  it('min and max hold typed dates too; renders on the server without the calendar', () => {
    const onChange = vi.fn();
    render(<DatePicker label="Due" locale="en-GB" min="2026-11-01" onChange={onChange} />);
    const input = screen.getByRole('textbox');
    fireEvent.change(input, { target: { value: '01/01/2026' } });
    fireEvent.blur(input);
    expect(onChange).not.toHaveBeenCalled();
    const DateField = defineDatePicker({ variant: 'filled' });
    const html = renderToString(<DateField label="Due" defaultOpen />);
    expect(html).toContain('data-variant="filled"');
    expect(html).not.toContain('role="dialog"');
  });
});

describePinfoldConformance({
  name: 'datepicker',
  slots: ['root', 'label', 'control', 'input', 'trigger'],
  optionalSlots: ['clear', 'popup', 'description', 'error'],
  cssFile: 'packages/css/src/datepicker.css',
  meta: datepickerMeta,
  preset: { define: defineDatePicker as any, props: { label: 'D' } },
  hook: { use: useDatePicker as any, config: { label: 'D' } },
  render: (config) => <DatePicker label="D" locale="en-GB" {...config} />,
});
