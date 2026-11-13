# Menu: spec

Status: **experimental**. Pattern: [APG menu button](https://www.w3.org/WAI/ARIA/apg/patterns/menu-button/).

## Usage
```tsx
import { defineMenu } from '@pinfold/react/menu';

export const RowActions = defineMenu({ placement: 'bottom-end' });

<RowActions
  trigger={{ label: 'Actions', variant: 'outline' }}
  onAction={(id) => run(id)}
  items={[
    { id: 'edit', label: 'Edit', shortcut: 'E' },
    { label: 'Docs', href: '/docs' },
    { type: 'group', label: 'Sort by', selectionMode: 'single', value: sort, onValueChange: setSort,
      items: [{ id: 'name', label: 'Name' }, { id: 'date', label: 'Date' }] },
    { type: 'separator' },
    { id: 'export', label: 'Export', disabled: !pro, disabledReason: 'Export is part of Pro' },
    { id: 'delete', label: 'Delete', tone: 'danger' },
  ]}
/>

// Rich rows, managed selection, a search field, header and footer
<Menu
  trigger={{ label: 'Assign' }}
  searchable
  selectionMode="multiple"
  value={assignees}
  onValueChange={setAssignees}
  header={<strong>Assign to</strong>}
  footer="Enter picks the first match"
  items={people.map((p) => ({ id: p.id, label: p.name, description: p.email, startContent: <Avatar name={p.name} size="sm" /> }))}
/>

// A context menu: the trigger is the area
const Canvas = useMenu({ mode: 'context', label: 'Canvas', trigger: <div className="canvas" tabIndex={0} />, items });
```
`useMenu(config)` and `<Menu {...config} />` take the same config. Precedence: use-site props, the
preset, `defaults.menu`, the provider (size), the library default.

## Config
| Key | Type | Default |
|---|---|---|
| `items` | rows (required), below | |
| `trigger` | `ButtonConfig` or an element; a context menu's area | none |
| `mode` | `'dropdown' \| 'context'` | `'dropdown'` |
| `label` | `string`; a dropdown is named by its trigger without one, a context menu needs it | none |
| `selectionMode` | `'none' \| 'single' \| 'multiple'`: the menu checks its rows (radio or checkbox rows) | `'none'` |
| `value`, `defaultValue` | `string` (single) or `string[]` (multiple): checked row ids | none |
| `closeOnSelect` | `boolean`; a row's own wins | on, off for checkbox and radio rows |
| `searchable` | `boolean`: a search field filters the rows | `false` |
| `filter` | `(item, query) => boolean` | label (or `textValue`) and description contain the query |
| `loading` | `boolean`: a loading row under the rows | `false` |
| `emptyContent` | node: no rows, or none match | `labels.empty` |
| `labels` | `{ search, empty, loading }` | `'Search'`, `'No results'`, `'Loading'` |
| `header`, `footer` | node or `({ close }) => node`: above and below the rows | none |
| `placement` | as tooltip | `'bottom-start'` |
| `radius` | `'none' \| 'sm' \| 'md' \| 'lg' \| 'full'` or a length; a preset rescales every corner inside, a length sets the frame | the theme radius |
| `size` | `'sm' \| 'md' \| 'lg'` | `'md'` (provider) |
| `offset` | `number`, px | `4` |
| `loop` | `boolean` | `true` |
| `open`, `defaultOpen` | state | uncontrolled, closed |
| `dimensions` | `width, maxHeight`: taller menus scroll the rows, header and footer stay | fits; `24rem` |
| `unstyled`, `className`, `style`, `classNames` / `styles` / `slotProps` / `render` (slots `root list item indicator icon text label description end shortcut separator group groupLabel submenu chevron header footer search empty loading`) | | |

Rows:
- an action: `label` (required, the accessible name), `id`, `icon`, `startContent` (an avatar, a dot; in
  place of `icon`), `description`, `endContent` (a badge, a count), `shortcut`, `tone`, `selected` (the
  current choice: a check at the end, `aria-current`), `disabled`, `disabledReason`, `onSelect`,
  `closeOnSelect`, `href`, `target`, `textValue` (typeahead and search text for a non-string label),
  `content` (replaces the row's inside: a node or `({ checked, selected, disabled }) => node`);
- `type: 'checkbox' | 'radio'` with `checked` (you own the state), or rows under a `selectionMode`
  (the menu owns it);
- `type: 'separator'`;
- `type: 'group'`: a section with a header (`label`, `items`), optionally with its own `selectionMode`,
  `value`, `defaultValue`, `onValueChange`;
- `type: 'submenu'`, below.

Selection rows are identified by `id`, or by their label text.

## Events
| Event | Called with |
|---|---|
| `onAction` | `(id, item)`: any row was chosen; `id` is the row's `id` or its position (`'2'`, `'1-0'` in a group) |
| `onValueChange` | `(value, item)`: the new id (`single`) or ids (`multiple`); also on a group |
| `onSearchChange` | `(query)`: load results from a server, with `loading` |
| `onOpenChange` | `(open, reason)`: `trigger`, `keyboard`, `contextmenu`, `escape`, `outside`, `select`, `tab`, `api` |
| row `onSelect` | `(event)` |

Controller: `isOpen`, `open()`, `close()`, `toggle()`, `getTriggerProps()`, `getRootProps()` (the panel),
`getListProps()` (the `role="menu"` list).
Inactive (`inactiveMenuOptions`): `placement`, `offset` in a context menu; `filter`, `onSearchChange`
without `searchable`; `value`, `defaultValue`, `onValueChange` without a `selectionMode`.

## Submenus
A row `{ type: 'submenu', label, items }` opens its rows in a menu beside it (the other side when
there is no room), on hover after 120 ms, on a press, or from the keyboard. Resting on another row
shuts it. It is a `menuitem` with `aria-haspopup="menu"` and `aria-expanded`; the submenu is its own
`menu` named by that row. Choosing a row anywhere closes every level; slot `submenu` styles the
panels, `chevron` the mark. A menu-level `selectionMode` does not reach into submenus; give a group
inside one its own.

## Look
The panel is raised (surface, hairline edge, soft shadow) and grows out of the side it opened on;
`data-state="closed"` while it shrinks away. Rows are inset with rounded fills; a section header is small
and muted; a check (or a dot for radio rows) sits in a leading column. When the rows scroll, the edge that
hides more fades (`data-overflow-top` / `-bottom` on the root, from `watchScrollEdges`).

## Keyboard
| Keys | Action |
|---|---|
| Enter, Space, ArrowDown (trigger) | Open on the first row (on the search field when `searchable`) |
| ArrowUp (trigger) | Open on the last row |
| ArrowDown, ArrowUp, Home, End | Move, wrapping unless `loop: false` |
| ArrowRight (ArrowLeft in RTL), Enter, Space on a submenu row | Open it beside, on its first row |
| ArrowLeft (ArrowRight in RTL), Escape in a submenu | Close just that submenu, back on its row |
| Enter, Space | Select |
| A letter | Jump to the next match; keep typing to narrow. With `searchable`: types into the field |
| ArrowDown, ArrowUp, Enter in the search field | First row, last row, choose the first match |
| Escape | Clear the search first; then close, focus back on the trigger |
| Tab | Close and move on from the trigger |

## Accessibility
- `role="menu"`, `menuitem`, `menuitemcheckbox`, `menuitemradio`, `aria-checked`; groups are
  `role="group"` named by their label.
- The `role="menu"` list sits inside the panel; the search field (`type="search"`, `aria-controls` the
  list), header, footer, loading and empty parts are outside it, so the menu holds only rows. Loading and
  empty are `role="status"`; a loading list is `aria-busy`.
- Real focus moves between rows (tabindex -1). Disabled rows are `aria-disabled` and stay reachable; a
  `disabledReason` is their tooltip and accessible description.
- A link row is a real `<a>`, with a safe `rel` on `_blank`; a disabled one has no `href`.
- A context menu also opens with the Menu key or Shift+F10 when the area has focus, so give the
  area `tabIndex={0}`. iOS Safari has no `contextmenu` event: offer the actions another way there.

## Compared with shadcn/ui, HeroUI and MUI
| shadcn/ui | HeroUI | MUI | Pinfold |
|---|---|---|---|
| `DropdownMenu`, `ContextMenu` + 10 parts | `Dropdown` + `DropdownItem` | `Menu` + `MenuItem` | one config: `items`, `mode` |
| `DropdownMenuCheckboxItem`, `RadioItem` | `selectionMode`, `selectedKeys` | | `selectionMode` + `value`, per menu or group |
| `DropdownMenuSub` + `SubTrigger` + `SubContent` | | nested `Menu` | `{ type: 'submenu', label, items }` |
| | `onAction`, `DropdownSection` | | `onAction`, `type: 'group'` |

## Deliberately excluded
- Binding `shortcut` to the key: it is a hint; the app owns its key handling.
