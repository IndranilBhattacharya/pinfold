# Pagination: spec

Status: **experimental**. Pattern: a [navigation landmark](https://www.w3.org/WAI/ARIA/apg/patterns/landmarks/examples/navigation.html) around a list.

## Usage
```tsx
import { definePagination } from '@pinfold/react/pagination';

export const Pages = definePagination();

<Pages count={24} page={page} onChange={setPage} />
<Pages count={24} defaultPage={3} getHref={(p) => `/blog?page=${p}`} />
```
With `getHref`, every page is a real link: crawlable, and it opens in a new tab. Without it,
pages are buttons. Precedence: use-site props, the preset, `defaults.pagination`, the provider
(size, tone), the library default.

## Config
| Key | Type | Default |
|---|---|---|
| `count` | pages in all | required |
| `page`, `defaultPage`, `onChange` | from 1; `(page, event)` | none, `1` |
| `getHref` | `(page) => string` | none (buttons) |
| `label` | the landmark's name | `'Pagination'` |
| `siblings`, `boundaries` | pages either side of the current one; pages at each end | `1`, `1` |
| `showControls`, `showEdges` | previous and next; first and last | `true`, `false` |
| `variant` | the other pages: `'ghost' \| 'soft' \| 'outline'` | `'ghost'` |
| `size`, `tone` | the current page is the tone's fill | `'md'`, `'primary'` (provider) |
| `disabled` | | `false` |
| `labels` | `{ previous, next, first, last, page: (n) => string }` for translation | English |
| `unstyled`, `className`, `style`, `classNames` / `styles` / `slotProps` / `render` (slots `root list item gap previous next first last`) | | |

Inactive (`inactivePaginationOptions`): `showEdges` with `showControls: false`.

## Accessibility
- `<nav>` named by `label` around a list; each page reads "Page 3"; the current one has
  `aria-current="page"`; gaps are hidden from screen readers.
- The list keeps the same length on every page (`paginationRange` in core), so controls never move
  under the pointer, and previous / next at an end stay focusable (`aria-disabled`), so focus is
  never lost.
- Chevrons mirror in right-to-left text.
