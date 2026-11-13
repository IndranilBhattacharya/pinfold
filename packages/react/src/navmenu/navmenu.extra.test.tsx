import * as React from 'react';
import { describe, expect, it, vi } from 'vitest';
import { act, fireEvent, render, screen } from '@testing-library/react';
import { NavMenu } from './NavMenu';

const items = [
  { label: 'Products', items: ['Analytics', 'Automation'] },
  { label: 'Resources', items: ['Docs', 'Blog'], content: ({ close }: { close: () => void }) => <button onClick={close}>Dismiss</button> },
  { label: 'Pricing', href: '/pricing' },
];
const panel = (name: string) => document.getElementById(screen.getByRole('button', { name }).getAttribute('aria-controls')!)!;

describe('NavMenu: transitions, highlight, delays', () => {
  it('a panel knows which way it arrived: dropping in, then from the side the pointer moved from', () => {
    render(<NavMenu label="Main" items={items} openOn="click" />);
    expect(screen.getByRole('navigation').getAttribute('data-transition')).toBe('slide');
    fireEvent.click(screen.getByRole('button', { name: 'Products' }));
    expect(panel('Products').getAttribute('data-motion')).toBe('in');
    fireEvent.click(screen.getByRole('button', { name: 'Resources' }));
    expect(panel('Resources').getAttribute('data-motion')).toBe('forward');
    expect(panel('Products').hasAttribute('data-motion')).toBe(false);
    fireEvent.click(screen.getByRole('button', { name: 'Products' }));
    expect(panel('Products').getAttribute('data-motion')).toBe('backward');
  });

  it('panel content as a function can close the panel', () => {
    render(<NavMenu label="Main" items={items} openOn="click" transition="fade" highlight={false} />);
    expect(document.querySelector('.pinfold-navmenu__highlight')).toBeNull();
    fireEvent.click(screen.getByRole('button', { name: 'Resources' }));
    expect(screen.getByRole('button', { name: 'Resources' }).getAttribute('aria-expanded')).toBe('true');
    fireEvent.click(screen.getByRole('button', { name: 'Dismiss' }));
    expect(screen.getByRole('button', { name: 'Resources' }).getAttribute('aria-expanded')).toBe('false');
  });

  it('openDelay and closeDelay set how long the pointer rests and how long a panel stays', () => {
    vi.useFakeTimers();
    render(<NavMenu label="Main" items={items} openDelay={400} closeDelay={50} />);
    const entry = screen.getByRole('button', { name: 'Products' }).closest('li')!;
    fireEvent.pointerEnter(entry, { pointerType: 'mouse' });
    act(() => void vi.advanceTimersByTime(300));
    expect(screen.getByRole('button', { name: 'Products' }).getAttribute('aria-expanded')).toBe('false');
    act(() => void vi.advanceTimersByTime(150));
    expect(screen.getByRole('button', { name: 'Products' }).getAttribute('aria-expanded')).toBe('true');
    fireEvent.pointerLeave(entry, { pointerType: 'mouse' });
    act(() => void vi.advanceTimersByTime(60));
    expect(screen.getByRole('button', { name: 'Products' }).getAttribute('aria-expanded')).toBe('false');
    vi.useRealTimers();
  });
});
