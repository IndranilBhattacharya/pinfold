# Table: spec

Status: **experimental**. Pattern: a real `<table>` ([APG sortable table](https://www.w3.org/WAI/ARIA/apg/patterns/table/examples/sortable-table/));
with interactions it becomes an [APG data grid](https://www.w3.org/WAI/ARIA/apg/patterns/grid/examples/data-grids/).

## Usage
```tsx
import { defineTable } from '@pinfold/react/table';
// styles: core.css, pagination.css, table.css

export const Grid = defineTable({ sortable: true, filterable: true, toolbar: true, resizableColumns: true });

// Your rows: paths reach into objects; types come from the values; any component in a cell.
<Grid label="Orders" rows={orders} pageSize={25} pageSizes={[10, 25, 50]} groupBy="region"
  columns={[
    { key: 'id', pinned: 'start', width: 96 },
    { key: 'customer.name', header: 'Customer', cell: ({ row }) => <Buyer person={row.customer} /> },
    { key: 'total', type: 'number', format: { style: 'currency', currency: 'USD' }, aggregate: 'sum' },
    { key: 'status', type: 'enum', editable: true, cell: ({ value }) => <Badge label={value} /> },
  ]}
  onCellEdit={({ rowKey, key, value }) => save(rowKey, { [key]: value })}
  renderDetail={(order) => <OrderDetail order={order} />} />

// Any number of rows from your server, a block at a time (a billion included).
<Grid label="Events" dimensions={{ height: 560 }}
  dataSource={{ rowCount: 1_000_000_000, getRows: ({ start, end, sort, filters, search, signal }) => api.events({ start, end, sort, filters, search }, { signal }) }} />

// A server that pages: one page of rows, the total, the sort as the server applied it.
<Grid label="Orders" rows={data.rows} total={data.total} pageSize={20} page={page} onPageChange={setPage}
  manualSort sort={sort} onSortChange={setSort} loading={isFetching} />
```
Columns are typed from the rows: a key or path (three levels deep) that is not one fails to compile,
and `cell`, `value`, `compare` get the row's type. Precedence: use-site props, the preset,
`defaults.table`, the provider (size, tone), the library default.

## Config
| Key | Type | Default |
|---|---|---|
| `label`, `hideLabel` | the caption | required, `false` |
| `rows`, `columns`, `rowKey` | your data; keys, paths or column objects (below); a key or `(row) => string` | every key; `id`, else the position |
| `dataSource` | `{ rowCount, getRows({ start, end, sort, filters, search, signal }), blockSize }`: blocks load as they scroll into view, stale requests are aborted, a few hundred blocks are kept; `getRows` may return `{ rows, rowCount }` | none, `blockSize` `100` |
| `sortable`, `sort`, `defaultSort`, `onSortChange`, `multiSort`, `manualSort` | every column sorts; one `{ key, direction }` or several; a press cycles ascending, descending, off; Shift adds a key (numbered in the header) | `false`, none, `true`, `false` |
| `filterable`, `filters`, `defaultFilters`, `onFiltersChange`, `filterLogic`, `manualFilter` | a filter row by type (text, number and date ranges, yes or no, a value list); `[{ key, op, value }]` with ops `contains notContains equals notEquals startsWith endsWith lt lte gt gte between in notIn empty notEmpty`; `'and' \| 'or'` | `false`, none, `'and'`, `false` |
| `search`, `defaultSearch`, `onSearchChange` | quick search: every word somewhere in the searchable columns (accents and case ignored) | `''` |
| `toolbar` | `true` or `{ search, columns, export }`: the quick search, a columns menu (show, hide, pin), a CSV download (a string names the file) | none |
| `pageSize`, `pageSizes`, `onPageSizeChange`, `page`, `defaultPage`, `onPageChange`, `total` | pages with Pagination and the range ("1–25 of 240"); sizes to pick; `total` for server pages | no pages |
| `virtual`, `rowHeight` | only the rows in view are drawn (needs a height) | `false`, by density 36 / 44 / 52 |
| `resizableColumns`, `reorderableColumns`, `resizableRows` | drag column edges (double-click fits, Alt + arrows), drag headers (Ctrl or Cmd + Shift + arrows), drag row bottoms | `false` |
| `columnState`, `defaultColumnState`, `onColumnStateChange`, `autoSaveId` | `{ order, widths, hidden, pinned }`; remembered with the sort and filters under an id | none |
| `selection`, `selected`, `defaultSelected`, `onSelectionChange` | `'none' \| 'single' \| 'multiple'`; Shift + click picks a span | `'none'` |
| `renderDetail`, `expanded`, `defaultExpanded`, `onExpandedChange` | `(row) => node`: a panel under the row | none |
| `groupBy` | a column key: every filtered row grouped by its value; a folding row per group with its count and the columns' totals; the grouped list is paged | none |
| `onCellEdit` | `({ row, rowKey, key, value, previous }) => void \| false \| Promise`: save it; `false` or a rejection keeps the editor | none |
| `onRowAction`, `rowClassName` | `(row, event)`: click or Enter on a row's cell; `(row, index) => class` | none |
| `loading`, `emptyText` | shimmering rows while there are none, busy | `false`, `'Nothing to show'` |
| `labels` | `{ selectAll, selectRow(text), search, columns, export, filter(header), expand, resize, pageSize, notSaved, range(from, to, total) }` | English |
| `variant`, `density`, `striped`, `stickyHeader` | `'card' \| 'plain' \| 'outline'`; `'compact' \| 'normal' \| 'relaxed'`; the head (and filter row) stick; always in a virtual table | `'card'`, `'normal'`, `false`, `false` |
| `radius` | `'none' \| 'sm' \| 'md' \| 'lg' \| 'full'` or a length; a preset rescales every corner inside, a length sets the frame | the theme radius |
| `size`, `tone`, `dimensions` | `maxHeight`, `height` of the body | `'md'`, `'primary'` (provider) |
| `unstyled`, `className`, `style`, `classNames` / `styles` / `slotProps` / `render` | slots `root toolbar search caption scroll table head header sort resizer filters filter body row cell select expand detail group editor empty loading totals footer`; rows, cells, headers, filters, details and group rows pass `item` (`{ row, rowKey, rowIndex, column, value, selected, expanded, group }`) | |

### A column
| Key | What it does | Default |
|---|---|---|
| `key` | the value's path (`'customer.name'`), or any id when `value` reads it | required |
| `header` | a node or `({ column, sort, filter }) => node` | the key made readable |
| `value`, `cell` | `(row) => value` (computed columns); `({ row, value, formatted, rowKey, rowIndex, column, selected, edit }) => node` | the path; the formatted value |
| `type`, `format`, `options` | `'text' \| 'number' \| 'date' \| 'boolean' \| 'enum'`; `Intl` options or `(value, row) => node`; an enum's values | from the values |
| `sortable`, `compare` | this column sorts; your own ascending order | the table's |
| `filterable`, `filterFn`, `filter`, `searchable` | this column filters; `(row, filter) => boolean`; `({ column, filter, setFilter }) => node`; in the quick search | the table's, `true` |
| `width`, `minWidth`, `maxWidth`, `resizable` | px or any CSS width; resize bounds | auto (by type in a fixed layout), `64` |
| `pinned`, `hidden`, `hideable`, `align` | `'start' \| 'end'`; starts hidden; can be hidden; `'start' \| 'center' \| 'end'` | none, `false`, `true`, end for numbers |
| `editable`, `editor`, `validate` | `true` or `(row) => boolean`; `'text' \| 'number' \| 'date' \| 'select' \| 'checkbox'` or your component; `(value, row) => message` | by type |
| `aggregate`, `className` | `'sum' \| 'avg' \| 'min' \| 'max' \| 'count' \| 'countDistinct'` or `(rows) => node`, in the footer and group rows; a class per cell | none |

Controller: `visibleRows`, `filteredRows`, `sort`, `filters`, `search`, `selected`, `columnState`,
`setSort`, `setFilters`, `setFilter(key, value, op)`, `setSearch`, `setSelected`, `setColumnState`,
`exportCsv()`, `downloadCsv(name)`, `scrollToRow(index)`.

## How it scales
- Rows are never copied: filtering is one pass over row positions; sorting turns each key into
  numbers once (text becomes its rank among the distinct values) and sorts positions, so a hundred
  thousand rows sort by two keys in well under a second.
- A virtual body draws only the rows in view. Past about ten million pixels (a browser's limit) the
  scroll area is drawn at the cap and the position is scaled: the scrollbar covers every row, and the
  wheel and keys still move row by row. Rows of their own height (resized or with details) cost
  O(log k) for the k rows that differ.
- A data source is asked only for the blocks in view, with the sort, filters and search; requests
  scrolled past are aborted; changing the query clears the blocks.

Inactive (`inactiveTableOptions`): the selection values without `selection`; the page options without
`pageSize` (and in a virtual table); `multiSort` without sorting; `filterLogic` without a filter row;
`rowHeight` outside a virtual table; the expansion values without `renderDetail`; `groupBy`,
`manualSort`, `manualFilter`, `rows` with a data source.

## Accessibility
- A real table with a caption; headers are `th scope="col"` with `aria-sort`; a sort change is
  announced (with how many keys sort the rows).
- With selection, row actions, editing, details, groups, column resizing or reordering, or a virtual
  body it is a `grid`: one tab stop, arrows between cells (details are stepped over), Home / End,
  Ctrl + Home / End, PageUp / PageDown; a virtual body scrolls the focused row into view.
- Boxes are native checkboxes (radios for `single`) named "Select <first column>"; the box for all
  goes mixed when some rows are chosen; chosen rows have `aria-selected`.
- A virtual or server table keeps `aria-rowcount` and each row's `aria-rowindex`.
- Resize handles are `separator`s named "Resize column <header>" with their width; filter controls
  are named "Filter <header>"; an expand button has `aria-expanded` and controls its panel; an edit
  error is an alert tied to the editor; a column move is announced ("Total: 3 of 6").
- The scroll area is a named region (focusable when the table is not a grid).

## Deliberately excluded
- Pivoting and tree data (nested child rows): group by a column covers the common case.
- Spreadsheet formulas and cell ranges: copy is per cell (Ctrl or Cmd + C).
- Touch reordering of columns: native drag and drop does not start from touch; the keys work.
