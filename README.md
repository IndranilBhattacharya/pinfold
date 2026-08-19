<div align="center">

# Knot UI

**Build React UI from configuration, not from markup.**

An entire accessible accordion, data grid or calendar from one object — or one hook.
Rich variants, per-component installs, an escape hatch on every slot.

`React ≥ 16.8` · `MIT` · zero runtime dependencies

</div>

---

## The problem

Every React UI library asks you to hand-write the same tree over and over:

```jsx
<Accordion type="single" collapsible>
  <AccordionItem value="a">
    <AccordionTrigger><ChevronIcon />Shipping</AccordionTrigger>
    <AccordionContent>Ships in 2 days.</AccordionContent>
  </AccordionItem>
  {/* ...repeat for every row, forever */}
</Accordion>
```

Twelve rows is sixty lines of nesting. It is not diffable, not serialisable, not
storable in a CMS, and a language model gets the nesting wrong more often than it
gets the content wrong.

## The Knot way — a hook that gives you a tag

```jsx
import { useAccordion } from '@knotui/accordion';

function Support() {
  const Faq = useAccordion({
    items: [
      { title: 'Shipping', content: 'Ships in 2 days.' },
      { title: 'Returns', content: '30 days, no questions.' },
    ],
    variant: 'separated',
  });

  return (
    <main className="mx-auto max-w-2xl py-12">
      <h1>Support</h1>
      <Faq />
    </main>
  );
}
```

One line of config per row, and a self-closing tag that drops into ordinary
layout JSX. No provider, no compound children, no wrapper components.

The value the hook returns is three things at once:

```jsx
<Faq className="mt-6" />        // 1. a component
Faq.toggle('shipping')          // 2. the controller — value, open, close, openAll, focusItem
<Faq.Panel id="shipping" />     // 3. its parts, for layouts config cannot express
```

Its identity is stable across renders, so React never remounts the subtree and
focus, scroll position and in-flight transitions all survive.

## Install

```bash
npx knotui init            # palette + radius + knot.config.json + theme CSS
npx knotui add accordion   # one component at a time, like shadcn
npx knotui add all         # or the lot
```

## Colour is a first-class configuration surface

Seven roles — `primary`, `accent`, `neutral`, `success`, `warning`, `danger`,
`info` — each an eleven-step ramp generated from a single OKLCH hue angle.
Perceptually uniform, so rotating a hue keeps the steps evenly spaced instead of
producing the muddy middles you get from HSL.

```bash
npx knotui palette                                   # preview every hue, in colour
npx knotui theme --primary emerald --accent amber    # two-tone brand
npx knotui theme --primary 274 --neutral 264 --intensity 1.15
npx knotui theme --check                             # WCAG 2.2 contrast report
```

Every generated stylesheet ships **sRGB hex first and OKLCH behind `@supports`**,
so browsers without OKLCH get the right colour rather than a broken one. Chroma
that falls outside sRGB is gamut-mapped by bisection, not clipped.

The same engine is importable at runtime — the CLI has no private maths:

```js
import { createTheme, contrastRatio } from '@knotui/core/palette';

const theme = createTheme({ primary: 'emerald', accent: 'amber', radius: 'lg' });
theme.vars;      // { '--knot-primary-500': '#009b60', … }  spread into a style prop
theme.css;       // the stylesheet the CLI writes
theme.contrast;  // WCAG report per role and step
```

## Levels of control

One hook, four levels. The config object never changes shape as you go deeper.

| Level | You add | You get |
| --- | --- | --- |
| **1 — render** | `<Faq />` | everything, styled, accessible |
| **2 — dimensions** | `dimensions: { paddingX: 24 }` | exact sizing, preset kept for the rest |
| **3 — slots** | `classNames`, `styles`, `slotProps`, `render` | your classes or your markup for one part |
| **4 — parts** | `<Faq.Trigger id>`, `<Faq.Panel id>` | your layout, our behaviour and ARIA |
| **5 — getters** | `getRootProps`, `getTriggerProps`, … | your elements, entirely |

Nothing about level 1 has to be abandoned to reach level 4. The config object
never changes shape, and no level is a different API.

