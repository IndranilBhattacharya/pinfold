import * as React from 'react';
import { describe, expect, it, vi } from 'vitest';
import { act, fireEvent, render, screen } from '@testing-library/react';
import { Timeline } from './Timeline';
import { useTimeline } from './useTimeline';

const steps = [
  { title: 'Build', status: 'complete' as const },
  { title: 'Tests', status: 'error' as const, description: '2 failed' },
  { title: 'Deploy', status: 'upcoming' as const },
];

describe('Timeline layout options', () => {
  it('reflects connector, density, align and time placement on the root, with defaults', () => {
    const { container, rerender } = render(<Timeline label="T" items={['a', 'b']} />);
    const root = container.firstElementChild!;
    expect(root.getAttribute('data-connector')).toBe('gap');
    expect(root.getAttribute('data-density')).toBe('comfortable');
    expect(root.getAttribute('data-align')).toBe('start');
    expect(root.getAttribute('data-time-placement')).toBe('above');
    expect(root.hasAttribute('data-opposite')).toBe(false);
    rerender(<Timeline label="T" items={['a', 'b']} orientation="horizontal" align="alternate" connector="joined" density="compact" />);
    expect(root.getAttribute('data-align')).toBe('alternate');
    expect(root.getAttribute('data-connector')).toBe('joined');
    expect(root.getAttribute('data-density')).toBe('compact');
  });

  it('connector "none" draws no line; otherwise one per gap between events', () => {
    const { container, rerender } = render(<Timeline label="T" items={['a', 'b', 'c']} />);
    expect(container.querySelectorAll('.pinfold-timeline__connector')).toHaveLength(2);
    rerender(<Timeline label="T" items={['a', 'b', 'c']} connector="none" />);
    expect(container.querySelectorAll('.pinfold-timeline__connector')).toHaveLength(0);
  });

  it('status: on the item, read after the title, a mark in the marker; the line takes the earlier event\'s status', () => {
    const { container } = render(<Timeline label="Deploy" variant="icon" items={steps} labels={{ status: { error: 'failed' } }} />);
    const lis = container.querySelectorAll('li');
    expect([...lis].map((li) => li.getAttribute('data-status'))).toEqual(['complete', 'error', 'upcoming']);
    expect(lis[0].textContent).toContain(', done');
    expect(lis[1].textContent).toContain(', failed');
    expect(lis[0].querySelector('.pinfold-timeline__marker svg')).toBeTruthy();
    expect([...container.querySelectorAll('.pinfold-timeline__connector')].map((c) => c.getAttribute('data-status'))).toEqual(['complete', 'error']);
    // Reversed: the line still takes the earlier event in time (now the lower one).
    const { container: rev } = render(<Timeline label="R" reverse items={steps} />);
    expect([...rev.querySelectorAll('.pinfold-timeline__connector')].map((c) => c.getAttribute('data-status'))).toEqual(['error', 'complete']);
  });

  it('pending: earlier events count as complete; the last is current', () => {
    const { container } = render(<Timeline label="T" pending items={['a', 'b', 'c']} />);
    expect([...container.querySelectorAll('li')].map((li) => li.getAttribute('data-status'))).toEqual(['complete', 'complete', 'current']);
    expect(container.querySelectorAll('li')[2].getAttribute('aria-current')).toBe('step');
  });

  it('custom markers: an item node, an item function, or the config function', () => {
    const marker = vi.fn((item: { index: number }) => <b>{item.index + 1}</b>);
    const { container } = render(<Timeline label="T" marker={marker} items={[{ title: 'a' }, { title: 'b', marker: 'B' }, { title: 'c', marker: (item) => `c${item.index}` }]} />);
    const marks = container.querySelectorAll('.pinfold-timeline__marker');
    expect([...marks].map((m) => m.textContent)).toEqual(['1', 'B', 'c2']);
    expect(marks[0].hasAttribute('data-custom')).toBe(true);
    expect(marker).toHaveBeenCalledTimes(1);
  });

  it('opposite content and timePlacement="opposite" fill the other side of the line', () => {
    const { container } = render(<Timeline label="T" timePlacement="opposite" items={[{ title: 'a', time: '2026-11-02' }, { title: 'b', opposite: '$40' }]} />);
    expect(container.firstElementChild!.hasAttribute('data-opposite')).toBe(true);
    const sides = container.querySelectorAll('.pinfold-timeline__opposite');
    expect(sides[0].querySelector('time')!.getAttribute('datetime')).toBe('2026-11-02');
    expect(sides[1].textContent).toBe('$40');
    expect(container.querySelector('.pinfold-timeline__body time')).toBeNull();
  });

  it('onItemClick makes each title a button and hands back the item', () => {
    const onItemClick = vi.fn();
    render(<Timeline label="T" items={['a', 'b']} onItemClick={onItemClick} />);
    fireEvent.click(screen.getByRole('button', { name: 'b' }));
    expect(onItemClick).toHaveBeenCalledWith(expect.objectContaining({ title: 'b', index: 1, last: true }), expect.anything());
  });

  it('collapsible: the title toggles the content (aria-expanded, aria-controls), onOpenChange reports, the controller opens', () => {
    const onOpenChange = vi.fn();
    let api: ReturnType<typeof useTimeline> | null = null;
    function Probe() {
      const T = useTimeline({ label: 'T', collapsible: true, onOpenChange, items: [{ title: 'a', content: 'More a' }, { title: 'b', content: 'More b', defaultOpen: true }, 'c'] });
      api = T;
      return <T />;
    }
    render(<Probe />);
    const a = screen.getByRole('button', { name: 'a' });
    expect(a.getAttribute('aria-expanded')).toBe('false');
    expect(document.getElementById(a.getAttribute('aria-controls')!)!.hidden).toBe(true);
    expect(screen.getByText('More b').hidden).toBe(false);
    expect(screen.queryByRole('button', { name: 'c' })).toBeNull();
    fireEvent.click(a);
    expect(a.getAttribute('aria-expanded')).toBe('true');
    expect(onOpenChange).toHaveBeenCalledWith(expect.objectContaining({ index: 0, open: true }), true, expect.anything());
    act(() => api!.setOpen(1, false));
    expect(screen.getByText('More b').hidden).toBe(true);
  });

  it('dimensions reach custom properties', () => {
    const { container } = render(<Timeline label="T" items={['a']} dimensions={{ markerSize: 20, gap: '2rem' }} />);
    const root = container.firstElementChild as HTMLElement;
    expect(root.style.getPropertyValue('--pinfold-timeline-marker-size')).toBe('20px');
    expect(root.style.getPropertyValue('--pinfold-timeline-gap')).toBe('2rem');
  });
});
