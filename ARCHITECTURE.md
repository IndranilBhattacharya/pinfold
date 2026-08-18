# Architecture

The contract every Knot UI component follows. Read this once and you can add
the next twelve components without inventing a single decision.

---

## 1. The three-layer rule

Each component is exactly three files' worth of concerns, in this order:

| Layer | File | Owns | Never touches |
| --- | --- | --- | --- |
| Behaviour | `use<Name>.ts` | state, keyboard, ARIA, prop getters | class names, markup |
| Presentation | `<Name>.tsx` | markup, slots, variants | state logic |
| Style | `<name>.css` | tokens → CSS | JS |

If the hook mentions a class name, the layering is broken. If the component
computes state, the layering is broken. This split is what makes the same
component usable at all three control levels.

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
3. **Controlled and uncontrolled from one hook.** `value` + `defaultValue` +
   `onValueChange`, resolved by `useControllableState`. Never two code paths.
4. **JSON-safe defaults.** Every behaviour option must be expressible in plain
   JSON — strings, numbers, booleans, arrays. Functions are opt-in extras, never
   required. This is what lets a CMS or a language model drive the component.
5. **Appearance inherits.** `size`, `tone`, `radius`, `dir` default from
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
- Local vars are declared once at the component root and derived by variant:

```css
.knot-accordion { --knot-acc-pad-x: var(--knot-space-4); }
.knot-accordion[data-size='lg'] { --knot-acc-pad-x: var(--knot-space-5); }
```

  Overriding one custom property re-skins the whole component. That is the
  supported theming path — not CSS overrides fighting specificity.
- The root always carries `knot` so the scoped reset applies.
- Animate with CSS only. Prefer `grid-template-rows`, `transform`, `opacity`,
  `clip-path`. Never measure heights in JS.
- Every component ships its own CSS file, copied to `dist/styles.css` by `tsup`.
  **JS never imports CSS** — that breaks SSR and CJS consumers. The CLI adds the
  import to the app entry instead.

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
    types.ts        config, state, api, slot union
    use<Name>.ts    behaviour
    <Name>.tsx      presentation
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

1. `cp -r packages/accordion packages/<name>` and rename everything.
2. Write `types.ts` first. The config object is the API; get it right before code.
3. Implement `use<Name>.ts` against the APG pattern. Reuse `nextIndexFromKey`,
   `useControllableState`, `useId`, `useEvent` — do not re-derive them.
4. Implement `<Name>.tsx` with `slotProps` / `renderSlot` for every slot.
5. Write `<name>.css` using only tokens; add variants as `[data-variant='…']`.
6. Tests: ARIA wiring, each mode, keyboard map, disabled, controlled, slot overrides.
7. Register it in `packages/cli/registry.json` (move it out of `planned`).
8. Add a section to `apps/docs/src/App.tsx`.
9. `npm test && npm run typecheck && npm run build`.

---

## 10. Why this design wins

**For developers:** twelve rows of data instead of sixty lines of nesting, with
the markup still reachable when they need it.

**For language models:** the entire API surface of a component is one JSON schema.
A model emits data, not a nested tree it can get structurally wrong. That is why
`AGENTS.md` exists and why every behaviour option is JSON-expressible.

**For bundles:** per-component packages, no runtime CSS, no dependencies, and
`data-*`-driven styling that ships as static text.
