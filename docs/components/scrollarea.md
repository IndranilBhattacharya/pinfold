# Scroll area: spec

Status: **experimental**. Pattern: a scrollable region.

## Usage
```tsx
import { defineScrollArea } from '@pinfold/react/scrollarea';

export const Scroll = defineScrollArea({ dimensions: { maxHeight: 320 } });
export const Messages = defineScrollArea({ stickToEnd: true, indicator: 'shadow', dimensions: { height: 480 } });

<Scroll label="Changelog">{entries}</Scroll>
<Messages label="Conversation" onReachStart={loadOlder}>{messages.map(renderMessage)}</Messages>
```
Precedence: use-site props, the preset, `defaults.scrollarea`, the provider (tone), the library default.
The content is `content` in a config, or `children` on the tag.

## Config
| Key | Type | Default |
|---|---|---|
| `content` | what scrolls (`children` on the tag) | |
| `label` | names the region | |
| `orientation` | `'vertical' \| 'horizontal' \| 'both'` | `'vertical'` |
| `indicator` | `'fade' \| 'shadow' \| 'glow' \| 'line' \| 'none'`: how an edge shows it hides content | `'fade'` |
| `indicatorSize` | depth of the fade, shadow or glow | `2rem` (shadow `1rem`, line `2px`) |
| `scrollbar` | `'auto' \| 'thin' \| 'hover' \| 'hidden'` | `'thin'` |
| `stickToEnd` | follow the end as content arrives, until the reader scrolls away | `false` |
| `onReachStart`, `onReachEnd`, `reachThreshold` | once per arrival within the threshold | threshold `48` |
| `onEdgesChange`, `onScroll` | `({ top, bottom, start, end })`; the scroll event | |
| `dimensions` | `height`, `maxHeight`, `width`, `maxWidth`, `padding` | |
| `radius`, `tone` | corner radius; colour of the glow and line | the theme radius, `'primary'` (provider) |
| `unstyled`, `className`, `style`, `classNames` / `styles` / `slotProps` / `render` | slots: `root`, `viewport`, `content`, `indicator` | |

Inactive (`inactiveScrollAreaOptions`): `indicatorSize` with no indicator; `tone` unless the indicator
is a glow or a line; `stickToEnd` in a horizontal area.

## Controller
`useScrollArea(config)` returns the component with `edges`, `getViewport()`, `scrollToStart()`,
`scrollToEnd()` and `scrollTo({ top, left } | element)`. Scrolling an element into view moves only
this area, never the page. Scrolls are smooth unless motion is reduced.

## Behaviour
- The root carries `data-overflow-top`, `-bottom`, `-start` and `-end` while that edge hides content;
  they are written straight to the element, so scrolling re-renders nothing unless an edge changes.
- `fade` masks the content itself, so it works over any background. The others lay a strip over the edge.
- `stickToEnd` follows growth only while the reader is at the end (within 24px); `scrollToEnd()` re-pins.
- Every listener and observer is removed on unmount; each use of a preset is its own instance.

## Other components
`watchScrollEdges(viewport, { target })` in `@pinfold/core` is the same engine without React: it keeps
the four attributes on any element.

## Accessibility
- The viewport is focusable only while it overflows, so a keyboard can scroll it (WCAG 2.1.1).
- With `label` it is a `region` with that name. Indicators are `aria-hidden`.
- Forced colours: the fade is dropped and strips become solid lines.
