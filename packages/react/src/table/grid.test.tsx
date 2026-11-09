import * as React from 'react';
import { describe, expect, it, vi } from 'vitest';
import { act, fireEvent, render, screen, within } from '@testing-library/react';
import { Table } from './Table';
import { useTable } from './useTable';
import type { TableColumn } from './types';

type Order = { id: string; customer: { name: string; city: string }; total: number; placed: string; paid: boolean; status: string };
const orders: Order[] = [
  { id: 'o1', customer: { name: 'Émile', city: 'Paris' }, total: 120, placed: '2026-11-03', paid: true, status: 'shipped' },
  { id: 'o2', customer: { name: 'Ada', city: 'Oslo' }, total: 80, placed: '2026-10-21', paid: false, status: 'pending' },
  { id: 'o3', customer: { name: 'Bo', city: 'Paris' }, total: 80, placed: '2026-11-05', paid: true, status: 'shipped' },
  { id: 'o4', customer: { name: 'Cy', city: 'Rome' }, total: 1200, placed: '2025-01-02', paid: false, status: 'returned' },
];
const names = () => Array.from(document.querySelectorAll('td[data-col="customer.name"]')).map((td) => td.textContent);

describe('Table as a data grid', () => {
  it('paths into objects, types from values, formatting, a header from the path', () => {
    render(<Table label="Orders" rows={orders} columns={['customer.name', { key: 'total', format: { style: 'currency', currency: 'USD', maximumFractionDigits: 0 } }, 'paid']} />);
    expect(screen.getByRole('columnheader', { name: 'Customer name' })).toBeTruthy();
    expect(names()).toEqual(['Émile', 'Ada', 'Bo', 'Cy']);
    expect(document.querySelector('td[data-col="total"]')!.textContent).toBe('$120');
    expect(document.querySelector('td[data-col="total"]')!.getAttribute('data-align')).toBe('end');
    expect(document.querySelector('td[data-col="paid"]')!.textContent).toBe('Yes');
  });

  it('sorts by several keys with Shift; the order is numbered and announced', () => {
    const onSortChange = vi.fn();
    render(<Table label="Orders" rows={orders} sortable columns={['customer.name', 'total']} onSortChange={onSortChange} />);
    fireEvent.click(within(screen.getByRole('columnheader', { name: /Total/ })).getByRole('button'));
    fireEvent.click(within(screen.getByRole('columnheader', { name: /Customer name/ })).getByRole('button'), { shiftKey: true });
    expect(onSortChange).toHaveBeenLastCalledWith([
      { key: 'total', direction: 'ascending' },
      { key: 'customer.name', direction: 'ascending' },
    ]);
    expect(names()).toEqual(['Ada', 'Bo', 'Émile', 'Cy']);
    expect(screen.getByRole('status').textContent).toBe('Total, ascending, then 1 more');
    expect(screen.getByRole('columnheader', { name: /Customer name/ }).textContent).toContain('2');
  });

  it('the filter row filters by type: text, number range, a value list, yes or no', async () => {
    vi.useFakeTimers();
    const onFiltersChange = vi.fn();
    render(<Table label="Orders" rows={orders} filterable columns={['customer.name', 'total', 'paid', { key: 'status', type: 'enum' }]} onFiltersChange={onFiltersChange} />);
    fireEvent.change(screen.getByRole('searchbox', { name: 'Filter Customer name' }), { target: { value: 'emi' } });
    await act(async () => {
      await vi.advanceTimersByTimeAsync(250);
    });
    expect(names()).toEqual(['Émile']);
    fireEvent.change(screen.getByRole('searchbox', { name: 'Filter Customer name' }), { target: { value: '' } });
    fireEvent.change(screen.getByRole('spinbutton', { name: 'Filter Total from' }), { target: { value: '100' } });
    await act(async () => {
      await vi.advanceTimersByTimeAsync(250);
    });
    expect(names()).toEqual(['Émile', 'Cy']);
    fireEvent.change(screen.getByRole('combobox', { name: 'Filter Paid' }), { target: { value: 'false' } });
    expect(names()).toEqual(['Cy']);
    expect(onFiltersChange).toHaveBeenLastCalledWith([
      { key: 'total', op: 'between', value: ['100', ''] },
      { key: 'paid', op: 'equals', value: false },
    ]);
    const status = screen.getByRole('combobox', { name: 'Filter Status' }) as HTMLSelectElement;
    expect([...status.options].map((o) => o.value)).toEqual(['', 'pending', 'returned', 'shipped']);
    vi.useRealTimers();
  });

  it('a toolbar: quick search across columns, columns to hide and pin, CSV of what is shown', async () => {
    vi.useFakeTimers();
    let api: ReturnType<typeof useTable> | null = null;
    function Grid() {
      const T = useTable({ label: 'Orders', rows: orders, toolbar: { search: true, columns: true, export: true }, columns: ['id', 'customer.name', 'customer.city'] });
      api = T;
      return <T />;
    }
    render(<Grid />);
    fireEvent.change(screen.getByRole('searchbox', { name: 'Search' }), { target: { value: 'paris bo' } });
    await act(async () => {
      await vi.advanceTimersByTimeAsync(250);
    });
    expect(names()).toEqual(['Bo']);
    expect(api!.exportCsv()).toBe('Id,Customer name,Customer city\r\no3,Bo,Paris');
    fireEvent.click(screen.getByRole('checkbox', { name: 'Customer city' }));
    expect(screen.queryByRole('columnheader', { name: 'Customer city' })).toBeNull();
    fireEvent.change(screen.getByRole('combobox', { name: 'Pin Id' }), { target: { value: 'start' } });
    expect(screen.getByRole('columnheader', { name: 'Id' }).getAttribute('data-pinned')).toBe('start');
    vi.useRealTimers();
  });

  it('groups rows with a folding row, counts and totals; totals in the footer', () => {
    render(<Table label="Orders" rows={orders} groupBy="customer.city" columns={['customer.name', 'customer.city', { key: 'total', aggregate: 'sum' }]} />);
    const groups = document.querySelectorAll('tr[data-group]');
    expect([...groups].map((g) => g.textContent)).toEqual(['Paris2200', 'Oslo180', 'Rome11,200']);
    fireEvent.click(within(groups[0] as HTMLElement).getByRole('button', { name: /Paris/ }));
    expect(names()).toEqual(['Ada', 'Cy']);
    expect(document.querySelector('tfoot')!.textContent).toContain('1,480');
  });

  it('groups hold every filtered row; pages go through the grouped list', () => {
    render(<Table label="Orders" rows={orders} groupBy="customer.city" pageSize={2} columns={['customer.name', 'customer.city']} />);
    // Page 1: all of Paris (both its rows), not just the Paris rows that happened to be first.
    expect([...document.querySelectorAll('tr[data-group]')].map((g) => g.textContent)).toEqual(['Paris2']);
    expect(names()).toEqual(['Émile', 'Bo']);
    fireEvent.click(screen.getByRole('button', { name: 'Page 2' }));
    expect(names()).toEqual(['Ada', 'Cy']);
    // A folded group keeps its place: its header takes a row's room on the page.
    fireEvent.click(screen.getByRole('button', { name: 'Page 1' }));
    fireEvent.click(screen.getByRole('button', { name: /Paris/ }));
    expect([...document.querySelectorAll('tr[data-group]')].map((g) => g.textContent)).toEqual(['Paris2', 'Oslo1']);
    expect(names()).toEqual(['Ada']);
  });

  it('a row opens its details; your own cells and headers draw from their context', () => {
    render(
      <Table
        label="Orders"
        rows={orders}
        renderDetail={(r) => <p>Shipped to {r.customer.city}</p>}
        columns={[
          { key: 'customer.name', header: ({ sort }) => `Who${sort ? '!' : ''}` },
          { key: 'total', cell: ({ value, row }) => <b data-testid="t">{`${row.id}:${value}`}</b> },
        ]}
      />,
    );
    expect(screen.getAllByTestId('t')[0].textContent).toBe('o1:120');
    expect(screen.getByRole('columnheader', { name: 'Who' })).toBeTruthy();
    const toggle = screen.getAllByRole('button', { name: 'Show details' })[1];
    fireEvent.click(toggle);
    expect(toggle.getAttribute('aria-expanded')).toBe('true');
    expect(screen.getByText('Shipped to Oslo')).toBeTruthy();
  });

  it('edits a cell: validation keeps the editor, Enter saves through onCellEdit, Escape cancels', async () => {
    const onCellEdit = vi.fn();
    const columns: Array<TableColumn<Order>> = [{ key: 'customer.name' }, { key: 'total', editable: true, validate: (v) => ((v as number) < 0 ? 'No negative totals' : undefined) }];
    render(<Table label="Orders" rows={orders} columns={columns} onCellEdit={onCellEdit} />);
    const cell = document.querySelector<HTMLElement>('td[data-col="total"]')!;
    fireEvent.doubleClick(cell);
    const input = within(cell).getByRole('spinbutton', { name: 'Total' });
    fireEvent.change(input, { target: { value: '-5' } });
    fireEvent.keyDown(input, { key: 'Enter' });
    expect(screen.getByRole('alert').textContent).toBe('No negative totals');
    expect(onCellEdit).not.toHaveBeenCalled();
    fireEvent.change(input, { target: { value: '150' } });
    fireEvent.keyDown(input, { key: 'Enter' });
    expect(onCellEdit).toHaveBeenCalledWith(expect.objectContaining({ rowKey: 'o1', key: 'total', value: 150, previous: 120 }));
    expect(within(cell).queryByRole('spinbutton')).toBeNull();
    fireEvent.keyDown(cell, { key: 'F2' });
    fireEvent.keyDown(within(cell).getByRole('spinbutton'), { key: 'Escape' });
    expect(within(cell).queryByRole('spinbutton')).toBeNull();
  });

  it('a grid: one tab stop, arrows move between cells, Space chooses the row', () => {
    const onSelectionChange = vi.fn();
    render(<Table label="Orders" rows={orders} selection="multiple" columns={['customer.name', 'total']} onSelectionChange={onSelectionChange} />);
    expect(screen.getByRole('grid')).toBeTruthy();
    const stops = document.querySelectorAll('[data-c][tabindex="0"]');
    expect(stops).toHaveLength(1);
    const first = stops[0] as HTMLElement;
    first.focus();
    fireEvent.keyDown(first, { key: 'ArrowDown' });
    expect(document.activeElement?.getAttribute('data-r')).toBe('0');
    fireEvent.keyDown(document.activeElement!, { key: 'ArrowRight' });
    expect(document.activeElement?.getAttribute('data-c')).toBe('1');
    fireEvent.keyDown(document.activeElement!, { key: ' ' });
    expect(onSelectionChange).toHaveBeenLastCalledWith(['o1']);
    fireEvent.keyDown(document.activeElement!, { key: 'End', ctrlKey: true });
    expect(document.activeElement?.getAttribute('data-r')).toBe('3');
  });

  it('columns resize from the keyboard and reorder with Ctrl + Shift + arrows (announced)', () => {
    const onColumnStateChange = vi.fn();
    render(<Table label="Orders" rows={orders} resizableColumns reorderableColumns columns={[{ key: 'id', width: 100 }, 'customer.name']} onColumnStateChange={onColumnStateChange} />);
    const handle = screen.getByRole('separator', { name: 'Resize column Id' });
    fireEvent.keyDown(handle, { key: 'ArrowRight' });
    expect(onColumnStateChange).toHaveBeenLastCalledWith(expect.objectContaining({ widths: expect.objectContaining({ id: 64 }) }));
    const header = screen.getByRole('columnheader', { name: /Id/ });
    header.focus();
    fireEvent.keyDown(header, { key: 'ArrowRight', ctrlKey: true, shiftKey: true });
    expect(onColumnStateChange).toHaveBeenLastCalledWith(expect.objectContaining({ order: ['customer.name', 'id'] }));
    expect(screen.getByRole('status').textContent).toBe('Id: 2 of 2');
  });

  it('a virtual body draws a window of a hundred thousand rows with their full count and positions', () => {
    const many = Array.from({ length: 100_000 }, (_, i) => ({ id: i, name: `Row ${i}` }));
    render(<Table label="Many" rows={many} virtual dimensions={{ height: 480 }} />);
    const grid = screen.getByRole('grid');
    expect(grid.getAttribute('aria-rowcount')).toBe('100001');
    const drawn = document.querySelectorAll('tbody tr.pinfold-table__row');
    expect(drawn.length).toBeLessThan(40);
    expect(drawn[0].getAttribute('aria-rowindex')).toBe('2');
    expect(screen.getByText('100,000 rows')).toBeTruthy();
  });

  it('a data source of a billion rows: only the blocks in view are fetched, with the sort and filters', async () => {
    const getRows = vi.fn(({ start, end }: { start: number; end: number }) => Array.from({ length: end - start }, (_, i) => ({ id: start + i, name: `Event ${start + i}` })));
    render(<Table label="Events" dataSource={{ rowCount: 1_000_000_000, getRows, blockSize: 50 }} columns={['id', 'name']} sortable dimensions={{ height: 480 }} />);
    await act(async () => {
      await Promise.resolve();
    });
    expect(getRows).toHaveBeenCalledTimes(1);
    expect(getRows.mock.calls[0][0]).toMatchObject({ start: 0, end: 50, sort: [], filters: [], search: '' });
    expect(screen.getByRole('grid').getAttribute('aria-rowcount')).toBe('1000000001');
    expect(await screen.findByText('Event 3')).toBeTruthy();
    fireEvent.click(within(screen.getByRole('columnheader', { name: /Name/ })).getByRole('button'));
    await act(async () => {
      await Promise.resolve();
    });
    expect(getRows.mock.calls[getRows.mock.calls.length - 1][0]).toMatchObject({ start: 0, sort: [{ key: 'name', direction: 'ascending' }] });
  });

  it('render overrides get the row and the cell they draw', () => {
    render(
      <Table
        label="Orders"
        rows={orders}
        columns={['customer.name']}
        render={{ row: ({ props, item, children }) => <tr {...props} data-mine={`${item?.rowKey}`}>{children}</tr>, cell: ({ props, item }) => <td {...props}>{`${item?.column?.title}=${String(item?.value)}`}</td> }}
      />,
    );
    expect(document.querySelector('tr[data-mine="o2"]')).toBeTruthy();
    expect(screen.getByText('Customer name=Ada')).toBeTruthy();
  });

  it('remembers column state, sort and filters under autoSaveId', () => {
    localStorage.removeItem('pinfold-table:orders');
    const { unmount } = render(<Table label="Orders" rows={orders} sortable autoSaveId="orders" columns={['customer.name', 'total']} />);
    fireEvent.click(within(screen.getByRole('columnheader', { name: /Total/ })).getByRole('button'));
    unmount();
    expect(JSON.parse(localStorage.getItem('pinfold-table:orders')!).sort).toEqual([{ key: 'total', direction: 'ascending' }]);
    render(<Table label="Orders" rows={orders} sortable autoSaveId="orders" columns={['customer.name', 'total']} />);
    expect(screen.getByRole('columnheader', { name: /Total/ }).getAttribute('aria-sort')).toBe('ascending');
  });

  it('page sizes to pick from, and the range shown', () => {
    const many = Array.from({ length: 60 }, (_, i) => ({ id: i, name: `P${i}` }));
    render(<Table label="People" rows={many} pageSize={10} pageSizes={[10, 25]} />);
    expect(screen.getByText('1–10 of 60')).toBeTruthy();
    fireEvent.change(screen.getByRole('combobox', { name: 'Rows per page' }), { target: { value: '25' } });
    expect(screen.getByText('1–25 of 60')).toBeTruthy();
  });
});
