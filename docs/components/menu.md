# Menu: spec

Status: **experimental**. Pattern: [APG menu button](https://www.w3.org/WAI/ARIA/apg/patterns/menu-button/).

## Usage
```tsx
import { defineMenu } from '@pinfold/react/menu';

export const RowActions = defineMenu({ placement: 'bottom-end' });

<RowActions
  trigger={{ label: 'Actions', variant: 'outline' }}
  items={[
    { label: 'Edit', shortcut: 'E', onSelect: edit },
    { label: 'Docs', href: '/docs' },
    { type: 'checkbox', label: 'Wrap lines', checked: wrap, onSelect: toggleWrap },
    { type: 'group', label: 'Sort by', items: [{ type: 'radio', label: 'Name', checked: sort === 'name', onSelect: byName }] },
    { type: 'separator' },
    { label: 'Delete', tone: 'danger', onSelect: remove },
  ]}
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
| `placement` | as tooltip | `'bottom-start'` |
| `size` | `'sm' \| 'md' \| 'lg'` | `'md'` (provider) |
| `offset` | `number`, px | `4` |
| `loop` | `boolean` | `true` |
| `open`, `defaultOpen`, `onOpenChange` | state | uncontrolled, closed |
| `dimensions` | `width, maxHeight` | fits; `24rem` |
| `unstyled`, `className`, `style`, `classNames` / `styles` / `slotProps` / `render` (slots `root item indicator icon label shortcut separator group groupLabel`) | | |

Rows: an action (`label`, `icon`, `shortcut`, `tone`, `disabled`, `onSelect`, `closeOnSelect`, `href`,
`target`), `type: 'checkbox' | 'radio'` (plus `checked`; you own the state), `type: 'separator'`, or
`type: 'group'` (`label`, `items`).

Controller: `isOpen`, `open()`, `close()`, `toggle()`, `getTriggerProps()`.
Inactive (`inactiveMenuOptions`): `placement`, `offset` in a context menu.

## Submenus
A row `{ type: 'submenu', label, items }` opens its rows in a menu beside it (the other side when
there is no room), on hover after 120 ms, on a press, or from the keyboard. Resting on another row
shuts it. It is a `menuitem` with `aria-haspopup="menu"` and `aria-expanded`; the submenu is its own
`menu` named by that row. Choosing a row anywhere closes every level; slot `submenu` styles the
panels, `chevron` the mark.

## Keyboard
| Keys | Action |
|---|---|
| Enter, Space, ArrowDown (trigger) | Open on the first row |
| ArrowUp (trigger) | Open on the last row |
| ArrowDown, ArrowUp, Home, End | Move, wrapping unless `loop: false` |
| ArrowRight (ArrowLeft in RTL), Enter, Space on a submenu row | Open it beside, on its first row |
| ArrowLeft (ArrowRight in RTL), Escape in a submenu | Close just that submenu, back on its row |
| Enter, Space | Select |
| A letter | Jump to the next match; keep typing to narrow |
| Escape | Close, focus back on the trigger |
| Tab | Close and move on from the trigger |

## Accessibility
- `role="menu"`, `menuitem`, `menuitemcheckbox`, `menuitemradio`, `aria-checked`; groups are
  `role="group"` named by their label.
- Real focus moves between rows (tabindex -1). Disabled rows are `aria-disabled` and stay reachable.
- A link row is a real `<a>`, with a safe `rel` on `_blank`; a disabled one has no `href`.
- A context menu also opens with the Menu key or Shift+F10 when the area has focus, so give the
  area `tabIndex={0}`. iOS Safari has no `contextmenu` event: offer the actions another way there.

## Compared with shadcn/ui, HeroUI and MUI
| shadcn/ui | HeroUI | MUI | Pinfold |
|---|---|---|---|
| `DropdownMenu`, `ContextMenu` + 10 parts | `Dropdown` + `DropdownItem` | `Menu` + `MenuItem` | one config: `items`, `mode` |
| `DropdownMenuCheckboxItem`, `RadioItem` | `selectionMode` | | `type: 'checkbox' \| 'radio'` |
| `DropdownMenuSub` + `SubTrigger` + `SubContent` | | nested `Menu` | `{ type: 'submenu', label, items }` |

## Deliberately excluded
- Binding `shortcut` to the key: it is a hint; the app owns its key handling.
