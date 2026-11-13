import * as React from 'react';
import { describe, expect, it, vi } from 'vitest';
import { act, fireEvent, render, screen } from '@testing-library/react';
import { NumberField } from './NumberField';
import { useNumberField } from './useNumberField';
import type { NumberFieldComponent } from './types';

const described = (el: Element) => (el.getAttribute('aria-describedby') ?? '').split(' ').filter(Boolean).map((id) => document.getElementById(id)!.textContent);

describe('NumberField events', () => {
  it('onValueCommit: after a stepper press, Enter, an arrow key release, or leaving after a change; once per value', () => {
    const onValueCommit = vi.fn();
    render(<NumberField label="Qty" defaultValue={1} onValueCommit={onValueCommit} />);
    const box = screen.getByRole('spinbutton');
    fireEvent.click(screen.getByRole('button', { name: 'Increase' }), { detail: 0 });
    expect(onValueCommit).toHaveBeenLastCalledWith(2);
    fireEvent.focus(box);
    fireEvent.change(box, { target: { value: '7' } });
    expect(onValueCommit).toHaveBeenCalledTimes(1);
    fireEvent.keyDown(box, { key: 'Enter' });
    expect(onValueCommit).toHaveBeenLastCalledWith(7);
    fireEvent.blur(box);
    expect(onValueCommit).toHaveBeenCalledTimes(2);
    fireEvent.change(box, { target: { value: '8' } });
    fireEvent.keyUp(box, { key: 'ArrowUp' });
    expect(onValueCommit).toHaveBeenLastCalledWith(8);
  });

  it('a held stepper commits once, on release', () => {
    vi.useFakeTimers();
    const onValueCommit = vi.fn();
    render(<NumberField label="Qty" defaultValue={1} onValueCommit={onValueCommit} />);
    const plus = screen.getByRole('button', { name: 'Increase' });
    fireEvent.pointerDown(plus, { button: 0 });
    act(() => vi.advanceTimersByTime(400 + 60 * 3));
    expect(onValueCommit).not.toHaveBeenCalled();
    fireEvent.pointerUp(plus);
    expect(onValueCommit).toHaveBeenCalledTimes(1);
    expect(onValueCommit.mock.calls[0][0]).toBeGreaterThan(2);
    vi.useRealTimers();
  });

  it('onFocus, onBlur, onKeyDown; custom stepper icons; content as a function of state', () => {
    const calls: string[] = [];
    render(
      <NumberField
        label="Qty"
        defaultValue={3}
        incrementIcon={<b>up</b>}
        decrementIcon={<b>down</b>}
        endContent={(s) => (s.value === 1 ? 'item' : 'items')}
        onFocus={() => calls.push('focus')}
        onBlur={() => calls.push('blur')}
        onKeyDown={(e) => calls.push(e.key)}
      />,
    );
    const box = screen.getByRole('spinbutton');
    fireEvent.focus(box);
    fireEvent.keyDown(box, { key: 'a' });
    fireEvent.blur(box);
    expect(calls).toEqual(['focus', 'a', 'blur']);
    expect(screen.getByText('up')).toBeTruthy();
    expect(screen.getByText('items')).toBeTruthy();
    fireEvent.change(box, { target: { value: '1' } });
    expect(screen.getByText('item')).toBeTruthy();
  });
});

describe('NumberField validation', () => {
  it('validate gets the number; native range messages take overrides', () => {
    render(<NumberField label="Qty" max={5} validate={(v) => (v === 4 ? 'Not 4' : null)} messages={{ max: (el) => `Höchstens ${el.max}` }} />);
    const box = screen.getByRole('spinbutton') as HTMLInputElement;
    fireEvent.change(box, { target: { value: '4' } });
    fireEvent.blur(box);
    expect(described(box)).toEqual(['Not 4']);
    fireEvent.change(box, { target: { value: '9' } });
    fireEvent.blur(box);
    expect(box.getAttribute('aria-invalid')).toBe('true');
    expect(described(box)).toContain('Höchstens 5');
  });

  it('the steppers count as edits; the controller validates', async () => {
    let ctrl!: NumberFieldComponent;
    function Host() {
      const N = useNumberField({ label: 'Qty', defaultValue: 1, validateOn: 'change', validate: (v) => (v !== null && v > 2 ? 'Too many' : null) });
      ctrl = N;
      return <N />;
    }
    render(<Host />);
    const box = screen.getByRole('spinbutton');
    fireEvent.click(screen.getByRole('button', { name: 'Increase' }), { detail: 0 });
    expect(box.getAttribute('aria-invalid')).toBeNull();
    fireEvent.click(screen.getByRole('button', { name: 'Increase' }), { detail: 0 });
    expect(box.getAttribute('aria-invalid')).toBe('true');
    let ok = true;
    await act(async () => {
      ok = await ctrl.validate();
    });
    expect(ok).toBe(false);
    act(() => ctrl.clearError());
    expect(box.getAttribute('aria-invalid')).toBeNull();
  });
});
