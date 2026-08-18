# AGENTS.md

Token-efficient spec for language models generating Knot UI code or new Knot UI
components. Humans: read `ARCHITECTURE.md` instead.

## Using Knot UI in an app

Every component is a hook taking one flat config object. Emit data, not nested JSX.

```jsx
import { useAccordion } from '@knotui/accordion';

const faq = useAccordion({ items: [{ title: string, content: node }], variant: 'separated' });
return faq.render();
```

Rules:
- Prefer the hook. `<Accordion {...config} />` exists but is only `useAccordion(config).render()`.
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
dimensions?: {                                  // number = px, string passes through
  width, minWidth, maxWidth, height, maxHeight, gap,
  paddingX, paddingY, panelPaddingX, panelPaddingY, panelMaxHeight,
  fontSize, titleSize, descriptionSize, iconSize, indicatorSize,
  borderWidth, radius, duration
}
classNames?: Partial<Record<Slot, string>>
styles?: Partial<Record<Slot, CSSProperties>>
slotProps?: Partial<Record<Slot, object>>
render?: Partial<Record<Slot, ({ props, state, children }) => ReactNode>>

Slot = root|item|header|trigger|icon|label|title|description|badge|indicator|panel|content
```

`useAccordion(config)` returns
`{ render, items, value, isOpen, open, close, toggle, openAll, closeAll, focusItem,
getRootProps, getItemProps, getHeaderProps, getTriggerProps, getPanelProps }`.
`render()` is the finished UI. Getters take `(item, extraProps?)` and must be
spread onto your own elements if you build the markup yourself.

## Building a new Knot UI component

Copy `packages/accordion`. Four files, strictly layered:
`use<Name>.tsx` (state/ARIA/getters, returns `render`) · `<Name>View.tsx` (pure
markup function, not a component) · `<name>.css` (tokens) · `<Name>.tsx` (one-line
tag wrapper). The hook is the API; the tag is a courtesy.

Hard constraints:
- React ≥ 16.8. No `useId`/`useSyncExternalStore`/`useTransition`/`use`. Classic JSX runtime. No `react-dom` import.
- Zero runtime dependencies. Use core's `cn`, `mergeProps`, `variants`, `useControllableState`, `useEvent`, `useId`, `nextIndexFromKey`, `slotProps`, `renderSlot`.
- JS must not import CSS. `tsup` copies `<name>.css` to `dist/styles.css`.
- Every CSS value comes from a `--knot-*` token. Class names: `.knot-<comp>__<slot>`. State via `[data-state]`/`[data-disabled]`, never `.is-*`.
- Sizing is two-layer: `[data-size]` writes `--knot-<c>-<x>-base`, and `dimensionVars()` writes `--knot-<component>-<kebab-key>` which wins via `var(fallback)`. Expose a `dimensions` config for every visible measurement.
- Rounded containers set `overflow: hidden` and cascade radius (`item → header → trigger`) so hover/active fills cannot square off over a border.
- Animate in CSS only (`grid-template-rows`, `transform`, `opacity`). No height measurement.
- Follow the matching WAI-ARIA APG pattern. `aria-disabled`, not `disabled`. Hidden content leaves the a11y tree and tab order.
- Config must be JSON-expressible; callbacks optional.

Then: register in `packages/cli/registry.json`, add a docs section in
`apps/docs/src/App.tsx`, and run `npm test && npm run typecheck && npm run build`.

Tests must cover: ARIA wiring, every mode, the full keyboard map, disabled,
controlled vs uncontrolled, and slot overrides.
