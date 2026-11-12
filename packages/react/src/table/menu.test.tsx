import * as React from 'react';
import { describe, expect, it, vi } from 'vitest';
import { act, fireEvent, render, screen, within } from '@testing-library/react';
import { distinctValues, flattenTree, treeOrder } from '@pinfold/core';
import { Table } from './Table';
import { useTable } from './useTable';
import { defineTable } from './define';

type Person = { id: string; name: string };
type Task = { id: string; title: string; owner: Person | null; points: number; tags: string[]; due: string };
const ada: Person = { id: 'u1', name: 'Ada' };
const bo: Person = { id: 'u2', name: 'Bo' };
// Two people share a name: identity, not text, must tell them apart.
const ada2: Person = { id: 'u3', name: 'Ada' };
const tasks: Task[] = [
  { id: 't1', title: 'Design', owner: ada, points: 3, tags: ['ui'], due: '2026-11-03' },
  { id: 't2', title: 'Build', owner: bo, points: 8, tags: ['ui', 'api'], due: '2026-11-04' },
  { id: 't3', title: 'Test', owner: ada2, points: 5, tags: [], due: '2026-11-04' },
  { id: 't4', title: 'Ship', owner: null, points: 3, tags: ['ops'], due: '2026-11-09' },
];
const titles = () => Array.from(document.querySelectorAll('td[data-col="title"]')).map((td) => td.textContent);
const openMenu = (header: string) => fireEvent.click(screen.getByRole('button', { name: `${header} column` }));

describe('grid engine: value lists and trees', () => {
  it('lists distinct values with counts, sorted for the type, blanks last; a list value counts per entry', () => {
    const all = tasks.map((_, i) => i);
    expect(distinctValues(tasks, all, (t) => t.points, 'number').map((d) => [d.key, d.count])).toEqual([['3', 2], ['5', 1], ['8', 1]]);
    expect(distinctValues(tasks, all, (t) => t.tags).map((d) => [d.key, d.count])).toEqual([['api', 1], ['ops', 1], ['ui', 2], ['', 1]]);
    expect(distinctValues(tasks, all, (t) => t.due, 'date').map((d) => d.key)).toEqual(['2026-11-03', '2026-11-04', '2026-11-09']);
    const byId = distinctValues(tasks, all, (t) => t.owner, 'text', (v) => (v as Person).id);
    expect(byId.map((d) => [d.key, d.index])).toEqual([['u1', 0], ['u2', 1], ['u3', 2], ['', 3]]);
  });

  it('flattens nested rows and orders them: children under their parent, parents of matches kept, shut parents hide theirs', () => {
    type Node = { n: string; kids?: Node[] };
    const roots: Node[] = [{ n: 'a', kids: [{ n: 'a1' }, { n: 'a2', kids: [{ n: 'a2x' }] }] }, { n: 'b' }];
    const tree = flattenTree(roots, (r) => r.kids);
    expect(tree.rows.map((r) => r.n)).toEqual(['a', 'a1', 'a2', 'a2x', 'b']);
    expect(tree.depth).toEqual([0, 1, 1, 2, 0]);
    expect(tree.children).toEqual([2, 0, 1, 0, 0]);
    const name = (list: number[]) => list.map((i) => tree.rows[i].n);
    expect(name(treeOrder(tree, [0, 1, 2, 3, 4], () => true))).toEqual(['a', 'a1', 'a2', 'a2x', 'b']);
    expect(name(treeOrder(tree, [0, 1, 2, 3, 4], (i) => i !== 2))).toEqual(['a', 'a1', 'a2', 'b']);
    // Sorted descending: siblings reverse, children stay under their parent.
    expect(name(treeOrder(tree, [4, 3, 2, 1, 0], () => true))).toEqual(['b', 'a', 'a2', 'a2x', 'a1']);
    // Only a2x passes: its ancestors stay.
    expect(name(treeOrder(tree, [3], () => true))).toEqual(['a', 'a2', 'a2x']);
  });
});

