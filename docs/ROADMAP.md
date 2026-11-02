# Roadmap

**Rule:** milestones run in order; each one is verified (`npm run verify`, CI green) before the next starts.
Milestones A1–A9 apply to the **accordion only**. Component #2 starts after A9.

Current milestone: **component round 1 (Button + Spinner), experimental (2026-11-02).** A1–A9 automated evidence is complete; the manual screen-reader pass (A9) stays open.

## Component lifecycle

1. **Research** real-world use and competitor APIs for the component.
2. **Spec** in `docs/components/<name>.md`, covering config, defaults, events, keyboard, ARIA and playground controls. The owner signs it off.
3. **Build** in this order: core logic, hook, view, CSS, `define*`, tag, meta.
4. **Gate:** `npm run verify`, conformance and SSR checks all pass.
5. **Evidence:** the accessibility report and the screen-reader pass.
6. **Status:** experimental, then stable. The site's docs and playground are updated.

## A1 · Foundation
- [x] Name everything `pinfold` (packages, CSS prefix, tokens, provider, CLI) in both repos.
- [x] Re-layout the packages: `core` (no framework), `css`, `react` (subpaths), `cli`, and `testing` (private).
- [x] React 18 floor: set `peerDependencies`, delete the `useId` shim (`packages/react/src/hooks.ts`), and delete the React <18 hydration warning in `useAccordion.tsx`.
- [x] React Compiler: write a failing test where a compiled consumer shows stale `<Faq />`. Fix it with a store subscription (`useSyncExternalStore`) in `usePinfoldComponent`.
- [x] CI matrix (`.github/workflows/ci.yml`):
  - Windows, macOS and Linux × Node 20, 22 and 24 × React 18 and 19; canary informational. Every leg runs the React Compiler suite (compiled + uncompiled consumers).
  - Packed-tarball installs with npm, pnpm, Yarn PnP and bun (`scripts/consumer-smoke.mjs`): ESM import, CJS require, server render.
  - Published `.d.ts` under TypeScript 4.7, 5.0 and latest (node10, node16, bundler), plus `attw` in `npm run verify`.
  - `framework-isolation.test.ts` fails if `core` or `css` imports a framework.
- [x] Packaging: ESM and CJS, `typesVersions`, a stub folder per subpath (generated from `exports`), `sideEffects`.
- [x] Release safety: manual `release.yml` (OIDC trusted publishing, `--provenance`, refuses runtime deps), Dependabot, OpenSSF Scorecard. Trusted publishers are configured on npmjs.com after the first manual publish.
- [x] Ban removed React APIs (`banned-apis.test.ts`: defaultProps, propTypes, legacy context, findDOMNode, string refs, UNSAFE_, react-dom imports). Compiler compatibility is proven at runtime (`accordion.compiler.test.tsx`) rather than by the compiler lint, which would flag the library's intentional render-time ref writes.

## A2 · Logic split
- [x] Move the accordion's rules to `core/accordion.logic.ts` as pure functions: toggle, the single/collapsible rules, open/close all, the keyboard map, ids, field mapping and panel mounting.
- [x] Unit tests that need no DOM (`accordion.logic.test.ts`, node environment). The hook is a thin adapter, and the existing tests pass unchanged.

## A3 · Accordion features
- [x] Add every A3 item in [components/accordion.md](components/accordion.md): `fields`, change `details`, `onBeforeChange`, root `disabled`, `hiddenUntilFound`, `mountPanels`, `syncWithHash`, `overflow`, `data-transition`.
- [x] `accordion.meta.ts` and a generated JSON schema (`toJsonSchema`). Dev-only config validation for JS users, dropped from production bundles.
- [x] `defineConfig`, `pinfold.config.(ts|js)` and the precedence order (D-08). The `lazy` option (D-12): `eager`, `visible`, `idle`, with `auto` per component.
- [x] Responsiveness: container queries, fluid type, overflow policy, touch targets. Enterprise sizing defaults (D-11). The size budget gained an app-bundle row (what a production app ships).

