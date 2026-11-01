# Compatibility

Supported targets (D-06, D-14). Shipped: `@pinfold/react` declares `react >=18` and builds ES2018
ESM + CJS + `.d.ts`, with `typesVersions` and a stub folder per subpath. The CI matrix that
proves each row lands in A1; SSR test apps in A4.

| Area | Supported | How it's verified |
|---|---|---|
| React | 18.x, 19.x, canary | CI matrix (A1) |
| React Compiler | Works with it on and with it off | Each React leg runs both ways (A1) |
| Language | TypeScript and plain JavaScript | JS test app (A4). Dev config validation (A3). |
| TypeScript | 4.7+ (the published `.d.ts` files) | Type checks of the published `.d.ts` with 4.7 and 5.x (A1) |
| Module formats | ESM, CJS | `exports` with `import`/`require` conditions |
| Old module resolution | `moduleResolution: node` | `typesVersions` maps the subpaths |
| Bundlers | Vite, webpack 5, webpack 4, Turbopack, Rspack, esbuild, Parcel | A stub folder per subpath for bundlers that ignore `exports` (webpack 4) |
| Test runners | Vitest, Jest (CJS) | JavaScript never imports CSS, so no CSS mocks are needed |
| Package managers | npm, pnpm (strict), Yarn classic and PnP, bun | Install checks (A1). Zero runtime dependencies means nothing leaks between packages. |
| Node (CLI and SSR) | 20, 22, 24 | CI matrix |
| OS (CLI) | Windows, macOS, Linux | CI matrix |
| SSR and RSC | Next.js App Router (RSC, ISR, streaming), Next.js Pages Router, Remix / React Router 7, Vite SSR, Gatsby, Astro islands | A test app for each (A4) |
| Styling | Plain CSS, Tailwind v3 and v4, CSS Modules, and fully `unstyled` | Conformance plus the CLI merge tests |
| Browsers | Baseline 2023: Chrome and Edge 111+, Firefox 113+, Safari 16.4+ | These are needed for `@layer`, `color-mix()`, container queries and OKLCH (sRGB hex fallbacks are emitted) |
| Progressive enhancement | `hidden="until-found"` (Chromium), glass refraction (Chromium) | Other browsers degrade gracefully: panels stay closed, glass becomes a blur |

## Not supported
- **React 16 and 17.** `npx pinfold doctor` detects them and links to the upgrade guide.
- **Browsers without `@layer`.** Every rule inside a layer is ignored there, so components would render unstyled.
- **Script tags with a UMD bundle.** An ESM CDN such as esm.sh works instead.