describe('Table column menu', () => {
  const columns = [
    'title',
    { key: 'owner', filterKey: (v: unknown) => (v as Person).id, cell: ({ row }: { row: Task }) => (row.owner ? <span data-person={row.owner.id}>{row.owner.name}</span> : null) },
    'points',
    'tags',
  ] as const;

  it('opens from the header button as a named dialog; Escape closes it and focus returns', () => {
    render(<Table label="Tasks" rows={tasks} sortable filterable columns={columns as never} />);
    const button = screen.getByRole('button', { name: 'Title column' });
    expect(button.getAttribute('aria-expanded')).toBe('false');
    fireEvent.click(button);
    expect(screen.getByRole('dialog', { name: 'Title column' })).toBeTruthy();
    expect(button.getAttribute('aria-expanded')).toBe('true');
    fireEvent.keyDown(document, { key: 'Escape' });
    expect(screen.queryByRole('dialog')).toBeNull();
  });

  it('sorts, pins and hides from the menu', () => {
    const onColumnStateChange = vi.fn();
    render(<Table label="Tasks" rows={tasks} sortable columns={['title', 'points']} onColumnStateChange={onColumnStateChange} />);
    openMenu('Points');
    fireEvent.click(screen.getByRole('button', { name: 'Sort high to low' }));
    expect(titles()).toEqual(['Build', 'Test', 'Design', 'Ship']);
    expect(screen.queryByRole('dialog')).toBeNull();
    openMenu('Points');
    fireEvent.click(screen.getByRole('button', { name: 'Pin to the start' }));
    expect(screen.getByRole('columnheader', { name: /Points/ }).getAttribute('data-pinned')).toBe('start');
    openMenu('Title');
    fireEvent.click(screen.getByRole('button', { name: 'Hide column' }));
    expect(screen.queryByRole('columnheader', { name: /Title/ })).toBeNull();
    expect(onColumnStateChange).toHaveBeenLastCalledWith(expect.objectContaining({ hidden: ['title'] }));
  });

  it('filters by a searchable list of the column\'s values, drawn as its cells draw them, keyed by identity', () => {
    const onFiltersChange = vi.fn();
    render(<Table label="Tasks" rows={tasks} filterable columns={columns as never} onFiltersChange={onFiltersChange} />);
    openMenu('Owner');
    const dialog = screen.getByRole('dialog', { name: 'Owner column' });
    // Three people and the blanks; the two Adas are two entries, each drawn by the cell renderer.
    const values = within(within(dialog).getByRole('group', { name: 'Values' })).getAllByRole('checkbox');
    expect(values).toHaveLength(4);
    expect(dialog.querySelectorAll('[data-person]')).toHaveLength(3);
    expect(within(dialog).getByText('(Blanks)')).toBeTruthy();
    // Untick the first Ada: the other Ada stays.
    fireEvent.click(values[0]);
    expect(onFiltersChange).toHaveBeenLastCalledWith([{ key: 'owner', op: 'in', value: ['u2', 'u3', ''] }]);
    expect(titles()).toEqual(['Build', 'Test', 'Ship']);
    expect(screen.getByRole('button', { name: 'Owner column' }).hasAttribute('data-filtered')).toBe(true);
    // Everything ticked again is no filter.
    fireEvent.click(within(dialog).getByRole('checkbox', { name: /Select all/ }));
    expect(onFiltersChange).toHaveBeenLastCalledWith([]);
    expect(titles()).toHaveLength(4);
  });

  it('a value list only offers what the other filters let through; a condition filters by type', () => {
    vi.useFakeTimers();
    render(<Table label="Tasks" rows={tasks} filterable defaultFilters={[{ key: 'points', op: 'gt', value: 3 }]} columns={['title', 'points', 'tags']} />);
    expect(titles()).toEqual(['Build', 'Test']);
    openMenu('Tags');
    const list = within(screen.getByRole('dialog')).getByRole('group', { name: 'Values' });
    // "ops" belongs to a row the points filter removed.
    expect(within(list).queryByText('ops')).toBeNull();
    expect(within(list).getByText('api')).toBeTruthy();
    fireEvent.keyDown(document, { key: 'Escape' });
    openMenu('Points');
    const dialog = screen.getByRole('dialog');
    fireEvent.change(within(dialog).getByRole('combobox'), { target: { value: 'between' } });
    fireEvent.change(within(dialog).getByRole('spinbutton', { name: /value/ }), { target: { value: '4' } });
    act(() => void vi.advanceTimersByTime(300));
    fireEvent.change(within(screen.getByRole('dialog')).getByRole('spinbutton', { name: /: to/ }), { target: { value: '6' } });
    act(() => void vi.advanceTimersByTime(300));
    vi.useRealTimers();
    expect(titles()).toEqual(['Test']);
    fireEvent.click(within(screen.getByRole('dialog')).getByRole('button', { name: 'Clear filter' }));
    expect(titles()).toHaveLength(4);
  });

  it('shows the active filters as chips in the toolbar; a chip removes its filter', () => {
    render(<Table label="Tasks" rows={tasks} filterable toolbar defaultFilters={[{ key: 'title', op: 'in', value: ['Design', 'Build', 'Test'] }, { key: 'points', op: 'gte', value: 5 }]} columns={['title', 'points']} />);
    const chips = screen.getByRole('group', { name: 'Filters' });
    expect(chips.textContent).toContain('Design, Build +1');
    expect(chips.textContent).toContain('≥ 5');
    fireEvent.click(within(chips).getByRole('button', { name: 'Clear filter: Points' }));
    expect(titles()).toEqual(['Design', 'Build', 'Test']);
    fireEvent.click(within(chips).getByRole('button', { name: 'Clear filter: Title' }));
    expect(screen.queryByRole('group', { name: 'Filters' })).toBeNull();
  });

  it('groups from the menu when groupable', () => {
    const onGroupByChange = vi.fn();
    render(<Table label="Tasks" rows={tasks} groupable columns={['title', 'points']} onGroupByChange={onGroupByChange} />);
    openMenu('Points');
    fireEvent.click(screen.getByRole('button', { name: 'Group by this column' }));
    expect(onGroupByChange).toHaveBeenCalledWith('points');
    expect(document.querySelectorAll('tr[data-group]')).toHaveLength(3);
  });
});

