# Architecture

The contract every Pinfold component follows. Read this once and you can add
the next twelve components without inventing a single decision.

> Sections marked **Planned** describe A1–A7 work.
> Each decision is referenced as D-nn ([docs/DECISIONS.md](docs/DECISIONS.md)).

---

## 0. Layers and packages (D-04, D-05)

```
@pinfold/core    no framework: utils, variants, keyboard nav, dimensions, dev warnings, palette, types,
               <name>.logic.ts (rules), <name>.meta.ts (metadata), meta.ts (validator, JSON schema)
@pinfold/css     tokens.css, reset.css, <name>.css, Tailwind v3 preset + v4 theme (Planned: styles/<pack>.css in A5)
@pinfold/react   use<Name>, define<Name>, <Name> tag, <Name>View, PinfoldProvider, defineConfig
pinfold          CLI
```

- **Isolation rule.** `core` and `css` never import React or any other framework, and a test fails
  the build if they do. Behaviour *rules* (what toggling does, the single/collapsible rules,
  which key goes where) live in `core` as pure functions. The React layer only adapts them:
  state, effects, refs, JSX.
- **Future adapters.** `@pinfold/vue` and `@pinfold/angular` would depend on `core` and `css` from npm, under
  the same org, and write only a view and an adapter. Behaviour stays identical, because there is
  only one copy of the rules.
- **Subpaths.** Each component has one: `@pinfold/react/accordion`. Unused components add 0 bytes.

## 1. The layering rule

Each component splits into these concerns, in this order:

| Layer | File | Owns | Never touches |
| --- | --- | --- | --- |
| Rules | `core/<name>.logic.ts` | pure transitions, keyboard map, validation | React, the DOM |
| Behaviour | `use<Name>.tsx` | state, refs, ARIA, prop getters, `render()` | class names, markup |
| Presentation | `<Name>View.tsx` | markup, slots, variants. A plain function, not a component. | state logic |
| Style | `<name>.css` | tokens turned into CSS | JS |
| Server twin | `define<Name>.ts` | `define<Name>(config)` returns a component that renders the client tag (Planned for A4) | hooks |
| Courtesy | `<Name>.tsx` | `use<Name>(config).render()`, one line | anything else |

**The hook returns a component.** `use<Name>(config)` hands back one value that is
three things at once:

1. a **component**: `<Faq />`, which accepts `className`, `style` and `data-*`, so it
   drops into ordinary layout JSX with no wrapper;
2. the **controller**: `Faq.value`, `Faq.toggle(id)`, `Faq.focusItem(0)`;
3. a set of **parts**: `<Faq.Trigger id>`, `<Faq.Panel id>`, for layouts the
   config cannot express.

Build both with one helper from `@pinfold/react`: `usePinfoldComponent(name, api, render, buildParts)`.
**Identity stability is not optional.** A component created fresh each render is a new element
type to React, which unmounts and remounts the whole subtree, discarding focus, scroll position
and every running transition. The conformance suite tests for it.

**React Compiler.** A stable component that reads state through a ref may be served from the
compiler's cache and go stale (reproduced in `accordion.compiler.test.tsx`, which compiles a consumer
with the real compiler). Each hook render bumps a per-instance version; the component and every part
subscribe through `useSyncExternalStore` and re-render after commit if they missed it. Without a
memoising parent the snapshot already matches, so there is no extra render.

**Server Components (D-07, Planned for A4).** Hooks can't run in a Server Component, so
`define<Name>(config)` is a plain function. It returns a component that renders the
`'use client'` tag with the same config, adding no extra DOM. The controller and the parts are
client-only. Function values in the config can't cross the server/client boundary (there's a dev
warning), but server-rendered JSX nodes can. Everything in the config ends up in the page payload,
so never put secrets in it.

The standalone `<Name />` export is a one-line wrapper for one-off usage. It must add nothing.

### Where the config model stops: the escape-hatch ladder (D-09)

Config fits repeated, uniform rows. It doesn't fit page layout, so every component provides the
same ladder down, enforced by conformance:

1. config
2. `classNames` / `styles` / `slotProps`
3. slot `render` / `renderItem`
4. parts
5. prop getters

Parts carry the ARIA, and the consumer carries the layout. A component is not finished until all
five rungs work. When many users drop below config for the same need, that need becomes a config
option.

