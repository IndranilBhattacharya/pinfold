# AGENTS.md

Binding rules for every AI agent and contributor working in this repo. Read this
file first, every session. Dense by design: no filler.

Product: **Lumae**, a hooks-first, config-driven React UI library.
Owner: Indranil Bhattacharya. MIT.

## 0. Status: read before touching code

- **Pre-release.** Names are final: packages `@lumae/*`, CSS `lumae-`/`--lumae-*`, provider
  `LumaeProvider`, CLI `lumae`. Docs label unbuilt behaviour **Planned**.
- Only one component exists (accordion). Milestones A1–A9 harden it end to end
  before a second component starts. See [docs/ROADMAP.md](docs/ROADMAP.md).

## 1. Mandatory reading order

1. `AGENTS.md` (this file)
2. [docs/DECISIONS.md](docs/DECISIONS.md): locked decisions, with the reason and the rejected alternatives for each
3. [ARCHITECTURE.md](ARCHITECTURE.md): the contract every component follows
4. [docs/ROADMAP.md](docs/ROADMAP.md): the current milestone and its checklist
5. The spec of the component you touch, e.g. [docs/components/accordion.md](docs/components/accordion.md)
6. When relevant: [docs/COMPATIBILITY.md](docs/COMPATIBILITY.md), [docs/CLI.md](docs/CLI.md),
   [docs/DISTRIBUTION.md](docs/DISTRIBUTION.md), [docs/STRATEGY.md](docs/STRATEGY.md), [docs/VISION.md](docs/VISION.md)

## 2. Process rules (non-negotiable)

1. **Locked decisions are locked.** Changing anything in `docs/DECISIONS.md` needs the
   owner's explicit approval in the conversation. Then append a dated entry; never
   rewrite history.
2. **Milestone gate.** Work only inside the current milestone. Do not start the next
   milestone, or a new component, without the owner's sign-off.
3. **Docs move with code.** Any behaviour change updates the spec, ARCHITECTURE or AGENTS
   in the same change. Docs describe planned behaviour as **Planned** until it ships.
4. **Spec before build.** A new component needs a researched spec in
   `docs/components/<name>.md`, signed off by the owner, before any code. Each component
   has its own config, events and metadata. Only the design-system base is shared.
5. **No public mention of other frameworks in this repo's README or package docs.**
   The architecture supports them (§4); announcing them is the site's job.
6. `npm run verify` must pass before you call work done. Report failures with their output.
7. Never `git push`, publish to npm, or change CI secrets unless the owner asks.

## 3. Hard constraints

| Area | Rule |
|---|---|
| React | Floor `react >=18`. Use native `useId` and `useSyncExternalStore`. No `react-dom` import inside components. Must work with and without the React Compiler. |
| Dependencies | Zero runtime dependencies in published packages. Dev dependencies are fine. The CLI may use dependencies, because they never reach the app bundle. |
| Layers | `core` (logic, no framework) and `css` never import React or any other framework. The React layer owns hooks, views, `define*` and tags. |
| API | Hooks first: `use<Name>(config)` returns a stable component that is also the controller and carries the parts. `define<Name>(config)` is the non-hook twin for Server Components. `<Name {...config}/>` is the courtesy tag. No compound children. |
| Config | One flat object. Data first (`items`, `columns`, `options`), never `children`. Only the data is required. Behaviour options must be expressible as plain JSON. Callbacks are optional. |
| Escape-hatch ladder | Every component exposes all of: config, then `classNames`/`styles`/`slotProps`, then slot `render` and `renderItem`, then parts, then prop getters. |
| Styling | Every CSS value comes from a token. No literal colours. BEM class names `.lumae-<comp>__<slot>`. State through `[data-state]`, `[data-disabled]`, never `.is-*`. All CSS inside `@layer lumae.*`. JS never imports CSS. `unstyled` drops the classes but keeps ARIA and `data-*`. |
| Sizing | Width defaults to 100% of the parent. Heights, padding and type come from the size scale. Two-layer sizing: the `[data-size]` preset, overridden by `dimensions`. |
| Responsive | Container queries, not viewport media queries, for layout. Fluid `clamp()` type tokens. A per-slot overflow policy (`wrap` \| `truncate` \| `{ lines }`). Touch targets of 44px or more under `pointer: coarse`. |
| Motion | CSS only (`grid-template-rows`, `transform`, `opacity`). No height measurement. Honour `prefers-reduced-motion`. |
| Rounded corners | Children cascade the radius. Never clip with `overflow: hidden`, which also cuts off the focus ring. |
| Accessibility | Follow the matching WAI-ARIA APG pattern. Use `aria-disabled`, never `disabled`. Hidden content leaves the accessibility tree and the tab order. A visible `:focus-visible` ring. Handle `forced-colors`. |
| SSR | No `window` or `document` at import time. Deterministic ids. The server HTML contains all content (panels mounted by default). `'use client'` is preserved in the build. |
| JS and TS | Ship ES2018 ESM and CJS plus `.d.ts`. JSDoc on every public field. A dev-only config validator for JS users, stripped from production. |
| Diagnostics | Dev-only `warnOnce()` for duplicate ids, frozen controlled state and impossible combinations. These must vanish under `NODE_ENV=production`. |
| Identity | Build the returned component and its parts only with `useLumaeComponent(name, api, render, buildParts)`. A fresh identity each render remounts the whole subtree; its store subscription keeps them fresh under the React Compiler. |

