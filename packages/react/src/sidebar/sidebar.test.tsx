import * as React from 'react';
import { describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen } from '@testing-library/react';
import { renderToString } from 'react-dom/server';
import { describePinfoldConformance } from '@pinfold/testing';
import { sidebarMeta } from '@pinfold/core/meta';
import { PinfoldProvider } from '../provider';
import { Sidebar } from './Sidebar';
import { useSidebar } from './useSidebar';
import { defineSidebar } from './define';

const items = [
  { label: 'Inbox', href: '/inbox', badge: 4 },
  { label: 'Projects', items: [{ label: 'Pinfold', href: '/p/pinfold' }, { label: 'Atlas', href: '/p/atlas' }] },
  'Drafts',
  { label: 'Settings', href: '/settings', group: 'Account' },
  { label: 'Billing', href: '/billing', group: 'Account', disabled: true },
];

describe('Sidebar', () => {
  it('a named nav; the current link has aria-current; the section holding it starts open; groups name their lists', () => {
    render(<Sidebar label="Main" items={items} value="/p/atlas" />);
    screen.getByRole('navigation', { name: 'Main' });
    expect(screen.getByRole('link', { name: 'Atlas' }).getAttribute('aria-current')).toBe('page');
    const section = screen.getByRole('button', { name: 'Projects' });
    expect(section.getAttribute('aria-expanded')).toBe('true');
    expect(section.hasAttribute('data-holds-current')).toBe(true);
    expect(document.getElementById(section.getAttribute('aria-controls')!)!.hasAttribute('data-open')).toBe(true);
    screen.getByRole('list', { name: 'Account' });
    expect(screen.getByRole('button', { name: 'Billing' }).getAttribute('aria-disabled')).toBe('true');
  });

  it('a section opens and closes; choosing an entry makes it current and calls onChange; links go through the router', () => {
    const onChange = vi.fn();
    const navigate = vi.fn();
    render(
      <PinfoldProvider navigate={navigate}>
        <Sidebar label="Main" items={items} onChange={onChange} />
      </PinfoldProvider>,
    );
    const section = screen.getByRole('button', { name: 'Projects' });
    expect(section.getAttribute('aria-expanded')).toBe('false');
    fireEvent.click(section);
    expect(section.getAttribute('aria-expanded')).toBe('true');
    fireEvent.click(screen.getByRole('link', { name: 'Pinfold' }));
    expect(navigate).toHaveBeenCalledWith('/p/pinfold');
    expect(onChange).toHaveBeenLastCalledWith('/p/pinfold', expect.objectContaining({ label: 'Pinfold' }), expect.anything());
    expect(screen.getByRole('link', { name: 'Pinfold' }).getAttribute('aria-current')).toBe('page');
    fireEvent.click(screen.getByRole('button', { name: 'Drafts' }));
    expect(onChange).toHaveBeenLastCalledWith('Drafts', { label: 'Drafts' }, expect.anything());
    fireEvent.click(screen.getByRole('button', { name: 'Billing' }));
    expect(onChange).toHaveBeenCalledTimes(2);
  });

  it('collapsible: the button folds it into a rail; names stay; a section in the rail opens the sidebar on it', () => {
    const onCollapsedChange = vi.fn();
    render(<Sidebar label="Main" items={items} collapsible onCollapsedChange={onCollapsedChange} />);
    const toggle = screen.getByRole('button', { name: 'Collapse sidebar' });
    expect(toggle.getAttribute('aria-expanded')).toBe('true');
    fireEvent.click(toggle);
    expect(onCollapsedChange).toHaveBeenLastCalledWith(true);
    expect(screen.getByRole('navigation').hasAttribute('data-collapsed')).toBe(true);
    expect(screen.getByRole('link', { name: /Inbox/ }).getAttribute('title')).toBe('Inbox');
    fireEvent.click(screen.getByRole('button', { name: 'Projects' }));
    expect(onCollapsedChange).toHaveBeenLastCalledWith(false);
    expect(screen.getByRole('button', { name: 'Projects' }).getAttribute('aria-expanded')).toBe('true');
  });

  it('renders on the server with the current section open', () => {
    const html = renderToString(React.createElement(defineSidebar({ variant: 'solid' }), { label: 'Main', items, value: '/p/pinfold' }));
    expect(html).toContain('aria-current="page"');
    expect(html).toContain('data-variant="solid"');
    expect(html).toContain('aria-expanded="true"');
  });
});

describePinfoldConformance({
  name: 'sidebar',
  slots: ['root', 'body', 'group', 'list', 'item', 'link', 'badge', 'chevron', 'sublist'],
  optionalSlots: ['icon', 'header', 'groupLabel', 'footer', 'toggle'],
  cssFile: 'packages/css/src/sidebar.css',
  meta: sidebarMeta,
  preset: { define: defineSidebar as any, props: { label: 'S', items } },
  hook: { use: useSidebar as any, config: { label: 'S', items } },
  render: (config) => <Sidebar label="S" items={items} {...config} />,
});
