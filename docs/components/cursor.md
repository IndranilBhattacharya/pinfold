# Cursor: spec

Status: **experimental**. A decoration that follows the pointer.

## Usage
```tsx
import { defineCursor } from '@pinfold/react/cursor';

export const Pointer = defineCursor({ variant: 'dot-ring' });

<Pointer />                                             // the whole page: once, anywhere
<Pointer variant="blob" blend="difference"><Gallery /></Pointer>   // one area
<Pointer variant="arrow" tone="success" label="Mara"><Canvas /></Pointer>
```
Precedence: use-site props, the preset, `defaults.cursor`, the provider (size, tone), the library default.

## Config
| Key | Type | Default |
|---|---|---|
| `content` | the area it belongs to (`children` on the tag); without it the cursor covers the page | |
| `variant` | `'dot-ring'` (a dot and a ring that trails it), `'dot'`, `'ring'`, `'blob'`, `'spotlight'` (a glow that lights what it passes), `'crosshair'`, `'arrow'` | `'dot-ring'` |
| `shape` | your own pointer in place of the dot: an icon, an emoji, an image | |
| `label` | text beside the pointer; an element's `data-cursor-label` replaces it while pointed at | |
| `smoothing`, `trail` | how far the follower lags, 0 to 0.95; dots that follow in a fading line, 0 to 12 | `0.8`, `0` |
| `blend` | `'difference'` inverts what is under the pointer, so it shows on any background | `'normal'` |
| `hideNative` | hide the system cursor inside the area (never over text fields) | on; off for the spotlight |
| `interactive` | a CSS selector for what counts as pressable | links, buttons, anything focusable |
| `disabled` | off: the system cursor is used | `false` |
| `onStateChange`, `onVisibleChange` | `(state, element)`; `(visible)` | |
| `size`, `tone` | | `'md'`, `'primary'` (provider) |
| `unstyled`, `className`, `style`, `classNames` / `styles` / `slotProps` / `render` | slots: `root area dot follower trail label` | |

## States from your markup
The pointer takes a state from what it is over, reflected as `data-state` on the cursor:
`default`, `pointer` (links, buttons, anything focusable), `text` (fields: the cursor steps aside for the system
I-beam), `hidden`, or any name you put on an element:
```tsx
<img data-cursor="zoom" data-cursor-label="View" ... />
<div data-cursor="hidden">…</div>
```
Style a state of your own with a class or a selector: `.my-cursor[data-state='zoom'] { --pinfold-cursor-follower-size: 5rem; }`.
`--pinfold-cursor-size`, `--pinfold-cursor-follower-size` and `--pinfold-cursor-color` set the sizes and the colour.

## Behaviour
- Positions are written straight to the elements as transforms: moving the pointer re-renders nothing. One animation
  frame loop runs only while something is still catching up.
- The system cursor is hidden only after the pointer has really moved, by an attribute that counts its users, and is
  given back when the pointer leaves, the window loses focus or the component unmounts.
- A cursor with an area listens on that area only; several cursors on one page are independent.
- `useCursor` adds `visible`, `state`, `pressed` and `getPosition()`.

## Accessibility
- `aria-hidden` and `pointer-events: none`: it never changes what a click reaches or what is read.
- Fine pointers only: on touch nothing is drawn and nothing is hidden. Reduced motion: no lag and no trail.
- Forced colours: the system highlight colour, no blending.
