# Breadcrumb: spec

Status: **experimental**. Pattern: [APG breadcrumb](https://www.w3.org/WAI/ARIA/apg/patterns/breadcrumb/).

## Usage
```tsx
import { defineBreadcrumb } from '@pinfold/react/breadcrumb';

export const Trail = defineBreadcrumb({ maxItems: 4 });

// Straight from the URL: one crumb per segment, made readable
<Trail path={pathname} pathLabels={{ 'user-settings': 'Settings' }} onNavigate={navigate} />

// Your own crumbs; a crumb's menu lists the other pages at its level
<Trail items={[
  { label: 'Home', href: '/', icon: <HomeIcon /> },
  { label: 'Projects', href: '/projects', menu: projects.map((p) => ({ label: p.name, href: `/projects/${p.id}` })) },
  'Settings',
]} />
```
Clicks go to `onNavigate`, else the provider's `navigate` (`<PinfoldProvider navigate={router.push}>`),
else the browser. A click with a modifier key, or to a new tab, always stays the browser's.
Precedence: use-site props, the preset, `defaults.breadcrumb`, the provider (size, tone), the
library default.

## Config
| Key | Type | Default |
|---|---|---|
| `items` | `{ label, href?, icon?, onClick?, menu?, disabled? }[]` or strings; the last is the current page | one of `items`, `path` |
| `path`, `pathLabels`, `homeLabel` | a URL path; names by segment or href, or `(segment, href) => node`; the first crumb | none, none, `'Home'` |
| `onNavigate` | `(href, event)`: plain clicks on crumbs and menu rows | none |
| `separator` | `'chevron' \| 'slash' \| 'dot' \| 'arrow'` or a node | `'chevron'` |
| `maxItems`, `itemsBeforeCollapse`, `itemsAfterCollapse` | collapse the middle | none, `1`, `2` |
| `collapse` | `'menu'` (the ellipsis opens the hidden crumbs) \| `'expand'` (shows them in place) | `'menu'` |
| `expandLabel`, `menuLabel` | names of the ellipsis and of a crumb's menu button | `'Show the full path'`, `'Other pages'` |
| `variant` | `'plain' \| 'soft' \| 'outline' \| 'pills'` | `'plain'` |
| `size`, `tone` | the tone colours the current crumb with `pills` | `'md'`, `'primary'` (provider) |
| `dimensions` | `itemWidth`: longest a crumb gets (its full text is the tooltip) | `22ch` |
| `label` | the landmark's name | `'Breadcrumb'` |
| `unstyled`, `className`, `style`, `classNames` / `styles` / `slotProps` / `render` (slots `root list item link icon separator ellipsis menuButton`) | | |

A crumb with a `menu` and an `href` gets a chevron button beside it; with no `href`, the crumb is
the button. Menus are Pinfold menus (`menu.css`); their rows are real links.

Inactive (`inactiveBreadcrumbOptions`): the collapse options without `maxItems`; `path`,
`pathLabels`, `homeLabel` when `items` is given; `tone` unless `pills`.

## Accessibility
- `<nav aria-label="Breadcrumb">` around an ordered list; the current page has
  `aria-current="page"` and is not a link; separators are hidden from screen readers.
- Menu buttons have `aria-haspopup` and `aria-expanded`; arrows move in the menu, Escape returns
  to the button. With `collapse: 'expand'`, focus moves to the first revealed crumb.
- Separators mirror in right-to-left text.
