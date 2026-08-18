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

## The Knot way — a hook, not a tag

```jsx
import { useAccordion } from '@knotui/accordion';

function Faq() {
  const faq = useAccordion({
    items: [
      { title: 'Shipping', content: 'Ships in 2 days.' },
      { title: 'Returns', content: '30 days, no questions.' },
    ],
    variant: 'separated',
  });

  return faq.render();
}
```

Same accessibility, same visual result, no markup. The hook is the API — the
`<Accordion />` tag exists only as a one-line wrapper for people who want one.

The same object is also the controller:

```jsx
faq.value            // ['0']
faq.toggle('0')      // open/close from anywhere
faq.openAll()        // ...in multiple mode
faq.isOpen('0')
```

## Install

```bash
npx knotui init            # palette + radius + knot.config.json + theme CSS
npx knotui add accordion   # one component at a time, like shadcn
npx knotui add all         # or the lot
```

`init` writes `src/knot-theme.css` with an OKLCH ramp generated from your brand
hue, and wires the CSS imports into your entry file. Re-tint at any time:

```bash
npx knotui theme --preset emerald --radius lg
npx knotui theme --hue 274 --gray 264 --intensity 1.15
```

## Levels of control

One hook, four levels. The config object never changes shape as you go deeper.

| Level | You add | You get |
| --- | --- | --- |
| **1 — render** | `faq.render()` | everything, styled, accessible |
| **2 — dimensions** | `dimensions: { paddingX: 24 }` | exact sizing, preset kept for the rest |
| **3 — slots** | `classNames`, `styles`, `slotProps`, `render` | your classes or your markup for one part |
| **4 — getters** | `getRootProps`, `getTriggerProps`, … | your elements, our behaviour and ARIA |

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

// 3 — your classes, your inline styles, or your element, per slot
useAccordion({
  items,
  classNames: { trigger: 'font-semibold uppercase', panel: 'prose' },
  styles: { title: { letterSpacing: '0.01em' } },
  slotProps: { root: { 'data-analytics': 'faq' } },
  render: { indicator: ({ props, state }) => <Chevron {...props} open={state.open} /> },
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
packages/cli         zero-dependency installer + theme engine  knotui
apps/docs            live documentation, runs off source       (private)
```

```bash
npm install       # once
npm run docs      # live docs at http://localhost:5180
npm test          # accordion behaviour + a11y assertions
npm run build     # all publishable packages
```

## Roadmap

`tabs` · `dialog` · `select` · `combobox` · `data-grid` · `calendar` ·
`date-picker` · `toast` · `tooltip` · `command` · `form` · `tree`

Adding one is a mechanical exercise — the contract is written down in
[ARCHITECTURE.md](./ARCHITECTURE.md), and [AGENTS.md](./AGENTS.md) is the
condensed version for language models.

## License

MIT
