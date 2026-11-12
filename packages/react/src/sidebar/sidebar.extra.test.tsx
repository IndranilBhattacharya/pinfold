import * as React from 'react';
import { describe, expect, it, vi } from 'vitest';
import { act, fireEvent, render, screen } from '@testing-library/react';
import { Sidebar } from './Sidebar';
import { useSidebar } from './useSidebar';

const items = [
  { label: 'Inbox', href: '/inbox' },
  { label: 'Projects', items: [{ label: 'Pinfold', href: '/projects/pinfold' }, { label: 'Atlas', href: '/projects/atlas' }] },
  { label: 'Home', href: '/' },
];

describe('Sidebar: routes, a rail that opens, frames', () => {
  it("match 'prefix' marks the deepest entry whose href starts the path and opens its section; an exact key still wins", () => {
    const { rerender } = render(<Sidebar label="Main" items={items} value="/projects/atlas/issues/4" match="prefix" />);
    expect(screen.getByRole('link', { name: 'Atlas' }).getAttribute('aria-current')).toBe('page');
    expect(screen.getByRole('button', { name: 'Projects' }).getAttribute('aria-expanded')).toBe('true');
    // "/" never swallows every path.
    expect(screen.getByRole('link', { name: 'Home' }).getAttribute('aria-current')).toBeNull();
    rerender(<Sidebar label="Main" items={items} value="/inbox?tab=unread" match="prefix" />);
    expect(screen.getByRole('link', { name: 'Inbox' }).getAttribute('aria-current')).toBe('page');
    rerender(<Sidebar label="Main" items={items} value="/projects/atlas/issues/4" />);
    expect(screen.queryByRole('link', { current: 'page' })).toBeNull();
  });

  it('expandOnHover: a folded rail opens while pointed at or focused and folds back on leaving; the toggle still pins it', () => {
    vi.useFakeTimers();
    let api: ReturnType<typeof useSidebar> | undefined;
    function Nav() {
      api = useSidebar({ label: 'Main', items, defaultCollapsed: true, collapsible: true, expandOnHover: true });
      const N = api;
      return <N />;
    }
    render(<Nav />);
    const nav = screen.getByRole('navigation', { name: 'Main' });
    expect(nav.hasAttribute('data-collapsed')).toBe(true);
    fireEvent.pointerEnter(nav, { pointerType: 'mouse' });
    act(() => void vi.advanceTimersByTime(100));
    expect(nav.hasAttribute('data-collapsed')).toBe(false);
    expect(nav.hasAttribute('data-peeking')).toBe(true);
    // Still folded as far as the app knows: only the look changed.
    expect(api!.collapsed).toBe(true);
    expect(api!.peeking).toBe(true);
    fireEvent.pointerLeave(nav);
    act(() => void vi.advanceTimersByTime(250));
    expect(nav.hasAttribute('data-collapsed')).toBe(true);
    fireEvent.focus(screen.getByRole('link', { name: 'Inbox' }));
    act(() => void vi.advanceTimersByTime(100));
    expect(nav.hasAttribute('data-peeking')).toBe(true);
    fireEvent.click(screen.getByRole('button', { name: 'Expand sidebar' }));
    expect(api!.collapsed).toBe(false);
    expect(nav.hasAttribute('data-peeking')).toBe(false);
    vi.useRealTimers();
  });

  it('touch does not open the rail; surface reaches the root', () => {
    vi.useFakeTimers();
    render(<Sidebar label="Main" items={items} collapsed expandOnHover surface="floating" />);
    const nav = screen.getByRole('navigation');
    expect(nav.getAttribute('data-surface')).toBe('floating');
    fireEvent.pointerEnter(nav, { pointerType: 'touch' });
    act(() => void vi.advanceTimersByTime(200));
    expect(nav.hasAttribute('data-peeking')).toBe(false);
    vi.useRealTimers();
  });
});