## A4 · SSR and RSC
- [x] Keep `'use client'` in the build output (client modules and chunks, ESM and CJS; checked by `scripts/check-dist.mjs`). Add `defineAccordion`. The single import path works: barrels are server-safe, so no `/server` subpath is needed (D-07).
- [x] Test apps under `fixtures/` (`scripts/fixture-apps.mjs`, CI job `fixtures`): Next.js 16 App Router with RSC and ISR, Next.js Pages Router with ISR, and a JS-only webpack app. Vite SSR and React Router 7 call the same `renderToString` path the consumer smoke test runs on every package manager, so they have no separate app.
- [x] Assert zero hydration warnings (`accordion.ssr.test.tsx`), complete server HTML (every panel's text) and deterministic ids (unit tests and the served Next.js pages).

## A5 · Style packs and theming
- [x] Glass, material, noise and brutalist (0.2.0; bauhaus and soft were dropped), each as a token recipe that follows the palette behind `data-pinfold-style` (`@pinfold/css/packs.css`, `<PinfoldProvider stylePack>`). New token hooks: `--pinfold-border-width`, `--pinfold-backdrop`, `--pinfold-texture`.
- [x] Each one respects `prefers-contrast`, `prefers-reduced-transparency` and `forced-colors`, and is contrast-checked in light and dark mode (`packs.test.ts`; the check raised glass opacity to keep AA over white backdrops in dark mode).
- [x] Export to CSS (`createTheme().css`), Tailwind v4/v3 (the theme and preset map onto the same variables) and DTCG tokens (`toDTCG`). Map onto shadcn's CSS variables (`@pinfold/css/shadcn.css`).

## A6 · CLI
- [x] `init`, `add`, `theme` and `doctor` per [CLI.md](CLI.md), with JS/TS output (`cli.test.ts`).
- [x] Tested against every A4 test app: `init`, then `add`, then build. Running `init` twice changes nothing the second time (`fixture-apps.mjs --cli`, CI job `fixtures`).

## A7 · Distribution and AI
- [x] Generate the shadcn registry JSON from meta and ship it in the npm package (`scripts/generate-artifacts.mjs`). Listing in the shadcn registry index is a launch step for the owner (a pull request to shadcn).
- [x] `llms.txt`, `llms-full.txt` and the schema, all generated from meta (`metaToMarkdown`, `toJsonSchema`) and shipped in the package.
- [x] `npx pinfold mcp`, a local MCP server (`packages/cli/lib/mcp.mjs`, `mcp.test.ts`).

## A8 · Playground v2 (in `../pinfold-ui`)
- [x] Controls generated from meta, showing only what matters for a quick look (no raw sizes), plus environment controls: style pack, light/dark, RTL, reduced motion, container width.
- [x] State in the URL. Copy buttons for code (TS and JS), CLI command, AI prompt and link. StackBlitz export. The site serves the registry, schema and `llms` files from the library build. Driving it in a browser found three CSS inheritance bugs (nested light theme, radius presets, style-pack radii), fixed in the library.

## A9 · Accessibility evidence
- [x] A report generated in CI on every build (`scripts/a11y-report.mjs`, job `a11y`, artifact `a11y-report`): the APG checklist from meta, the keyboard map pressed in Chromium, axe (WCAG 2.2 AA + best practices) in light and dark mode across variants, all six tones, RTL, unstyled and a style pack, Tab skipping closed panels, `hidden="until-found"`, and forced-colors and reduced-motion checks with snapshots. Its first run found two contrast failures (badge text; open titles in the filled variant and the 500-step tones), now fixed.
- [ ] A manual screen-reader matrix: NVDA + Chrome, JAWS, VoiceOver + Safari, TalkBack. The script and the table are ready in [a11y/screen-readers.md](a11y/screen-readers.md); a person runs it before the first stable release.

## 0.2.0 · Look and release hardening
- [x] Accordion look after HeroUI-style review: calm headers (no hover or open background, no accent bar), dividers inset in cards, `outline` is a framed card, roomier rows. Shape options: `radius` (container), `itemRadius` (rows) and `gap`, each a preset or a length. Icons on every part of a row: `icon`, `endIcon` (per row or accordion-wide, node or `(state) => node`) and `indicator`. Parity with shadcn/ui and HeroUI: `disabledIds`, `animateIndicator`, `collapsible: false` in multiple mode, divider colour (mapping in [components/accordion.md](components/accordion.md)).
- [x] Components read the `primary` role, so the palette re-colours them; style packs mix every colour from palette tokens.
- [x] Zero known vulnerabilities: `rimraf` removed; `npm audit` gates CI and the release, and the consumer smoke test audits what a user installs.
- [x] `scripts/publish.mjs`: the release publishes only versions that are not on npm yet.

## Components

Deduplicated from shadcn/ui, HeroUI and MUI, filtered for modern use, ordered so shared
infrastructure lands first. One round per component (tiny atoms share a round); the owner reviews
each in the playground before the next starts. **Kind** is D-23: atoms are tags, widgets are hooks.

| Wave | Round | Component | Kind | Status |
|---|---|---|---|---|
| W1 atoms | 1 | Button (+ Spinner) | atom | experimental |
| | 2 | Separator, Kbd, Skeleton | atom | Planned |
| | 3 | Badge (+ count/dot) | atom | Planned |
| | 4 | Alert | atom | Planned |
| | 5 | Avatar (+ group) | atom | Planned |
| | 6 | Card | atom | Planned |
| | 7 | Progress (+ meter) | atom | Planned |
| W2 overlays | 8–12 | Tooltip, Popover (+ hover card), Dialog (+ alert dialog, sheet placements), Menu (dropdown + context), Toast | widget | Planned |
| W3 forms | 13–20 | Field + Input (group, textarea, search), Checkbox (+ group), Radio group, Switch, Toggle + Toggle group + Button group, Slider, Number field, Input OTP | widget | Planned |
| W4 navigation | 21–24 | Tabs, Breadcrumb, Pagination, Stepper | widget | Planned |
| W5 collections | 25–28 | Select (+ native), Combobox, Tag group, Command | widget | Planned |
| W6 data and dates | 29–31 | Table (data table), Calendar (single/range), Date picker | widget | Planned |
| W7 on demand | | Carousel, Resizable, Navigation menu, Sidebar, Empty, Timeline, Color picker, Rating | | Planned, if asked for |

Shared layers built on the way: the overlay layer in core (W2: top layer through native
`<dialog>` and the Popover API, CSS anchor positioning, a dismiss stack, focus trap and restore,
scroll lock), field wiring and native validation (W3), a listbox engine with typeahead (W5), and
date math on `Intl` (W6). No runtime dependencies at any point.

Left out on purpose: Aspect Ratio, Box/Container/Grid/Stack, Image List, Masonry, Typography, Link,
Scroll Area (native CSS or HTML does it); Direction (the provider's `dir`); Icons, Chart, Code
Block (they need dependencies); App Bar, Bottom Navigation, Speed Dial, FAB (Button and Tabs cover
them); Transfer List, Menubar (niche); a chat kit (attachment, message, bubble) is a separate
future package.

## Before the public launch
- The trademark search, an npm org check, the launch essay, and the shadcn index listing.
