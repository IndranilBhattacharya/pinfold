# @knotui/tailwind

Knot UI and Tailwind, sharing one palette.

```bash
npm install @knotui/tailwind
```

**Tailwind v4** — import the theme:

```css
@import "tailwindcss";
@import "@knotui/core/styles.css";
@import "@knotui/tailwind/theme.css";
```

**Tailwind v3** — add the preset:

```js
// tailwind.config.js
module.exports = { presets: [require('@knotui/tailwind')] };
```

## What you get

`bg-primary-600`, `text-content-muted`, `border-line`, `rounded-lg`, `shadow-md`,
`ease-knot-out` — all resolving to `--knot-*` custom properties, so they follow
`npx knotui theme`, dark mode, and any runtime override. Change the brand hue
once and both systems move together.

State variants map to the `data-*` attributes Knot components already expose:

```jsx
<Faq classNames={{
  trigger: 'open:text-primary-600 disabled-row:opacity-40',
  panel: 'closed:pointer-events-none',
}} />
```

`open:` · `closed:` · `selected:` · `disabled-row:` · `group-open:` · `knot-dark:`

## Three ways to combine them

**1. Knot styles, Tailwind for layout.** The default. Knot's CSS lives in the
`knot` cascade layer, and unlayered Tailwind utilities beat any layered rule
regardless of specificity or source order — so a utility always wins, with no
`!important` and no `tailwind-merge`.

```jsx
<Faq className="mt-8 max-w-2xl" classNames={{ trigger: 'px-6 text-base' }} />
```

**2. Tailwind only.** `unstyled` drops every Knot class and its CSS; behaviour,
ARIA and `data-*` state stay. Knot becomes a headless library with a palette.

```jsx
const Faq = useAccordion({
  items,
  unstyled: true,
  classNames: {
    root: 'divide-y divide-line rounded-xl border border-line',
    trigger: 'flex w-full items-center justify-between px-5 py-4 hover:bg-surface-hover open:text-primary-600',
    panel: 'grid transition-all duration-300 ease-knot-out closed:grid-rows-[0fr] open:grid-rows-[1fr]',
    content: 'overflow-hidden px-5 pb-4 text-content-muted',
  },
});
return <Faq />;
```

You do not need `@knotui/accordion/styles.css` in this mode.

**3. Tokens only.** Skip the components; use the palette engine for your own
design system. `npx knotui theme` writes plain CSS custom properties.

MIT
