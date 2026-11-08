import * as React from 'react';
import { describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen, within } from '@testing-library/react';
import { renderToString } from 'react-dom/server';
import { describePinfoldConformance } from '@pinfold/testing';
import { tableMeta } from '@pinfold/core/meta';
import { Table } from './Table';
import { useTable } from './useTable';
import { defineTable } from './define';

const people = [
  { id: 'a', name: 'Item 10', age: 31 },
  { id: 'b', name: 'Item 2', age: 25 },
  { id: 'c', name: 'Item 1', age: 40 },
];

describe('Table', () => {
  it('a real table with a caption; columns from the first row\'s keys, headers made readable', () => {
    render(<Table label="People" rows={people} />);
    const table = screen.getByRole('table', { name: 'People' });
    expect(within(table).getAllByRole('columnheader').map((h) => h.textContent)).toEqual(['Id', 'Name', 'Age']);
    expect(within(table).getAllByRole('row')).toHaveLength(4);
    expect(screen.getByRole('region', { name: 'People' }).tabIndex).toBe(0);
  });

  it('a sortable header cycles ascending, descending, off; text sorts naturally; aria-sort follows', () => {
    const onSortChange = vi.fn();
    render(<Table label="People" rows={people} columns={[{ key: 'name', sortable: true }]} onSortChange={onSortChange} />);
    const header = screen.getByRole('columnheader', { name: 'Name' });
    const button = within(header).getByRole('button');
    expect(header.getAttribute('aria-sort')).toBe('none');
    fireEvent.click(button);
    expect(header.getAttribute('aria-sort')).toBe('ascending');
    expect(screen.getAllByRole('cell').map((c) => c.textContent)).toEqual(['Item 1', 'Item 2', 'Item 10']);
    fireEvent.click(button);
    expect(screen.getAllByRole('cell').map((c) => c.textContent)).toEqual(['Item 10', 'Item 2', 'Item 1']);
    fireEvent.click(button);
    expect(onSortChange).toHaveBeenLastCalledWith(null);
    expect(screen.getAllByRole('cell').map((c) => c.textContent)).toEqual(['Item 10', 'Item 2', 'Item 1']);
  });

  it('multiple selection: named boxes, a page box that goes mixed, chosen rows marked', () => {
    const onSelectionChange = vi.fn();
    render(<Table label="People" rows={people} columns={['name']} selection="multiple" onSelectionChange={onSelectionChange} />);
    fireEvent.click(screen.getByRole('checkbox', { name: 'Select Item 2' }));
    expect(onSelectionChange).toHaveBeenLastCalledWith(['b']);
    const all = screen.getByRole('checkbox', { name: 'Select all rows on this page' }) as HTMLInputElement;
    expect(all.indeterminate).toBe(true);
    fireEvent.click(all);
    expect(onSelectionChange).toHaveBeenLastCalledWith(['b', 'a', 'c']);
    expect(screen.getAllByRole('row')[1].getAttribute('aria-selected')).toBe('true');
  });

  it('pages its rows with Pagination; a server total pages without slicing', () => {
    const onPageChange = vi.fn();
    const { rerender } = render(<Table label="People" rows={people} columns={['name']} pageSize={2} onPageChange={onPageChange} />);
    expect(screen.getAllByRole('row')).toHaveLength(3);
    fireEvent.click(screen.getByRole('button', { name: 'Page 2' }));
    expect(onPageChange).toHaveBeenCalledWith(2);
    expect(screen.getAllByRole('cell').map((c) => c.textContent)).toEqual(['Item 1']);
    rerender(<Table label="People" rows={people} columns={['name']} pageSize={3} total={30} />);
    expect(screen.getAllByRole('row')).toHaveLength(4);
    expect(screen.getByRole('button', { name: 'Page 10' })).toBeTruthy();
    expect(screen.getByRole('table').getAttribute('aria-rowcount')).toBe('31');
  });

  it('loading with no rows shimmers and is busy; empty says so; row actions take Enter', () => {
    const onRowAction = vi.fn();
    const { rerender, container } = render(<Table label="People" rows={[]} columns={['name']} loading />);
    expect(screen.getByRole('table').getAttribute('aria-busy')).toBe('true');
    expect(container.querySelectorAll('.pinfold-table__loading').length).toBeGreaterThan(0);
    rerender(<Table label="People" rows={[]} columns={['name']} />);
    expect(screen.getByRole('cell').textContent).toBe('Nothing to show');
    rerender(<Table label="People" rows={people} columns={['name']} onRowAction={onRowAction} />);
    const row = screen.getAllByRole('row')[1];
    row.focus();
    fireEvent.keyDown(row, { key: 'Enter' });
    expect(onRowAction).toHaveBeenCalledWith(people[0], expect.anything());
    expect(renderToString(React.createElement(defineTable({ striped: true }), { label: 'P', rows: people }))).toContain('data-striped');
  });
});

describePinfoldConformance({
  name: 'table',
  slots: ['root', 'caption', 'scroll', 'table', 'head', 'header', 'body', 'row', 'cell'],
  optionalSlots: ['sort', 'select', 'empty', 'loading', 'footer'],
  cssFile: 'packages/css/src/table.css',
  meta: tableMeta,
  preset: { define: defineTable as any, props: { label: 'P', rows: people } },
  hook: { use: useTable as any, config: { label: 'P', rows: people } },
  render: (config) => <Table label="P" rows={people} {...config} />,
});
