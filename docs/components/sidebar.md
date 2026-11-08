# Sidebar: spec

Status: **experimental**. Pattern: [APG disclosure navigation](https://www.w3.org/WAI/ARIA/apg/patterns/disclosure/examples/disclosure-navigation/).

## Usage
```tsx
import { defineSidebar } from '@pinfold/react/sidebar';

export const AppNav = defineSidebar({ collapsible: true });

<AppNav
  label="Main"
  value={pathname}
  header={<Logo />}
  items={[
    { label: 'Inbox', href: '/inbox', icon: <InboxIcon />, badge: 4 },
    { label: 'Projects', icon: <FolderIcon />, items: [{ label: 'Pinfold', href: '/p/pinfold' }, 'Archive'] },
    { label: 'Settings', href: '/settings', icon: <CogIcon />, group: 'Account' },
  ]}
/>
```
`value` is the current entry's key: its `id`, else its `href`, else its label, so the router's
path usually fits as is. Links go through `onNavigate`, the provider's `navigate`, or the browser.
Precedence: use-site props, the preset, `defaults.sidebar`, the provider, the library default.

## Config
| Key | Type | Default |
|---|---|---|
| `label`, `items` | names the landmark; entries or strings | required |
| `value`, `defaultValue`, `onChange(key, item, event)` | the current entry | none |
| `onNavigate(href, event)` | follow links yourself | provider `navigate` |
| `expanded`, `defaultExpanded`, `onExpandedChange` | open sections | the sections holding `value` |
| `collapsible` | a button that folds it into a rail | `false` |
| `collapsed`, `defaultCollapsed`, `onCollapsedChange` | the rail | `false` |
| `header`, `footer` | nodes above and under the entries | none |
| `labels` | `{ collapse, expand }` | English |
| `variant` | `soft` tint, `plain` edge bar, `solid` fill | `'soft'` |
| `size`, `tone`, `dimensions` | `width` | `'md'`, `'primary'`, `16rem` |
| `unstyled`, `className`, `style`, `classNames` / `styles` / `slotProps` / `render` | slots `root header body group groupLabel list item link icon badge chevron sublist footer toggle` | |

Entry: `{ label, href?, target?, icon?, badge?, items?, group?, id?, disabled?, onClick? }`. An
entry with `items` is a section: a button that opens and closes, never a link. `group` puts
top-level entries under a heading, in the order the groups first appear.

Controller: `value`, `setValue`, `expanded`, `setExpanded`, `collapsed`, `setCollapsed`.

## Rail
With `collapsed` the text is visually hidden (names stay), icons stand for entries (the first
letter without one), badges become dots and sections close; pressing a section opens the sidebar
on it. Entries get a `title` for pointer users.

## Inactive options
| Option | Inactive when |
|---|---|
| `labels` | without `collapsible` |

## Accessibility
- A `nav` landmark named by `label`; group headings name their lists.
- The current entry has `aria-current="page"`; a section holding it is marked for the eye too.
- Sections are disclosure buttons (`aria-expanded`, `aria-controls`); closed ones are hidden from
  the keyboard and screen readers. Disabled entries are buttons with `aria-disabled`.
- Plain Tab order (links and buttons); no roving focus, as the disclosure pattern advises.

## Deliberately excluded
- An off-canvas mode on phones: put the sidebar in a Dialog with `placement: 'start'`.
- Tree keyboard (arrows): a site nav is links, and the tree pattern hides them from link lists.
