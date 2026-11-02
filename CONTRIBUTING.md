# Contributing to Pinfold

Read [ARCHITECTURE.md](ARCHITECTURE.md) and the spec of the component you touch before changing code.

## Setup
```bash
npm install
npm run verify      # typecheck, tests, build, gzip budget, published types (attw)
npm run test:watch
npm run smoke -- --pm npm --react 19 --ts 5.6.3   # pack, install and use the real tarballs
```
Requirements: Node 22 or newer, npm 10 or newer (the published packages still run on Node 20).
The docs, playground and palette studio live in the sibling repo [`../pinfold-ui`](../pinfold-ui).

## Hard constraints

| Area | Rule |
|---|---|
| React | Floor `react >=18`. Use native `useId` and `useSyncExternalStore`. No `react-dom` import inside components. Must work with and without the React Compiler. |
| Dependencies | Zero runtime dependencies in published packages. Dev dependencies are fine. The CLI may use dependencies, because they never reach the app bundle. |
| Layers | `core` (logic, no framework) and `css` never import React or any other framework. The React layer owns hooks, views, `define*` and tags. |
| API | Every component, a button included: hooks first, `use<Name>(config)` returns a stable component that is also the controller and carries the parts. `define<Name>(config)` is the non-hook twin for Server Components. `<Name {...config}/>` is the courtesy tag. Content is config (`label`, `items`), never `children`. |
| Config | One flat object. Data first (`items`, `columns`, `options`), never `children`. Only the data is required. Behaviour options must be expressible as plain JSON. Callbacks are optional. |
| Escape-hatch ladder | Every component exposes all of: config, then `classNames`/`styles`/`slotProps`, then slot `render` and `renderItem`, then parts, then prop getters. |
| Styling | Every CSS value comes from a token. No literal colours. BEM class names `.pinfold-<comp>__<slot>`. State through `[data-state]`, `[data-disabled]`, never `.is-*`. All CSS inside `@layer pinfold.*`. JS never imports CSS. `unstyled` drops the classes but keeps ARIA and `data-*`. |
| Sizing | Width defaults to 100% of the parent. Heights, padding and type come from the size scale. Two-layer sizing: the `[data-size]` preset, overridden by `dimensions`. |
| Responsive | Container queries, not viewport media queries, for layout. Fluid `clamp()` type tokens. A per-slot overflow policy (`wrap` \| `truncate` \| `{ lines }`). Touch targets of 44px or more under `pointer: coarse`. |
| Motion | CSS only (`grid-template-rows`, `transform`, `opacity`). No height measurement. Honour `prefers-reduced-motion`, and the provider's `disableAnimation` (no `data-animate` on the root; conformance checks it). Only an essential indicator (a spinner) keeps moving, slower. |
| Browser floor | Baseline 2023 (COMPATIBILITY.md). No newer CSS in a component stylesheet: `light-dark()`, `:has()`, `@scope`, anchor positioning, `field-sizing`, `@starting-style` and the like fail silently on the floor (conformance fails on them). Express state the view knows as `data-*` instead of `:has()`. |
| Style packs | Every control reads the pack control tokens (`--pinfold-control-edge`, `-shadow`, `-surface`, `-press`, `-glow`, `-round`) with a fallback, so each pack visibly changes it. Filled surfaces stay opaque so text contrast is the palette's. |
| Containment | Never wider than the container: `max-inline-size: 100%`; long text truncates (`min-inline-size: 0`, ellipsis) or wraps. Checked at 375, 768 and 1360 px. |
| Rounded corners | Children cascade the radius. Never clip with `overflow: hidden`, which also cuts off the focus ring. |
| Accessibility | Follow the matching WAI-ARIA APG pattern. Use `aria-disabled`, never `disabled`. Hidden content leaves the accessibility tree and the tab order. A visible `:focus-visible` ring, declared after the variant rules and outranking them, so no variant shadow can hide it (the a11y report checks a focused control). Handle `forced-colors`. |
| SSR | No `window` or `document` at import time. Deterministic ids. The server HTML contains all content (panels mounted by default). `'use client'` is preserved in the build. |
| JS and TS | Ship ES2018 ESM and CJS plus `.d.ts`. JSDoc on every public field. A dev-only config validator for JS users, stripped from production. |
| Diagnostics | Dev-only `warnOnce()` for duplicate ids, frozen controlled state and impossible combinations. These must vanish under `NODE_ENV=production`. |
| Identity | Build the returned component and its parts only with `usePinfoldComponent(name, api, render, buildParts)`. A fresh identity each render remounts the whole subtree; its store subscription keeps them fresh under the React Compiler. |

## Layers and future frameworks

Packages: `@pinfold/core` (logic, store, keyboard, palette, meta, types), `@pinfold/css`,
`@pinfold/react` (subpath per component: `@pinfold/react/accordion`), and `pinfold` (CLI).
A future `@pinfold/vue` or `@pinfold/angular` reuses `core` and `css` from npm, under the same
npm org. So: **put behaviour rules in `core`, never in hooks**; keep meta and types framework-free.
No Vue or Angular code is built now.

## Adding or changing a component

