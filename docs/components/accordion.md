# Accordion: spec

Status: **stable API**.
Pattern: [WAI-ARIA APG Accordion](https://www.w3.org/WAI/ARIA/apg/patterns/accordion/).
Owner sign-off: 2026-10-31 (session plan).

## Usage

```tsx
// Client, in any React 18+ setup
import { useAccordion } from '@pinfold/react/accordion';
const Faq = useAccordion({ items });
return <Faq />;
```
```tsx
// Server Component: same import path
import { defineAccordion } from '@pinfold/react/accordion';
const Faq = defineAccordion({ items: await db.faq.findMany(), fields: { id: 'slug', title: 'question', content: 'answer' } });
return <Faq />;
```
```jsx
// Plain JS. The editor still gets types from the .d.ts files.
/** @type {import('@pinfold/react/accordion').AccordionConfig} */
const config = { items };
```
State is uncontrolled by default. Control it from code with `Faq.open(id)`, `toggle`, `openAll`, `closeAll` and `focusItem`.
It becomes controlled only when you pass `value` together with `onValueChange`.

## Config

Only `items` is required. Defaults come from the global config first (D-08).

### Behaviour
| Key | Type | Default | Status |
|---|---|---|---|
| `items` | `AccordionItemConfig[]` | required | stable |
| `fields` | `{ id?, title?, content?, description?, icon?, badge?, disabled?, defaultOpen? }`, mapping raw records onto rows | none | stable |
| `mode` | `'single' \| 'multiple'` | `'single'` | stable |
| `collapsible` | `boolean`. In single mode, lets the user close the open row. | `true` | stable |
| `value` / `defaultValue` | `string[]` | none | stable |
| `onValueChange` | `(ids, details?)`. `details: { id, open, reason: 'click'\|'keyboard'\|'api'\|'find-in-page'\|'hash', event? }` | none | stable |
| `onBeforeChange` | `(details) => boolean \| void`. Return `false` to block the change. | none | stable |
| `onItemToggle` | `(id, open)` | none | stable |
| `disabled` | `boolean`, disables every row (they stay focusable) | `false` | stable |
| `orientation` | `'vertical' \| 'horizontal'` | `'vertical'` | stable |
| `dir` | `'ltr' \| 'rtl'` | provider | stable |
| `loop` | `boolean`. Focus wraps around at the ends. | `true` | stable |
| `id` | id prefix | `useId` | stable |
| `hiddenUntilFound` | `boolean`. Closed panels use `hidden="until-found"` and open on `beforematch`, so Ctrl+F finds them. Applied after hydration; browsers without support fall back to plain `hidden`. | `true` | stable |
| `mountPanels` | `'always' \| 'open' \| 'first-open'` | `'always'` (good for SEO and Ctrl+F) | stable. Replaces `unmountClosed`, which stays as a deprecated alias with a dev warning. |
| `syncWithHash` | `boolean`. `#id` opens the row and scrolls to it. Opening a row by click or keyboard updates the hash (`history.replaceState`, no new history entry). | `false` | stable |
| `lazy` | `'auto' \| 'eager' \| 'visible' \| 'idle'` | `'auto'` (eager for this component). Used by the `@pinfold/react/accordion/lazy` entry; also settable on the provider. | stable |

### Appearance
| Key | Type | Default |
|---|---|---|
| `variant` | `'solid' \| 'outline' \| 'separated' \| 'filled' \| 'ghost'` (see Look below) | `'solid'` |
| `size` / `tone` | design-system scale | provider |
| `radius` | Corner radius of the container that holds the rows: a preset (`'none' \| 'sm' \| 'md' \| 'lg' \| 'full'`, scaling the size's radius like the theme presets) or a length (`20` is px, `'1.25rem'` passes through). | the theme radius |
| `itemRadius` | Corner radius of each row, same values as `radius`. | `radius` for separated, filled and ghost rows; square rows inside a solid or outline card |
| `gap` | Space between rows: `'none' \| 'sm' \| 'md' \| 'lg'` or a length. Dividers sit in the middle of the gap. | none for solid, outline and ghost; `'sm'` for separated and filled |
| `icon` / `endIcon` | A visual for every row, at the start or just before the indicator: a node or `(state) => node` (e.g. different when open). A row's own `icon` / `endIcon` wins. | none |
| `indicator` | `'chevron' \| 'plus' \| 'caret' \| 'arrow' \| 'none' \| node \| (state) => node` | `'chevron'` |
| `indicatorPosition` | `'start' \| 'end'` | `'end'` |
| `animateIndicator` | `boolean`. `false` keeps the indicator still (a plus still turns into a minus). | `true` |
| `headingLevel` | `1–6` | `3` |
| `animate` | `boolean`. `prefers-reduced-motion` always wins. | `true` |
| `dividers` | `boolean`, solid, outline and ghost. Colour: `--pinfold-accordion-divider-color`. | `true` |
| `overflow` | per slot: `'wrap' \| 'truncate' \| { lines: n }` | title `wrap`, description `{ lines: 2 }` |
| `dimensions` | width, min/max width, height, max height, gap, padding, panel padding, panel max height, font sizes, icon and indicator size, border width, radius, item radius, duration. Each one wins over the matching option above. | from the size scale. Width defaults to 100%. |
| `unstyled`, `className`, `style` | | |

### Look
- `solid`: one raised card. `outline`: the same card as a hairline frame. `separated`: every row is its
  own card. `filled`: tinted rows. `ghost`: no container.
- In a card (`solid`, `outline`) the dividers stop at the row padding; `ghost` runs them full width.
- The header never repaints on hover or when open, and there is no accent bar. The indicator carries the
  state: it darkens on hover, turns to the tone colour and rotates when open.
- Colour comes from the `primary` palette role (through `tone`), so a palette change re-colours the
  indicator, icon, badge and focus ring. Style packs re-point surfaces, borders and depth and follow the
  palette too.

### The appearance cascade
Options flow top-down, so each change carries on to what sits below it, never sideways:
1. **`variant` decides what is a surface:** the container (`solid`, `outline`), each row (`separated`,
   `filled`) or nothing (`ghost`).
2. **`radius` shapes the container**, and `itemRadius` defaults to it.
3. **`gap` decides whether rows touch.** At zero (the default for solid, outline and ghost, or
   `gap: 'none'`), separated and filled rows join into one group: the container `radius` rounds its outer
   corners, inner corners are square, separated rows share one border and cast one shadow.
4. **`dividers` is the only thing that draws a line between touching rows.** Rows that are apart have no
   dividers.
5. **`animate: false` stills everything**, the indicator included; `animateIndicator: false` only stops
   its rotation.

When the rest of the config makes an option invisible, `inactiveAccordionOptions(config)` (from
`@pinfold/core`) names it with the reason, the dev build warns if you set it, and the playground disables
its control:

| Option | No visible effect when | Do instead |
|---|---|---|
| `itemRadius` | solid or outline (the card is the surface); rows joined; ghost | `radius` |
| `radius` | separated or filled rows apart, with `itemRadius` set; ghost | unset `itemRadius`, or `gap: 'none'` |
| `dividers` | separated or filled rows apart | `gap: 'none'` |
| `indicatorPosition`, `animateIndicator` | `indicator: 'none'` | |
| `disabledIds` | `disabled: true` | |

### Escape-hatch ladder (D-09)
| Rung | What it is |
|---|---|
| 1 | Config |
| 2 | `classNames`, `styles` and `slotProps`, per slot |
| 3 | `render` per slot, and `renderItem` |
| 4 | Parts: `<Faq.Item\|Trigger\|Panel\|Indicator id\|index>` |
| 5 | Prop getters: `getRootProps`, `getItemProps`, `getHeaderProps`, `getTriggerProps`, `getPanelProps` |

Slots: `root item header trigger icon label title description badge endIcon indicator panel content`.

### Per row (`items[]`)
`id?`, `title`, `content?`, `description?`, `icon?`, `badge?`, `endIcon?`, `indicator?`, `disabled?`, `defaultOpen?`, `classNames?`, `styles?`.
A row reads left to right (mirrored in RTL): `icon`, title over description, `badge`, `endIcon`, indicator.
Every field that renders something accepts either a node or `(state) => node`.
Server Components can't pass functions (dev warning), but server-rendered JSX nodes are allowed.

## Compared with shadcn/ui (Radix) and HeroUI
Every option of both has a Pinfold equivalent:

| shadcn/ui (Radix) | HeroUI | Pinfold |
|---|---|---|
| `type="single" \| "multiple"` | `selectionMode` | `mode` |
| `collapsible` (single only) | `disallowEmptySelection` | `collapsible` (`false` keeps one row open, either mode) |
| `value`, `defaultValue`, `onValueChange` | `selectedKeys`, `defaultExpandedKeys`, `onSelectionChange` | `value`, `defaultValue`, `onValueChange(ids, details)` |
| `disabled` (root or item) | `isDisabled`, `disabledKeys` | `disabled`, `disabledIds`, row `disabled` |
| `dir`, `orientation` | | `dir`, `orientation` |
| `forceMount` | `keepContentMounted` | `mountPanels` |
| `asChild` | `HeadingComponent` | `render` per slot, `headingLevel` |
| your own markup | `variant`: light, shadow, bordered, splitted | `variant`: ghost, solid, outline, separated (+ filled) |
| className | `isCompact` | `size: 'sm'` |
| className | `showDivider`, `dividerProps` | `dividers`, `--pinfold-accordion-divider-color` |
| className | `itemClasses`, `classNames` | `classNames`, `styles`, `slotProps` (all rows) and row `classNames` |
| children of Trigger | `title`, `subtitle`, `startContent` | `title`, `description`, `icon`, `endIcon`, `badge` |
| chevron in Trigger | `indicator` (node or function), `hideIndicator` | `indicator` (glyph, node or `(state) => node`, `'none'`), `indicatorPosition` |
| | `disableAnimation`, `disableIndicatorAnimation` | `animate`, `animateIndicator` |
| `--radix-accordion-content-height` keyframes | `motionProps` | CSS grid rows (no measuring), `data-transition`, `dimensions.duration` |
| className on the container | classNames | `radius`, `itemRadius`, `gap` |

Pinfold only: config from JSON or a CMS (`fields`), find-in-page (`hiddenUntilFound`), `syncWithHash`,
`onBeforeChange`, the controller (`Faq.open(id)`), `defineAccordion` for Server Components, and
container-query responsiveness.

## Keyboard
| Key | Action |
|---|---|
| Enter / Space | Toggle the focused row |
| ↓ / ↑ (→ / ← when horizontal; flipped in RTL) | Next or previous header. Wraps if `loop`. |
| Home / End | First or last header |
| Tab | Leaves the header list. Closed panels are not in the tab order. |

## ARIA
- Each trigger is a `<button>` inside a heading (`aria-level`), with `aria-expanded` and `aria-controls`.
- Each panel has `role="region"` and `aria-labelledby` pointing at its trigger.
- Disabled rows use `aria-disabled` and stay focusable.

## Data attributes
- On every row: `data-state="open|closed"`, `data-disabled`, `data-index`.
- On the root: `data-orientation`, `data-mode`.
- On the panel: `data-transition="opening|closing"` while it animates (set on the DOM node; no re-render).

## Responsive
- The component is a container query container. In narrow containers it stacks the badge and description under the title.
- Text uses fluid type tokens.
- Each trigger is at least 44px tall under `pointer: coarse`.

## Playground controls (shape and behaviour only)
- Appearance: `variant`, `indicator`, `indicatorPosition`, `size`, `tone`, `radius`.
- Behaviour: `mode`, `collapsible`, `animate`, `dividers`.
- Environment: style pack, light/dark, RTL, reduced motion, container width.

Never shown: `dimensions` or raw sizes.

## Deliberately excluded
- A controlled `open` on each item (it duplicates `value`).
- Measuring panel height in JavaScript (CSS grid rows handle it).
- `sx` props.
- Built-in persistence to storage (one line in `onValueChange` does it).