describe('Table rows under rows', () => {
  type Node = { id: string; name: string; size: number; children?: Node[] };
  const files: Node[] = [
    { id: 'src', name: 'src', size: 0, children: [{ id: 'a', name: 'a.ts', size: 30 }, { id: 'lib', name: 'lib', size: 0, children: [{ id: 'b', name: 'b.ts', size: 10 }] }] },
    { id: 'readme', name: 'README.md', size: 20 },
  ];
  const shown = () => Array.from(document.querySelectorAll('td[data-col="name"]')).map((td) => td.textContent);

  it('opens to any depth; rows carry their level; filters keep the parents of a match', () => {
    render(<Table label="Files" rows={files} getSubRows={(r) => r.children} filterable columns={['name', 'size']} />);
    expect(shown()).toEqual(['src', 'README.md']);
    const src = screen.getByRole('row', { name: /src/ });
    expect(src.getAttribute('aria-level')).toBe('1');
    expect(src.getAttribute('aria-expanded')).toBe('false');
    fireEvent.click(within(src).getByRole('button', { name: 'Show details' }));
    expect(shown()).toEqual(['src', 'a.ts', 'lib', 'README.md']);
    fireEvent.click(within(screen.getByRole('row', { name: /lib/ })).getByRole('button', { name: 'Show details' }));
    expect(shown()).toEqual(['src', 'a.ts', 'lib', 'b.ts', 'README.md']);
    expect(screen.getByRole('row', { name: /b\.ts/ }).getAttribute('aria-level')).toBe('3');
  });

  it('a controller opens and closes every row; children sort under their parent', () => {
    let api: ReturnType<typeof useTable> | undefined;
    function Files() {
      api = useTable({ label: 'Files', rows: files, getSubRows: (r: Node) => r.children, defaultSort: { key: 'name', direction: 'descending' }, columns: ['name', 'size'] });
      const T = api;
      return <T />;
    }
    render(<Files />);
    act(() => api!.expandAll());
    expect(shown()).toEqual(['src', 'lib', 'b.ts', 'a.ts', 'README.md']);
    act(() => api!.collapseAll());
    expect(shown()).toEqual(['src', 'README.md']);
  });

  it('a row opens a table of its own, which opens another; each is its own instance', () => {
    const customers = [{ id: 'c1', name: 'Ada', orders: [{ id: 'o1', total: 5, items: [{ id: 'i1', sku: 'A' }] }] }];
    const Grid = defineTable<any>({});
    render(
      <Grid
        label="Customers"
        rows={customers}
        defaultExpanded={['c1']}
        columns={['name']}
        subTable={(c: any) => ({ label: 'Orders', rows: c.orders, columns: ['id', 'total'], defaultExpanded: ['o1'], subTable: (o: any) => ({ label: 'Items', rows: o.items, columns: ['sku'] }) })}
      />,
    );
    expect(screen.getAllByRole('table').length + screen.getAllByRole('grid').length).toBe(3);
    expect(screen.getByText('A')).toBeTruthy();
    const ids = Array.from(document.querySelectorAll('[id]')).map((el) => el.id);
    expect(new Set(ids).size).toBe(ids.length);
  });
});

