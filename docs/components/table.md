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

### Data & Columns
- **`label`**, **`hideLabel`** — Table caption for accessibility (`required`, default `false`).
- **`rows`**, **`columns`**, **`rowKey`** — Data items; keys, paths or column objects; row identity key or `(row) => string` (defaults: all keys; `id`, else row index).
- **`dataSource`** — `{ rowCount, getRows({ start, end, sort, filters, search, signal }), blockSize }`: blocks load as they scroll into view, stale requests are aborted, a few hundred blocks are kept (default: `blockSize 100`).

### Sorting & Searching
- **`sortable`**, **`sort`**, **`defaultSort`**, **`onSortChange`**, **`multiSort`**, **`manualSort`** — Column sorting. Cycle ascending, descending, off; Shift+click multi-sorts (defaults: `false`, none, `true`, `false`).
- **`search`**, **`defaultSearch`**, **`onSearchChange`** — Quick search across all searchable columns (case and accents normalized, default `''`).

### Filtering & Toolbar
- **`filterable`**, **`filterMode`**, **`filters`**, **`defaultFilters`**, **`onFiltersChange`**, **`filterLogic`**, **`manualFilter`** — Type-aware filtering from header menus (`'menu'`) or inline filter controls (`'row'`) (defaults: `false`, `'menu'`, `'and'`).
- **`columnMenu`** — Context menu on each column header: sort, pin, hide, group, filter.
- **`toolbar`** — Built-in quick search, columns drawer, CSV download, filter chips, or custom `render(tools)`.

### Pagination & Virtualization
- **`pageSize`**, **`pageSizes`**, **`onPageSizeChange`**, **`page`**, **`defaultPage`**, **`onPageChange`**, **`total`** — Paging controls with page size selector and server total.
- **`virtual`**, **`rowHeight`** — Windowed rendering for large datasets (defaults: `false`, row height by density: 36 / 44 / 52 px).

### Interaction & Layout
- **`resizableColumns`**, **`reorderableColumns`**, **`resizableRows`** — Interactive drag-to-resize and drag-to-reorder for columns and rows (default `false`).
- **`columnState`**, **`defaultColumnState`**, **`onColumnStateChange`**, **`autoSaveId`** — Persistent column order, widths, visibility, and pinning.
- **`selection`**, **`selected`**, **`defaultSelected`**, **`onSelectionChange`** — Row selection (`'none' | 'single' | 'multiple'`, default `'none'`).
- **`renderDetail`**, **`subTable`**, **`getSubRows`**, **`expandIcon`**, **`expanded`**, **`defaultExpanded`**, **`onExpandedChange`** — Expandable row details, nested tables, or hierarchical trees.
- **`groupBy`**, **`defaultGroupBy`**, **`onGroupByChange`**, **`groupable`** — Multi-row grouping with group summaries and foldable rows.
- **`reorderableRows`**, **`onRowReorder`** — Row reordering with keyboard and drag support (default `false`).
- **`onCellEdit`** — Inline editable cell handlers `({ row, rowKey, key, value, previous }) => void | false | Promise`.
- **`onRowAction`**, **`onCellClick`**, **`rowClassName`**, **`rowProps`**, **`cellProps`** — Row and cell event hooks, classes, and props.
- **`loading`**, **`emptyText`** — Loading skeleton state and empty state label (defaults: `false`, `'Nothing to show'`).
- **`labels`** — Localization dictionary for all assistive text and UI controls.

### Appearance & Slots
- **`variant`**, **`density`**, **`striped`**, **`stickyHeader`** — Appearance variant (`'card' | 'plain' | 'outline'`), density (`'compact' | 'normal' | 'relaxed'`), zebra striping, and pinned headers.
- **`lines`**, **`hoverable`**, **`scrollIndicator`** — Border grid lines (`'rows' | 'grid' | 'none'`), hover highlights, and edge shadows (`'shadow' | 'fade' | 'none'`).
- **`radius`**, **`size`**, **`tone`** — Corner radius, scale, and color tone.
- **`dimensions`** — Fine-grained padding and height overrides (`cellPaddingX`, `cellPaddingY`, `toolbarPadding`, `footerPadding`, `maxHeight`, `height`).
- **`unstyled`**, **`className`**, **`style`**, **`classNames`**, **`styles`**, **`slotProps`**, **`render`** — Slot overrides across all 24 table parts.

