import * as React from 'react';
import { describe, expect, it, vi } from 'vitest';
import { act, fireEvent, render, screen } from '@testing-library/react';
import { describePinfoldConformance } from '@pinfold/testing';
import { treeviewMeta } from '@pinfold/core/meta';
import { TreeView } from './TreeView';
import { useTreeView } from './useTreeView';
import { defineTreeView } from './define';
import type { TreeViewItemInput } from './types';

const files: TreeViewItemInput[] = [
  { label: 'src', icon: '📁', children: [{ label: 'components', children: ['Button.tsx', 'Card.tsx'] }, 'index.ts', 'app.tsx'] },
  { label: 'docs', children: ['intro.md'] },
  { label: 'package.json', badge: 3 },
];
const row = (name: string) => screen.getByRole('treeitem', { name: new RegExp(`^${name}`) });
const key = (k: string, extra: Record<string, unknown> = {}) => fireEvent.keyDown(document.activeElement!, { key: k, ...extra });

describe('TreeView', () => {
  it('is a named tree of rows with level, set size and position; one row is in the tab order', () => {
    render(<TreeView label="Files" items={files} defaultExpanded={['src']} />);
    const tree = screen.getByRole('tree', { name: 'Files' });
    expect(tree).toBeTruthy();
    const items = screen.getAllByRole('treeitem');
    expect(items.map((i) => i.textContent)).toEqual(['📁src', 'components', 'index.ts', 'app.tsx', 'docs', 'package.json3']);
    expect(row('src').getAttribute('aria-expanded')).toBe('true');
    expect(row('docs').getAttribute('aria-expanded')).toBe('false');
    expect(row('index.ts').getAttribute('aria-expanded')).toBeNull();
    expect(row('index.ts').getAttribute('aria-level')).toBe('2');
    expect(row('index.ts').getAttribute('aria-setsize')).toBe('3');
    expect(row('index.ts').getAttribute('aria-posinset')).toBe('2');
    expect(row('src').getAttribute('aria-selected')).toBe('false');
    expect(items.filter((i) => i.tabIndex === 0)).toHaveLength(1);
  });

  it('follows the APG keyboard: arrows, right/left open and close, Home/End, * and typeahead', () => {
    const onExpandedChange = vi.fn();
    render(<TreeView label="Files" items={files} onExpandedChange={onExpandedChange} />);
    act(() => row('src').focus());
    key('ArrowRight');
    expect(onExpandedChange).toHaveBeenLastCalledWith(['src'], { id: 'src', expanded: true });
    key('ArrowRight');
    expect(document.activeElement).toBe(row('components'));
    key('ArrowDown');
    expect(document.activeElement).toBe(row('index.ts'));
    key('ArrowLeft');
    expect(document.activeElement).toBe(row('src'));
    key('ArrowLeft');
    expect(row('src').getAttribute('aria-expanded')).toBe('false');
    key('End');
    expect(document.activeElement).toBe(row('package.json'));
    key('Home');
    expect(document.activeElement).toBe(row('src'));
    key('*');
    expect(row('src').getAttribute('aria-expanded')).toBe('true');
    expect(row('docs').getAttribute('aria-expanded')).toBe('true');
    key('p');
    expect(document.activeElement).toBe(row('package.json'));
  });

  it('a closed parent hands the focus to itself when the row inside had it', () => {
    render(<TreeView label="Files" items={files} defaultExpanded={['src']} />);
    act(() => row('index.ts').focus());
    fireEvent.click(row('src').querySelector('.pinfold-treeview__toggle')!);
    expect(screen.queryByRole('treeitem', { name: 'index.ts' })).toBeNull();
  });

  it('selects one row by click, Enter and Space, runs onAction, and is controlled by value', () => {
    const onSelectionChange = vi.fn();
    const onAction = vi.fn();
    const { rerender } = render(<TreeView label="Files" items={files} onSelectionChange={onSelectionChange} onAction={onAction} />);
    fireEvent.click(row('package.json'));
    expect(onSelectionChange).toHaveBeenLastCalledWith(['package.json'], expect.objectContaining({ id: 'package.json' }));
    expect(onAction).toHaveBeenLastCalledWith('package.json', expect.objectContaining({ depth: 0 }));
    expect(row('package.json').getAttribute('aria-selected')).toBe('true');
    // A parent row opens on press too.
    fireEvent.click(row('docs'));
    expect(row('docs').getAttribute('aria-expanded')).toBe('true');
    act(() => row('intro.md').focus());
    key('Enter');
    expect(onSelectionChange).toHaveBeenLastCalledWith(['docs/intro.md'], expect.anything());
    rerender(<TreeView label="Files" items={files} value={['src']} onSelectionChange={onSelectionChange} />);
    expect(row('src').getAttribute('aria-selected')).toBe('true');
    fireEvent.click(row('package.json'));
    expect(row('src').getAttribute('aria-selected')).toBe('true');
  });

  it('multiple: Ctrl + click toggles, Shift + click selects a range, Shift + arrows extend, Ctrl + A takes all', () => {
    const onSelectionChange = vi.fn();
    render(<TreeView label="Files" selectionMode="multiple" items={['a', 'b', 'c', 'd']} onSelectionChange={onSelectionChange} />);
    expect(screen.getByRole('tree').getAttribute('aria-multiselectable')).toBe('true');
    fireEvent.click(row('a'));
    fireEvent.click(row('c'), { ctrlKey: true });
    expect(onSelectionChange).toHaveBeenLastCalledWith(['a', 'c'], expect.anything());
    fireEvent.click(row('d'), { shiftKey: true });
    expect(onSelectionChange).toHaveBeenLastCalledWith(['a', 'c', 'd'], expect.anything());
    fireEvent.click(row('a'));
    act(() => row('a').focus());
    key('ArrowDown', { shiftKey: true });
    expect(onSelectionChange).toHaveBeenLastCalledWith(['a', 'b'], expect.anything());
    key('a', { ctrlKey: true });
    expect(onSelectionChange).toHaveBeenLastCalledWith(['a', 'b', 'c', 'd'], expect.anything());
  });

  it('checkable: a parent checks its children and shows mixed from them; disabled rows do not change', () => {
    const onSelectionChange = vi.fn();
    render(<TreeView label="Perms" checkable defaultExpanded={['src', 'src/components']} items={files} onSelectionChange={onSelectionChange} />);
    expect(row('src').getAttribute('aria-checked')).toBe('false');
    expect(row('src').getAttribute('aria-selected')).toBeNull();
    fireEvent.click(row('Button.tsx'));
    expect(row('components').getAttribute('aria-checked')).toBe('mixed');
    expect(row('src').getAttribute('aria-checked')).toBe('mixed');
    fireEvent.click(row('src'));
    expect(row('src').getAttribute('aria-checked')).toBe('true');
    expect(onSelectionChange.mock.lastCall![0]).toEqual(['src', 'src/components', 'src/components/Button.tsx', 'src/components/Card.tsx', 'src/index.ts', 'src/app.tsx']);
    act(() => row('index.ts').focus());
    key(' ');
    expect(row('src').getAttribute('aria-checked')).toBe('mixed');
  });

  it('disabled rows stay focusable but do not select', () => {
    const onSelectionChange = vi.fn();
    render(<TreeView label="Files" items={['a', { label: 'b', disabled: true }]} onSelectionChange={onSelectionChange} />);
    fireEvent.click(row('b'));
    expect(onSelectionChange).not.toHaveBeenCalled();
    expect(row('b').getAttribute('aria-disabled')).toBe('true');
  });

  it('loads children on demand with a loading row, and an error row that retries', async () => {
    let fail = true;
    const loadChildren = vi.fn(async (_item: unknown, _o: { signal: AbortSignal }) => {
      if (fail) throw new Error('offline');
      return ['child.txt'];
    });
    const onLoadError = vi.fn();
    render(<TreeView label="Drive" items={[{ id: 'root', label: 'Drive', hasChildren: true }]} loadChildren={loadChildren} onLoadError={onLoadError} />);
    fireEvent.click(row('Drive'));
    expect(row('Drive').getAttribute('aria-busy')).toBe('true');
    expect(screen.getByRole('treeitem', { name: 'Loading…' })).toBeTruthy();
    await vi.waitFor(() => expect(screen.getByRole('treeitem', { name: /Couldn't load/ })).toBeTruthy());
    expect(onLoadError).toHaveBeenCalledWith(expect.objectContaining({ id: 'root' }), expect.any(Error));
    expect(loadChildren.mock.calls[0]![1].signal).toBeInstanceOf(AbortSignal);
    fail = false;
    act(() => screen.getByRole('treeitem', { name: /Couldn't load/ }).focus());
    key('Enter');
    await vi.waitFor(() => expect(row('child.txt')).toBeTruthy());
    expect(row('child.txt').getAttribute('aria-level')).toBe('2');
  });

  it('aborts a load on unmount', () => {
    let signal: AbortSignal | undefined;
    const { unmount } = render(<TreeView label="Drive" defaultExpanded={['r']} items={[{ id: 'r', label: 'R', hasChildren: true }]} loadChildren={(_, o) => ((signal = o.signal), new Promise(() => {}))} />);
    expect(signal!.aborted).toBe(false);
    unmount();
    expect(signal!.aborted).toBe(true);
  });

  it('searches: keeps the path to every match, marks it, and says when nothing matches', () => {
    const onFilterChange = vi.fn();
    render(<TreeView label="Files" searchable items={files} onFilterChange={onFilterChange} />);
    const search = screen.getByRole('searchbox', { name: 'Search' });
    fireEvent.change(search, { target: { value: 'card' } });
    expect(onFilterChange).toHaveBeenLastCalledWith('card');
    expect(screen.getAllByRole('treeitem').map((i) => i.textContent)).toEqual(['📁src', 'components', 'Card.tsx']);
    expect(document.querySelector('mark')!.textContent).toBe('Card');
    fireEvent.keyDown(search, { key: 'ArrowDown' });
    expect(document.activeElement).toBe(row('src'));
    fireEvent.change(search, { target: { value: 'zzz' } });
    expect(screen.getByRole('status').textContent).toBe('No matches');
  });

  it('reorders with Alt + arrows, announces it and calls onMove with the new tree', () => {
    const onMove = vi.fn();
    render(<TreeView label="Pages" reorderable items={[{ label: 'A', children: [] }, 'B', 'C']} onMove={onMove} />);
    act(() => row('C').focus());
    key('ArrowUp', { altKey: true });
    expect(screen.getAllByRole('treeitem').map((i) => i.textContent)).toEqual(['A', 'C', 'B']);
    expect(onMove).toHaveBeenLastCalledWith(expect.objectContaining({ id: 'C', parentId: null, index: 1 }));
    expect(document.activeElement).toBe(row('C'));
    expect(document.querySelector('[aria-live]')!.textContent).toBe('Moved C to position 2 of 3');
    key('ArrowUp', { altKey: true });
    key('ArrowDown', { altKey: true });
    // Into A (the sibling before it), then back out.
    key('ArrowRight', { altKey: true });
    expect(onMove).toHaveBeenLastCalledWith(expect.objectContaining({ id: 'C', parentId: 'A', index: 0 }));
    expect(row('C').getAttribute('aria-level')).toBe('2');
    key('ArrowLeft', { altKey: true });
    expect(onMove).toHaveBeenLastCalledWith(expect.objectContaining({ id: 'C', parentId: null, index: 1 }));
  });

  it('renderItem and rowProps reach every row with its state; render.item gets the item', () => {
    render(
      <TreeView
        label="Files"
        items={['a', 'b']}
        rowProps={(item) => ({ 'data-row': item.id })}
        renderItem={({ item, children }) => (
          <>
            {children}
            <em>{item.depth}</em>
          </>
        )}
        render={{ item: ({ props, children, item }) => <div {...props} data-custom={item!.id}>{children}</div> }}
      />,
    );
    expect(row('a').getAttribute('data-row')).toBe('a');
    expect(row('a').getAttribute('data-custom')).toBe('a');
    expect(row('a').querySelector('em')!.textContent).toBe('0');
  });

  it('the controller opens, selects and moves; its Search part filters', () => {
    let api: ReturnType<typeof useTreeView> | undefined;
    function App() {
      api = useTreeView({ label: 'Files', items: files });
      const Tree = api;
      return (
        <>
          <Tree.Search aria-label="Find" />
          <Tree />
        </>
      );
    }
    render(<App />);
    act(() => api!.expandAll());
    expect(api!.expanded).toEqual(['src', 'src/components', 'docs']);
    act(() => api!.select('docs'));
    expect(api!.value).toEqual(['docs']);
    act(() => api!.move('docs', null, 0));
    expect(api!.visible[0].id).toBe('docs');
    fireEvent.change(screen.getByRole('searchbox', { name: 'Find' }), { target: { value: 'intro' } });
    expect(api!.visible.map((v) => v.id)).toEqual(['docs', 'docs/intro.md']);
    act(() => api!.collapseAll());
  });
});

describePinfoldConformance({
  name: 'treeview',
  slots: ['root', 'tree', 'item', 'guide', 'toggle', 'icon', 'label', 'badge'],
  optionalSlots: ['search', 'checkbox', 'match', 'handle', 'status', 'empty'],
  dimension: { key: 'indent', value: 24 },
  cssFile: 'packages/css/src/treeview.css',
  meta: treeviewMeta,
  preset: { define: defineTreeView as any, props: { label: 'Files', items: files } },
  hook: { use: useTreeView as any, config: { label: 'Files', items: files } },
  render: (config) => <TreeView label="Files" items={files} defaultExpanded={['src']} {...config} />,
});
