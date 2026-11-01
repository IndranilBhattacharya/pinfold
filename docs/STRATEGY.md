# Strategy: market, SWOT, threats

Research date: 2026-10. Refresh this before the public launch.

## 1. Landscape (Oct 2026)

**Unstyled primitives (behaviour and accessibility, no styling).** Well funded and settled.
- **Base UI** (MUI, with former Radix and Floating UI contributors). v1 shipped Feb 2026. It became shadcn/ui's default for new projects in Jul 2026.
- **React Aria Components** (Adobe). The deepest accessibility and internationalisation work. Adobe's Spectrum 2 and HeroUI v3 (a Mar 2026 rewrite) are built on it.
- **Radix**. Still supported, but no longer the default.
- **Zag.js / Ark UI**. Framework-agnostic state machines with React, Vue, Solid and Svelte adapters. No Angular adapter.

**Styled libraries and distribution.**
- **shadcn/ui** won distribution: code you copy into your app, registries, an MCP server, and 40+ community registries.
  Its known pain points: updates mean diffing upstream changes by hand, copies drift apart in large teams, and there's no channel for patches.
- **MUI**: the enterprise incumbent. Its paid MUI X tier carries the data grid and date pickers.
- **HeroUI v3**: polished defaults, plus React Native.

**Platform.** Browser-native APIs now in every major browser:
- The Popover API and CSS anchor positioning.
- `hidden="until-found"`, which lets Ctrl+F reveal collapsed content. Chromium only; harmless elsewhere.

**Design tokens.** The W3C DTCG 2025.10 spec is stable and supports OKLCH and P3, so it's now the format for exchanging tokens with Figma and tooling.

**AI.** MCP servers, `llms.txt`, and APIs that can be described as JSON are now selling points.

**Regulation.** The European Accessibility Act has been enforced since 28 Jun 2025, based on EN 301 549 and WCAG 2.1/2.2 AA. Buyers ask for evidence, not claims.

**Visual trends.** Liquid glass (SVG refraction works only in Chromium, so every library ships simpler fallbacks), bauhaus, neo-brutalism, and noise textures. Theme editors such as tweakcn are popular.

## 2. Positioning

Don't compete as yet another set of unstyled primitives. Pinfold is **the config-first,
hooks-first layer**, with uncluttered JSX on client and server, a design system in a box,
and accessibility backed by evidence. It **cooperates with shadcn**: a registry, token
mapping, and a home inside vibe-coding tools.

## 3. SWOT

### Strengths
- Hooks first, with uncluttered JSX on both client and server (`use*` and `define*`). Nobody else ships this.
- Config can be written as plain JSON: cheap for AI, easy to fill from a CMS or server data, and it can cross from server to client.
- React 18 through 19+, with or without the compiler, across SSR, RSC and ISR. JavaScript and TypeScript are both first-class.
- Static CSS in cascade layers: no runtime cost, no SSR styling problems, and Tailwind classes win without `!important`.
- You ship only what you import, and there are zero runtime dependencies.
- Accessibility enforced by the build (the conformance suite) and backed by a published report.
- An OKLCH palette engine with WCAG contrast reports and gamut mapping.
- A layered architecture that is ready for other frameworks.

### Weaknesses, and how we fix them
| Weakness | In plain terms | Fix |
|---|---|---|
| Only the accordion exists | Teams choose a library by how many components it has. The config model is only proven on the easiest widget. | An internal-only phase with many components before launch. Each component is researched and specified first. The escape-hatch ladder covers the rest. Hard components (dialog, popover, combobox) come early. |
| Two entry points per component | `use*` and `define*` mean more to document and test | Both are generated from the same meta and run against the same conformance spec |
| React Compiler risk | Suspected: the compiler may cache `<Faq />`, so the screen stops updating. TanStack Table hit this ([#5567](https://github.com/TanStack/table/issues/5567)). | A1: reproduce it in a test, then make `<Faq />` subscribe to its own state with `useSyncExternalStore` |
| Single maintainer | Enterprises check what happens if the maintainer disappears | Automation (scaffolder, conformance, release bot), CONTRIBUTING, SECURITY, sponsorship, and 1–2 co-maintainers after launch |

### Opportunities
- **Become the default for AI agents.** Docs inside the package plus `llms.txt` and a local MCP server make Pinfold cheap for agents to use correctly. Publish a benchmark comparing AI-written code that uses Pinfold with raw AI output, measured by accessibility tests.
- **The shadcn registry index.** One command away for every shadcn user and every tool built on shadcn.
- **Config-first components that work in Server Components with no boilerplate.** Nobody fills this niche.
- **EAA procurement.** A per-component accessibility report, which no competitor publishes.
- **A theme studio** (on the site) whose shareable links spread on their own.
- **The owner's personal brand.** Name the pattern ("the hook returns the component"), and publish a dated essay and talks.

### Threats and mitigations
| Threat | Mitigation |
|---|---|
| Developers default to shadcn and Base UI | Interoperate: a namespaced shadcn registry, mapping onto shadcn's CSS variables, and a migration guide. Win on what shadcn lacks: updates, config-first components, proof of accessibility. |
| AI writes one-off components instead of using a library | AI-first docs in the package, a local MCP server, and the benchmark. Config is the cheapest thing for an agent to emit. |
| Funded competitors ship more components | Win on depth and developer experience, not count. Use native platform features to write less code. Respond to issues fast. Build in public. |
| React platform churn (RSC, compiler, future majors) | Canary React and compiler builds in CI. Keep logic in a framework-free core. |
| Copycats | Ship fast, publish the dated essay first, trademark the name, keep the MIT copyright notice, and become the best-known original |
| npm supply-chain attacks | Zero dependencies, no install scripts, trusted publishing with provenance, passkeys, OpenSSF Scorecard (D-18) |
| Trademark conflict after launch | A formal search before launch (D-01) |
| Scope creep | Filter components for modern use. Each one has a spec and passes conformance. The bottleneck is verification, not writing code. |

## 4. Attribution plan
1. MIT copyright, `author` fields, `CITATION.cff`.
2. A trademark on "Pinfold".
3. A dated public essay that names the pattern. The public git history serves as the record of priority.
4. "Created by Indranil Bhattacharya" on the site, plus talks and building in public.

## Sources
[shadcn Base UI default](https://releases.sh/release/rel_TUxVOyVHeyyTBGlCTm6n4) ·
[Base UI v1](https://infoq.com/news/2026/02/baseui-v1-accessible/) ·
[MUI 2026](https://mui.com/blog/2026-and-beyond/) ·
[HeroUI v3](https://heroui.com/docs/react/releases/v3-0-0) ·
[Zag.js](https://www.zagjs.com) ·
[TanStack Table #5567](https://github.com/TanStack/table/issues/5567) ·
[DTCG 2025.10](https://www.w3.org/community/design-tokens/2025/10/28/design-tokens-specification-reaches-first-stable-version/) ·
[Chrome web UI recap](https://developer.chrome.com/blog/new-in-web-ui-io-2025-recap) ·
[CVE-2025-55182](https://vercel.com/changelog/cve-2025-55182) ·
[EAA for developers](https://www.telerik.com/blogs/what-does-european-accessibility-act-mean-developers) ·
[shadcn criticism](https://dev.to/chnkc41/copy-paste-components-vs-npm-packages-shadcnui-vs-ninna-ui-in-2026-1n0a) ·
[Base UI Accordion](https://base-ui.com/react/components/accordion) ·
[TaloDev](https://github.com/TaloDev/backend)