The fields inside the grid are Pinfold components: search and text filters are an Input, number filters a NumberField, date filters a DatePicker, the filter condition, enum filters, an enum cell editor and rows per page a Select, and the selection and value boxes the Checkbox's and Radio's own boxes (in the table's tone). Select, Input, NumberField and DatePicker load the first time a grid shows one, so a grid without a toolbar, filters or page sizes never downloads them; import their stylesheets with the table's (`checkbox`, `datepicker`, `input`, `number`, `pagination`, `radio`, `select`). The in-cell text, number and date editors stay a bare input inside the cell's frame. A condition picked before its value is typed stays chosen.

### Column Definition
- **`key`** — Property path (e.g. `'customer.name'`) or custom identifier (`required`).
- **`header`** — Header text or render function `({ column, sort, filter }) => node`.
- **`value`**, **`cell`** — Custom getter and custom cell renderer.
- **`type`**, **`format`**, **`options`** — Column type (`'text' | 'number' | 'date' | 'boolean' | 'enum'`), format options, and enum values.
- **`sortable`**, **`compare`** — Column sort configuration and custom comparator.
- **`filterable`**, **`filterFn`**, **`filter`**, **`searchable`** — Filtering logic and custom filter UI.
- **`filterKey`**, **`filterItem`** — Custom identity and representation in the filter menu.
- **`pinnable`**, **`groupable`** — Pinning and grouping capability (default `true`).
- **`width`**, **`minWidth`**, **`maxWidth`**, **`resizable`** — Width constraints and resize behavior.
- **`pinned`**, **`hidden`**, **`hideable`**, **`align`** — Column pinning (`'start' | 'end'`), visibility, and text alignment.
- **`editable`**, **`editor`**, **`validate`** — Inline editing configuration, editor type, and validation.
- **`aggregate`**, **`className`** — Footer aggregation calculation (`'sum' | 'avg' | 'min' | 'max' | 'count' | 'countDistinct'`) and custom class.

Controller: `visibleRows`, `filteredRows`, `sort`, `filters`, `search`, `selected`, `columnState`,
`setSort`, `setFilters`, `setFilter(key, value, op)`, `setSearch`, `setSelected`, `setColumnState`,
`exportCsv()`, `downloadCsv(name)`, `scrollToRow(index)`.

## A toolbar of your own

`start` and `end` add your controls around the built-in ones. To lay the toolbar out yourself with your own
components, pass `render`: what it returns replaces everything inside the toolbar, which stays the table's
named `role="toolbar"`. It gets the table's state and actions, and the built-in parts to keep where you want them.

```tsx
<Grid
  label="Orders"
  rows={orders}
  toolbar={{
    export: 'orders.csv',
    render: (t) => (
      <MyBar>
        <MySearch value={t.search} onChange={t.setSearch} />
        {t.selectedCount > 0 && <MyBadge>{t.selectedCount} chosen</MyBadge>}
        <MyButton {...t.columnsButtonProps}>Columns</MyButton>
        <MyButton onClick={() => t.downloadCsv()}>Download</MyButton>
        {t.parts.export /* or keep a built-in part */}
      </MyBar>
    ),
  }}
/>
```

`tools`: `search`, `setSearch`, `selectedCount`, `filters`, `clearFilters`, `columnsButtonProps` (spread on your
button: the columns panel opens from it and anchors to it; needs `columns` on), `exportCsv`, `downloadCsv`, and
`parts` (`search`, `selected`, `columns`, `export`; null when switched off). For only a different search field,
`render.search` gets the field's props (`value`, `onCommit`, `aria-label`, `placeholder`).

## The column menu
Pointing at (or focusing) a header shows its menu button; a column that filters keeps it, filled with the tone.
- **Sort** ascending or descending (pressing the active one clears it).
- **Pin** to the start or end, **hide**, and **group by** the column (`groupable`).
- **Filter by condition**: the operators of the column's type (contains, starts with, between, is empty...).
- **Filter by values**: every distinct value among the rows the *other* filters let through, with counts, blanks last,
  a search box over eight values, and "Select all" (mixed while some are ticked). A value is drawn exactly as the
  column's `cell` draws it (an avatar and a name stay an avatar and a name); `filterItem` overrides it. Ticking
  everything clears the filter. A list value (tags) is one entry per tag.
- `column.filter` replaces the built-in controls with your own.

`labels` translates every string in it. `Table.openColumnMenu(key)` opens one from code.

## Rows under rows, tables under rows
```tsx
<Grid label="Files" rows={folders} getSubRows={(row) => row.children} columns={['name', 'size']} />

<Grid label="Customers" rows={customers} columns={['name', 'plan']}
  subTable={(customer) => ({ label: 'Orders', rows: customer.orders, columns: ['id', 'total'],
    subTable: (order) => ({ label: 'Items', rows: order.items }) })} />
```
Tree rows indent their first column and carry `aria-level`; `Table.expandAll()` and `collapseAll()` open and close
everything. A sub-table is a table of its own (state, ids, events, any config) and inherits density, size, tone and lines.

## Dragging rows
`reorderableRows` + `onRowReorder` is built in: a handle column, a line where the row will land, Alt + arrows from
the keyboard, an announcement. For a drag-and-drop library, hand it the row element: the `row` render override gets the
row's props and its data, and `rowProps` adds attributes and handlers to the table's own row.
```tsx
// dnd-kit
function SortableRow({ id, children, ...props }) {
  const { setNodeRef, attributes, listeners, transform, transition } = useSortable({ id });
  return <tr {...props} ref={setNodeRef} style={{ ...props.style, transform: CSS.Transform.toString(transform), transition }} {...attributes} {...listeners}>{children}</tr>;
}
<Grid label="Queue" rows={queue} rowKey="id" render={{ row: ({ props, children, item }) => <SortableRow id={item.rowKey} {...props}>{children}</SortableRow> }} />

// The browser's own drag and drop: drag a row onto anything outside the grid
<Grid label="Orders" rows={orders} rowKey="id"
  rowProps={({ row }) => ({ draggable: true, onDragStart: (event) => event.dataTransfer.setData('application/json', JSON.stringify(row)) })} />
<section onDragOver={(event) => event.preventDefault()} onDrop={(event) => assign(JSON.parse(event.dataTransfer.getData('application/json')))} />
```

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
