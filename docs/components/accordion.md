# Accordion: spec

Status: **stable API**. Rows marked **Planned** arrive in A3 or A4.
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
// Server Component (Planned, A4)
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
| `fields` | `{ id?, title?, content?, description?, icon?, badge?, disabled? }`, mapping raw records onto rows | none | Planned |
| `mode` | `'single' \| 'multiple'` | `'single'` | stable |
| `collapsible` | `boolean`. In single mode, lets the user close the open row. | `true` | stable |
| `value` / `defaultValue` | `string[]` | none | stable |
| `onValueChange` | `(ids, details?)`. `details: { id, open, reason: 'click'\|'keyboard'\|'api'\|'find-in-page'\|'hash', event? }` | none | stable (`details` Planned) |
| `onBeforeChange` | `(details) => boolean \| void`. Return `false` to block the change. | none | Planned |
| `onItemToggle` | `(id, open)` | none | stable |
| `disabled` | `boolean`, disables every row | `false` | Planned |
| `orientation` | `'vertical' \| 'horizontal'` | `'vertical'` | stable |
| `dir` | `'ltr' \| 'rtl'` | provider | stable |
| `loop` | `boolean`. Focus wraps around at the ends. | `true` | stable |
| `id` | id prefix | `useId` | stable |
| `hiddenUntilFound` | `boolean`. Closed panels use `hidden="until-found"` and open on `beforematch`, so Ctrl+F finds them. | `true` | Planned |
| `mountPanels` | `'always' \| 'open' \| 'first-open'` | `'always'` (good for SEO and Ctrl+F) | Planned. Replaces `unmountClosed`, which stays as a deprecated alias. |
| `syncWithHash` | `boolean`. `#id` opens the row and scrolls to it. Changes the URL. | `false` | Planned |
| `lazy` | `'auto' \| 'eager' \| 'visible' \| 'idle'` | `'auto'` (eager for this component) | Planned |

### Appearance
| Key | Type | Default |
|---|---|---|
| `variant` | `'solid' \| 'outline' \| 'separated' \| 'filled' \| 'ghost'` | `'solid'` |
| `size` / `tone` / `radius` | design-system scale | provider |
| `indicator` | `'chevron' \| 'plus' \| 'caret' \| 'arrow' \| 'none' \| node \| (state) => node` | `'chevron'` |
| `indicatorPosition` | `'start' \| 'end'` | `'end'` |
| `headingLevel` | `1–6` | `3` |
| `animate` | `boolean`. `prefers-reduced-motion` always wins. | `true` |
| `dividers` | `boolean` | `true` |
| `overflow` (Planned) | per slot: `'wrap' \| 'truncate' \| { lines: n }` | title `wrap`, description `{ lines: 2 }` |
| `dimensions` | width, min/max width, height, max height, gap, padding, panel padding, panel max height, font sizes, icon and indicator size, border width, radius, duration | from the size scale. Width defaults to 100%. |
| `unstyled`, `className`, `style` | | |

### Escape-hatch ladder (D-09)
| Rung | What it is |
|---|---|
| 1 | Config |
| 2 | `classNames`, `styles` and `slotProps`, per slot |
| 3 | `render` per slot, and `renderItem` |
| 4 | Parts: `<Faq.Item\|Trigger\|Panel\|Indicator id\|index>` |
| 5 | Prop getters: `getRootProps`, `getItemProps`, `getHeaderProps`, `getTriggerProps`, `getPanelProps` |

Slots: `root item header trigger icon label title description badge indicator panel content`.

### Per row (`items[]`)
`id?`, `title`, `content?`, `description?`, `icon?`, `badge?`, `indicator?`, `disabled?`, `defaultOpen?`, `classNames?`, `styles?`.
Every field that renders something accepts either a node or `(state) => node`.
Server Components can't pass functions (dev warning), but server-rendered JSX nodes are allowed.

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
- On the panel (Planned): `data-transition="opening|closing"`.

## Responsive (Planned, A3)
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
