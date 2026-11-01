# Roadmap

**Rule:** the owner signs off after each milestone. Agents never start the next one on their own (AGENTS.md §2).
Milestones A1–A9 apply to the **accordion only**. Component #2 starts after A9.

Current milestone: **A1 complete. CI green on GitHub (26 jobs) on 2026-11-01. Awaiting the owner's sign-off.** Next: A2.

## Component lifecycle

1. **Research** real-world use and competitor APIs for the component.
2. **Spec** in `docs/components/<name>.md`, covering config, defaults, events, keyboard, ARIA and playground controls. The owner signs it off.
3. **Build** in this order: core logic, hook, view, CSS, `define*`, tag, meta.
4. **Gate:** `npm run verify`, conformance and SSR checks all pass.
5. **Evidence:** the accessibility report and the screen-reader pass.
6. **Status:** experimental, then stable. The site's docs and playground are updated.

## A1 · Foundation
- [x] Rename the original working name to `lumae` everywhere (packages, CSS prefix, tokens, provider, CLI) in both repos.
- [x] Re-layout the packages: `core` (no framework), `css`, `react` (subpaths), `cli`, and `testing` (private).
- [x] React 18 floor: set `peerDependencies`, delete the `useId` shim (`packages/react/src/hooks.ts`), and delete the React <18 hydration warning in `useAccordion.tsx`.
- [x] React Compiler: write a failing test where a compiled consumer shows stale `<Faq />`. Fix it with a store subscription (`useSyncExternalStore`) in `useLumaeComponent`.
- [x] CI matrix (`.github/workflows/ci.yml`):
  - Windows, macOS and Linux × Node 20, 22 and 24 × React 18 and 19; canary informational. Every leg runs the React Compiler suite (compiled + uncompiled consumers).
  - Packed-tarball installs with npm, pnpm, Yarn PnP and bun (`scripts/consumer-smoke.mjs`): ESM import, CJS require, server render.
  - Published `.d.ts` under TypeScript 4.7, 5.0 and latest (node10, node16, bundler), plus `attw` in `npm run verify`.
  - `framework-isolation.test.ts` fails if `core` or `css` imports a framework.
- [x] Packaging: ESM and CJS, `typesVersions`, a stub folder per subpath (generated from `exports`), `sideEffects`.
- [x] Release safety: manual `release.yml` (OIDC trusted publishing, `--provenance`, refuses runtime deps), Dependabot, OpenSSF Scorecard. Trusted publishers are configured on npmjs.com after the first manual publish.
- [x] Ban removed React APIs (`banned-apis.test.ts`: defaultProps, propTypes, legacy context, findDOMNode, string refs, UNSAFE_, react-dom imports). Compiler compatibility is proven at runtime (`accordion.compiler.test.tsx`) rather than by the compiler lint, which would flag the library's intentional render-time ref writes.

## A2 · Logic split
- [ ] Move the accordion's rules to `core/accordion.logic.ts` as pure functions: toggle, the single/collapsible rules, the keyboard map.
- [ ] Unit tests that need no DOM. The hook becomes a thin adapter, and the existing tests pass unchanged.

## A3 · Accordion features
- [ ] Add every **Planned** item in [components/accordion.md](components/accordion.md).
- [ ] `accordion.meta.ts` and a generated JSON schema. Dev-only config validation for JS users.
- [ ] `defineConfig`, `lumae.config.(ts|js)` and the precedence order (D-08). The `lazy` option (D-12).
- [ ] Responsiveness: container queries, fluid type, overflow policy, touch targets. Enterprise sizing defaults (D-11).

## A4 · SSR and RSC
- [ ] Keep `'use client'` in the build output. Add `defineAccordion`. Verify the single import path, or fall back to a `/server` subpath (D-07).
- [ ] Test apps under `fixtures/`: Next.js App Router with ISR, Next.js Pages Router, Vite SSR, React Router 7, and a JS-only webpack app.
- [ ] Assert zero hydration warnings, complete server HTML (every panel's text) and deterministic ids.

## A5 · Style packs and theming
- [ ] Glass, bauhaus, brutalist, noise and soft, each as a token recipe behind `data-lumae-style`.
- [ ] Each one respects `prefers-contrast`, `prefers-reduced-transparency` and `forced-colors`, and is contrast-checked in light and dark mode.
- [ ] Export to CSS, Tailwind v4/v3 and DTCG tokens. Map onto shadcn's CSS variables.

## A6 · CLI
- [ ] `init`, `add`, `theme` and `doctor` per [CLI.md](CLI.md), with JS/TS output.
- [ ] Tested against every A4 test app: `init`, then `add`, then build. Running `init` twice changes nothing the second time.

## A7 · Distribution and AI
- [ ] Generate the shadcn registry JSON from meta and ship it in the npm package. List it in the shadcn registry index.
- [ ] `llms.txt`, generated AGENTS docs and the schema, all shipped in the package.
- [ ] `npx lumae mcp`, a local MCP server.

## A8 · Playground v2 (in `../lumae-site`)
- [ ] Controls generated from meta, showing only what matters for a quick look (no raw sizes).
- [ ] State in the URL. Copy buttons for code, CLI command and AI prompt. StackBlitz export.

## A9 · Accessibility evidence
- [ ] A per-release report generated in CI: the APG checklist from meta, the keyboard map that was tested, axe results, forced-colors and reduced-motion snapshots.
- [ ] A manual screen-reader matrix: NVDA + Chrome, JAWS, VoiceOver + Safari, TalkBack.

## After A9
- Component #2, most likely dialog or popover, because it forces the overlay and positioning layer to exist. Then the next components, one at a time.
- Before the public launch: the trademark search, an npm org check, the launch essay, and the shadcn index listing.
