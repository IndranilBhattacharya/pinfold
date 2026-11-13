import * as React from 'react';
import { describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen } from '@testing-library/react';
import { inactiveRatingOptions, ratingFromPointer } from '@pinfold/core';
import { Rating } from './Rating';

/** A row of symbols 100px wide in jsdom. */
function lay(container: HTMLElement) {
  const row = container.querySelector<HTMLElement>('.pinfold-rating__symbols')!;
  row.getBoundingClientRect = () => ({ left: 0, top: 0, width: 100, height: 20, right: 100, bottom: 20, x: 0, y: 0, toJSON: () => ({}) });
  return row;
}

describe('Rating: half steps, words, icons per state, onHover', () => {
  it('half steps: the pointer picks halves (and RTL mirrors them); the radios step by halves', () => {
    expect(ratingFromPointer(25, 100, 5, true)).toBe(1.5);
    expect(ratingFromPointer(29, 100, 5, true)).toBe(1.5);
    expect(ratingFromPointer(31, 100, 5, true)).toBe(2);
    expect(ratingFromPointer(25, 100, 5, true, true)).toBe(4);
    const onChange = vi.fn();
    const { container } = render(<Rating label="Score" allowHalf onChange={onChange} />);
    const row = lay(container);
    fireEvent.click(row, { clientX: 65, detail: 1 });
    expect(onChange).toHaveBeenLastCalledWith(3.5);
    expect([...container.querySelectorAll('[data-fill]')].map((s) => s.getAttribute('data-fill'))).toEqual(['1', '1', '1', '0.5', '0']);
    expect(screen.getAllByRole('radio').map((r) => (r as HTMLInputElement).value)).toEqual(['0.5', '1', '1.5', '2', '2.5', '3', '3.5', '4', '4.5', '5']);
    fireEvent.click(screen.getByRole('radio', { name: '4.5 stars' }));
    expect(onChange).toHaveBeenLastCalledWith(4.5);
  });

  it('onHover reports the previewed value, then null; the preview shows in the fill and the word', () => {
    const onHover = vi.fn();
    const { container } = render(<Rating label="Score" defaultValue={2} onHover={onHover} valueLabels={['Poor', 'Fair', 'Good', 'Great', 'Superb']} />);
    const row = lay(container);
    const hint = container.querySelector('.pinfold-rating__hint')!;
    expect(hint.textContent).toBe('Fair');
    fireEvent.pointerMove(row, { clientX: 75, pointerType: 'mouse' });
    expect(onHover).toHaveBeenLastCalledWith(4);
    expect(hint.textContent).toBe('Great');
    expect(container.firstElementChild!.hasAttribute('data-previewing')).toBe(true);
    fireEvent.pointerMove(row, { clientX: 79, pointerType: 'mouse' });
    expect(onHover).toHaveBeenCalledTimes(1);
    fireEvent.pointerLeave(row);
    expect(onHover).toHaveBeenLastCalledWith(null);
    expect(hint.textContent).toBe('Fair');
  });

  it('a half value reads as the whole step it has reached', () => {
    const words = ['Poor', 'Fair', 'Good', 'Great', 'Superb'];
    const { container, rerender } = render(<Rating label="Average" value={3.5} allowHalf readOnly valueLabels={words} />);
    expect(container.querySelector('.pinfold-rating__hint')!.textContent).toBe('Good');
    rerender(<Rating label="Average" value={0.5} allowHalf readOnly valueLabels={words} />);
    expect(container.querySelector('.pinfold-rating__hint')!.textContent).toBe('Poor');
  });

  it('valueLabels name the choices and title the symbols', () => {
    const { container } = render(<Rating label="Score" valueLabels={['Poor', 'Fair', 'Good', 'Great', 'Superb']} />);
    expect(screen.getByRole('radio', { name: 'Good, 3 stars' })).toBeTruthy();
    expect(container.querySelectorAll('[data-fill]')[4].getAttribute('title')).toBe('Superb');
  });

  it('icon and emptyIcon may be functions of the symbol: a face per value, an outline when empty', () => {
    const icon = vi.fn(({ index }: { index: number }) => <b>{`full-${index}`}</b>);
    const { container } = render(<Rating label="Mood" defaultValue={2} icon={icon} emptyIcon={({ index, fill }) => <i>{`empty-${index}-${fill}`}</i>} />);
    const symbols = container.querySelectorAll('[data-fill]');
    expect(symbols[0].textContent).toBe('empty-0-1full-0');
    expect(symbols[3].textContent).toBe('empty-3-0full-3');
    expect(icon).toHaveBeenCalledWith(expect.objectContaining({ index: 1, value: 2, fill: 1, previewing: false }));
  });

  it('render.symbol gets the symbol as item', () => {
    render(<Rating label="Score" defaultValue={1} max={3} render={{ symbol: ({ props, item }) => <span {...props}>{`#${item?.value}:${item?.fill}`}</span> }} />);
    expect(screen.getByText('#1:1')).toBeTruthy();
    expect(screen.getByText('#3:0')).toBeTruthy();
    expect(inactiveRatingOptions({ readOnly: true })).toHaveProperty('onHover');
  });
});
