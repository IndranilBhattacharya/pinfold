# Architecture

The contract every Knot UI component follows. Read this once and you can add
the next twelve components without inventing a single decision.

---

## 1. The layering rule

Each component splits into these concerns, in this order:

| Layer | File | Owns | Never touches |
| --- | --- | --- | --- |
| Behaviour | `use<Name>.tsx` | state, keyboard, ARIA, prop getters, `render()` | class names, markup |
| Presentation | `<Name>View.tsx` | markup, slots, variants — a plain function, not a component | state logic |
| Style | `<name>.css` | tokens → CSS | JS |
| Courtesy | `<Name>.tsx` | `useName(config).render()`, one line | anything else |

**The hook returns a component.** `use<Name>(config)` hands back a value that
is simultaneously:

1. a **component** — `<Faq />`, accepting `className`, `style` and `data-*`, so it
   drops into ordinary layout JSX with no wrapper;
2. the **controller** — `Faq.value`, `Faq.toggle(id)`, `Faq.focusItem(0)`;
3. a set of **parts** — `<Faq.Trigger id>`, `<Faq.Panel id>` — for layouts the
   config cannot express.

Build both with `useKnotComponent` and `useStableParts` from core. **Identity
stability is not optional**: a component created fresh each render is a new
element type to React, which unmounts and remounts the whole subtree, discarding
focus, scroll position and every running transition. The conformance suite tests
for it.

The standalone `<Name />` export is a one-line wrapper for one-off usage; it must
add nothing.

### Where the config model stops

Config fits repeated, uniform rows. It does not fit page layout, and pretending
otherwise is what earns a library its "leaky abstraction" reviews. So the ladder
out is first-class, not an escape hatch: parts carry the ARIA, the consumer
carries the layout. A component is not finished until its parts are exported.

If the hook mentions a class name, the layering is broken. If the component
computes state, the layering is broken. This split is what makes the same
component usable at every level of control without a second code path.

---

## 2. The config object

One flat object. No nested `components={{}}`, no context gymnastics, no
compound-component children.

```ts
interface <Name>Config
  extends <Name>BehaviourConfig,       // data + state + callbacks
          <Name>AppearanceConfig,      // variant, size, tone, radius, …
          SlotOverrides<Slot, State> {}  // classNames, slotProps, render
```

Rules:

1. **Data first.** The primary array/record is called `items`, `columns`, `rows`,
   `options` — never `children`.
2. **Everything optional except data.** A component with only its data prop must
   render something correct and good-looking.
3. **Every measurement is configurable.** Ship a `dimensions` object covering
   width, height, padding, gap, radius, font sizes, icon sizes, border width and
   duration. Numbers are px, strings pass through. It layers *over* the `size`
   preset, so overriding one dimension keeps the preset for the rest.
4. **Every visible part is configurable.** Anything renderable — title, icon,
   badge, body, indicator — accepts a node *or* a function of the row's live
   state, and can be set per component or per row. Ship `render` per slot and
   `renderItem` for the whole row, so no customisation requires forking.
5. **Controlled and uncontrolled from one hook.** `value` + `defaultValue` +
   `onValueChange`, resolved by `useControllableState`. Never two code paths.
6. **JSON-safe defaults.** Every behaviour option must be expressible in plain
   JSON — strings, numbers, booleans, arrays. Functions are opt-in extras, never
   required. This is what lets a CMS or a language model drive the component.
7. **Appearance inherits.** `size`, `tone`, `radius`, `dir` default from
   `useKnot()` (the provider) so an app themes once.

---

## 3. Prop getters

The hook returns `getRootProps`, `getItemProps`, and one getter per interactive
part. Each:

- takes an optional props bag and merges it through `mergeProps` (handlers chain,
  `className` concatenates, `style` merges, `ref` composes)
- returns every ARIA and `data-*` attribute that part needs
- carries `data-state`, `data-disabled`, `data-orientation` so CSS never needs a
  class toggle

```ts
getTriggerProps: (item, props) =>
  mergeProps({ 'aria-expanded': item.open, 'data-state': item.open ? 'open' : 'closed' }, props),
```

CSS styles state through `[data-state='open']`, never through a `.is-open` class.
That keeps the stylesheet valid for headless consumers too.

---

## 4. Slots

Name every visual part. The accordion has twelve: `root, item, header, trigger,
icon, label, title, description, badge, indicator, panel, content`.

