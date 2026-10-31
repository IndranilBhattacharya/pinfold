# Decisions

Locked decisions. Changing one needs the owner's (Indranil Bhattacharya) explicit
approval. When that happens, append a new dated entry and mark the old one **Superseded**.
Never edit history.

Format: **D-nn · title** · date · status. Then: the decision, why, and what was rejected.

---

## Identity

**D-01 · Name: Lumae** · 2026-10-31 · Locked
- Lumae (LOO-may), from *lumen*: light, luminous, lightweight. npm org `@lumae`
  (fallback `@lumae-ui` if taken), CLI `lumae`, CSS prefix `lumae-`, tokens `--lumae-*`,
  provider `LumaeProvider`, config `lumae.config.(ts|js)`, site `lumae.indranildev.in`.
- Why: short, invented, modern. When chosen, the unscoped npm name and `@lumae/core` were free, and a web search found no software product named Lumae.
- Rejected names:
  - "Knot UI": a placeholder the owner disliked.
  - "Talo": already used by TaloDev (a game backend), talo-pay and `@talo-code/talo-ui`.
  - Oru, Vinya, Velin, Ovyn, Tessra, Vyla, Lirra: candidates not chosen.
  - Uvio: an existing UX agency.
  - Orlo: existing software.
- Open: a formal trademark search (USPTO, EUIPO, WIPO, India IP; classes 9 and 42) before the public launch.