### Where config stops, and what happens then

Config is the right shape for repeated rows: an accordion, tabs, a menu, a data
grid. It is the wrong shape for a page layout, and we do not pretend otherwise —
so the parts exist, and they are ordinary API rather than an escape hatch:

```jsx
const Faq = useAccordion({ items });

<div className="grid grid-cols-2 gap-6">
  {Faq.items.map((item) => (
    <section key={item.id} className="rounded-2xl border p-4">
      <Faq.Trigger id={item.id}>{item.config.title}</Faq.Trigger>
      <Faq.Panel id={item.id} />
    </section>
  ))}
</div>
```

Every ARIA attribute still comes from the hook. You laid out the page; you did
not reimplement the accordion.

```jsx
// 2 — every dimension is configurable. Numbers are px, strings pass through.
useAccordion({
  items,
  dimensions: {
    width: '100%', maxWidth: '40rem', gap: 12, radius: 16,
    paddingX: 24, paddingY: 18, panelPaddingX: 24,
    fontSize: 15, titleSize: 16, descriptionSize: 13,
    iconSize: 22, indicatorSize: 20, borderWidth: 1,
    panelMaxHeight: '18rem',   // caps and scrolls the open panel
    maxHeight: '32rem',        // caps and scrolls the whole accordion
    duration: '240ms',
  },
});

// 3 — every visible part is configurable, per accordion or per row.
// Any renderable field also accepts a function of the row's live state.
useAccordion({
  items: [{
    title: (s) => <b>{s.open ? 'Hide' : 'Show'} shipping</b>,
    description: 'Updated today',
    icon: <TruckIcon />,
    badge: (s) => (s.open ? 'reading' : null),
    content: (s) => <ShippingTable id={s.id} />,
    indicator: 'plus',                          // this row only
    classNames: { trigger: 'font-semibold' },   // this row only
  }],
  indicator: (s) => <Caret open={s.open} />,    // every row
  classNames: { trigger: 'uppercase', panel: 'prose' },
  styles: { title: { letterSpacing: '0.01em' } },
  slotProps: { root: { 'data-analytics': 'faq' } },
  render: { title: ({ children }) => <h4>{children}</h4> },
  renderItem: ({ props, header, panel }) => (
    <div {...props} className="rounded-2xl border p-2">{header}{panel}</div>
  ),
});

// 4 — bring your own elements; every ARIA attribute comes from the getters
const faq = useAccordion({ items, mode: 'multiple' });
<dl {...faq.getRootProps()}>
  {faq.items.map((item) => (
    <div key={item.id} {...faq.getItemProps(item)}>
      <dt><button {...faq.getTriggerProps(item)}>{item.config.title}</button></dt>
      <dd {...faq.getPanelProps(item)} hidden={!item.open}>{item.config.content}</dd>
    </div>
  ))}
</dl>
```

Slots are named, not guessed: `root item header trigger icon label title
description badge indicator panel content`.

## Tailwind

Knot's CSS ships inside a `knot` [cascade layer](https://developer.mozilla.org/en-US/docs/Web/CSS/@layer).
Unlayered CSS — which is every Tailwind utility — beats a layered rule at any
specificity, regardless of import order. So utilities simply win:

```jsx
<Faq className="mt-8 max-w-2xl" classNames={{ trigger: 'px-6 text-base' }} />
```

No plugin, no `!important`, no `tailwind-merge`, no import-order rule.

Prefer to own the styling completely? `unstyled` drops every Knot class and its
stylesheet, leaving the behaviour, the ARIA and the `data-*` state hooks:

```jsx
const Faq = useAccordion({
  items,
  unstyled: true,
  classNames: {
    root: 'divide-y divide-line rounded-xl border border-line',
    trigger: 'flex w-full justify-between px-5 py-4 hover:bg-surface-hover open:text-primary-600',
    panel: 'grid transition-all duration-300 ease-knot-out closed:grid-rows-[0fr] open:grid-rows-[1fr]',
    content: 'overflow-hidden px-5 pb-4 text-content-muted',
  },
});
```

