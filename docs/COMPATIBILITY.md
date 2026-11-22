# Compatibility

Supported targets. Shipped: `@pinfold/react` declares `react >=18` and builds ES2018
ESM + CJS + `.d.ts`, with `typesVersions` and a stub folder per subpath.

- **React** — 18.x, 19.x, and canary (verified via CI matrix across both versions with and without the React Compiler).
- **Language & Types** — TypeScript (4.7+ published `.d.ts` files) and plain JavaScript (Next.js `.jsx`, webpack CJS, runtime config validator).
- **Module formats** — Native ESM and CJS (`exports` with `import`/`require` conditions; `typesVersions` and stub subpaths for legacy bundlers like webpack 4).
- **Bundlers** — Vite, webpack 5, webpack 4, Turbopack, Rspack, esbuild, and Parcel.
- **Test runners** — Vitest and Jest (JavaScript never imports CSS, so no CSS mock transformers needed).
- **Package managers** — npm, pnpm (strict), Yarn (classic and PnP), and bun (zero runtime dependencies).
- **Node & Operating Systems** — Node 20, 22, 24 on Windows, macOS, and Linux.
- **SSR and RSC** — Next.js App Router (Server Components, ISR, streaming), Next.js Pages Router, Remix / React Router 7, Vite SSR, Gatsby, and Astro islands.
- **Styling** — Plain CSS, Tailwind v3 and v4, CSS Modules, and fully `unstyled`.
- **Browsers** — Baseline 2023: Chrome & Edge 111+, Firefox 113+, Safari 16.4+ (`@layer`, `color-mix()`, container queries, and OKLCH with sRGB hex fallbacks).
- **Overlays** — Popover API top layer where available (Chrome/Edge 114+, Firefox 125+, Safari 17+), fixed positioning fallback, and native `<dialog>` across all supported browsers.
- **Progressive enhancement** — `hidden="until-found"` and glass refraction where supported, gracefully degrading on other engines.

## Not supported
- **React 16 and 17.** `npx pinfold doctor` detects them and links to the upgrade guide.
- **Browsers without `@layer`.** Every rule inside a layer is ignored there, so components would render unstyled.
- **Script tags with a UMD bundle.** An ESM CDN such as esm.sh works instead.
