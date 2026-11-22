<div align="center">

<img src="https://raw.githubusercontent.com/IndranilBhattacharya/pinfold/main/.github/assets/logo.svg" width="64" height="64" alt="Pinfold" />

# @pinfold/css

The styling layer of [Pinfold](https://pinfold.indranildev.in): tokens, scoped reset, modular component stylesheets, style packs, and Tailwind / shadcn bridges.

[![npm](https://img.shields.io/npm/v/@pinfold/css?color=7c3aed&label=%40pinfold%2Fcss)](https://www.npmjs.com/package/@pinfold/css)
[![license](https://img.shields.io/npm/l/@pinfold/css?color=4f46e5)](LICENSE)
[![dependencies](https://img.shields.io/badge/dependencies-0-16a34a)](package.json)

[Documentation](https://pinfold.indranildev.in/docs) · [Theming](https://pinfold.indranildev.in/docs/theming) · [GitHub](https://github.com/IndranilBhattacharya/pinfold)

<img src="https://raw.githubusercontent.com/IndranilBhattacharya/pinfold/main/.github/assets/banner.png" alt="Pinfold CSS" width="100%" />

</div>

Plain CSS in cascade layers (`@layer pinfold.*`), so your own CSS and every Tailwind utility override it with no
`!important`. Framework-free, Baseline 2023, and only the stylesheets you import.

```ts
import '@pinfold/css/core.css';    // reset and tokens, once
import '@pinfold/css/table.css';   // per component you use
// or everything: import '@pinfold/css/all.css';
```

Styling every part yourself with `unstyled`? Import only `@pinfold/css/tokens.css`, or nothing.

## Style packs

```ts
import '@pinfold/css/packs.css';
// <PinfoldProvider stylePack="glass">, or data-pinfold-style="glass" on any element
```

`glass`, `material`, `noise` and `brutalist` change surfaces, edges, depth and texture of every component at once,
never its colours or layout. Every colour a pack sets is mixed from your palette. Each pack yields to
`prefers-reduced-transparency`, `prefers-contrast: more` and forced colours, and glass surfaces are tested to keep
body text at WCAG AA over white, black and brand-coloured backdrops.

## Tailwind

```css
/* v4 */
@import "tailwindcss";
@import "@pinfold/css/core.css";
@import "@pinfold/css/tailwind.css";
```

```js
// v3: tailwind.config.js
module.exports = { presets: [require('@pinfold/css/tailwind')] };
```

`bg-primary-600`, `text-content-muted`, `border-line`, `rounded-lg`, `shadow-md` and `ease-pinfold-out` resolve to
`--pinfold-*` variables, so they follow `npx pinfold theme`, dark mode and any runtime override. Variants such as
`open:`, `closed:` and `disabled-row:` map to the `data-*` attributes components already set.

## shadcn

```css
@import "@pinfold/css/core.css";
@import "@pinfold/css/shadcn.css";   /* after shadcn's own variables */
```

Points shadcn's variables (`--background`, `--primary`, `--ring`, `--radius`, …) at Pinfold's tokens, so both
libraries share one theme. For dark mode set both `.dark` and `data-pinfold-theme`, e.g. next-themes
`attribute={['class', 'data-pinfold-theme']}`.

## Your theme

```bash
npx pinfold theme --primary "#4f46e5" --radius lg --check
```

Writes the theme CSS from your colours in any CSS format, with a contrast check. See
[Theming](https://pinfold.indranildev.in/docs/theming).

MIT © Indranil Bhattacharya · [Docs](https://pinfold.indranildev.in/docs) · [GitHub](https://github.com/IndranilBhattacharya/pinfold)
