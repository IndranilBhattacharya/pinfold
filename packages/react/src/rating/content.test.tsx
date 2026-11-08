import * as React from 'react';
import { describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen } from '@testing-library/react';
import { renderToString } from 'react-dom/server';
import { describePinfoldConformance } from '@pinfold/testing';
import { emptyMeta, ratingMeta, timelineMeta } from '@pinfold/core/meta';
import { Rating } from './Rating';
import { useRating } from './useRating';
import { defineRating } from './define';
import { Timeline } from '../timeline/Timeline';
import { useTimeline } from '../timeline/useTimeline';
import { defineTimeline } from '../timeline/define';
import { Empty } from '../empty/Empty';
import { useEmpty } from '../empty/useEmpty';
import { defineEmpty } from '../empty/define';

describe('Rating', () => {
  it('a radiogroup of native radios named per value; choosing calls onChange; choosing again clears', () => {
    const onChange = vi.fn();
    const { container } = render(<Rating label="Your rating" defaultValue={3} onChange={onChange} name="stars" />);
    screen.getByRole('radiogroup', { name: 'Your rating' });
    expect(screen.getAllByRole('radio')).toHaveLength(5);
    expect((screen.getByRole('radio', { name: '3 stars' }) as HTMLInputElement).checked).toBe(true);
    fireEvent.click(screen.getByRole('radio', { name: '4 stars' }));
    expect(onChange).toHaveBeenLastCalledWith(4);
    expect([...container.querySelectorAll('[data-fill]')].map((s) => s.getAttribute('data-fill'))).toEqual(['1', '1', '1', '1', '0']);
    fireEvent.click(screen.getByRole('radio', { name: '4 stars' }), { detail: 0 });
    expect(onChange).toHaveBeenLastCalledWith(0);
  });

  it('half steps: ten choices; read-only is one image with the score', () => {
    render(<Rating label="Your rating" allowHalf />);
    expect(screen.getAllByRole('radio')).toHaveLength(10);
    const { container } = render(<Rating label="Average" value={3.5} readOnly showValue />);
    expect(screen.getByRole('img', { name: 'Average: 3.5 out of 5' })).toBeTruthy();
    expect([...container.querySelectorAll('[data-fill]')].map((s) => s.getAttribute('data-fill'))).toEqual(['1', '1', '1', '0.5', '0']);
    expect(container.querySelector('.pinfold-rating__value')!.textContent).toBe('3.5');
  });
});

describe('Timeline', () => {
  it('a named ordered list; ISO times shown in the locale and kept in datetime; a pending last event', () => {
    render(<Timeline label="Order history" locale="en-GB" pending items={[{ title: 'Ordered', time: '2026-11-02' }, { title: 'Shipped', time: '2026-11-04T09:30' }, 'Delivered']} />);
    const list = screen.getByRole('list', { name: 'Order history' });
    const items = list.querySelectorAll('li');
    expect(items).toHaveLength(3);
    expect(items[0].querySelector('time')!.getAttribute('datetime')).toBe('2026-11-02');
    expect(items[0].querySelector('time')!.textContent).toBe('2 Nov 2026');
    expect(items[1].querySelector('time')!.textContent).toMatch(/4 Nov 2026,? 09:30/);
    expect(items[2].getAttribute('aria-current')).toBe('step');
  });

  it('reverse puts the newest first; the pending event follows', () => {
    render(<Timeline label="Feed" reverse pending items={['One', 'Two']} />);
    const items = screen.getByRole('list').querySelectorAll('li');
    expect(items[0].textContent).toBe('Two');
    expect(items[0].getAttribute('aria-current')).toBe('step');
  });
});

describe('Empty', () => {
  it('a real heading, a line and Pinfold buttons; renders on the server', () => {
    const clear = vi.fn();
    render(<Empty title="No results" description="Try fewer filters." headingLevel={2} actions={[{ label: 'Clear filters', onClick: clear }]} />);
    expect(screen.getByRole('heading', { level: 2, name: 'No results' })).toBeTruthy();
    fireEvent.click(screen.getByRole('button', { name: 'Clear filters' }));
    expect(clear).toHaveBeenCalled();
    expect(renderToString(React.createElement(defineEmpty({ variant: 'card' }), { title: 'Nothing' }))).toContain('data-variant="card"');
  });
});

describePinfoldConformance({
  name: 'rating',
  inherits: ['size'],
  variants: false,
  slots: ['root', 'label', 'symbols', 'symbol'],
  optionalSlots: ['value'],
  cssFile: 'packages/css/src/rating.css',
  meta: ratingMeta,
  preset: { define: defineRating as any, props: { label: 'R' } },
  hook: { use: useRating as any, config: { label: 'R' } },
  render: (config) => <Rating label="R" defaultValue={2} {...config} />,
});

describePinfoldConformance({
  name: 'timeline',
  slots: ['root', 'item', 'marker', 'connector', 'body', 'title'],
  optionalSlots: ['time', 'description', 'content'],
  cssFile: 'packages/css/src/timeline.css',
  meta: timelineMeta,
  preset: { define: defineTimeline as any, props: { label: 'T', items: ['a', 'b'] } },
  hook: { use: useTimeline as any, config: { label: 'T', items: ['a', 'b'] } },
  render: (config) => <Timeline label="T" items={['a', 'b']} {...config} />,
});

describePinfoldConformance({
  name: 'empty',
  slots: ['root', 'media', 'title'],
  optionalSlots: ['description', 'actions'],
  cssFile: 'packages/css/src/empty.css',
  meta: emptyMeta,
  preset: { define: defineEmpty as any, props: { title: 'E' } },
  hook: { use: useEmpty as any, config: { title: 'E' } },
  render: (config) => <Empty title="E" {...config} />,
});
