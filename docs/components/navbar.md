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
| `align` | where the links sit: `'start' \| 'center' \| 'end'` | `'start'` |
| `variant` | `'solid'`, `'glass'` (a translucent blur), `'floating'` (a rounded pill clear of the edges), `'plain'` | `'solid'` |
| `indicator` | the current link's marker, one element that slides between links and follows the pointer: `'pill' \| 'underline' \| 'none'` | `'pill'` |
| `position` | `'static' \| 'sticky' \| 'fixed'`; leave it static inside an app shell | `'static'` |
| `shrinkOnScroll`, `hideOnScroll` | shorter once the page has scrolled (a floating bar also narrows toward the middle); slides away going down and back going up | `false`, `false` |
| `overflow`, `collapseAt` | links that do not fit: under `'more'`, in a row that `'scroll'`s, or `'none'`; the bar width (px) under which every link folds into a menu button and a panel | `'more'`, `640` |
| `labels` | `more`, `openMenu`, `closeMenu` | |
| `radius`, `size`, `tone`, `dimensions` | `height`, `maxWidth`, `paddingX` | the theme radius, `'md'`, `'primary'` (provider) |
| `unstyled`, `className`, `style`, `classNames` / `styles` / `slotProps` / `render` | slots: `root inner brand start list item link icon badge indicator more center end actions toggle panel panelLink`; links get `item`: the entry, `key`, `current`, `overflowed` | |

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
