# Dialog: spec

Status: **experimental**. Pattern: [APG dialog](https://www.w3.org/WAI/ARIA/apg/patterns/dialog-modal/). Built on the native `<dialog>`.

## Usage
```tsx
import { defineDialog } from '@pinfold/react/dialog';

export const Confirm = defineDialog({ role: 'alertdialog', size: 'sm' });
export const Drawer = defineDialog({ placement: 'end' });
export const Sheet = defineDialog({ placement: 'bottom' });

<Confirm
  title="Delete this project?"
  description="This cannot be undone."
  trigger={{ label: 'Delete', tone: 'danger', variant: 'soft' }}
  actions={[{ label: 'Cancel' }, { label: 'Delete', tone: 'danger', onClick: remove }]}   // a promise shows loading, closes on resolve
/>

// Free content, header and footer, a body that scrolls between them
<Dialog
  title="Terms of service"
  size="lg"
  header={<Badge label="v2" />}
  content={({ close }) => <Terms onDecline={close} />}
  footer={<Checkbox label="Don't show again" />}
  actions={[{ label: 'Decline' }, { label: 'Accept', onClick: accept }]}
  onClose={(reason) => track('terms-closed', reason)}
/>

// From code
const Welcome = useDialog({ title: 'Welcome', content: <Tour /> });
Welcome.open();
```
`useDialog(config)` and `<Dialog {...config} />` take the same config; the tag also takes `children` as
the content. Precedence: use-site props, the preset, `defaults.dialog`, the library default.

## Config
| Key | Type | Default |
|---|---|---|
| `title`, `description` | node | none |
| `content` | node, or `({ close, isOpen }) => node`; `children` on the tag | none |
| `header` | node or function: under the title, or the whole header without one | none |
| `footer` | node or function: at the start of the footer, before the actions | none |
| `actions` | `ButtonConfig[]`: last solid, rest ghost. Each closes it unless `onClick` returns `false`; a promise shows loading, closes when it resolves, and stays open if it rejects | none |
| `trigger` | `ButtonConfig` or an element | none |
| `role` | `'dialog' \| 'alertdialog'` | `'dialog'` |
| `placement` | `'center' \| 'top' \| 'bottom' \| 'start' \| 'end'`: centred, a top or bottom sheet, a drawer | `'center'` |
| `size` | `'sm' \| 'md' \| 'lg' \| 'xl' \| 'full'`: 24, 32, 44, 60rem centred; 20, 24, 32, 44rem as a drawer; `full` fills the screen, square | `'md'` |
| `scrollBehavior` | `'inside' \| 'outside'`, below | `'inside'` |
| `backdrop` | `'dim' \| 'blur' \| 'none'` | `'dim'` |
| `radius` | `'none' \| 'sm' \| 'md' \| 'lg' \| 'full'` or a length; a preset rescales every corner inside, a length sets the frame (`dimensions.radius` wins) | the theme radius |
| `modal` | `boolean` | `true` |
| `dismissible` | `boolean`; `false`: no close button, Escape and outside presses do nothing | `true` |
| `closeButton` | `boolean` | on, off for an alert dialog |
| `closeLabel` | `string` | `'Close'` |
| `closeOnOutsidePress` | `boolean` | on, off for an alert dialog |
| `closeOnOutside` | deprecated alias of `closeOnOutsidePress` | |
| `closeOnEscape` | `boolean` | `true` |
| `initialFocus` | `'panel'`, a CSS selector inside the dialog, or a ref | `[data-autofocus]`, else the first control |
| `open`, `defaultOpen` | state | uncontrolled, closed |
| `dimensions` | `width, height, maxHeight, padding, radius` | from the size |
| `unstyled`, `className`, `style`, `classNames` / `styles` / `slotProps` / `render` (slots `root panel header title description content footer actions close`) | | |

## Events
| Event | Called with |
|---|---|
| `onOpenChange` | `(open, reason)` |
| `onOpen` | `()`: it asked to open |
| `onClose` | `(reason)`: it asked to close |

Reasons: `trigger`, `escape`, `outside`, `closeButton`, `action` (an action, or `close()` from a content
function), `form` (a `<form method="dialog">` inside), `api` (the controller).

Controller: `isOpen`, `open()`, `close()`, `getTriggerProps()`, `getRootProps()`.
Inactive (`inactiveDialogOptions`): `size` on a top or bottom sheet unless `full`; `closeLabel` without the
close button; `closeOnOutsidePress` and `backdrop` when not modal; `closeButton`, `closeOnEscape`,
`closeOnOutsidePress` with `dismissible: false`; `scrollBehavior: 'outside'` on a sheet.

## Shape and overflow
- The panel has three bands: a header (title, description, `header`), the content, and a footer
  (`footer`, actions). With `scrollBehavior: 'inside'` the panel fits the screen (or
  `dimensions.maxHeight`) and only the content scrolls; while content hides under the header or above
  the footer, that band shows a hairline and a soft shadow (`data-overflow-top` / `-bottom` on the panel,
  kept by `watchScrollEdges`).
- `scrollBehavior: 'outside'`: the panel grows with its content and the backdrop scrolls, starting at the
  top; focus starts on the panel.
- `size: 'full'` is edge to edge with square corners. Sheets are flush with their edge and round only
  the inner corners; a bottom sheet shows a grabber and stops at 85% of the screen height. Drawers fill
  the height. `radius` reshapes every corner that is rounded.
- It enters from where it lives (scales up in the centre, slides in from an edge) and leaves the same way;
  the browser closes it, and returns focus, when the exit animation ends (at once with reduced motion or
  `disableAnimation`).

## Accessibility
- Native `showModal()`: the top layer, the inert page, the focus trap and focus return come from the
  browser, so they cannot break.
- Named by the title, described by the description. Without a title or an `aria-label` it warns in
  development.
- Focus goes to the first control inside; the close button is last in the DOM, so it is never that
  control. `initialFocus` or `data-autofocus` (through `slotProps`) choose another.
- An alert dialog focuses its first action: put the safe one first, as in `[Cancel, Delete]`.
- Content mounts only while open. Scroll is locked without the page shifting sideways.
- Overlays inside a dialog (menus, tooltips, another dialog) close first on Escape and on a backdrop press.

## Compared with shadcn/ui, HeroUI and MUI
| shadcn/ui | HeroUI | MUI | Pinfold |
|---|---|---|---|
| `Dialog`, `AlertDialog`, `Sheet`, `Drawer` | `Modal`, `Drawer` | `Dialog`, `Drawer` | one config: `role`, `placement` |
| `DialogHeader/Title/Description/Footer` | `ModalHeader/Body/Footer` | `DialogTitle/Content/Actions` | `title`, `description`, `header`, `content`, `footer`, `actions` |
| `DialogClose` wraps a button | `onClose` | `onClose(reason)` | an action closes by itself; `onClose(reason)` |
| | `scrollBehavior`, `backdrop` | `scroll` | `scrollBehavior`, `backdrop`, edge shadows |
