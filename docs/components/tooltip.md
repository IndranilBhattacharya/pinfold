# Tooltip: spec

Status: **experimental**. Pattern: [APG tooltip](https://www.w3.org/WAI/ARIA/apg/patterns/tooltip/). Meets [WCAG 1.4.13](https://www.w3.org/WAI/WCAG22/Understanding/content-on-hover-or-focus.html).

## Usage
```tsx
import { defineTooltip } from '@pinfold/react/tooltip';

export const Hint = defineTooltip({ placement: 'bottom' });

<Hint content="Copies the link" trigger={{ label: 'Share', variant: 'outline' }} />   // a button config
<Hint content="Opens in a new tab" trigger={<a href="/docs">Docs</a>} />              // any element

// Your own element
const Tip = useTooltip({ content: 'Hint' });
<input {...Tip.getTriggerProps()} /><Tip />
```
`useTooltip(config)` and `<Tooltip {...config} />` take the same config. Precedence: use-site props,
the preset, `defaults.tooltip`, the library default. An element trigger must pass props to its root.

## Config
| Key | Type | Default |
|---|---|---|
| `content` | node (required) | |
| `trigger` | `ButtonConfig` or an element | none |
| `placement` | `top`, `bottom`, `start`, `end`, each with `-start`/`-end` (or `-top`/`-bottom`) | `'top'` |
| `variant` | `'inverse' \| 'surface'` | `'inverse'` |
| `arrow` | `boolean` | `true` |
| `offset` | `number`, px | `8` |
| `delay`, `closeDelay` | `number`, ms | `400`, `120` |
| `disabled` | `boolean` | `false` |
| `open`, `defaultOpen`, `onOpenChange` | state | uncontrolled, closed |
| `dimensions` | `maxWidth` | `18rem` |
| `radius` | `'none' \| 'sm' \| 'md' \| 'lg' \| 'full'` or a length; a preset rescales every corner inside, a length sets the frame | the theme radius |
| `unstyled`, `className`, `style`, `classNames` / `styles` / `slotProps` / `render` (slots `root arrow`) | | |

Controller: `isOpen`, `open()`, `close()`, `getTriggerProps()`.

## Accessibility
- `role="tooltip"`, linked with `aria-describedby` on the trigger while open. It describes; it does
  not name: an icon-only control still needs its own label.
- Dismissible (Escape), hoverable (the pointer can move onto it), persistent (stays until the pointer
  or focus leaves).
- Keyboard focus opens it at once; a mouse click on the trigger closes it; touch has no hover, so a
  stray tap never opens it.

## Positioning
Flips when the preferred side has no room and shifts along the edge to stay on screen; `start` and
`end` swap in RTL. It stays next to its trigger in the DOM, so theme and direction are inherited, and
joins the top layer through the Popover API where the browser has it (see
[COMPATIBILITY](../COMPATIBILITY.md)).

## Deliberately excluded
- Interactive content: use a [popover](popover.md).
- A shared delay group between neighbouring tooltips: rarely noticed; `delay` covers it.
