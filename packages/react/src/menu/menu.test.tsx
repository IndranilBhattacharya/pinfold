import * as React from 'react';
import { describe, expect, it, vi } from 'vitest';
import { act, fireEvent, render, screen } from '@testing-library/react';
import { renderToString } from 'react-dom/server';
import { describePinfoldConformance } from '@pinfold/testing';
import { menuMeta } from '@pinfold/core/meta';
import { Menu } from './Menu';
import { useMenu } from './useMenu';
import { defineMenu } from './define';
import type { MenuItem } from './types';

const items: MenuItem[] = [
  { label: 'Copy', shortcut: '⌘C' },
  { label: 'Cut' },
  { label: 'Delete', tone: 'danger' },
];
const focused = () => document.activeElement?.textContent;
const open = () => fireEvent.click(screen.getByRole('button', { name: 'Actions' }));

describe('Menu', () => {
  it('submenus: arrow toward it opens and focuses its first row; away or Escape returns; a row in it closes everything', () => {
    const share = vi.fn();
    const nested: MenuItem[] = [
      { label: 'Copy' },
      { type: 'submenu', label: 'Share', items: [{ label: 'Email', onSelect: share }, { type: 'submenu', label: 'More', items: [{ label: 'Print' }] }] },
      { label: 'Delete' },
    ];
    render(<Menu trigger={{ label: 'Actions' }} items={nested} />);
    open();
    const root = screen.getByRole('menu', { name: 'Actions' });
    expect(screen.getAllByRole('menuitem').filter((r) => root.contains(r))).toHaveLength(3);
    fireEvent.keyDown(document.activeElement!, { key: 'ArrowDown' });
    const shareRow = document.activeElement as HTMLElement;
    expect(shareRow.getAttribute('aria-haspopup')).toBe('menu');
    expect(shareRow.getAttribute('aria-expanded')).toBe('false');
    fireEvent.keyDown(shareRow, { key: 'ArrowRight' });
    expect(shareRow.getAttribute('aria-expanded')).toBe('true');
    const sub = screen.getByRole('menu', { name: 'Share' });
    expect(focused()).toBe('Email');
    // Its own rows only: the deeper submenu's rows are not counted.
    fireEvent.keyDown(document.activeElement!, { key: 'ArrowDown' });
    expect(focused()).toContain('More');
    fireEvent.keyDown(document.activeElement!, { key: 'Enter' });
    expect(screen.getByRole('menu', { name: 'More' })).toBeTruthy();
    expect(focused()).toBe('Print');
    fireEvent.keyDown(document.activeElement!, { key: 'Escape' });
    expect(screen.queryByRole('menu', { name: 'More' })).toBeNull();
    expect(focused()).toContain('More');
    fireEvent.keyDown(document.activeElement!, { key: 'ArrowLeft' });
    expect(screen.queryByRole('menu', { name: 'Share' })).toBeNull();
    expect(document.activeElement).toBe(shareRow);
    expect(root.isConnected).toBe(true);
    fireEvent.click(shareRow);
    fireEvent.click(screen.getByRole('menuitem', { name: 'Email' }));
    expect(share).toHaveBeenCalledTimes(1);
    expect(screen.queryByRole('menu')).toBeNull();
    expect(sub.isConnected).toBe(false);
  });

  it('wires the trigger and focuses the first row on open', () => {
    render(<Menu trigger={{ label: 'Actions' }} items={items} />);
    const button = screen.getByRole('button', { name: 'Actions' });
    expect(button.getAttribute('aria-haspopup')).toBe('menu');
    open();
    const menu = screen.getByRole('menu', { name: 'Actions' });
    expect(button.getAttribute('aria-expanded')).toBe('true');
    expect(button.getAttribute('aria-controls')).toBe(menu.id);
    expect(screen.getAllByRole('menuitem')).toHaveLength(3);
    expect(focused()).toContain('Copy');
  });

  it('opens from the arrow keys on the trigger: down to the first, up to the last', () => {
    render(<Menu trigger={{ label: 'Actions' }} items={items} />);
    const button = screen.getByRole('button', { name: 'Actions' });
    fireEvent.keyDown(button, { key: 'ArrowUp' });
    expect(focused()).toBe('Delete');
    fireEvent.keyDown(document.activeElement!, { key: 'Escape' });
    fireEvent.keyDown(button, { key: 'ArrowDown' });
    expect(focused()).toContain('Copy');
  });

  it('moves with arrows, Home and End, wrapping unless loop is off', () => {
    const { rerender } = render(<Menu trigger={{ label: 'Actions' }} items={items} />);
    open();
    const key = (k: string) => fireEvent.keyDown(document.activeElement!, { key: k });
    key('ArrowDown');
    expect(focused()).toBe('Cut');
    key('End');
    expect(focused()).toBe('Delete');
    key('ArrowDown');
    expect(focused()).toContain('Copy');
    key('ArrowUp');
    expect(focused()).toBe('Delete');
    key('Home');
    expect(focused()).toContain('Copy');
    rerender(<Menu trigger={{ label: 'Actions' }} items={items} loop={false} />);
    key('ArrowUp');
    expect(focused()).toContain('Copy');
  });

  it('jumps by typeahead', () => {
    render(<Menu trigger={{ label: 'Actions' }} items={items} />);
    open();
    fireEvent.keyDown(document.activeElement!, { key: 'd' });
    expect(focused()).toBe('Delete');
  });

  it('selects by click and keyboard, closes and returns focus', () => {
    const onSelect = vi.fn();
    render(<Menu trigger={{ label: 'Actions' }} items={[{ label: 'Edit', onSelect }]} />);
    const button = screen.getByRole('button', { name: 'Actions' });
    act(() => button.focus());
    open();
    fireEvent.keyDown(document.activeElement!, { key: 'Enter' });
    expect(onSelect).toHaveBeenCalledTimes(1);
    expect(screen.queryByRole('menu')).toBeNull();
    expect(document.activeElement).toBe(button);
    open();
    fireEvent.click(screen.getByRole('menuitem', { name: 'Edit' }));
    expect(onSelect).toHaveBeenCalledTimes(2);
  });

  it('a disabled row is reachable and does nothing', () => {
    const onSelect = vi.fn();
    render(<Menu trigger={{ label: 'Actions' }} items={[{ label: 'Edit', disabled: true, onSelect }]} />);
    open();
    const row = screen.getByRole('menuitem', { name: 'Edit' });
    expect(row.getAttribute('aria-disabled')).toBe('true');
    expect(document.activeElement).toBe(row);
    fireEvent.click(row);
    expect(onSelect).not.toHaveBeenCalled();
    expect(screen.getByRole('menu')).toBeTruthy();
  });

  it('checkbox and radio rows report their state and stay open', () => {
    const onSelect = vi.fn();
    render(
      <Menu
        trigger={{ label: 'Actions' }}
        items={[
          { type: 'checkbox', label: 'Wrap', checked: true, onSelect },
          { type: 'group', label: 'Sort', items: [{ type: 'radio', label: 'Name', checked: true }, { type: 'radio', label: 'Date' }] },
          { type: 'separator' },
        ]}
      />,
    );
    open();
    const box = screen.getByRole('menuitemcheckbox', { name: 'Wrap' });
    expect(box.getAttribute('aria-checked')).toBe('true');
    fireEvent.click(box);
    expect(onSelect).toHaveBeenCalled();
    expect(screen.getByRole('menu')).toBeTruthy();
    expect(screen.getByRole('group', { name: 'Sort' }).querySelectorAll('[role="menuitemradio"]')).toHaveLength(2);
    expect(screen.getByRole('separator')).toBeTruthy();
  });

  it('a link row is a real link with safe rel; a disabled one has no href', () => {
    render(<Menu trigger={{ label: 'Actions' }} items={[{ label: 'Docs', href: '/docs', target: '_blank' }, { label: 'Off', href: '/off', disabled: true }]} />);
    open();
    const docs = screen.getByRole('menuitem', { name: 'Docs' });
    expect(docs.tagName).toBe('A');
    expect(docs.getAttribute('rel')).toBe('noopener noreferrer');
    expect(screen.getByRole('menuitem', { name: 'Off' }).tagName).toBe('DIV');
  });

  it('a context menu opens on right-click and is named by its label', async () => {
    render(<Menu mode="context" label="Canvas" trigger={<div data-testid="area" />} items={items} />);
    fireEvent.contextMenu(screen.getByTestId('area'), { clientX: 40, clientY: 50 });
    await vi.waitFor(() => expect(screen.getByRole('menu', { name: 'Canvas' })).toBeTruthy());
    expect(screen.getByRole('menu').getAttribute('data-mode')).toBe('context');
    expect(screen.getByRole('menu').style.top).toBe('50px');
  });

  it('a context menu stays at its point inside the area when the page scrolls, and moves on a second right-click', async () => {
    render(<Menu mode="context" label="Canvas" trigger={<div data-testid="area" />} items={items} />);
    const area = screen.getByTestId('area');
    let top = 100;
    area.getBoundingClientRect = () => ({ x: 20, y: top, left: 20, top, width: 200, height: 80, right: 220, bottom: top + 80, toJSON: () => ({}) }) as DOMRect;
    fireEvent.contextMenu(area, { clientX: 60, clientY: 130 });
    await vi.waitFor(() => expect(screen.getByRole('menu').style.top).toBe('130px'));
    top = 40;
    fireEvent.scroll(window);
    await vi.waitFor(() => expect(screen.getByRole('menu').style.top).toBe('70px'));
    fireEvent.contextMenu(area, { clientX: 30, clientY: 50 });
    await vi.waitFor(() => expect(screen.getByRole('menu').style.top).toBe('50px'));
    expect(screen.getAllByRole('menu')).toHaveLength(1);
  });

  it('renders no menu on the server', () => {
    const Actions = defineMenu({ placement: 'bottom-end' });
    const html = renderToString(<Actions defaultOpen trigger={{ label: 'Actions' }} items={items} />);
    expect(html).toContain('Actions');
    expect(html).not.toContain('role="menu"');
  });
});

describePinfoldConformance({
  name: 'menu',
  inherits: ['size'],
  variants: false,
  slots: ['root', 'item', 'indicator', 'icon', 'label', 'shortcut', 'separator', 'group'],
  dimension: { key: 'width', value: 240 },
  cssFile: 'packages/css/src/menu.css',
  meta: menuMeta,
  preset: { define: defineMenu as any, props: { items, defaultOpen: true } },
  hook: { use: useMenu as any, config: { items, defaultOpen: true } },
  render: (config) => (
    <Menu
      defaultOpen
      trigger={{ label: 'Actions' }}
      items={[{ label: 'Copy', icon: <svg />, shortcut: 'C' }, { type: 'checkbox', label: 'Wrap', checked: true }, { type: 'separator' }, { type: 'group', label: 'More', items: [{ label: 'Cut' }] }]}
      {...config}
    />
  ),
});
