import * as React from 'react';
import { describe, expect, it, vi } from 'vitest';
import { act, fireEvent, render, screen } from '@testing-library/react';
import { renderToString } from 'react-dom/server';
import { describePinfoldConformance } from '@pinfold/testing';
import { commandMeta, tagsMeta } from '@pinfold/core/meta';
import { PinfoldProvider } from '../provider';
import { Tags } from './Tags';
import { useTags } from './useTags';
import { defineTags } from './define';
import { Command } from '../command/Command';
import { useCommand } from '../command/useCommand';
import { defineCommand } from '../command/define';

describe('Tags', () => {
  it('tags to read: a named list; remove buttons say which tag; focus moves on', () => {
    const onRemove = vi.fn();
    function Filters() {
      const [items, setItems] = React.useState(['React', 'Vue', 'Svelte']);
      return <Tags label="Filters" items={items} onRemove={(v) => (onRemove(v), setItems((x) => x.filter((i) => i !== v)))} />;
    }
    render(<Filters />);
    expect(screen.getByRole('list', { name: 'Filters' }).children).toHaveLength(3);
    const remove = screen.getByRole('button', { name: 'Remove Vue' });
    remove.focus();
    fireEvent.click(remove);
    expect(onRemove).toHaveBeenCalledWith('Vue');
    expect(document.activeElement).toBe(screen.getByRole('button', { name: 'Remove Svelte' }));
  });

  it('tags to pick: a listbox, arrows move, Space picks, Delete removes', () => {
    const onChange = vi.fn();
    const onRemove = vi.fn();
    render(<Tags label="Topics" selection="multiple" items={['Design', 'Code', { value: 'Ops', disabled: true }]} onChange={onChange} onRemove={onRemove} />);
    const box = screen.getByRole('listbox', { name: 'Topics' });
    expect(box.getAttribute('aria-multiselectable')).toBe('true');
    const [design, code] = screen.getAllByRole('option');
    expect([design.tabIndex, code.tabIndex]).toEqual([0, -1]);
    design.focus();
    fireEvent.keyDown(design, { key: ' ' });
    expect(onChange).toHaveBeenLastCalledWith(['Design'], expect.anything());
    fireEvent.keyDown(design, { key: 'ArrowRight' });
    expect(document.activeElement).toBe(code);
    fireEvent.keyDown(code, { key: 'Delete' });
    expect(onRemove).toHaveBeenCalledWith('Code', expect.anything());
    expect(code.getAttribute('aria-keyshortcuts')).toBe('Delete');
  });

  it('a single choice can be unpicked; maxVisible folds the rest behind "+n"; links follow the router', () => {
    const navigate = vi.fn();
    const { rerender } = render(<Tags label="Size" selection="single" items={['S', 'M']} defaultValue={['S']} />);
    fireEvent.click(screen.getByRole('option', { name: 'S' }));
    expect(screen.getByRole('option', { name: 'S' }).getAttribute('aria-selected')).toBe('false');
    rerender(
      <PinfoldProvider navigate={navigate}>
        <Tags label="Links" maxVisible={1} items={[{ value: 'docs', href: '/docs' }, 'two', 'three']} />
      </PinfoldProvider>,
    );
    fireEvent.click(screen.getByRole('button', { name: /^\+2\s*Show all$/ }));
    expect(screen.getAllByRole('listitem')).toHaveLength(3);
    fireEvent.click(screen.getByRole('link', { name: 'docs' }));
    expect(navigate).toHaveBeenCalledWith('/docs');
  });
});

const commands = [
  { label: 'New file', shortcut: '⌘N', group: 'File' },
  { label: 'Open recent', group: 'File' },
  { label: 'Preferences', keywords: ['settings'], group: 'App' },
  { label: 'Sign out', group: 'App', disabled: true },
];

describe('Command', () => {
  it('inline: typing narrows by name or keyword; the first is active; Enter runs it', () => {
    const onSelect = vi.fn();
    render(<Command label="Commands" items={commands} onSelect={onSelect} />);
    const input = screen.getByRole('combobox', { name: 'Commands' });
    input.focus();
    fireEvent.change(input, { target: { value: 'sett' } });
    expect(screen.getAllByRole('option').map((o) => o.textContent)).toEqual(['Preferences']);
    fireEvent.keyDown(input, { key: 'Enter' });
    expect(onSelect).toHaveBeenCalledWith('Preferences', expect.anything());
    fireEvent.change(input, { target: { value: '' } });
    expect(screen.getAllByRole('group')).toHaveLength(2);
    expect(screen.getByText('⌘N').tagName).toBe('KBD');
    fireEvent.keyDown(input, { key: 'Escape' });
  });

  it('arrows skip disabled commands; nothing matching says so', () => {
    render(<Command label="Commands" items={commands} />);
    const input = screen.getByRole('combobox');
    input.focus();
    fireEvent.keyDown(input, { key: 'ArrowUp' });
    const active = () => document.getElementById(input.getAttribute('aria-activedescendant')!)!.textContent;
    expect(active()).toBe('Preferences');
    fireEvent.change(input, { target: { value: 'zzz' } });
    expect(screen.getByRole('listbox').textContent).toBe('No results');
  });

  it('dialog: the hotkey opens it, a command runs and closes it', () => {
    const onOpenChange = vi.fn();
    const run = vi.fn();
    render(<Command label="Commands" mode="dialog" items={[{ label: 'Reload', onSelect: run }]} onOpenChange={onOpenChange} />);
    expect(screen.queryByRole('combobox')).toBeNull();
    act(() => {
      fireEvent.keyDown(document, { key: 'k', ctrlKey: true });
    });
    expect(onOpenChange).toHaveBeenLastCalledWith(true);
    const input = screen.getByRole('combobox', { name: 'Commands' });
    fireEvent.keyDown(input, { key: 'Enter' });
    expect(run).toHaveBeenCalled();
    expect(onOpenChange).toHaveBeenLastCalledWith(false);
    expect(screen.queryByRole('combobox')).toBeNull();
  });

  it('renders on the server', () => {
    const Palette = defineCommand();
    expect(renderToString(<Palette label="Commands" items={['A']} />)).toContain('role="combobox"');
  });
});

describePinfoldConformance({
  name: 'tags',
  inherits: ['size'],
  slots: ['root', 'label', 'list', 'tag', 'text'],
  optionalSlots: ['body', 'icon', 'editInput', 'remove', 'more', 'add', 'empty'],
  cssFile: 'packages/css/src/tags.css',
  meta: tagsMeta,
  preset: { define: defineTags as any, props: { label: 'T', items: ['a'] } },
  hook: { use: useTags as any, config: { label: 'T', items: ['a'] } },
  render: (config) => <Tags label="T" items={['a', 'b']} {...config} />,
});

describePinfoldConformance({
  name: 'command',
  variants: false,
  slots: ['root', 'panel', 'search', 'searchIcon', 'input', 'list', 'option', 'footer'],
  optionalSlots: ['group', 'groupLabel', 'avatar', 'icon', 'detail', 'endContent', 'shortcut', 'empty', 'loadMore', 'hint', 'footerContent'],
  cssFile: 'packages/css/src/command.css',
  meta: commandMeta,
  preset: { define: defineCommand as any, props: { label: 'C', items: ['a'] } },
  hook: { use: useCommand as any, config: { label: 'C', items: ['a'] } },
  render: (config) => <Command label="C" items={['a', 'b']} {...config} />,
});
