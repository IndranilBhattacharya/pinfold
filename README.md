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

## The Knot way

```jsx
import { Accordion } from '@knotui/accordion';

<Accordion
  items={[
    { title: 'Shipping', content: 'Ships in 2 days.' },
    { title: 'Returns', content: '30 days, no questions.' },
  ]}
  variant="separated"
/>
```

Same accessibility. Same visual result. The component *is* the config.

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

## Three levels of control

| Level | You write | You get |
| --- | --- | --- |
| **Config** | `<Accordion items={…} variant="separated" />` | Everything, styled, accessible |
| **Slots** | `classNames`, `slotProps`, `render` per slot | Your markup for one part, our behaviour |
| **Headless** | `useAccordion(config)` | State + prop getters, zero markup |

```jsx
// Level 2 — swap one slot, keep every ARIA attribute
<Accordion
  items={items}
  classNames={{ trigger: 'my-trigger' }}
  render={{ indicator: ({ state }) => <Spinner spinning={state.open} /> }}
/>

// Level 3 — bring your own elements
const api = useAccordion({ items, mode: 'multiple' });
<dl {...api.getRootProps()}>
  {api.items.map((item) => (
    <div key={item.id} {...api.getItemProps(item)}>
      <dt><button {...api.getTriggerProps(item)}>{item.config.title}</button></dt>
      <dd {...api.getPanelProps(item)} hidden={!item.open}>{item.config.content}</dd>
    </div>
  ))}
</dl>
```

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
