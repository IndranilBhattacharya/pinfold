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
// The floating panel around the role="menu" list: it carries the position and the data attributes.
const panelOf = () => screen.getByRole('menu').parentElement!;

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
    expect(panelOf().getAttribute('data-mode')).toBe('context');
    expect(panelOf().style.top).toBe('50px');
  });

  it('a context menu stays at its point inside the area when the page scrolls, and moves on a second right-click', async () => {
    render(<Menu mode="context" label="Canvas" trigger={<div data-testid="area" />} items={items} />);
    const area = screen.getByTestId('area');
    let top = 100;
    area.getBoundingClientRect = () => ({ x: 20, y: top, left: 20, top, width: 200, height: 80, right: 220, bottom: top + 80, toJSON: () => ({}) }) as DOMRect;
    fireEvent.contextMenu(area, { clientX: 60, clientY: 130 });
    await vi.waitFor(() => expect(panelOf().style.top).toBe('130px'));
    top = 40;
    fireEvent.scroll(window);
    await vi.waitFor(() => expect(panelOf().style.top).toBe('70px'));
    fireEvent.contextMenu(area, { clientX: 30, clientY: 50 });
    await vi.waitFor(() => expect(panelOf().style.top).toBe('50px'));
    expect(screen.getAllByRole('menu')).toHaveLength(1);
  });

  it('onAction reports every chosen row by id or position; onOpenChange says why', () => {
    const onAction = vi.fn();
    const onOpenChange = vi.fn();
    render(<Menu trigger={{ label: 'Actions' }} onAction={onAction} onOpenChange={onOpenChange} items={[{ id: 'copy', label: 'Copy' }, { label: 'Cut' }]} />);
    open();
    expect(onOpenChange).toHaveBeenLastCalledWith(true, 'trigger');
    fireEvent.click(screen.getByRole('menuitem', { name: 'Copy' }));
    expect(onAction).toHaveBeenLastCalledWith('copy', expect.objectContaining({ label: 'Copy' }));
    expect(onOpenChange).toHaveBeenLastCalledWith(false, 'select');
    open();
    fireEvent.click(screen.getByRole('menuitem', { name: 'Cut' }));
    expect(onAction).toHaveBeenLastCalledWith('1', expect.objectContaining({ label: 'Cut' }));
    open();
    fireEvent.keyDown(document.activeElement!, { key: 'Escape' });
    expect(onOpenChange).toHaveBeenLastCalledWith(false, 'escape');
  });

  it('a single selection the menu owns: radio rows, checked from defaultValue, stays open', () => {
    const onValueChange = vi.fn();
    render(<Menu trigger={{ label: 'Actions' }} selectionMode="single" defaultValue="name" onValueChange={onValueChange} items={[{ id: 'name', label: 'Name' }, { id: 'date', label: 'Date' }]} />);
    open();
    const [name, date] = screen.getAllByRole('menuitemradio');
    expect(name.getAttribute('aria-checked')).toBe('true');
    expect(date.getAttribute('aria-checked')).toBe('false');
    fireEvent.click(date);
    expect(onValueChange).toHaveBeenCalledWith('date', expect.objectContaining({ id: 'date' }));
    expect(screen.getByRole('menu')).toBeTruthy();
    expect(screen.getByRole('menuitemradio', { name: 'Date' }).getAttribute('aria-checked')).toBe('true');
    expect(screen.getByRole('menuitemradio', { name: 'Name' }).getAttribute('aria-checked')).toBe('false');
  });

  it('a multiple selection: controlled value at the menu level, and a group with its own', () => {
    const onValueChange = vi.fn();
    const onSort = vi.fn();
    render(
      <Menu
        trigger={{ label: 'Actions' }}
        selectionMode="multiple"
        value={['a']}
        onValueChange={onValueChange}
        items={[{ id: 'a', label: 'Alpha' }, { id: 'b', label: 'Beta' }, { type: 'group', label: 'Sort', selectionMode: 'single', defaultValue: 'asc', onValueChange: onSort, items: [{ id: 'asc', label: 'Ascending' }, { id: 'desc', label: 'Descending' }] }]}
      />,
    );
    open();
    expect(screen.getAllByRole('menuitemcheckbox')).toHaveLength(2);
    fireEvent.click(screen.getByRole('menuitemcheckbox', { name: 'Beta' }));
    expect(onValueChange).toHaveBeenCalledWith(['a', 'b'], expect.anything());
    // Controlled: unchanged until the parent says so.
    expect(screen.getByRole('menuitemcheckbox', { name: 'Beta' }).getAttribute('aria-checked')).toBe('false');
    fireEvent.click(screen.getByRole('menuitemcheckbox', { name: 'Alpha' }));
    expect(onValueChange).toHaveBeenLastCalledWith([], expect.anything());
    const group = screen.getByRole('group', { name: 'Sort' });
    expect(group.querySelectorAll('[role="menuitemradio"][aria-checked="true"]')).toHaveLength(1);
    fireEvent.click(screen.getByRole('menuitemradio', { name: 'Descending' }));
    expect(onSort).toHaveBeenCalledWith('desc', expect.anything());
  });

  it('rich rows: description, start and end content, a custom inside, selected and a disabled reason', () => {
    const { container } = render(
      <Menu
        trigger={{ label: 'Actions' }}
        items={[
          { label: 'Ada', description: 'ada@x.dev', startContent: <i>A</i>, endContent: <b>3</b>, selected: true },
          { label: 'Custom', content: ({ disabled }) => <em>{disabled ? 'off' : 'on'}</em> },
          { label: 'Export', disabled: true, disabledReason: 'Upgrade to export' },
        ]}
      />,
    );
    open();
    const ada = screen.getByRole('menuitem', { name: /Ada/ });
    expect(ada.getAttribute('aria-current')).toBe('true');
    expect(ada.hasAttribute('data-selected')).toBe(true);
    expect(container.querySelector('.pinfold-menu__description')!.textContent).toBe('ada@x.dev');
    expect(container.querySelector('.pinfold-menu__end')!.textContent).toBe('3');
    expect(container.querySelector('.pinfold-menu__icon')!.textContent).toBe('A');
    expect(container.querySelector('em')!.textContent).toBe('on');
    const exp = screen.getByRole('menuitem', { name: 'Export' });
    expect(exp.getAttribute('title')).toBe('Upgrade to export');
    expect(document.getElementById(exp.getAttribute('aria-describedby')!)!.textContent).toBe('Upgrade to export');
  });

  it('typeahead uses textValue when the label is not a string', () => {
    render(<Menu trigger={{ label: 'Actions' }} items={[{ label: 'Copy' }, { label: <span>Zoom</span>, textValue: 'Zoom', startContent: <i>AB</i> }]} />);
    open();
    fireEvent.keyDown(document.activeElement!, { key: 'z' });
    expect(focused()).toContain('Zoom');
  });

  it('header and footer content; closeOnSelect at the menu level', () => {
    const { container } = render(<Menu trigger={{ label: 'Actions' }} closeOnSelect={false} header={<strong>Signed in</strong>} footer={({ close }) => <button onClick={close}>Done</button>} items={items} />);
    open();
    expect(container.querySelector('.pinfold-menu__header')!.textContent).toBe('Signed in');
    fireEvent.click(screen.getByRole('menuitem', { name: 'Cut' }));
    expect(screen.getByRole('menu')).toBeTruthy();
    // Outside the role=menu list: the menu holds only rows.
    expect(screen.getByRole('menu').contains(screen.getByRole('button', { name: 'Done' }))).toBe(false);
    fireEvent.click(screen.getByRole('button', { name: 'Done' }));
    expect(screen.queryByRole('menu')).toBeNull();
  });

  it('searchable: focus starts in the field, typing filters, arrows reach the rows, Escape clears then closes', () => {
    const onSearchChange = vi.fn();
    const onSelect = vi.fn();
    render(<Menu trigger={{ label: 'Actions' }} searchable onSearchChange={onSearchChange} items={[{ label: 'Copy' }, { label: 'Cut', onSelect }, { type: 'separator' }, { label: 'Delete', description: 'Forever' }]} />);
    open();
    const field = screen.getByRole('searchbox', { name: 'Search' });
    expect(document.activeElement).toBe(field);
    fireEvent.change(field, { target: { value: 'cu' } });
    expect(onSearchChange).toHaveBeenLastCalledWith('cu');
    expect(screen.getAllByRole('menuitem').map((r) => r.textContent)).toEqual(['Cut']);
    expect(screen.queryByRole('separator')).toBeNull();
    fireEvent.change(field, { target: { value: 'forever' } });
    expect(screen.getAllByRole('menuitem')).toHaveLength(1);
    fireEvent.change(field, { target: { value: '' } });
    fireEvent.keyDown(field, { key: 'ArrowDown' });
    expect(focused()).toBe('Copy');
    // Typing on a row goes on in the field.
    fireEvent.keyDown(document.activeElement!, { key: 'c' });
    expect(document.activeElement).toBe(field);
    expect((field as HTMLInputElement).value).toBe('c');
    fireEvent.change(field, { target: { value: 'zzz' } });
    expect(screen.getByRole('status').textContent).toBe('No results');
    fireEvent.keyDown(field, { key: 'Escape' });
    expect((field as HTMLInputElement).value).toBe('');
    expect(screen.getByRole('menu')).toBeTruthy();
    fireEvent.change(field, { target: { value: 'cut' } });
    fireEvent.keyDown(field, { key: 'Enter' });
    expect(onSelect).toHaveBeenCalledTimes(1);
    expect(screen.queryByRole('menu')).toBeNull();
  });

  it('a custom filter, an empty menu, and loading', () => {
    const { rerender } = render(<Menu trigger={{ label: 'Actions' }} searchable filter={(item, q) => q === 'x' && (item as { label: string }).label === 'Cut'} items={items} />);
    open();
    fireEvent.change(screen.getByRole('searchbox'), { target: { value: 'x' } });
    expect(screen.getAllByRole('menuitem').map((r) => r.textContent)).toEqual(['Cut']);
    rerender(<Menu trigger={{ label: 'Actions' }} items={[]} emptyContent="Nothing here" />);
    expect(screen.getByRole('status').textContent).toBe('Nothing here');
    rerender(<Menu trigger={{ label: 'Actions' }} items={[]} loading labels={{ loading: 'Fetching' }} />);
    expect(screen.getByRole('status').textContent).toBe('Fetching');
    expect(screen.getByRole('menu').getAttribute('aria-busy')).toBe('true');
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
  slots: ['root', 'list', 'item', 'indicator', 'icon', 'text', 'label', 'description', 'end', 'shortcut', 'separator', 'group', 'header', 'footer'],
  dimension: { key: 'width', value: 240 },
  cssFile: 'packages/css/src/menu.css',
  meta: menuMeta,
  preset: { define: defineMenu as any, props: { items, defaultOpen: true } },
  hook: { use: useMenu as any, config: { items, defaultOpen: true } },
  render: (config) => (
    <Menu
      defaultOpen
      trigger={{ label: 'Actions' }}
      header="Header"
      footer="Footer"
      items={[{ label: 'Copy', icon: <svg />, shortcut: 'C', description: 'To the clipboard', endContent: '2' }, { type: 'checkbox', label: 'Wrap', checked: true }, { type: 'separator' }, { type: 'group', label: 'More', items: [{ label: 'Cut' }] }]}
      {...config}
    />
  ),
});
