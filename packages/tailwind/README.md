# @lumae/tailwind

Lumae and Tailwind, sharing one palette.

```bash
npm install @lumae/tailwind
```

**Tailwind v4** — import the theme:

```css
@import "tailwindcss";
@import "@lumae/core/styles.css";
@import "@lumae/tailwind/theme.css";
```

**Tailwind v3** — add the preset:

```js
// tailwind.config.js
module.exports = { presets: [require('@lumae/tailwind')] };
```

## What you get

`bg-primary-600`, `text-content-muted`, `border-line`, `rounded-lg`, `shadow-md`,
`ease-lumae-out` — all resolving to `--lumae-*` custom properties, so they follow
`npx lumae theme`, dark mode, and any runtime override. Change the brand hue
once and both systems move together.

State variants map to the `data-*` attributes Lumae components already expose:

```jsx
<Faq classNames={{
  trigger: 'open:text-primary-600 disabled-row:opacity-40',
  panel: 'closed:pointer-events-none',
}} />
```

`open:` · `closed:` · `selected:` · `disabled-row:` · `group-open:` · `lumae-dark:`

## Three ways to combine them

**1. Lumae styles, Tailwind for layout.** The default. Lumae's CSS lives in the
`lumae` cascade layer, and unlayered Tailwind utilities beat any layered rule
regardless of specificity or source order — so a utility always wins, with no
`!important` and no `tailwind-merge`.

```jsx
<Faq className="mt-8 max-w-2xl" classNames={{ trigger: 'px-6 text-base' }} />
```

**2. Tailwind only.** `unstyled` drops every Lumae class and its CSS; behaviour,
ARIA and `data-*` state stay. Lumae becomes a headless library with a palette.

```jsx
const Faq = useAccordion({
  items,
  unstyled: true,
  classNames: {
    root: 'divide-y divide-line rounded-xl border border-line',
    trigger: 'flex w-full items-center justify-between px-5 py-4 hover:bg-surface-hover open:text-primary-600',
    panel: 'grid transition-all duration-300 ease-lumae-out closed:grid-rows-[0fr] open:grid-rows-[1fr]',
    content: 'overflow-hidden px-5 pb-4 text-content-muted',
  },
});
return <Faq />;
```

You do not need `@lumae/accordion/styles.css` in this mode.

**3. Tokens only.** Skip the components; use the palette engine for your own
design system. `npx lumae theme` writes plain CSS custom properties.

MIT