If the hook mentions a class name, the layering is broken. If the view computes state, the layering
is broken.

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

1. **Data first.** The primary array or record is called `items`, `columns`, `rows` or
   `options`, never `children`. A `fields` mapping lets raw records in without glue code.
2. **Everything optional except the data.** A component given only its data must render something
   correct and good-looking, with enterprise-standard defaults.
3. **Every measurement is configurable.** `dimensions` covers width, height, padding, gap, radius,
   font sizes, icon sizes, border width and duration. Numbers are px; strings pass through. It
   layers *over* the `size` preset. Width defaults to 100% of the parent.
4. **Every visible part is configurable.** Any renderable field accepts a node or a function of the
   row's live state, at the component or the row level.
5. **Controlled and uncontrolled come from one hook,** via `useControllableState`.
6. **Defaults expressible as plain JSON.** Every behaviour option can be written as plain JSON.
   Functions are opt-in extras. This is what lets a CMS, a server component or a language model
   drive the component.
7. **Appearance inherits** from the global config (D-08). Precedence, highest first: component
   config, `defaults.<component>` in `pinfold.config`, the global theme, library defaults. A nested
   `PinfoldProvider` scopes a section.
8. **Dev validation.** `meta.ts` drives dev-only warnings for unknown keys, wrong
   types and invalid enum values, because JS users have no compiler to catch them. It sits behind a
   literal `process.env.NODE_ENV` check, so bundlers drop the validator and the meta in production.

---

## 3. Prop getters

The hook returns `getRootProps`, `getItemProps`, and one getter per interactive
part. Each:

- takes an optional props bag and merges it through `mergeProps` (handlers chain,
  `className` concatenates, `style` merges, `ref` composes)
- returns every ARIA and `data-*` attribute that part needs
- carries `data-state`, `data-disabled`, `data-orientation`, so CSS never needs a
  class toggle

```ts
getTriggerProps: (item, props) =>
  mergeProps({ 'aria-expanded': item.open, 'data-state': item.open ? 'open' : 'closed' }, props),
```

CSS styles state through `[data-state='open']`, never through a `.is-open` class.

---

## 4. Slots

Name every visual part. The accordion has twelve: `root, item, header, trigger,
icon, label, title, description, badge, indicator, panel, content`.

Each slot is reachable three ways, and every component supports all of them:

```jsx
classNames={{ trigger: 'px-6' }}                       // add a class
styles={{ trigger: { letterSpacing: '2px' } }}         // inline style
slotProps={{ panel: { 'data-analytics': 'faq' } }}     // merge DOM props
render={{ indicator: ({ props, state }) => <X {...props} open={state.open} /> }}  // replace
```

Implement with the two core helpers. Never hand-roll them:

```ts
const props = slotProps(config, 'trigger', baseProps);
renderSlot(config, 'trigger', props, itemState, children, (p, c) => <button {...p}>{c}</button>);
```

A `render` override receives the behaviour props. If a consumer forgets to spread them,
accessibility breaks. That is documented, not defended against.

---

## 5. Styling contract

- Class names are BEM: `.pinfold-<component>__<slot>`. State is expressed through `[data-*]`.
- **Every value comes from a core token.** No literal colours, and no magic pixels outside the
  component's own local variables.
- Sizing is **two-layer**. `[data-size]` writes the `*-base` preset. The `dimensions` config writes
  `--pinfold-<component>-<key>` via `dimensionVars()`, which wins through the `var()` fallback:

```css
.pinfold-accordion { --pinfold-acc-pad-x-base: var(--pinfold-space-4); }
.pinfold-accordion[data-size='lg'] { --pinfold-acc-pad-x-base: var(--pinfold-space-5); }
.pinfold-accordion { --pinfold-acc-pad-x: var(--pinfold-accordion-padding-x, var(--pinfold-acc-pad-x-base)); }
```

- **Rounded containers cascade their radius; they never clip.** An element with a radius passes it
  to its children (`item → header → trigger`), so hover and active fills follow the curve.
  **Never use `overflow: hidden` to clip a rounded container,** because it also cuts off the focus
  ring.
- **Everything lives in a cascade layer:** `@layer pinfold.tokens`, `pinfold.reset`, `pinfold.components`.
  Unlayered CSS beats a layered rule at any specificity, so a consumer's stylesheet and every
  Tailwind utility override us for free. No `!important`, no plugin, no import-order rule, no
  `tailwind-merge`.