**D-02 · License MIT, credit to the owner** · 2026-10-31 · Locked
- MIT © Indranil Bhattacharya. An `author` field in every package.json, a `CITATION.cff` file, and "Created by Indranil Bhattacharya" on the site.
- Why: maximum adoption (shadcn, MUI and Base UI are MIT). MIT requires copies to keep the copyright line, so attribution travels with every fork.
- Rejected: Apache-2.0 (its NOTICE file and patent grant are useful, but it's less common for UI libraries). Restrictive licenses (they kill adoption).

**D-03 · Two public repos** · 2026-10-31 · Locked
- `lumae/` holds the library published to npm. `lumae-site/` holds the docs, playground, palette and theme studio, and serves the registry. They are sibling folders, and the parent folder has no git.
- Why: keeps the product repo lean, so tooling and website concerns never pollute it.
- Rejected: one monorepo that includes the site. A private site repo (the owner wants it public; contributions are welcome).

## Architecture

**D-04 · React only in this repo, with an architecture ready for more frameworks** · 2026-10-31 · Locked
- Only React components are built. Behaviour rules live in a framework-free `@lumae/core`, and styles in `@lumae/css`. Future `@lumae/vue` and `@lumae/angular` packages reuse both from npm, under the same org. They may live here or in separate repos.
- Why: proves demand on React first, without locking out later frameworks or splitting the name into `lumae-vue` or `ng-lumae`.
- Rejected: building Vue and Angular now. Compile-to-many tools such as Mitosis (fragile output).
- Messaging: the library README stays React-only. The site says Vue and Angular are planned.

**D-05 · Packages: one per layer and per framework, with a subpath per component** · 2026-10-31 · Locked
- `@lumae/core`, `@lumae/css`, `@lumae/react` (imported as `@lumae/react/accordion`), and `lumae` (CLI).
- Why: Radix moved to a single `radix-ui` package, and Base UI, Ark and MUI each ship a single package. Per-component packages cause version skew: two copies of core end up installed, and the provider no longer reaches every component. Subpath exports plus `sideEffects: ["*.css"]` mean an unused component adds 0 bytes to the app bundle.
- **Supersedes** the earlier per-component packages (`@knotui/accordion`). The cost is a few hundred kB of install footprint.

**D-06 · React floor: 18** · 2026-10-31 · Locked
- `peerDependencies: react >=18`. CI runs React 18, 19 and canary, each with and without the React Compiler.
- Why: 18 covers both the pre-compiler era (where enterprises sit) and the compiler era (19+). Native `useId` and `useSyncExternalStore` remove the shims and give deterministic SSR ids. React 16 and 17 are 2019–2020 releases that no longer get patches, and Next.js has required 18 since v13.
- **Supersedes** `>=16.8` (that was the lowest version with no known CVE, but its shims and its manual SSR ids cost more than they bought).
- Rejected: requiring 19 (it excludes the large group of enterprises still on 18).

**D-07 · Hooks first, with a server twin and a courtesy tag** · 2026-10-31 · Locked
- `const Faq = useAccordion({ items })` gives `<Faq />`. The same value is the controller and carries the parts.
- Server Components use `defineAccordion(config)`, which also gives `<Faq />` and adds no extra DOM. `<Accordion {...config}/>` exists as well.
- Every component follows the `use<Name>` / `define<Name>` pair.
- Why: the JSX you return stays uncluttered everywhere. Server Components can't call hooks. JSON-safe config can cross from server to client.
- Goal: a single import path (`@lumae/react/accordion`) that works on both server and client. This is verified in A4; the fallback is a `/server` subpath.
- Rejected names for the server twin: `accordion()` (reads like a variable), `createAccordion()` (sounds like a store).

**D-08 · Minimal config and a global config** · 2026-10-31 · Locked
- Only the data is required. Everything else has an enterprise-standard default.
- `lumae.config.(ts|js)` uses `defineConfig({ theme, defaults: { <component>: {...} }, lazy })`.
- Precedence, highest first: component config, `defaults.<component>`, the global theme, the library defaults. A nested `LumaeProvider` re-themes one section of the app.

**D-09 · The escape-hatch ladder** · 2026-10-31 · Locked
- In every component: config, then `classNames`/`styles`/`slotProps`, then slot `render`/`renderItem`, then parts, then prop getters. The conformance suite enforces it.
- Feedback rule: when many users need to drop below config for something, it becomes a config option.

**D-10 · Metadata per component** · 2026-10-31 · Locked
- `<name>.meta.ts` holds the shared design-system base plus that component's own researched config, events, keyboard map, ARIA notes and playground controls.
- From it we generate the docs, playground controls, CLI registry, shadcn registry, `llms.txt`, dev validation and the accessibility report.
- Each component is researched separately before it's built, and the owner sets its expectations.

**D-11 · Responsive by default, with standard sizing** · 2026-10-31 · Locked
- Container queries, fluid `clamp()` type, a per-slot overflow policy (`wrap` | `truncate` | `{ lines }`), and touch targets of 44px or more under `pointer: coarse`.
- Width is 100% of the parent. Heights, padding and type come from the size scale. `dimensions` overrides them but never appears in the playground.

**D-12 · Lazy loading** · 2026-10-31 · Locked
- `lazy: 'auto' | 'eager' | 'visible' | 'idle'`, default `'auto'`. Light components load eagerly. Heavy components load when they become visible.
- Server-rendered HTML is always complete.
- Why not lazy by default: for a 4 kB component it adds a network round trip, layout shift and SEO loss, and saves almost nothing.

**D-13 · SEO and Core Web Vitals** · 2026-10-31 · Locked
- Server-rendered HTML contains all content (`mountPanels: 'always'` by default). Zero layout shift. A small amount of JS to hydrate. CI asserts the server HTML is complete.
- `'use client'` marks where hydration begins. It does not stop server rendering.

**D-14 · JavaScript and TypeScript, both first-class** · 2026-10-31 · Locked
- ES2018 ESM and CJS builds, `.d.ts` plus JSDoc, and a dev-only config validator for JS users.
- The CLI writes `.jsx`/`.tsx` and `lumae.config.js`/`.ts` to match the project.
- `typesVersions` and per-subpath stub folders support old module resolution and webpack 4.
- The types are tested against TS 4.7 and 5.x.

## Distribution, tooling and AI

**D-15 · Distribution: npm plus a shadcn registry** · 2026-10-31 · Locked
- npm packages (D-05). A namespaced shadcn registry (`npx shadcn add @lumae/accordion`), whose JSON ships inside the npm package. The site serves that JSON, with jsDelivr as a fallback.
- Why: work with shadcn, not against it, because vibe-coding tools default to shadcn.
- Eject (copying the view code into an app): **deferred**, because the registry already covers "own the code".

**D-16 · The CLI** · 2026-10-31 · Locked
- Commands: `init` (interactive, using `@clack/prompts`), `add <names…>|all`, `theme`, `doctor`.
- `add accordion` writes `components/ui/accordion.(tsx|jsx)`, named after the documented component.
- It never overwrites files. It merges, shows a diff first, and supports `--dry-run` and `--yes`.

**D-17 · AI is a primary audience** · 2026-10-31 · Locked
- Dense, generated docs (`AGENTS.md`, `llms.txt`, schema, meta) ship inside the npm package, matching the installed version and readable offline. `npx lumae mcp` is a local MCP server, so nothing needs hosting.
- Repo `AGENTS.md` holds binding rules, and `CLAUDE.md` imports it.

**D-18 · Security posture** · 2026-10-31 · Locked
- Zero runtime dependencies and no install scripts. npm trusted publishing (GitHub OIDC) with provenance. Two-factor auth with passkeys. `SECURITY.md`, OpenSSF Scorecard, and Dependabot for dev dependencies.
- Why: npm supply-chain worms in 2025 spread by hijacking maintainer accounts.

**D-19 · Accessibility evidence** · 2026-10-31 · Locked
- Follow the APG pattern for each component, pass the conformance gate, and publish a generated accessibility report plus a screen-reader matrix with every release.
- Why: the European Accessibility Act (enforced since June 2025) means buyers ask for evidence.

**D-20 · Build only the accordion first** · 2026-10-31 · Locked
- Milestones A1–A9 bring the accordion to finished quality. The owner signs off after each milestone. Then components follow one at a time, each researched and specified first.
- Nothing goes public until there are many components and they have had internal feedback.

**D-21 · No Docker requirement** · 2026-10-31 · Locked
- Cross-machine confidence comes from the CI matrix (operating system × Node × package manager × React × compiler), not from containers.
