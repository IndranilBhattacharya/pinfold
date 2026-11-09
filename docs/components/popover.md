# Popover: spec

Status: **experimental**. A non-modal dialog; for a modal one see [dialog](dialog.md).

## Usage
```tsx
import { definePopover } from '@pinfold/react/popover';

export const Details = definePopover({ placement: 'bottom-start' });
export const Profile = definePopover({ openOn: 'hover' });   // a hover card

<Details title="Share this page" content={<CopyLink />} actions={[{ label: 'Done' }]} trigger={{ label: 'Share', variant: 'outline' }} />
<Profile title="Ada Lovelace" description="Mathematician" trigger={<a href="/ada">Ada</a>} />
```
`usePopover(config)` and `<Popover {...config} />` take the same config. Precedence: use-site props,
the preset, `defaults.popover`, the library default.

## Config
| Key | Type | Default |
|---|---|---|
| `title`, `description`, `content` | node | none |
| `actions` | `ButtonConfig[]`: small, first solid, rest ghost. Each closes it unless `onClick` returns `false`; a promise closes when it resolves | none |
| `trigger` | `ButtonConfig` or an element | none |
| `openOn` | `'click' \| 'hover'` | `'click'` |
| `placement` | as tooltip | `'bottom'` |
| `arrow` | `boolean` | `false` |
| `offset` | `number`, px | `8` |
| `delay`, `closeDelay` | `number`, ms; hover only | `200`, `200` |
| `closeOnOutside`, `closeOnEscape` | `boolean` | `true`, `true` |
| `open`, `defaultOpen`, `onOpenChange` | state | uncontrolled, closed |
| `dimensions` | `width, padding` | `20rem`, theme |
| `radius` | `'none' \| 'sm' \| 'md' \| 'lg' \| 'full'` or a length; a preset rescales every corner inside, a length sets the frame | the theme radius |
| `unstyled`, `className`, `style`, `classNames` / `styles` / `slotProps` / `render` (slots `root title description content actions arrow`) | | |

Controller: `isOpen`, `open()`, `close()`, `toggle()`, `getTriggerProps()`.
Inactive (`inactivePopoverOptions`): `delay`, `closeDelay` unless `openOn: 'hover'`.

## Accessibility
- `role="dialog"` named by the title; the trigger has `aria-haspopup="dialog"`, `aria-expanded`,
  `aria-controls`. Without a title it warns in development.
- Click: focus moves into the panel; Escape closes and returns focus to the trigger.
- Hover: opens on hover or keyboard focus, leaves focus alone, and stays while the pointer is over it.
- The panel is right after its trigger in the DOM, so the tab order is the visual order.
- A popover open from the first render never takes focus.

## Deliberately excluded
- A focus trap: that is what a modal [dialog](dialog.md) is for.