1. The spec exists and was agreed in an issue (`docs/components/<name>.md`).
2. `npx pinfold new <name>` scaffolds a component that already passes conformance.
3. Write the types first, then the core logic, then the hook (`use<Name>`), the view (a plain function), the CSS, and the tag.
4. Tests cover ARIA wiring, every mode, the full keyboard map, disabled, controlled versus uncontrolled, slot overrides, and dimensions reaching CSS. Add the component to `scripts/a11y-report.mjs` in every style pack, light and dark. Then add `describePinfoldConformance` (mandatory, with `meta` and `preset`):

```tsx
describePinfoldConformance({
  name: 'tabs',
  slots: ['root', 'list', 'tab', 'panel'],
  optionalSlots: ['icon'],
  dimension: { key: 'paddingX', value: 24 },
  cssFile: 'packages/tabs/src/tabs.css',
  render: (config) => <Tabs items={items} {...config} />,
});
```
Conformance fails the build on:
- a missing root class
- a slot that ignores `classNames`, `styles` or `slotProps`
- a dimension that never reaches CSS
- a `disabled` attribute
- an unnamed control
- a hard-coded colour
- a class outside the component's namespace

5. Add the component to `COMPONENTS` in `packages/react/src/types-meta.test.ts` and write its
   `<name>.types.test.tsx` (see "Typed API" below).
6. Register it in `packages/cli/registry.json`. Update its spec and the site repo
   (`../pinfold-ui`) if the site documents it.
7. Run `npm run verify` (typecheck, tests, build, gzip budget).

## Config, precedence and metadata

The rules that keep every component predictable (details in ARCHITECTURE.md, "Precedence and
metadata"):

1. **Config is the API, presets carry the look.** Everything a developer or a model writes is one
   config object. `define<Name>(preset)` (module scope) is the default way to use a component: it
   returns a component whose props are any part of the config. `use<Name>` is for the controller.
   Content lives in the config (`label`, `items`), never in `children`.
2. **One precedence:** use-site props, then the preset, then `defaults.<name>`, then the provider,
   then the library default. The hook resolves it and writes the result as `data-*` on the root. CSS never infers
   a setting from an ancestor.
3. **The library does the work.** If a common pattern needs glue code, the component absorbs it
   (example: an `onClick` that returns a promise drives the button's loading state).
4. **Required means meaningful.** Only what the component cannot render correctly without is
   required (a button's `label`, which is also its accessible name).
5. **Meta, types, runtime and playground agree.** Add the component's meta and its `preset` factory
   to its conformance call and its key list to `config-keys.test.ts`;
   the suite fails on a default or value that does not reach the DOM, and `types-meta.test.ts`
   fails on a type that disagrees with the meta.
6. **Buttons inside components are data.** A composite component takes `actions` (an array of
   button configs) instead of asking the developer to build buttons.
7. **No silent options.** An option that has no visible effect in the current config is listed by
   `inactive<Name>Options` (dev warning, disabled playground control).

## Typed API

Every component follows these rules. They hold on TypeScript 4.7, the published floor (no
`const` type parameters, no built-in `NoInfer`).

- **Ids are inferred.** When a component has keyed entries (rows, tabs, options), their ids are a
  type parameter inferred from the data. Every place a developer writes an id by hand
  (`defaultValue`, `disabledIds`, controller methods, part props) uses it, wrapped in `NoInfer`;
  callbacks receive it. Controlled values are state, so they accept any `string[]`. Ids from data
  stay `string`: typing never gets stricter for them.
- **Never add friction.** A type rule that breaks an everyday pattern (e.g. `useState<string[]>`) is
  wrong; the types test keeps those patterns compiling.
- **Raw records are typed.** A `fields` map only accepts real keys of the record type.
- **Readonly in, mutable out.** Inputs accept `readonly` arrays (`as const` data works); values
  handed back are plain arrays.
- **Defaults are documented once and checked.** Every option with a default has a `@default` JSDoc
  tag equal to the meta's default; `types-meta.test.ts` fails on any difference, and on an option
  present in the types but not the meta (or the reverse).
- **Required means required in every config.** No option becomes required because of another
  option's value: options can come from provider defaults at runtime, which the compiler cannot
  see. Combinations that make an option pointless are reported at runtime (an inactive-options
  helper in `core`, a dev warning, a disabled playground control).
- **The contract is tested.** `<name>.types.test.tsx` holds `@ts-expect-error` lines for every
  mistake the types must catch; `npm run typecheck` fails if one stops being an error. The
  consumer smoke test repeats the key ones against the published `.d.ts` files on TypeScript
  4.7, 5.0 and the latest.

## What to contribute
- Fixes and tests for existing components.
- A new component **only** after its spec (`docs/components/<name>.md`) has been agreed in an issue.
- Docs corrections. Planned behaviour must be labelled **Planned**.

## Rules
- Follow [ARCHITECTURE.md](ARCHITECTURE.md). The conformance suite (`@pinfold/testing`) must pass.
- Zero runtime dependencies. `core` and `css` never import a framework.
- Update the docs in the same pull request as the behaviour change.
- Commits use conventional prefixes: `feat:`, `fix:`, `docs:`, `chore:`, `test:`, `refactor:`.
- One logical change per pull request. Explain why, not just what.

## Security
Report vulnerabilities privately. See [SECURITY.md](SECURITY.md).

## License
By contributing you agree that your contributions are licensed under the [MIT License](LICENSE).
