# Pagination: spec

Status: **experimental**. Pattern: a [navigation landmark](https://www.w3.org/WAI/ARIA/apg/patterns/landmarks/examples/navigation.html) around a list.

## Usage
```tsx
import { definePagination, usePagination } from '@pinfold/react/pagination';

export const Pages = definePagination({ pageSizes: [10, 25, 50], showInfo: true });

// Pages you count yourself
<Pages count={24} page={page} onChange={setPage} />

// Server side: the API gives the total; offset = (page - 1) * pageSize
const [query, setQuery] = useState({ page: 1, pageSize: 10 });
const { data, isFetching } = useInvoices(query);
<Pages total={data.total} {...query} loading={isFetching}
  onChange={(page, { pageSize }) => setQuery({ page, pageSize })} />

// A cursor API with no total
<Pages hasNext={data.nextCursor != null} hasPrevious={data.prevCursor != null} page={page} onChange={setPage} />

// A simple pager: previous and next with words, and the range
<Pages total={240} showPages={false} showControlLabels showInfo variant="ghost" />

// Your own page buttons (each keeps its label, current state and behaviour)
<Pages count={9} renderItem={({ page, current }) => (current ? <strong>{page}</strong> : page)} />

// An array you hold: the controller slices it
const P = usePagination({ total: rows.length, pageSizes: [10, 25] });
return <>{P.slice(rows).map(renderRow)}<P /></>;

// Crawlable links, routed by the provider's navigate
<Pages count={24} defaultPage={3} getHref={(p) => `/blog?page=${p}`} />
```
Precedence: use-site props, the preset, `defaults.pagination`, the provider (size, tone), the
library default.

## Config
| Key | Type | Default |
|---|---|---|
| `count` / `total` / `hasNext` | pages; or items (pages = total / page size); or, with no total, whether there is a next page | one of them |
| `hasPrevious` | with no total: whether there is a previous page | any page after the first |
| `page`, `defaultPage` | from 1 | none, `1` |
| `pageSize`, `defaultPageSize`, `pageSizes` | items per page; the sizes offered in a "Rows per page" select | none, `10` (or the first of `pageSizes`) |
| `onChange` | `(page, { pageSize, offset, reason, event })`: a page or the page size changed | none |
| `onPageSizeChange` | `(pageSize, event)`: the page size changed (before `onChange`) | none |
| `renderItem` | `({ page, current }) => node`: the inside of each page button; `render.item` also gets `item` | none |
| `getHref` | `(page) => string`: real links | none (buttons) |
| `showControls`, `showEdges` | previous and next; first and last | `true`, `false` |
| `showInfo` | "21–40 of 532", or "Page 3 of 20"; `labels.info` formats it | `false` |
| `showPages` | numbered pages; `false`: a simple pager (previous and next only) | `true` |
| `showControlLabels` | "Previous" / "Next" written beside the chevrons (`labels.previousText`, `labels.nextText`) | `false` |
| `showJump` | a "Go to page" field | `false` |
| `compact` | previous, "3 / 20", next | `false` |
| `loading` | the cursor pulses, controls wait, `aria-busy` | `false` |
| `siblings`, `boundaries` | pages either side of the current one; pages at each end | `1`, `1` |
| `variant` | `'soft' \| 'ghost' \| 'outline' \| 'panel'` | `'soft'` |
| `radius` | `'sm' \| 'md' \| 'full'` | `'md'` |
| `size`, `tone` | the current page is the tone's sliding cursor | `'md'`, `'primary'` (provider) |
| `disabled`, `label` | | `false`, `'Pagination'` |
| `labels` | `{ previous, next, first, last, previousText, nextText, page(n), info({ from, to, total, page, count }), pageSize, jump }` | English |
| `unstyled`, `className`, `style`, `classNames` / `styles` / `slotProps` / `render` (slots `root info list cursor item gap previous next first last status size jump`) | | |

A page-size change keeps the first item on screen (`pageAt` in core). Controller: `page`,
`pageSize`, `count`, `offset`, `setPage`, `setPageSize`, `next`, `previous`, `slice(array)`.

Inactive (`inactivePaginationOptions`): `showEdges` with `showControls: false`; `siblings` and
`boundaries` (and `showControls`) with `compact`; with an unknown total, `showControls`, `siblings`, `boundaries`, `showEdges`,
`compact`; `hasNext` and `hasPrevious` once `count` or `total` is known; `siblings`, `boundaries`,
`renderItem`, `compact` and `showControls` with `showPages: false`; `showControlLabels` with
`showControls: false`.

## Accessibility
- `<nav>` named by `label` around a list; each page reads "Page 3"; the current one has
  `aria-current="page"`; gaps and the cursor are hidden from screen readers.
- The list keeps the same length on every page (`paginationRange` in core), so controls never move
  under the pointer, and previous / next at an end stay focusable (`aria-disabled`).
- The summary is a polite live region. The page-size select and go-to field are native controls
  with visible labels. `aria-busy` while loading.
- Chevrons mirror in right-to-left text.

## Compared
| | Pinfold | MUI TablePagination + Pagination | Ant Design | HeroUI |
|---|---|---|---|---|
| Page size select | `pageSizes` | yes | yes | no |
| Go to page | `showJump` | no | yes | no |
| Range summary | `showInfo` | yes | `showTotal` | no |
| Unknown total | `hasNext` | `count={-1}` | no | no |
| Loading state | `loading` | no | no | no |
| Sliding cursor | yes | no | no | yes |