## 4. Multi-framework readiness (architecture only)

Packages: `@lumae/core` (logic, store, keyboard, palette, meta, types), `@lumae/css`,
`@lumae/react` (subpath per component: `@lumae/react/accordion`), and `lumae` (CLI).
A future `@lumae/vue` or `@lumae/angular` reuses `core` and `css` from npm, under the same
npm org. So: **put behaviour rules in `core`, never in hooks**; keep meta and types framework-free.
No Vue or Angular code is built now.

## 5. Adding or changing a component: checklist

1. The spec exists and is signed off (`docs/components/<name>.md`).
2. `npx lumae new <name>` scaffolds a package that already passes conformance.
3. Write the types first, then the core logic, then the hook (`use<Name>`), the view (a plain function), the CSS, and the tag.
4. Tests cover ARIA wiring, every mode, the full keyboard map, disabled, controlled versus uncontrolled, slot overrides, and dimensions reaching CSS. Then add `describeLumaeConformance` (mandatory):

```tsx
describeLumaeConformance({
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

5. Register it in `packages/cli/registry.json`. Update its spec and the site repo
   (`../lumae-site`) if the site documents it.
6. Run `npm run verify` (typecheck, tests, build, gzip budget).

## 6. Current API reference

```jsx
import { useAccordion } from '@lumae/react/accordion';
const Faq = useAccordion({ items: [{ title, content }], variant: 'separated' });
return <Faq className="mt-6" />;
// Faq is also the controller (Faq.value, Faq.toggle(id), Faq.openAll()) and carries parts (<Faq.Trigger id>, <Faq.Panel id>).
```

```ts
items: Array<{ id?, title, content?, description?, icon?, badge?, indicator?, disabled?, defaultOpen?, classNames?, styles? }>  // required
mode?: 'single' | 'multiple'          // 'single'
collapsible?: boolean                 // true
value?, defaultValue?: string[]   onValueChange?(ids)   onItemToggle?(id, open)
orientation?: 'vertical'|'horizontal'   dir?: 'ltr'|'rtl'   loop?: boolean   id?: string
unmountClosed?: boolean               // false
variant?: 'solid'|'outline'|'separated'|'filled'|'ghost'   // 'solid'
size?: 'sm'|'md'|'lg'   tone?: 'primary'|'neutral'|'success'|'warning'|'danger'|'info'
radius?: 'none'|'sm'|'md'|'lg'|'full'
indicator?: 'chevron'|'plus'|'caret'|'arrow'|'none'|ReactNode   indicatorPosition?: 'start'|'end'
headingLevel?: 1..6 (3)   animate?, dividers?, unstyled?: boolean   className?, style?
dimensions?: { width, minWidth, maxWidth, height, maxHeight, gap, paddingX, paddingY,
  panelPaddingX, panelPaddingY, panelMaxHeight, fontSize, titleSize, descriptionSize,
  iconSize, indicatorSize, borderWidth, radius, duration }   // number = px
classNames?, styles?, slotProps?, render?: per Slot   renderItem?({ state, props, header, panel })
Slot = root|item|header|trigger|icon|label|title|description|badge|indicator|panel|content
// Renderable fields accept ReactNode | ((state) => ReactNode).
```
The returned value carries `items, value, isOpen, open, close, toggle, openAll, closeAll, focusItem, render,
Item, Trigger, Panel, Indicator, getRootProps, getItemProps, getHeaderProps, getTriggerProps, getPanelProps`.

Theming: `createTheme({ primary, accent, neutral, intensity, radius })` from `@lumae/core/palette`
returns `{ vars, css, ramps, contrast }`. It covers 7 roles × 11 OKLCH steps. Never hand-write a colour.

Planned API (A3/A4): `defineAccordion`, `defineConfig`, `lazy`, `hiddenUntilFound`,
`onBeforeChange`, `mountPanels`, `syncWithHash`, `fields`. See the accordion spec.
