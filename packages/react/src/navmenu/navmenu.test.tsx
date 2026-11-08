import * as React from 'react';
import { describe, expect, it, vi } from 'vitest';
import { act, fireEvent, render, screen } from '@testing-library/react';
import { renderToString } from 'react-dom/server';
import { describePinfoldConformance } from '@pinfold/testing';
import { navmenuMeta } from '@pinfold/core/meta';
import { PinfoldProvider } from '../provider';
import { NavMenu } from './NavMenu';
import { useNavMenu } from './useNavMenu';
import { defineNavMenu } from './define';

const items = [
  {
    label: 'Products',
    items: [
      { label: 'Analytics', href: '/analytics', description: 'Know your traffic' },
      { label: 'Automation', href: '/automation' },
      'Changelog',
    ],
  },
  { label: 'About', content: 'We make tools.' },
  { label: 'Pricing', href: '/pricing' },
];

describe('Navigation menu', () => {
  it('a named nav of links and disclosure buttons; the current page is marked, and its panel button too', () => {
    render(<NavMenu label="Main" items={items} value="/automation" />);
    screen.getByRole('navigation', { name: 'Main' });
    const products = screen.getByRole('button', { name: 'Products' });
    expect(products.getAttribute('aria-expanded')).toBe('false');
    expect(products.hasAttribute('data-holds-current')).toBe(true);
    expect(document.getElementById(products.getAttribute('aria-controls')!)).toBeTruthy();
    expect(screen.getByRole('link', { name: 'Pricing' }).hasAttribute('aria-current')).toBe(false);
  });

  it('a press opens one panel at a time; a link inside routes, closes it and becomes current; Escape returns focus', () => {
    const navigate = vi.fn();
    const onChange = vi.fn();
    render(
      <PinfoldProvider navigate={navigate}>
        <NavMenu label="Main" items={items} openOn="click" onChange={onChange} />
      </PinfoldProvider>,
    );
    const products = screen.getByRole('button', { name: 'Products' });
    fireEvent.click(products);
    expect(products.getAttribute('aria-expanded')).toBe('true');
    fireEvent.click(screen.getByRole('button', { name: 'About' }));
    expect(products.getAttribute('aria-expanded')).toBe('false');
    expect(screen.getByRole('button', { name: 'About' }).getAttribute('aria-expanded')).toBe('true');
    fireEvent.click(products);
    fireEvent.click(screen.getByRole('link', { name: /Analytics/ }));
    expect(navigate).toHaveBeenCalledWith('/analytics');
    expect(onChange).toHaveBeenLastCalledWith('/analytics', expect.objectContaining({ label: 'Analytics' }), expect.anything());
    expect(products.getAttribute('aria-expanded')).toBe('false');
    expect(products.hasAttribute('data-holds-current')).toBe(true);
    fireEvent.click(products);
    fireEvent.keyDown(document, { key: 'Escape' });
    expect(products.getAttribute('aria-expanded')).toBe('false');
    expect(document.activeElement).toBe(products);
  });

  it('arrow keys move between top entries; Arrow Down opens a panel and focuses its first link', async () => {
    render(<NavMenu label="Main" items={items} />);
    const products = screen.getByRole('button', { name: 'Products' });
    products.focus();
    fireEvent.keyDown(products, { key: 'ArrowRight' });
    expect(document.activeElement).toBe(screen.getByRole('button', { name: 'About' }));
    fireEvent.keyDown(document.activeElement!, { key: 'End' });
    expect(document.activeElement).toBe(screen.getByRole('link', { name: 'Pricing' }));
    products.focus();
    fireEvent.keyDown(products, { key: 'ArrowDown' });
    await act(() => new Promise((r) => requestAnimationFrame(() => r(undefined))));
    expect(products.getAttribute('aria-expanded')).toBe('true');
    expect(document.activeElement).toBe(screen.getByRole('link', { name: /Analytics/ }));
    fireEvent.keyDown(document.activeElement!, { key: 'ArrowUp' });
    expect(document.activeElement).toBe(screen.getByRole('button', { name: 'Changelog' }));
  });

  it('hover opens after a delay and closes after a grace period; touch never hovers', () => {
    vi.useFakeTimers();
    render(<NavMenu label="Main" items={items} />);
    const item = screen.getByRole('button', { name: 'Products' }).parentElement!;
    fireEvent.pointerEnter(item, { pointerType: 'touch' });
    act(() => vi.advanceTimersByTime(300));
    expect(screen.getByRole('button', { name: 'Products' }).getAttribute('aria-expanded')).toBe('false');
    fireEvent.pointerEnter(item, { pointerType: 'mouse' });
    act(() => vi.advanceTimersByTime(200));
    expect(screen.getByRole('button', { name: 'Products' }).getAttribute('aria-expanded')).toBe('true');
    fireEvent.pointerLeave(item, { pointerType: 'mouse' });
    act(() => vi.advanceTimersByTime(100));
    expect(screen.getByRole('button', { name: 'Products' }).getAttribute('aria-expanded')).toBe('true');
    act(() => vi.advanceTimersByTime(300));
    expect(screen.getByRole('button', { name: 'Products' }).getAttribute('aria-expanded')).toBe('false');
    vi.useRealTimers();
  });

  it('renders on the server with a controlled open panel', () => {
    const html = renderToString(React.createElement(defineNavMenu({ variant: 'pills' }), { label: 'Main', items, open: 'Products' }));
    expect(html).toContain('aria-expanded="true"');
    expect(html).toContain('data-variant="pills"');
  });
});

describePinfoldConformance({
  name: 'navmenu',
  slots: ['root', 'list', 'item', 'link', 'trigger', 'chevron', 'panel', 'grid', 'panelLink', 'description', 'content'],
  optionalSlots: ['icon'],
  cssFile: 'packages/css/src/navmenu.css',
  meta: navmenuMeta,
  preset: { define: defineNavMenu as any, props: { label: 'N', items } },
  hook: { use: useNavMenu as any, config: { label: 'N', items } },
  render: (config) => <NavMenu label="N" items={items} {...config} />,
});
