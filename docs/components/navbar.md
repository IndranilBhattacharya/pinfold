# Navbar: spec

Status: **experimental**. Pattern: a navigation landmark with disclosure.

## Usage
```tsx
import { defineNavbar } from '@pinfold/react/navbar';

export const TopBar = defineNavbar({ variant: 'glass', position: 'sticky' });

<TopBar label="Main" value={pathname} brand={{ label: 'Acme', logo: <Logo />, href: '/' }}
  items={[{ label: 'Docs', href: '/docs' }, { label: 'Pricing', href: '/pricing', badge: 'New' },
    { label: 'Resources', items: [{ label: 'Blog', href: '/blog' }] }]}
  actions={[{ label: 'Sign in', variant: 'ghost' }, { label: 'Start free' }]} end={<UserMenu />} />
```
Precedence: use-site props, the preset, `defaults.navbar`, the provider (size, tone), the library default.

## Config
| Key | Type | Default |
|---|---|---|
| `label` | names the navigation landmark | required |
| `brand` | a node, or `{ label, logo, href }` | |
| `items` | strings, or `{ id, label, href, target, icon, badge, items, disabled, onClick }`; `items` under a link make a dropdown | |
| `value`, `defaultValue`, `onChange`, `onNavigate` | the current link's key (id, href or label): pass the router's path; `(key, item, event)`; `(href, event)` | |
| `start`, `center`, `end`, `actions` | your content after the brand, in the middle and at the end; button configs | |
| `tools` | icon buttons, links, dropdowns or your own elements as data: `{ id, label, icon, showLabel, badge, onClick, href, menu, active, disabled, content, placement, whenCollapsed }` | |
| `layout` | what sits where: `{ start, center, end }`, each a list of parts in order (see Arranging the bar) | start `['brand', 'tools', 'start', 'links']`, center `['tools', 'center']`, end `['tools', 'actions', 'end', 'toggle']` |
| `secondary` | a second row under the bar: tabs, a breadcrumb, filters | |
| `align` | where the links sit: `'start' \| 'center' \| 'end'` | `'start'` |
| `variant` | `'solid'`, `'glass'` (a translucent blur), `'floating'` (a rounded pill clear of the edges), `'plain'` | `'solid'` |
| `indicator` | the current link's marker, one element that slides between links and follows the pointer: `'pill' \| 'underline' \| 'none'` | `'pill'` |
| `position` | `'static' \| 'sticky' \| 'fixed'`; leave it static inside an app shell | `'static'` |
| `shrinkOnScroll`, `hideOnScroll` | shorter once the page has scrolled (a floating bar also narrows toward the middle); slides away going down and back going up | `false`, `false` |
| `overflow`, `collapseAt` | links that do not fit: under `'more'`, in a row that `'scroll'`s, or `'none'`; the bar width (px) under which every link folds into a menu button and a panel | `'more'`, `640` |
| `labels` | `more`, `openMenu`, `closeMenu` | |
| `radius`, `size`, `tone`, `dimensions` | `height`, `maxWidth`, `paddingX` | the theme radius, `'md'`, `'primary'` (provider) |
| `unstyled`, `className`, `style`, `classNames` / `styles` / `slotProps` / `render` | slots: `root inner zone brand start list item link icon badge indicator more center end actions tools tool toolBadge toggle panel panelLink secondary`; links get `item`: the entry, `key`, `current`, `overflowed` | |

## Arranging the bar
The bar has three zones. `tools` covers the usual icon buttons in one line each; `layout` puts any part anywhere.
```tsx
<TopBar label="Main" value={pathname} brand={{ label: 'Acme', logo: <Logo /> }} items={links} end={<UserMenu />}
  tools={[
    { id: 'apps', label: 'Apps', icon: <GridIcon />, placement: 'start' },
    { id: 'search', label: 'Search', icon: <SearchIcon />, onClick: openSearch },
    { id: 'bell', label: 'Notifications', icon: <BellIcon />, badge: unread, menu: notifications },
    { id: 'help', label: 'Help', icon: <HelpIcon />, href: '/help', whenCollapsed: 'panel' },
    { id: 'theme', label: 'Dark mode', icon: <MoonIcon />, active: dark, onClick: toggleTheme },
  ]}
  layout={{
    start: ['tool:apps', 'brand', 'separator', 'links'],
    end: [{ content: <SearchField />, hideBelow: 900 }, 'tool:bell', 'tool:help', 'separator', 'tool:theme', 'end', 'toggle'],
  }}
  secondary={<Trail items={crumbs} />} />
```
- Parts by name: `'brand'`, `'links'`, `'actions'`, `'tools'` (the tools whose `placement` is that zone; `'end'` by
  default), `'tool:<id>'` (one tool), `'start'`, `'center'`, `'end'` (your nodes), `'toggle'` (the menu button of a folded
  bar), `'spacer'` (takes the free room), `'separator'` (a hairline). Any node works as a part; `{ content, hideBelow,
  whenCollapsed }` is a node that leaves a narrow bar.
- A tool is a button (`onClick`), a link (`href`), a toggle (`active`), a dropdown (`menu`) or your own element
  (`content`). Its `label` names it and is its tooltip; `badge` is a count or, with `true`, a dot.
- Folded, a tool stays in the bar (`'keep'`), becomes a row of the panel (`'panel'`) or goes (`'hide'`).
- The zone that holds `'links'` takes the room, so "More" always measures what really fits.

## Any router
Links are real `<a href>`. A plain click goes to `onNavigate(href, event)`, else to the provider's `navigate`
(`<PinfoldProvider navigate={router.push}>` for React Router, TanStack Router, Next), else the browser follows it. A
click with a modifier key or a `target` is always the browser's. Pass the path as `value` and the bar marks the link,
or the dropdown that holds it.

## Behaviour
- The bar measures itself (not the window): links that do not fit move under "More" one by one and come back as room
  returns; under `collapseAt` they fold into a panel that lists every link, dropdown links included, and the actions.
- Every observer and listener is removed on unmount; each use is its own instance.
- Controller: `value`, `setValue(key)`, `scrolled`, `collapsed`, `menuOpen`, `openMenu()`, `closeMenu()`.

## Accessibility
- `nav` named by `label`; the current link has `aria-current="page"`.
- Dropdowns and "More" are menus; the menu button has `aria-expanded` and controls its panel; Escape closes and
  returns focus.
- Links under "More" leave the row's tab order. Reduced transparency drops the blur; forced colours keep the marker.
