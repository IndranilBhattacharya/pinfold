# AGENTS.md

Token-efficient spec for language models generating Knot UI code or new Knot UI
components. Humans: read `ARCHITECTURE.md` instead.

## Using Knot UI in an app

Every component is a hook taking one flat config object. The hook returns a
component. Emit data, not nested JSX.

```jsx
import { useAccordion } from '@knotui/accordion';

const Faq = useAccordion({ items: [{ title: node, content: node }], variant: 'separated' });
return <Faq className="mt-6" />;
```

The returned value is also the controller (`Faq.value`, `Faq.toggle(id)`) and
carries parts (`<Faq.Trigger id>`, `<Faq.Panel id>`) for custom layouts.

Rules:
- Call the hook at the top of the component; render `<Faq />` inside ordinary layout JSX.
- Never write compound children (`<AccordionItem>`, `<AccordionTrigger>`). They do not exist.
- `<Accordion {...config} />` also exists; it is a one-line wrapper over the hook.
- Any renderable field accepts a node **or** a function of the row's state: `title: (s) => ...`.
- Tailwind: utilities override Knot CSS automatically (cascade layer). For full control pass `unstyled: true` and style through `classNames`.
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
animate?: boolean  dividers?: boolean  unstyled?: boolean  className?  style?
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
renderItem?: ({ state, props, header, panel }) => ReactNode

Slot = root|item|header|trigger|icon|label|title|description|badge|indicator|panel|content

// Per row, inside items[]:
{ id?, title, content?, description?, icon?, badge?, indicator?, disabled?,
  defaultOpen?, classNames?, styles? }
// title/content/description/icon/badge/indicator each accept
//   ReactNode | ((state: AccordionItemState) => ReactNode)
```

`useAccordion(config)` returns a component carrying
`{ items, value, isOpen, open, close, toggle, openAll, closeAll, focusItem, render,
Item, Trigger, Panel, Indicator,
getRootProps, getItemProps, getHeaderProps, getTriggerProps, getPanelProps }`.

Render it as `<Faq />` (it accepts `className`, `style` and `data-*`), or call
`Faq.render()`. Parts take `id` or `index`; `Trigger` and `Panel` accept
`children` to replace their contents. Getters take `(item, extraProps?)` and must
be spread onto your own elements if you build the markup yourself.

## Theming from code

```js
import { createTheme } from '@knotui/core/palette';
createTheme({ primary: 'emerald', accent: 'amber', neutral: 264, intensity: 1.1, radius: 'lg' });
// -> { vars, css, ramps, contrast }
```
Roles: primary, accent, neutral, success, warning, danger, info. Each is an
11-step ramp (50…950) from one OKLCH hue. Hue accepts a name or 0–360.
Never hand-write a colour: override `--knot-*` tokens or regenerate the theme.

## Building a new Knot UI component

Start with `npx knotui new <name>` — it scaffolds a package that already passes
the conformance suite. Then implement the WAI-ARIA pattern.

Four files, strictly layered:
`use<Name>.tsx` (state/ARIA/getters, returns `render`) · `<Name>View.tsx` (pure
markup function, not a component) · `<name>.css` (tokens) · `<Name>.tsx` (one-line
tag wrapper). The hook is the API; the tag is a courtesy.

Hard constraints:
- React ≥ 16.8. No `useId`/`useSyncExternalStore`/`useTransition`/`use`. Classic JSX runtime. No `react-dom` import.
- Zero runtime dependencies. Use core's `cn`, `mergeProps`, `variants`, `useControllableState`, `useEvent`, `useId`, `nextIndexFromKey`, `slotProps`, `renderSlot`.
- JS must not import CSS. `tsup` copies `<name>.css` to `dist/styles.css`.
- Every CSS value comes from a `--knot-*` token. Class names: `.knot-<comp>__<slot>`. State via `[data-state]`/`[data-disabled]`, never `.is-*`.
- Sizing is two-layer: `[data-size]` writes `--knot-<c>-<x>-base`, and `dimensionVars()` writes `--knot-<component>-<kebab-key>` which wins via `var(fallback)`. Expose a `dimensions` config for every visible measurement.
- Rounded containers cascade radius (`item → header → trigger`) instead of clipping with `overflow: hidden`, which would also cut off the focus ring.
- All component CSS lives inside `@layer knot.components` so consumer CSS and Tailwind utilities win without `!important`.
- The hook returns a component via `useKnotComponent`, and parts via `useStableParts`. Never build either inline — a fresh identity per render remounts the subtree.
- Support `unstyled`: drop the component's own classes, keep ARIA and `data-*`.
- Animate in CSS only (`grid-template-rows`, `transform`, `opacity`). No height measurement.
- Follow the matching WAI-ARIA APG pattern. `aria-disabled`, not `disabled`. Hidden content leaves the a11y tree and tab order.
- Config must be JSON-expressible; callbacks optional.

- Dev-only `warnOnce()` diagnostics for duplicate ids, frozen controlled state,
  and impossible config combinations. They must vanish under `NODE_ENV=production`.

Then: register in `packages/cli/registry.json`, add a docs section in
`apps/docs/src/App.tsx`, and run `npm run verify` (typecheck + tests + build +
gzip budget).

Tests must cover: ARIA wiring, every mode, the full keyboard map, disabled,
controlled vs uncontrolled, slot overrides — plus `describeKnotConformance`
from `@knotui/testing`, which is not optional:

```tsx
describeKnotConformance({
  name: 'tabs',
  slots: ['root', 'list', 'tab', 'panel'],
  optionalSlots: ['icon'],
  dimension: { key: 'paddingX', value: 24 },
  cssFile: 'packages/tabs/src/tabs.css',
  render: (config) => <Tabs items={items} {...config} />,
});
```

It fails the build on: a missing `knot`/`knot-<name>` root class, a slot that
ignores `classNames`/`styles`/`slotProps`, dimensions that never reach CSS, a
`disabled` attribute, an unnamed control, a hard-coded colour in the stylesheet,
or a class outside the `knot-<name>` namespace.