Each slot is reachable three ways, and every component supports all three:

```jsx
classNames={{ trigger: 'px-6' }}                       // add a class
styles={{ trigger: { letterSpacing: '2px' } }}         // inline style
slotProps={{ panel: { 'data-analytics': 'faq' } }}     // merge DOM props
render={{ indicator: ({ props, state }) => <X {...props} open={state.open} /> }}  // replace
```

Implement with the two core helpers — never hand-roll:

```ts
const props = slotProps(config, 'trigger', baseProps);
renderSlot(config, 'trigger', props, itemState, children, (p, c) => <button {...p}>{c}</button>);
```

A `render` override receives the behaviour props. If a consumer forgets to spread
them, accessibility breaks — that is documented, not defended against.

---

## 5. Styling contract

- Class names are BEM: `.knot-<component>__<slot>`, state via `[data-*]`.
- **Every value comes from a core token.** No literal colors, no magic pixels
  outside the component's own local vars.
- Sizing is **two-layer**. `[data-size]` writes the `*-base` preset; the
  `dimensions` config writes `--knot-<component>-<key>` via `dimensionVars()`,
  and wins through the `var()` fallback:

```css
.knot-accordion { --knot-acc-pad-x-base: var(--knot-space-4); }
.knot-accordion[data-size='lg'] { --knot-acc-pad-x-base: var(--knot-space-5); }
.knot-accordion { --knot-acc-pad-x: var(--knot-accordion-padding-x, var(--knot-acc-pad-x-base)); }
```

  That is what lets a consumer override one measurement without losing the preset
  for the others. Overriding a custom property is the supported theming path —
  never CSS overrides fighting specificity.
- **Rounded containers clip.** Any element with a radius sets `overflow: hidden`
  and its children inherit the radius (`item → header → trigger`). Without this a
  hover or active fill renders as a rectangle crossing the rounded border.
- **Everything lives in a cascade layer** — `@layer knot.tokens`, `knot.reset`,
  `knot.components`. Unlayered CSS beats a layered rule at any specificity, so a
  consumer's stylesheet and every Tailwind utility override us for free: no
  `!important`, no plugin, no import-order rule, no `tailwind-merge`.
- **`unstyled` is mandatory on every component.** It drops the component's own
  classes and leaves behaviour, ARIA and `data-*` intact, so Knot can be used as
  a headless library with a palette. Style then flows entirely through
  `classNames`, which is how Tailwind-first teams will adopt it.
- The root always carries `knot` so the scoped reset applies (unless `unstyled`).
- Animate with CSS only. Prefer `grid-template-rows`, `transform`, `opacity`,
  `clip-path`. Never measure heights in JS.
- Every component ships its own CSS file, copied to `dist/styles.css` by `tsup`.
  **JS never imports CSS** — that breaks SSR and CJS consumers. The CLI adds the
  import to the app entry instead.

---

## 5b. Colour

Colour is generated, never hand-picked. `@knotui/core/palette` is React-free and
dependency-free so the CLI, the build and the runtime share one implementation.

- **Seven roles** — primary, accent, neutral, success, warning, danger, info —
  each an eleven-step ramp from a single OKLCH hue angle.
- **One tuned lightness/chroma curve**, shared by every role. Only the hue moves,
  which is why any hue produces an evenly stepped, usable ramp.
- **Neutrals inherit the brand hue** by default. Pure grey next to a saturated
  brand reads as dead.
- **Every value is emitted twice**: sRGB hex for reach, OKLCH behind `@supports`
  for fidelity. Out-of-gamut chroma is bisection-mapped, never clipped.
- **Dark mode flips the semantic layer only.** The ramps are untouched, so a
  consumer who overrode `--knot-primary-500` keeps their brand in both themes.
- **Contrast is reported, not assumed.** `createTheme().contrast` and
  `npx knotui theme --check` give WCAG 2.2 ratios per role and step.

A literal colour in a component stylesheet is a bug: it cannot follow the
palette, dark mode, or a consumer override. The conformance suite fails the
build on one.

---

## 5c. Aesthetic invariants

The details that separate a component library from a design system:

- **Two-layer shadows**, tinted with the neutral ramp. A tight contact shadow
  plus a wide ambient one. Untinted black over a tinted surface reads as dirt.
