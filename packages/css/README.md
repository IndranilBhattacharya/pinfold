# @lumae/css

All of Lumae's styling: design tokens, a scoped reset, one stylesheet per component, and
the Tailwind bridge. Plain CSS in cascade layers (`@layer lumae.*`), so your own CSS and every
Tailwind utility override it without `!important`. Framework-free.

```js
import '@lumae/css/core.css';        // reset + tokens, once
import '@lumae/css/accordion.css';   // per component you use
// or: import '@lumae/css/all.css';
```

Using `unstyled: true` everywhere? Import only `@lumae/css/tokens.css`, or nothing.

## Tailwind

**v4:** import the theme after Tailwind.

```css
@import "tailwindcss";
@import "@lumae/css/core.css";
@import "@lumae/css/tailwind.css";
```

**v3:** add the preset.

```js
// tailwind.config.js
module.exports = { presets: [require('@lumae/css/tailwind')] };
```

`bg-primary-600`, `text-content-muted`, `border-line`, `rounded-lg`, `shadow-md` and
`ease-lumae-out` all resolve to `--lumae-*` custom properties, so they follow
`npx lumae theme`, dark mode and any runtime override. Variants such as `open:`, `closed:` and
`disabled-row:` map to the `data-*` attributes Lumae components already set.

MIT © Indranil Bhattacharya
