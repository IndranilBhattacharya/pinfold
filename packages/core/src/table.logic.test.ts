// @vitest-environment node
import { describe, expect, it } from 'vitest';
import { compareValues, headerFromKey, inactiveTableOptions, nextSort, selectionState, sortRows } from './table.logic';

describe('table logic', () => {
  it('compares numbers by value, text naturally, empties last', () => {
    expect(compareValues(2, 10)).toBeLessThan(0);
    expect(compareValues('Item 2', 'Item 10')).toBeLessThan(0);
    expect(compareValues('apple', 'Banana')).toBeLessThan(0);
    expect(compareValues(null, 'a')).toBeGreaterThan(0);
    expect(compareValues(new Date(1), new Date(2))).toBeLessThan(0);
  });

  it('sorts stably both ways; a custom compare wins; no sort keeps the order', () => {
    const rows = [{ n: 2, t: 'b' }, { n: 1, t: 'a' }, { n: 2, t: 'c' }];
    expect(sortRows(rows, { key: 'n', direction: 'ascending' }).map((r) => r.t)).toEqual(['a', 'b', 'c']);
    expect(sortRows(rows, { key: 'n', direction: 'descending' }).map((r) => r.t)).toEqual(['b', 'c', 'a']);
    expect(sortRows(rows, { key: 'n', direction: 'ascending' }, (a, b) => b.t.localeCompare(a.t)).map((r) => r.t)).toEqual(['c', 'b', 'a']);
    expect(sortRows(rows, null).map((r) => r.t)).toEqual(['b', 'a', 'c']);
  });

  it('cycles ascending, descending, off; tracks the header box; makes headers', () => {
    expect(nextSort(null, 'a')).toEqual({ key: 'a', direction: 'ascending' });
    expect(nextSort({ key: 'a', direction: 'ascending' }, 'a')).toEqual({ key: 'a', direction: 'descending' });
    expect(nextSort({ key: 'a', direction: 'descending' }, 'a')).toBeNull();
    expect(nextSort({ key: 'a', direction: 'descending' }, 'b')).toEqual({ key: 'b', direction: 'ascending' });
    expect(selectionState(['1'], ['1', '2'])).toBe('some');
    expect(selectionState(['1', '2', '9'], ['1', '2'])).toBe('all');
    expect(selectionState([], ['1'])).toBe('none');
    expect(headerFromKey('invoiceId')).toBe('Invoice id');
    expect(headerFromKey('due_date')).toBe('Due date');
    expect(Object.keys(inactiveTableOptions({}))).toEqual(['selected', 'defaultSelected', 'onSelectionChange', 'page', 'defaultPage', 'onPageChange', 'total', 'pageSizes', 'onPageSizeChange', 'multiSort', 'filterLogic', 'filterMode', 'rowHeight', 'expanded', 'defaultExpanded', 'onExpandedChange', 'expandIcon', 'onRowReorder']);
    expect(inactiveTableOptions({ selection: 'multiple', pageSize: 10, sortable: true, filterable: true, virtual: false, renderDetail: () => null })).toEqual({ rowHeight: 'only for a virtual table (rows size to their content otherwise).', onRowReorder: 'only used with `reorderableRows`.' });
    expect(inactiveTableOptions({ virtual: true, pageSize: 10, sortable: true, filterable: true, renderDetail: () => null }).page).toBe('a virtual table scrolls instead of paging.');
    expect(Object.keys(inactiveTableOptions({ dataSource: {}, sortable: true, filterable: true, renderDetail: () => null, selection: 'single' }))).toEqual(['page', 'defaultPage', 'onPageChange', 'total', 'pageSizes', 'onPageSizeChange', 'onRowReorder', 'groupBy', 'defaultGroupBy', 'groupable', 'manualSort', 'manualFilter', 'rows', 'getSubRows', 'reorderableRows']);
  });
});