describe('Table rows that move and take your props', () => {
  it('Alt + arrows on the handle move a row and hand back the new order; sorting pauses it', () => {
    const onRowReorder = vi.fn();
    const { rerender } = render(<Table label="Queue" rows={tasks} reorderableRows onRowReorder={onRowReorder} columns={['title']} />);
    const handle = screen.getByRole('button', { name: 'Drag to reorder: Design' });
    fireEvent.keyDown(handle, { key: 'ArrowDown', altKey: true });
    expect(onRowReorder).toHaveBeenCalledTimes(1);
    expect(onRowReorder.mock.calls[0][0]).toMatchObject({ rowKey: 't1', from: 0, to: 1 });
    expect(onRowReorder.mock.calls[0][0].rows.map((t: Task) => t.id)).toEqual(['t2', 't1', 't3', 't4']);
    rerender(<Table label="Queue" rows={tasks} reorderableRows onRowReorder={onRowReorder} sort={{ key: 'title', direction: 'ascending' }} columns={['title']} />);
    const paused = screen.getByRole('button', { name: 'Drag to reorder: Design' });
    expect(paused.getAttribute('aria-disabled')).toBe('true');
    fireEvent.keyDown(paused, { key: 'ArrowDown', altKey: true });
    expect(onRowReorder).toHaveBeenCalledTimes(1);
  });

  it('rowProps and cellProps reach the elements; handlers chain with the table\'s own; onCellClick reports the cell', () => {
    const onDoubleClick = vi.fn();
    const onRowAction = vi.fn();
    const onClick = vi.fn();
    const onCellClick = vi.fn();
    render(
      <Table
        label="Tasks"
        rows={tasks}
        columns={['title', 'points']}
        onRowAction={onRowAction}
        onCellClick={onCellClick}
        rowProps={({ row, rowIndex }) => ({ 'data-owner': row.owner?.id ?? 'none', 'data-at': rowIndex, onDoubleClick, onClick })}
        cellProps={({ column, value }) => ({ 'data-big': column.key === 'points' && (value as number) > 4 ? '' : undefined })}
      />,
    );
    const row = document.querySelector('tr[data-row-key="t2"]') as HTMLElement;
    expect(row.getAttribute('data-owner')).toBe('u2');
    expect(row.getAttribute('data-at')).toBe('1');
    fireEvent.doubleClick(row);
    expect(onDoubleClick).toHaveBeenCalledTimes(1);
    fireEvent.click(row.querySelector('td[data-col="points"]')!);
    expect(onRowAction).toHaveBeenCalledTimes(1);
    expect(onClick).toHaveBeenCalledTimes(1);
    expect(onCellClick.mock.calls[0][0]).toMatchObject({ rowKey: 't2', value: 8 });
    expect(document.querySelectorAll('td[data-big]')).toHaveLength(2);
  });

  it('a custom expand icon gets the row\'s state', () => {
    render(<Table label="Tasks" rows={tasks} columns={['title']} renderDetail={(t) => <p>{t.due}</p>} expandIcon={({ expanded }) => <span data-icon={expanded ? 'minus' : 'plus'} />} />);
    expect(document.querySelectorAll('[data-icon="plus"]')).toHaveLength(4);
    fireEvent.click(screen.getAllByRole('button', { name: 'Show details' })[0]);
    expect(document.querySelectorAll('[data-icon="minus"]')).toHaveLength(1);
    expect(screen.getByText('2026-11-03')).toBeTruthy();
  });
});