- **`unstyled` is mandatory on every component.** It drops the component's own classes and keeps
  behaviour, ARIA and `data-*`.
- The root always carries `pinfold`, so the scoped reset applies (unless `unstyled`).
- Animate with CSS only. Prefer `grid-template-rows`, `transform`, `opacity` and `clip-path`. Never
  measure heights in JS.
- Every component ships its own CSS file. **JS never imports CSS,** because that breaks SSR, CJS and
  Jest consumers. The CLI adds the import to the app entry instead.

## 5a. Responsive contract (D-11)

- **Container first.** The component root is a query container (`container-type: inline-size`).
  Layout changes use `@container`, so a component behaves the same in a sidebar and in a full-width
  page. Viewport media queries are only for user preferences.
- **Fluid type.** Type tokens use `clamp()`. No fixed breakpoint jumps.
- **Overflow policy per slot:** `'wrap' | 'truncate' | { lines: n }`, using `line-clamp` with an
  ellipsis. Truncation is visual only, so assistive tech still reads the full text.
- **Touch.** Under `@media (pointer: coarse)`, interactive targets are at least 44×44px (above the
  WCAG 2.5.8 minimum of 24px).
- **Defaults.** Width is 100% of the parent. Heights come from the size scale. No hard-coded widths.

## 5b. Colour

Colour is generated, never hand-picked. `@pinfold/core/palette` has no React and no dependencies, so
the CLI, the build and the runtime share one implementation.

- **Seven roles:** primary, accent, neutral, success, warning, danger, info. Each is an
  eleven-step ramp generated from a single OKLCH hue angle.
- **One tuned lightness and chroma curve,** shared by every role. Only the hue moves, which is why
  any hue produces an evenly stepped, usable ramp.
- **Neutrals inherit the brand hue** by default. Pure grey next to a saturated brand looks dead.
- **Every value is emitted twice:** sRGB hex for reach, and OKLCH behind `@supports` for fidelity.
  Out-of-gamut chroma is pulled back into gamut by bisection, never clipped.
- **Dark mode flips the semantic layer only.** The ramps are untouched.
- **Contrast is reported, not assumed:** `createTheme().contrast` and `npx pinfold theme --check`.
- **Style packs (A5)** (glass, bauhaus, brutalist, noise, soft) are token and surface recipes behind
  `data-pinfold-style`. They are never forks of the components. Each one respects `prefers-contrast`,
  `prefers-reduced-transparency` and `forced-colors`, and must pass the contrast check.

A literal colour in a component stylesheet is a bug. The conformance suite fails the build on one.

## 5c. Aesthetic invariants

- **Two-layer shadows,** tinted with the neutral ramp.
- **`--pinfold-highlight`,** a hairline inset top edge on raised surfaces.
- **Interaction surfaces carry the brand.** Hover mixes about 6% accent into the surface.
- **Two-tone focus ring.** Nothing may clip it.
- **Decelerating easing** (`--pinfold-ease-out`) for anything that appears. Content settles about 35%
  behind its container.
- Reduced motion and forced colours are handled in CSS, once, in the reset.

---

## 6. Accessibility gate (D-19)

A component is not done until:

