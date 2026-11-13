# Popover: spec

Status: **experimental**. A floating dialog anchored to a trigger; for a modal one over the page see [dialog](dialog.md).

## Usage
```tsx
import { definePopover } from '@pinfold/react/popover';

export const Details = definePopover({ placement: 'bottom-start' });
export const Profile = definePopover({ openOn: 'hover', size: 'sm' });   // a hover card

<Details title="Share this page" content={<CopyLink />} actions={[{ label: 'Done' }]} trigger={{ label: 'Share', variant: 'outline' }} />
<Profile aria-label="Ada Lovelace" content={<ProfileCard id="ada" />} trigger={<a href="/ada">Ada</a>} />

// Anything inside: a function of { close, isOpen }; header and footer content; a scrolling body
<Popover
  trigger={{ label: 'Filters' }}
  title="Filters"
  header={<Badge label="3 active" />}
  content={({ close }) => <FilterForm onApply={close} />}
  footer={<a href="/help/filters">How filters work</a>}
  closeButton
  size="lg"
  dimensions={{ maxHeight: 360 }}
/>

// The tag also takes children as the content
<Popover title="Note" trigger={{ label: 'Info' }}>Saved drafts are kept for 30 days.</Popover>
```
`usePopover(config)` and `<Popover {...config} />` take the same config. Precedence: use-site props,
the preset, `defaults.popover`, the library default.

## Config
| Key | Type | Default |
|---|---|---|
| `title`, `description` | node | none |
| `content` | node, or `({ close, isOpen }) => node`; `children` on the tag | none |
| `header` | node or function: under the title, or the whole header without one | none |
| `footer` | node or function: before the actions, or the whole footer without them | none |
| `actions` | `ButtonConfig[]`: small, first solid, rest ghost. Each closes it unless `onClick` returns `false`; a promise shows loading and closes when it resolves | none |
| `trigger` | `ButtonConfig` or an element | none |
| `openOn` | `'click' \| 'hover' \| 'focus' \| 'manual'` | `'click'` |
| `modal` | `boolean`: Tab cycles inside the panel, `aria-modal` | `false` |
| `placement` | as tooltip; flips when there is no room | `'bottom'` |
| `arrow` | `boolean` | `false` |
| `offset` | `number`, px | `8` |
| `matchTriggerWidth` | `boolean`: as wide as the trigger | `false` |
| `size` | `'sm' \| 'md' \| 'lg' \| 'auto'`: 16, 20, 28rem wide, or fit the content | `'md'` |
| `closeButton`, `closeLabel` | `boolean`, `string` | `false`, `'Close'` |
| `delay`, `closeDelay` | `number`, ms; hover only | `200`, `200` |
| `closeOnOutsidePress`, `closeOnEscape` | `boolean` | `true`, `true` |
| `closeOnScroll` | `boolean`: a page scroll (not one inside the panel) closes it | `false` |
| `closeOnOutside` | deprecated alias of `closeOnOutsidePress` | |
| `open`, `defaultOpen` | state | uncontrolled, closed |
| `dimensions` | `width, maxWidth, maxHeight, padding` | from the size |
| `radius` | `'none' \| 'sm' \| 'md' \| 'lg' \| 'full'` or a length; a preset rescales every corner inside, a length sets the frame | the theme radius |
| `unstyled`, `className`, `style`, `classNames` / `styles` / `slotProps` / `render` (slots `root header title description content footer actions close arrow`) | | |

## Events
| Event | Called with |
|---|---|
| `onOpenChange` | `(open, reason)` |
| `onOpen` | `()`: it asked to open |
| `onClose` | `(reason)`: it asked to close |

Reasons: `trigger`, `hover`, `focus`, `escape`, `outside`, `scroll`, `blur`, `action` (an action, or `close()`
from a content function), `closeButton`, `api` (the controller).

Controller: `isOpen`, `open()`, `close()`, `toggle()`, `getTriggerProps()`, `getRootProps()`.
Inactive (`inactivePopoverOptions`): `delay`, `closeDelay` unless `openOn: 'hover'`; `closeLabel` without
`closeButton`; `modal` with `openOn: 'hover' | 'focus'`; `size` with `matchTriggerWidth`.

## Behaviour
- `click` toggles from the trigger and moves focus into the panel; closing returns it to the trigger.
- `hover` opens on hover or keyboard focus after `delay`, leaves focus alone, and stays while the
  pointer is over the panel. `focus` opens while the trigger or the panel has focus (help for a field)
  and closes when focus leaves both. `manual` opens only through `open` or the controller.
- `modal` focuses the first control (or `[data-autofocus]`) and keeps Tab inside until it closes.
- With `dimensions.maxHeight` the header and footer stay and the content scrolls; the edge that hides
  more fades (`data-overflow-top` / `-bottom` on the root, from `watchScrollEdges`).
- It grows out of the side it opened on and shrinks back when it closes (`data-state="closed"` while the
  exit animation runs; at once with reduced motion or `disableAnimation`).
- Nested popovers (a popover in another's content) work: Escape closes the innermost first, and a press
  inside the outer panel closes only the inner one.

## Accessibility
- `role="dialog"` named by the title; the trigger has `aria-haspopup="dialog"`, `aria-expanded`,
  `aria-controls`. Without a title or an `aria-label` it warns in development.
- The panel is right after its trigger in the DOM, so the tab order is the visual order.
- A popover open from the first render never takes focus.
