# Breadcrumb: spec

Status: **experimental**. Pattern: [APG breadcrumb](https://www.w3.org/WAI/ARIA/apg/patterns/breadcrumb/).

## Usage
```tsx
import { defineBreadcrumb } from '@pinfold/react/breadcrumb';

export const Trail = defineBreadcrumb({ maxItems: 4 });

<Trail items={[
  { label: 'Home', href: '/' },
  { label: 'Projects', href: '/projects' },
  { label: 'Pinfold', href: '/projects/pinfold' },
  { label: 'Docs', href: '/projects/pinfold/docs' },
  { label: 'Settings' },
]} />
```
For a client-side router, give each crumb an `onClick`, or swap the link element with
`render.link`. Precedence: use-site props, the preset, `defaults.breadcrumb`, the provider (size),
the library default.

## Config
| Key | Type | Default |
|---|---|---|
| `items` | `{ label, href?, icon?, onClick? }[]`, the last one the current page | required |
| `label` | the landmark's name | `'Breadcrumb'` |
| `separator` | `'chevron' \| 'slash' \| 'dot'` or your own node | `'chevron'` |
| `maxItems` | collapse the middle when there are more | none |
| `itemsBeforeCollapse`, `itemsAfterCollapse` | crumbs kept either side | `1`, `2` |
| `expandLabel` | the reveal button's name | `'Show the full path'` |
| `variant` | `'plain' \| 'soft'` (a tinted tray) | `'plain'` |
| `size` | | `'md'` (provider) |
| `unstyled`, `className`, `style`, `classNames` / `styles` / `slotProps` / `render` (slots `root list item link icon separator ellipsis`) | | |

Inactive (`inactiveBreadcrumbOptions`): `itemsBeforeCollapse` and `itemsAfterCollapse` without
`maxItems`.

## Accessibility
- `<nav aria-label="Breadcrumb">` around an `<ol>`: a landmark, with the number of levels read.
- The current page has `aria-current="page"` and is text, not a link.
- Separators are hidden from screen readers and mirror in right-to-left text.
- The reveal button shows every crumb and moves focus to the first one it revealed. Long names are
  cut with an ellipsis on screen; the full name stays in the DOM.
