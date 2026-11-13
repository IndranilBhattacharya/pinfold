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
| `items` | `{ label, href?, icon?, iconOnly?, key?, onClick?, menu?, disabled? }[]` or strings; the last is the current page | one of `items`, `path` |
| `path`, `pathLabels`, `homeLabel` | a URL path; names by segment or href, or `(segment, href) => node`; the name of the first crumb (and of `home`) | none, none, `'Home'` |
| `home` | `true`: an icon-only house crumb linking to `/`, named by `homeLabel`; or a crumb object (`{ href: '/app', label: 'Dashboard', iconOnly: false }`). With `path` it dresses the root crumb | `false` |
| `onNavigate` | `(href, event)`: plain clicks on crumbs and menu rows | none |
| `onChange` | `(key, item, event)`: a crumb, a hidden crumb or a sibling page was chosen; runs after the item's `onClick`, before navigation | none |
| `separator` | `'chevron' \| 'slash' \| 'dot' \| 'arrow'` or a node | `'chevron'` |
| `maxItems`, `itemsBeforeCollapse`, `itemsAfterCollapse` | collapse the middle | none, `1`, `2` |
| `collapse` | `'menu'` (the ellipsis opens the hidden crumbs) \| `'expand'` (shows them in place) | `'menu'` |
| `expandLabel`, `menuLabel` | names of the ellipsis and of a crumb's menu button | `'Show the full path'`, `'Other pages'` |
| `variant` | `'plain' \| 'soft' \| 'outline' \| 'pills'` | `'plain'` |
| `radius` | `'none' \| 'sm' \| 'md' \| 'lg' \| 'full'` or a length; a preset rescales every corner inside, a length sets the frame | the theme radius |
| `size`, `tone` | the tone colours the current crumb with `pills` | `'md'`, `'primary'` (provider) |
| `dimensions` | `itemWidth`: longest a crumb gets (its full text is the tooltip) | `22ch` |
| `label` | the landmark's name | `'Breadcrumb'` |
| `unstyled`, `className`, `style`, `classNames` / `styles` / `slotProps` / `render` (slots `root list item link icon separator ellipsis menuButton`) | | |

A crumb with a `menu` (its sibling pages) and an `href` gets a chevron button beside it; with no
`href`, the crumb is the button. Menus are Pinfold menus (`menu.css`); their rows are real links.

### Variations
| Look | Config |
|---|---|
| Plain text, crumbs light up on hover | `variant: 'plain'` (default) |
| Chips, the current page in the tone | `variant: 'pills'` (with `tone`) |
| A contained bar | `variant: 'soft'` (tinted) or `'outline'` (raised, follows the style pack) |
| Separator | `separator: 'chevron' \| 'slash' \| 'dot' \| 'arrow'`, or any node (`<span>»</span>`); mirrored in right-to-left text |
| Icons | `icon` per crumb; `iconOnly` keeps the label as the name and the tooltip |
| Home | `home: true` |
| Long trails | `maxItems` (with `itemsBeforeCollapse`, `itemsAfterCollapse`): the middle collapses into a "…" button whose menu lists the hidden crumbs, icons included; `collapse: 'expand'` shows them in place instead |
| Long labels | cut with an ellipsis at `dimensions.itemWidth` (22ch); the full text is the tooltip and is still read in full |

```tsx
<Breadcrumb variant="pills" separator="slash" home maxItems={4} items={[
  { label: 'Projects', href: '/projects', icon: <FolderIcon /> },
  { label: 'Pinfold', href: '/projects/pinfold', menu: projects.map((p) => ({ label: p.name, href: `/projects/${p.id}` })) },
  { label: 'Docs', href: '/projects/pinfold/docs' },
  'Settings',
]} />
```

### Events
`onChange(key, item, event)` fires when a crumb, a hidden crumb (from the "…" menu) or a sibling page
(from a crumb's menu) is chosen. `key` is the item's `key`, else its `href`, else its text, else its
position. It runs after the item's own `onClick` and before navigation, so `event.preventDefault()`
keeps the page. `onNavigate(href, event)` then routes plain clicks (else the provider's `navigate`,
else the browser).

```tsx
<Breadcrumb
  items={trail}
  onChange={(key, item) => analytics.track('breadcrumb', { key })}
  onNavigate={(href) => router.push(href)}
/>
```

Inactive (`inactiveBreadcrumbOptions`): the collapse options without `maxItems`; `path` and
`pathLabels` when `items` is given; `homeLabel` without `path` or `home`; `tone` unless `pills`.

## Accessibility
- `<nav aria-label="Breadcrumb">` around an ordered list; the current page (the last crumb) has
  `aria-current="page"` and is not a link, even with an `href`; separators are hidden from screen
  readers.
- An icon-only crumb (the home crumb) keeps its label in visually hidden text and as its tooltip.
- Menu buttons have `aria-haspopup` and `aria-expanded`; arrows move in the menu, Escape returns
  to the button. With `collapse: 'expand'`, focus moves to the first revealed crumb.
- Separators mirror in right-to-left text.
