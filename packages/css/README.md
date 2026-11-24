<p align="center">
  <a href="https://pinfold.indranildev.in">
    <img src="https://raw.githubusercontent.com/IndranilBhattacharya/pinfold/main/.github/assets/banner.png" alt="@pinfold/css" width="100%" />
  </a>
</p>

<p align="center">
  <strong>The styling layer of <a href="https://pinfold.indranildev.in">Pinfold</a></strong><br />
  Tokens &bull; Cascade layers &bull; Modular component stylesheets &bull; Style packs &bull; Tailwind & shadcn bridges
</p>

<p align="center">
  <a href="https://www.npmjs.com/package/@pinfold/css"><img src="https://img.shields.io/npm/v/@pinfold/css?color=7c3aed&label=%40pinfold%2Fcss" alt="npm version" /></a>
  <a href="https://github.com/IndranilBhattacharya/pinfold/blob/main/LICENSE"><img src="https://img.shields.io/npm/l/@pinfold/css?color=4f46e5" alt="license" /></a>
  <a href="https://www.npmjs.com/package/@pinfold/css"><img src="https://img.shields.io/badge/npm-provenance-0ea5e9" alt="provenance" /></a>
  <a href="https://www.npmjs.com/package/@pinfold/css"><img src="https://img.shields.io/badge/dependencies-0-16a34a" alt="dependencies: 0" /></a>
  <a href="https://www.npmjs.com/package/@pinfold/css"><img src="https://img.shields.io/badge/Baseline-2023-blue" alt="Baseline 2023" /></a>
</p>

<p align="center">
  <a href="https://pinfold.indranildev.in/docs"><strong>Documentation</strong></a> &nbsp;&bull;&nbsp;
  <a href="https://pinfold.indranildev.in/docs/theming"><strong>Theming</strong></a> &nbsp;&bull;&nbsp;
  <a href="https://pinfold.indranildev.in/docs/table"><strong>Components</strong></a> &nbsp;&bull;&nbsp;
  <a href="https://github.com/IndranilBhattacharya/pinfold"><strong>GitHub</strong></a>
</p>

<br />

Pure CSS organized into standard cascade layers (`@layer pinfold.*`). Your application CSS and Tailwind utility classes override default styles effortlessly with zero `!important`. Framework-free, Baseline 2023 compliant, and modular.

```ts
import '@pinfold/css/core.css';    // global reset and design tokens
import '@pinfold/css/table.css';   // individual component styles as needed
// or import all components at once:
import '@pinfold/css/all.css';
```

## Cascade Layers Architecture

| Layer | Priority Order | Purpose & Contents |
| :--- | :---: | :--- |
| `@layer pinfold.tokens` | 1 | Global theme design tokens (`--pinfold-*`), colors, typography, and radii |
| `@layer pinfold.reset` | 2 | Scoped semantic element reset (box-sizing, standard focus outlines) |
| `@layer pinfold.base` | 3 | Component structural layout, flex/grid positions, and ARIA states |
| `@layer pinfold.components`| 4 | Component slot variants, visual tones, and hover/active states |
| `@layer pinfold.packs` | 5 | Style pack surface, edge, and elevation transformations |

Because Pinfold declares its rules inside `@layer pinfold.*`, unlayered consumer rules and Tailwind utilities automatically take precedence regardless of import order.

## Style Packs

```ts
import '@pinfold/css/packs.css';
// Apply via provider: <PinfoldProvider stylePack="glass">
// Or via attribute on any DOM subtree: data-pinfold-style="glass"
```

| Pack | Visual Characteristics | Contrast & Accessibility |
| :--- | :--- | :--- |
| `default` | Clean, crisp, modern SaaS aesthetic with subtle border definitions | Baseline contrast safe, system light/dark |
| `glass` | Frosted backdrop blur, subtle translucent surface highlights | Tested against WCAG AA over dark, light, and brand fills |
| `material` | Layered elevation shadows, subtle surface tints | Tactile hierarchy with elevated depth |
| `noise` | Micro-grain texture overlay for tactile depth | Neutral opacity preserving underlying contrast |
| `brutalist` | Hard unblurred drop shadows, bold dark borders | Ultra-high contrast exceeding WCAG AAA |

Every style pack strictly respects `prefers-reduced-transparency`, `prefers-contrast: more`, and system forced-colors modes.

## Tailwind CSS Integration

### Tailwind v4

```css
@import "tailwindcss";
@import "@pinfold/css/core.css";
@import "@pinfold/css/tailwind.css";
```

### Tailwind v3

```js
// tailwind.config.js
module.exports = {
  presets: [require('@pinfold/css/tailwind')]
};
```

Classes like `bg-primary-600`, `text-content-muted`, `border-line`, `rounded-lg`, and `shadow-md` map directly to Pinfold tokens. Variants such as `open:`, `closed:`, and `disabled-row:` match data attributes emitted by components.

## shadcn/ui Compatibility

```css
@import "@pinfold/css/core.css";
@import "@pinfold/css/shadcn.css";   /* maps shadcn CSS variables to Pinfold tokens */
```

Bridges shadcn variables (`--background`, `--primary`, `--ring`, `--radius`) to Pinfold tokens, allowing both design systems to coexist under a unified theme.

---

[MIT](https://github.com/IndranilBhattacharya/pinfold/blob/main/LICENSE) &copy; 2026 Indranil Bhattacharya &bull; [Documentation](https://pinfold.indranildev.in/docs) &bull; [GitHub](https://github.com/IndranilBhattacharya/pinfold)
