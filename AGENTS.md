# AGENTS.md

Token-efficient spec for language models generating Knot UI code or new Knot UI
components. Humans: read `ARCHITECTURE.md` instead.

## Using Knot UI in an app

Every component takes one flat config object. Emit data, not nested JSX.

```jsx
import { Accordion } from '@knotui/accordion';

<Accordion items={[{ title: string, content: node }]} variant="separated" />
```

Rules:
- Never write compound children (`<AccordionItem>`, `<AccordionTrigger>`). They do not exist.
- Styles are imported once in the app entry: `@knotui/core/styles.css`, then `@knotui/<name>/styles.css`.
- Wrap the app in `<KnotProvider theme radius dir size tone>` only to set global defaults. It is optional.
- Code-split with `@knotui/<name>/lazy`.

### Accordion config

```ts
items: Array<{ id?, title, content?, description?, icon?, badge?, disabled?, defaultOpen? }>  // required
mode?: 'single' | 'multiple'                    // default 'single'
collapsible?: boolean                           // default true
value?: string[]  defaultValue?: string[]  onValueChange?(ids)  onItemToggle?(id, open)
orientation?: 'vertical' | 'horizontal'  dir?: 'ltr' | 'rtl'  loop?: boolean  id?: string
unmountClosed?: boolean                         // default false
variant?: 'solid' | 'outline' | 'separated' | 'filled' | 'ghost'   // default 'solid'
size?: 'sm' | 'md' | 'lg'
tone?: 'primary' | 'neutral' | 'success' | 'warning' | 'danger' | 'info'
radius?: 'none' | 'sm' | 'md' | 'lg' | 'full'
indicator?: 'chevron' | 'plus' | 'caret' | 'none' | ReactNode
indicatorPosition?: 'start' | 'end'             // default 'end'
headingLevel?: 1..6                             // default 3
animate?: boolean  dividers?: boolean  className?  style?
classNames?: Partial<Record<Slot, string>>
slotProps?: Partial<Record<Slot, object>>
render?: Partial<Record<Slot, ({ props, state, children }) => ReactNode>>

Slot = root|item|header|trigger|icon|label|title|description|badge|indicator|panel|content
```

Headless: `useAccordion(sameConfig)` returns
`{ items, value, isOpen, open, close, toggle, openAll, closeAll, focusItem,
getRootProps, getItemProps, getHeaderProps, getTriggerProps, getPanelProps }`.
Getters take `(item, extraProps?)` and must be spread onto your elements.

## Building a new Knot UI component

Copy `packages/accordion`. Keep the three layers separate:
`use<Name>.ts` (state/ARIA/getters) · `<Name>.tsx` (markup/slots) · `<name>.css` (tokens).

Hard constraints:
- React ≥ 16.8. No `useId`/`useSyncExternalStore`/`useTransition`/`use`. Classic JSX runtime. No `react-dom` import.
- Zero runtime dependencies. Use core's `cn`, `mergeProps`, `variants`, `useControllableState`, `useEvent`, `useId`, `nextIndexFromKey`, `slotProps`, `renderSlot`.
- JS must not import CSS. `tsup` copies `<name>.css` to `dist/styles.css`.
- Every CSS value comes from a `--knot-*` token. Class names: `.knot-<comp>__<slot>`. State via `[data-state]`/`[data-disabled]`, never `.is-*`.
- Animate in CSS only (`grid-template-rows`, `transform`, `opacity`). No height measurement.
- Follow the matching WAI-ARIA APG pattern. `aria-disabled`, not `disabled`. Hidden content leaves the a11y tree and tab order.
- Config must be JSON-expressible; callbacks optional.

Then: register in `packages/cli/registry.json`, add a docs section in
`apps/docs/src/App.tsx`, and run `npm test && npm run typecheck && npm run build`.

Tests must cover: ARIA wiring, every mode, the full keyboard map, disabled,
controlled vs uncontrolled, and slot overrides.