- it implements the matching [WAI-ARIA APG](https://www.w3.org/WAI/ARIA/apg/patterns/) pattern
- keyboard support is complete and tested with real key events
- disabled means `aria-disabled` on a control that stays focusable, never `disabled`
- hidden content is out of both the accessibility tree and the tab order
- focus is visible via `:focus-visible` and the `--pinfold-focus-*` tokens
- `prefers-reduced-motion` and `forced-colors` are handled
- `dir="rtl"` flips direction through logical properties and direction-aware key handling
- contrast holds at every step of the generated palette, in light and dark mode
- the accessibility report is generated (A9)

---

## 7. Compatibility rules (D-06, D-14)

| Rule | Why |
| --- | --- |
| `peerDependencies: react >=18` | Native `useId` and `useSyncExternalStore`, no shims, deterministic SSR ids |
| Must work with the React Compiler on and off | Both eras of React |
| Classic JSX runtime (`jsx: "react"`) in the build | Works in every toolchain. Keep it unless D-06 changes. |
| No `react-dom` import in components | Keeps non-DOM renderers viable |
| No runtime dependencies in any published package | Install size and supply-chain safety |
| ES2018 output, ESM and CJS, `.d.ts`, JSDoc | Old bundlers, Jest, plain JS projects |
| No `window` or `document` at import time | SSR |
| `'use client'` preserved for each client module | RSC |

The full matrix is in [docs/COMPATIBILITY.md](docs/COMPATIBILITY.md).

## 7a. SSR, RSC and lazy loading (D-12, D-13, Planned for A4)

- Server HTML contains all content: panels are mounted by default and closed with
  `hidden="until-found"`. CI asserts every panel's text appears in the server HTML.
- Ids are deterministic (native `useId`, or the explicit `id` prefix).
- `lazy: 'auto' | 'eager' | 'visible' | 'idle'`. In `'auto'`, light components load eagerly and
  heavy ones code-split their view (through `createLazyComponent`) and load once visible. The hook
  stays the tiny state part, so the API never changes.

## 7b. Metadata (D-10)

`core/<name>.meta.ts` is the single source of truth. It holds the shared design-system base plus
that component's own config schema, defaults, events, keyboard map, ARIA notes, slots, CSS
variables, data attributes and **playground controls** (shape and behaviour only, never raw sizes).

From it we generate:
- docs and prop tables
- playground controls (site)
- the CLI registry and the shadcn registry
- `llms.txt`
- the JSON schema
- dev validation
- the accessibility report

---

## 8. Package shape

```
packages/
  core/    src/{utils,variants,navigation,dimensions,dev,palette,types}.ts, accordion.logic.ts      @pinfold/core
  css/     src/{tokens,reset,<name>}.css  tailwind/{preset.cjs,theme.css}  build.mjs  @pinfold/css
  react/   src/<name>/{use<Name>.tsx,<Name>View.tsx,<Name>.tsx,define<Name>.ts,index.ts}  @pinfold/react
  cli/                                                                              pinfold
  testing/ (private)                                                                conformance
```

`package.json` essentials:

```jsonc
"sideEffects": ["*.css"],   // CSS survives tree-shaking, JS does not
"exports": { "./accordion": { "types": …, "import": …, "require": … }, … },
"typesVersions": { "*": { "accordion": ["./dist/accordion/index.d.ts"] } },
"peerDependencies": { "react": ">=18" }
```

- The React package's `exports` map is the single source of truth: tsup builds one entry per
  export, and `scripts/subpath-stubs.mjs` writes a stub folder per subpath (`accordion/package.json`)
  for bundlers that ignore `exports` (webpack 4). `npx pinfold new <name>` adds the export.
- Code splitting keeps shared modules (provider, hooks) in common chunks, so every subpath sees one
  React context. `scripts/size-check.mjs` budgets each entry together with the chunks it imports.

---

## 9. Adding a component: the checklist

1. The spec `docs/components/<name>.md` is researched and signed off by the owner.
2. `npx pinfold new <name>`.
3. Write `types.ts` first. The config object is the API.
4. Write the rules in core (`<name>.logic.ts`), then `use<Name>.tsx` against the APG pattern.
   Reuse `nextIndexFromKey`, `useControllableState`, `useId`, `useEvent` and `dimensionVars`.
5. Write `<Name>View.tsx` with `slotProps` / `renderSlot` for every slot.
6. Write `<name>.css` from tokens only: variants as `[data-variant='…']`, the two-layer sizing,
   the responsive contract.
7. Write `define<Name>` and `<name>.meta.ts`.
8. Tests: ARIA wiring, every mode, the keyboard map, disabled, controlled, slot overrides,
   dimensions reaching custom properties, SSR output. Add `describePinfoldConformance`.
9. Register it in `packages/cli/registry.json`. Update its section on the site (`../pinfold-ui`).
10. Run `npm run verify` (typecheck, tests, build, gzip budget).

---

## 10. Why this design wins

**For developers:** twelve rows of data instead of sixty lines of nesting, and the JSX you return
stays `<Faq />`, on both client and server.

**For language models:** the whole API surface of a component is one JSON schema. A model emits
data, not a nested tree it can get structurally wrong.

**For bundles:** subpath imports, no runtime CSS, no dependencies, and styling driven by `data-*`
attributes that ships as static text.
