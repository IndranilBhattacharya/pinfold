import * as React from 'react';
import { afterEach, describe, expect, it } from 'vitest';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { Select } from './select/Select';

afterEach(cleanup);

const many = Array.from({ length: 40 }, (_, i) => `Port ${i + 1}`);

describe('scroll arrows in list popups', () => {
  it('a long list gets two hidden bars; a press scrolls a page and keeps focus on the field', () => {
    render(<Select label="Port" items={many} defaultOpen />);
    const list = screen.getByRole('listbox');
    const bars = list.querySelectorAll('.pinfold-scroll-arrow');
    expect(bars).toHaveLength(2);
    bars.forEach((bar) => expect(bar.getAttribute('aria-hidden')).toBe('true'));
    expect(bars[0].getAttribute('data-dir')).toBe('up');
    expect(bars[1].getAttribute('data-dir')).toBe('down');
    Object.defineProperty(list, 'clientHeight', { configurable: true, value: 200 });
    Object.defineProperty(list, 'scrollHeight', { configurable: true, value: 1200 });
    const field = screen.getByRole('combobox');
    field.focus();
    const down = fireEvent.pointerDown(bars[1]);
    expect(down).toBe(false);
    expect(list.scrollTop).toBeGreaterThan(0);
    expect(document.activeElement).toBe(field);
  });

  it('scrollArrows: false leaves them out', () => {
    render(<Select label="Port" items={many} defaultOpen scrollArrows={false} />);
    expect(screen.getByRole('listbox').querySelector('.pinfold-scroll-arrow')).toBeNull();
  });
});