And `@knotui/tailwind` puts the palette in Tailwind's own scale, so one theme
command moves both systems:

```js
// tailwind.config.js  ·  v4: @import "@knotui/tailwind/theme.css";
module.exports = { presets: [require('@knotui/tailwind')] };
```

`bg-primary-600` · `text-content-muted` · `border-line` · `rounded-lg` ·
`shadow-md` · `ease-knot-out` — all resolving to `--knot-*` variables. The
`open:`, `closed:`, `selected:`, `disabled-row:` and `knot-dark:` variants map
to the `data-*` attributes Knot already exposes, so there is no class toggling
to write.

## Why it stays small and fast

- **No runtime CSS.** Plain CSS files driven by custom properties. No emotion, no
  stitches, no `styled`, no class generation on render.
- **No dependencies.** Core is tokens plus six primitives; `clsx`/`cva` are
  reimplemented in ~40 lines because that is cheaper than the install.
- **One package per component.** Importing the accordion cannot pull in the data grid.
- **Real code-splitting.** `import { Accordion } from '@knotui/accordion/lazy'` for a
  Suspense-wrapped dynamic import with no boilerplate.
- **CSS-only animation.** Panels collapse with `grid-template-rows: 0fr → 1fr`. No
  height measurement, no `ResizeObserver`, no layout thrash.
- **React 16.8+.** No `useId`, `useSyncExternalStore` or automatic-JSX requirement.
  No `react-dom` import, so React Native Web and custom renderers stay possible.

## Accessibility is not a variant

Every component is built against the WAI-ARIA Authoring Practices before it ships.
For the accordion that means:

- triggers are real `<button>`s inside real headings at a configurable level
- `aria-expanded` / `aria-controls` / `aria-labelledby` wired in both directions
- panels are `role="region"` labelled by their trigger
- Arrow Up/Down, Home, End move between headers; `dir="rtl"` flips the axis
- disabled rows use `aria-disabled` so they stay focusable and discoverable
- closed panels leave the accessibility tree *and* the tab order
- `prefers-reduced-motion` and `forced-colors` handled in CSS, not JS

## Repo layout

```
packages/core        tokens, theme engine, primitives          @knotui/core
packages/accordion   first component                           @knotui/accordion
packages/tailwind    Tailwind v3 preset and v4 theme           @knotui/tailwind
packages/testing     the conformance contract                  @knotui/testing
packages/cli         zero-dependency installer + theme engine  knotui
apps/docs            live documentation, runs off source       (private)
```

```bash
npm install       # once
npm run docs      # live docs + palette studio at http://localhost:5180
npm run verify    # typecheck, tests, build, bundle budget
npm run size      # gzip report per published entry point
```

Current budget, gzipped:

| Entry | Size | Ceiling |
| --- | --- | --- |
| `@knotui/core` | 2.82 kB | 4 kB |
| `@knotui/core/palette` | 2.67 kB | 4 kB |
| core CSS (reset + tokens) | 4.13 kB | 5 kB |
| `@knotui/accordion` | 4.18 kB | 5 kB |
| accordion CSS | 2.90 kB | 3 kB |

CI fails the build when any of them is exceeded — "lightweight" is a test here,
not a claim.

## Roadmap

`tabs` · `dialog` · `select` · `combobox` · `data-grid` · `calendar` ·
`date-picker` · `toast` · `tooltip` · `command` · `form` · `tree`

Adding one is deliberately mechanical:

```bash
npx knotui new tabs     # scaffolds the package, already passing conformance
```

The scaffold arrives with the layering, the dimensions plumbing, the dev
diagnostics and a wired-up conformance suite. What is left is the WAI-ARIA
pattern itself.

`@knotui/testing` asserts the invariants that make fifty components feel like
one library — block naming, all four escape hatches on every slot, dimensions
reaching CSS, `aria-disabled` instead of `disabled`, accessible names, and
**zero hard-coded colours in component CSS**. A component that drifts fails CI
rather than shipping.

The contract is written down in [ARCHITECTURE.md](./ARCHITECTURE.md);
[AGENTS.md](./AGENTS.md) is the condensed version for language models.

## License

MIT
