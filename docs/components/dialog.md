# Dialog: spec

Status: **experimental**. Pattern: [APG dialog](https://www.w3.org/WAI/ARIA/apg/patterns/dialog-modal/). Built on the native `<dialog>`.

## Usage
```tsx
import { defineDialog } from '@pinfold/react/dialog';

export const Confirm = defineDialog({ role: 'alertdialog', size: 'sm' });
export const Panel = defineDialog({ placement: 'end' });   // a sheet

<Confirm
  title="Delete this project?"
  description="This cannot be undone."
  trigger={{ label: 'Delete', tone: 'danger', variant: 'soft' }}
  actions={[{ label: 'Cancel' }, { label: 'Delete', tone: 'danger', onClick: remove }]}
/>

// From code
const Welcome = useDialog({ title: 'Welcome', content: <Tour /> });
Welcome.open();
```
`useDialog(config)` and `<Dialog {...config} />` take the same config. Precedence: use-site props, the
preset, `defaults.dialog`, the library default.

## Config
| Key | Type | Default |
|---|---|---|
| `title`, `description`, `content` | node | none |
| `actions` | `ButtonConfig[]`: last solid, rest ghost. Each closes it unless `onClick` returns `false`; a promise closes when it resolves, and stays open if it rejects | none |
| `trigger` | `ButtonConfig` or an element | none |
| `role` | `'dialog' \| 'alertdialog'` | `'dialog'` |
| `placement` | `'center' \| 'top' \| 'bottom' \| 'start' \| 'end'` | `'center'` |
| `radius` | `'none' \| 'sm' \| 'md' \| 'lg' \| 'full'` or a length; a preset rescales every corner inside, a length sets the frame | the theme radius |
| `size` | `'sm' \| 'md' \| 'lg' \| 'xl' \| 'full'`; a layout choice, not the provider size | `'md'` |
| `modal` | `boolean` | `true` |
| `closeButton` | `boolean` | on, off for an alert dialog |
| `closeLabel` | `string` | `'Close'` |
| `closeOnOutside` | `boolean` | on, off for an alert dialog |
| `closeOnEscape` | `boolean` | `true` |
| `open`, `defaultOpen`, `onOpenChange` | state | uncontrolled, closed |
| `dimensions` | `width, height, padding, radius` | from the size |
| `unstyled`, `className`, `style`, `classNames` / `styles` / `slotProps` / `render` (slots `root panel title description content actions close`) | | |

Controller: `isOpen`, `open()`, `close()`, `getTriggerProps()`.
Inactive (`inactiveDialogOptions`): `size` on a sheet; `closeLabel` without the close button;
`closeOnOutside` when not modal.

## Accessibility
- Native `showModal()`: the top layer, the inert page, the focus trap and focus return come from the
  browser, so they cannot break.
- Named by the title, described by the description. Without a title it warns in development.
- Focus goes to the first control inside; the close button is last in the DOM, so it is never that
  control. Put `data-autofocus` on a control (through `slotProps`) to choose another.
- An alert dialog focuses its first action: put the safe one first, as in `[Cancel, Delete]`.
- Content mounts only while open. Scroll is locked without the page shifting sideways.
- Overlays inside a dialog (menus, tooltips) work and close first on Escape.

## Compared with shadcn/ui, HeroUI and MUI
| shadcn/ui | HeroUI | MUI | Pinfold |
|---|---|---|---|
| `Dialog`, `AlertDialog`, `Sheet`, `Drawer` | `Modal`, `Drawer` | `Dialog`, `Drawer` | one config: `role`, `placement` |
| `DialogHeader/Title/Description/Footer` | `ModalHeader/Body/Footer` | `DialogTitle/Content/Actions` | `title`, `description`, `content`, `actions` |
| `DialogClose` wraps a button | `onClose` | `onClose` | an action closes by itself |

## Deliberately excluded
- An exit animation: there is no way to animate a closing `<dialog>` on the browser floor without
  delaying `close()`, which delays focus return.
- A scrollable-page variant: the panel scrolls inside the viewport.
