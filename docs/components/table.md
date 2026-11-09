# Table: spec

Status: **experimental**. Pattern: [APG sortable table](https://www.w3.org/WAI/ARIA/apg/patterns/table/examples/sortable-table/): a real `<table>`.

## Usage
```tsx
import { defineTable } from '@pinfold/react/table';
// styles: core.css, pagination.css, table.css

export const Grid = defineTable({ striped: true });

// Your rows; columns from keys (or every key of the first row)
<Grid label="Invoices" rows={invoices} pageSize={10} selection="multiple" onSelectionChange={setChosen}
  columns={['id', 'customer', { key: 'amount', align: 'end', sortable: true, cell: (r) => money(r.amount) }]} />

// Server side: one page of rows, the total, the sort as the server applied it
<Grid label="Orders" rows={data.rows} total={data.total} pageSize={20} page={page} onPageChange={setPage}
  manualSort sort={sort} onSortChange={setSort} loading={isFetching} />
```
Columns are typed from the rows: a key that is not one fails to compile, and `cell` gets the
row's type. Precedence: use-site props, the preset, `defaults.table`, the provider (size, tone),
the library default.

## Config
| Key | Type | Default |
|---|---|---|
| `label`, `hideLabel` | the caption | required, `false` |
| `rows`, `columns`, `rowKey` | your data; keys or `{ key, header, cell, sortable, compare, align, width }`; a key or `(row) => string` | every key; `id`, else the position |
| `sort`, `defaultSort`, `onSortChange`, `manualSort` | `{ key, direction }`; a header cycles ascending, descending, off | none, client sorting |
| `selection`, `selected`, `defaultSelected`, `onSelectionChange` | `'none' \| 'single' \| 'multiple'`; row keys | `'none'` |
| `pageSize`, `page`, `defaultPage`, `onPageChange`, `total` | pages with Pagination; `total` for server pages | no pages |
| `onRowAction` | `(row, event)`: rows focusable, click or Enter | none |
| `loading`, `emptyText` | shimmering rows while there are none, busy | `false`, `'Nothing to show'` |
| `labels` | `{ selectAll, selectRow(text) }` | English |
| `variant`, `density`, `striped`, `stickyHeader` | `'card' \| 'plain' \| 'outline'`; `'compact' \| 'normal' \| 'relaxed'` | `'card'`, `'normal'`, `false`, `false` |
| `radius` | `'none' \| 'sm' \| 'md' \| 'lg' \| 'full'` or a length; a preset rescales every corner inside, a length sets the frame | the theme radius |
| `size`, `tone`, `dimensions` | `maxHeight` of the body | `'md'`, `'primary'` (provider) |
| `unstyled`, `className`, `style`, `classNames` / `styles` / `slotProps` / `render` | slots `root caption scroll table head header sort body row cell select empty loading footer` | |

Sorting is stable and natural ("Item 2" before "Item 10"; numbers and dates by value; empty cells
last). Controller: `visibleRows`, `sort`, `selected`, `setSort`, `setSelected`.

Inactive (`inactiveTableOptions`): the selection values without `selection`; the page options
without `pageSize`.

## Accessibility
- A real table with a caption; headers are `th scope="col"`. A sortable header holds a button and
  carries `aria-sort`.
- Boxes are native checkboxes (radios for `single`) named "Select <first column>"; the page box
  goes mixed when some rows are chosen; chosen rows have `aria-selected`.
- The scroll area is a named, focusable region, so a keyboard can scroll a wide table.
- `aria-busy` while loading; with `total`, `aria-rowcount` gives the full size.
