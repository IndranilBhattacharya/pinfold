# Compatibility

Supported targets (D-06, D-14). Shipped: `@pinfold/react` declares `react >=18` and builds ES2018
ESM + CJS + `.d.ts`, with `typesVersions` and a stub folder per subpath.

| Area | Supported | How it's verified |
|---|---|---|
| React | 18.x, 19.x, canary | CI matrix |
| React Compiler | Works with it on and with it off | Each React leg runs both ways |
| Language | TypeScript and plain JavaScript | The fixture apps are plain JS (Next.js `.jsx`, webpack CommonJS without JSX). Dev config validation from meta. |
| TypeScript | 4.7+ (the published `.d.ts` files) | Type checks of the published `.d.ts` with 4.7, 5.0 and the latest |
| Module formats | ESM, CJS | `exports` with `import`/`require` conditions |
| Old module resolution | `moduleResolution: node` | `typesVersions` maps the subpaths |
| Bundlers | Vite, webpack 5, webpack 4, Turbopack, Rspack, esbuild, Parcel | webpack 5 production build in `fixture-apps.mjs` (dev validator must be stripped); Turbopack via the Next.js fixture; esbuild in the size check. A stub folder per subpath for bundlers that ignore `exports` (webpack 4). |
| Test runners | Vitest, Jest (CJS) | JavaScript never imports CSS, so no CSS mocks are needed |
| Package managers | npm, pnpm (strict), Yarn classic and PnP, bun | Install checks of the packed tarballs. Zero runtime dependencies means nothing leaks between packages. |
| Node (CLI and SSR) | 20, 22, 24 | CI matrix |
| OS (CLI) | Windows, macOS, Linux | CI matrix |
| SSR and RSC | Next.js App Router (RSC, ISR, streaming), Next.js Pages Router, Remix / React Router 7, Vite SSR, Gatsby, Astro islands | `fixture-apps.mjs`: Next.js 16 App Router (Server Component + `defineAccordion` + ISR, Client Component) and Pages Router (ISR), built and served. Plain `renderToString` (what Vite SSR, React Router 7 and Astro call) in the consumer smoke test, and a hydration test with zero warnings. |
| Styling | Plain CSS, Tailwind v3 and v4, CSS Modules, and fully `unstyled` | Conformance plus the CLI merge tests |
| Browsers | Baseline 2023: Chrome and Edge 111+, Firefox 113+, Safari 16.4+ | These are needed for `@layer`, `color-mix()`, container queries and OKLCH (sRGB hex fallbacks are emitted) |
| Progressive enhancement | `hidden="until-found"` (Chromium), glass refraction (Chromium) | Other browsers degrade gracefully: panels stay closed, glass becomes a blur |

## Not supported
- **React 16 and 17.** `npx pinfold doctor` detects them and links to the upgrade guide.
- **Browsers without `@layer`.** Every rule inside a layer is ignored there, so components would render unstyled.
- **Script tags with a UMD bundle.** An ESM CDN such as esm.sh works instead.
