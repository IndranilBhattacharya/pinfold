# @pinfold/css

All of Pinfold's styling: design tokens, a scoped reset, one stylesheet per component, and
the Tailwind bridge. Plain CSS in cascade layers (`@layer pinfold.*`), so your own CSS and every
Tailwind utility override it without `!important`. Framework-free.

```js
import '@pinfold/css/core.css';        // reset + tokens, once
import '@pinfold/css/accordion.css';   // per component you use
// or: import '@pinfold/css/all.css';
```

Using `unstyled: true` everywhere? Import only `@pinfold/css/tokens.css`, or nothing.

## Style packs

```js
import '@pinfold/css/packs.css';
// <PinfoldProvider stylePack="glass">, or data-pinfold-style="glass" on any element
```

`glass`, `bauhaus`, `brutalist`, `noise` and `soft` are token recipes (shape, depth, borders,
surfaces, type), so every component follows them with no extra CSS. Each one yields to
`prefers-reduced-transparency`, `prefers-contrast: more` and `forced-colors`, and glass surfaces
are tested to keep body text at WCAG AA over white, black and brand-coloured backdrops.

## shadcn/ui

```css
@import "@pinfold/css/core.css";
@import "@pinfold/css/shadcn.css";   /* after shadcn's own variables */
```

Points shadcn's variables (`--background`, `--primary`, `--ring`, `--radius`, …) at Pinfold's
tokens, so both libraries share one theme. For dark mode set both `.dark` and
`data-pinfold-theme`, e.g. next-themes `attribute={['class', 'data-pinfold-theme']}`.

## Design tokens (DTCG)

`toDTCG(createTheme({ primary: 'emerald' }))` from `@pinfold/core/palette` returns the theme as
W3C Design Tokens (2025.10) for Tokens Studio, Style Dictionary and other DTCG tools.

## Tailwind

**v4:** import the theme after Tailwind.

```css
@import "tailwindcss";
@import "@pinfold/css/core.css";
@import "@pinfold/css/tailwind.css";
```

**v3:** add the preset.

```js
// tailwind.config.js
module.exports = { presets: [require('@pinfold/css/tailwind')] };
```

`bg-primary-600`, `text-content-muted`, `border-line`, `rounded-lg`, `shadow-md` and
`ease-pinfold-out` all resolve to `--pinfold-*` custom properties, so they follow
`npx pinfold theme`, dark mode and any runtime override. Variants such as `open:`, `closed:` and
`disabled-row:` map to the `data-*` attributes Pinfold components already set.

MIT © Indranil Bhattacharya