- **`--knot-highlight`**, a hairline inset top edge on raised surfaces.
- **Interaction surfaces carry the brand.** Hover mixes ~6% accent into the
  surface rather than going grey, so a control reads as alive.
- **Two-tone focus ring** — a gap in the page colour, then the ring — so focus
  stays visible on any surface, including one matching the ring hue. Nothing
  may clip it: containers round their children rather than `overflow: hidden`.
- **Decelerating easing** (`--knot-ease-out`) for anything that appears;
  content settles ~35% behind its container so motion reads as physical.
- Reduced motion and forced colors are handled in CSS, once, in the reset.

---

## 6. Accessibility gate

A component is not done until:

- it implements the matching [WAI-ARIA Authoring Practices](https://www.w3.org/WAI/ARIA/apg/patterns/) pattern
- keyboard support is complete and tested with real key events
- disabled means `aria-disabled` on a still-focusable control, not `disabled`
- hidden content is out of both the a11y tree and the tab order
- focus is visible via `:focus-visible` and the `--knot-focus-*` tokens
- `prefers-reduced-motion` and `forced-colors` are handled
- `dir="rtl"` flips direction through logical properties and dir-aware key handling
- contrast holds at every step of the generated palette in light and dark

---

## 7. Compatibility rules

These are hard constraints, not preferences:

| Rule | Why |
| --- | --- |
| No `useId`, `useSyncExternalStore`, `useTransition`, `use` | React 16.8 support |
| Classic JSX runtime (`jsx: "react"`) | works before React 17 |
| No `react-dom` import in components | keeps non-DOM renderers viable |
| `peerDependencies: react >= 16.8.0` | never pin a major |
| No runtime dependencies in any package | install size, supply chain |
| ES2018 build target | old bundlers, old browsers |

New React APIs are read off the namespace and feature-detected — see
`useId` in `packages/core/src/hooks.ts`.

---

## 8. Package shape

```
packages/<name>/
  package.json      exports ".", "./lazy", "./styles.css"
  tsup.config.ts    esm + cjs + dts, copies the CSS to dist/styles.css
  src/
    types.ts        config, dimensions, state, api, slot union
    use<Name>.tsx   behaviour + render()
    <Name>View.tsx  markup (plain function)
    <Name>.tsx      one-line tag wrapper
    <name>.css      style
    index.ts        public surface
    lazy.ts         createLazyComponent wrapper
    <name>.test.tsx behaviour + a11y assertions
```

`package.json` essentials:

```jsonc
"sideEffects": ["*.css"],   // CSS survives tree-shaking, JS does not
"exports": { ".": …, "./lazy": …, "./styles.css": "./dist/styles.css" },
"dependencies": { "@knotui/core": "0.1.0" },
"peerDependencies": { "react": ">=16.8.0" }
```

---

## 9. Adding a component — the checklist

1. `npx knotui new <name>` (or `cp -r packages/accordion packages/<name>`).
2. Write `types.ts` first. The config object is the API; get it right before code.
3. Implement `use<Name>.tsx` against the APG pattern, returning `render()`. Reuse
   `nextIndexFromKey`, `useControllableState`, `useId`, `useEvent`, `dimensionVars`
   — do not re-derive them.
4. Implement `<Name>View.tsx` with `slotProps` / `renderSlot` for every slot.
5. Write `<name>.css` using only tokens; variants as `[data-variant='…']`; the
   two-layer sizing chain for every dimension.
6. Tests: ARIA wiring, each mode, keyboard map, disabled, controlled, slot
   overrides, dimensions → custom properties.
7. Register it in `packages/cli/registry.json` (move it out of `planned`).
8. Add a section to `apps/docs/src/App.tsx`.
9. Add `describeKnotConformance` from `@knotui/testing` — not optional.
10. `npm run verify` (typecheck, tests, build, gzip budget).

Step 1 is automated: `npx knotui new <name>` produces steps 1, 4, 6 and 9
already wired, passing 14 tests before you write a line.

---

## 10. Why this design wins

**For developers:** twelve rows of data instead of sixty lines of nesting, with
the markup still reachable when they need it.

**For language models:** the entire API surface of a component is one JSON schema.
A model emits data, not a nested tree it can get structurally wrong. That is why
`AGENTS.md` exists and why every behaviour option is JSON-expressible.

**For bundles:** per-component packages, no runtime CSS, no dependencies, and
`data-*`-driven styling that ships as static text.
