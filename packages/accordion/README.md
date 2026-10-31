# @lumae/accordion

A complete WAI-ARIA accordion from one config object — or one hook.

```bash
npx lumae add accordion      # or: npm install @lumae/core @lumae/accordion
```

```jsx
import '@lumae/core/styles.css';
import '@lumae/accordion/styles.css';
import { useAccordion } from '@lumae/accordion';

function Support() {
  const Faq = useAccordion({
    items: [
      { title: 'Shipping', content: 'Ships in 2 days.' },
      { title: 'Returns', content: '30 days, no questions.', badge: 'New' },
    ],
    variant: 'separated',
    mode: 'multiple',
  });

  return <Faq className="mt-6" />;
}
```

`Faq` is also the controller — `Faq.value`, `Faq.toggle(id)`, `Faq.openAll()`,
`Faq.isOpen(id)`, `Faq.focusItem(i)` — and carries its parts:
`<Faq.Item id>`, `<Faq.Trigger id>`, `<Faq.Panel id>`, `<Faq.Indicator id>`.

Prefer a tag? `<Accordion {...sameConfig} />` is a one-line wrapper over the hook.
Lazy: `import { Accordion } from '@lumae/accordion/lazy';`

## Config

`items` is the only required key. Everything else is optional:

- **behaviour** — `mode`, `collapsible`, `value`/`defaultValue`/`onValueChange`,
  `onItemToggle`, `orientation`, `dir`, `loop`, `unmountClosed`, `id`
- **appearance** — `variant` (`solid` `outline` `separated` `filled` `ghost`),
  `size`, `tone`, `radius`, `indicator` (`chevron` `plus` `caret` `none` | node),
  `indicatorPosition`, `headingLevel`, `animate`, `dividers`
- **dimensions** — `dimensions: { width, minWidth, maxWidth, height, maxHeight, gap,
  paddingX, paddingY, panelPaddingX, panelPaddingY, panelMaxHeight, fontSize,
  titleSize, descriptionSize, iconSize, indicatorSize, borderWidth, radius, duration }`.
  Numbers are px, strings pass through (`'50%'`, `'18rem'`, `clamp()`). Each key
  overrides only itself — the `size` preset still covers the rest.
- **escape hatches** — `classNames`, `styles`, `slotProps`, `render`, keyed by slot:
  `root item header trigger icon label title description badge indicator panel content`

Each item: `{ id?, title, content?, description?, icon?, badge?, indicator?, disabled?,
defaultOpen?, classNames?, styles? }`. Every renderable field also accepts a
function of the row state: `title: (s) => s.open ? 'Hide' : 'Show'`.

Styling with Tailwind? Utilities override Lumae automatically (cascade layer), or
pass `unstyled: true` to drop our classes entirely and keep only the behaviour.

## Your own markup

```jsx
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

## Accessibility

Buttons inside real headings, `aria-expanded`/`aria-controls`/`aria-labelledby`,
panels as labelled regions, Arrow/Home/End navigation, `aria-disabled` on
focusable rows, closed panels out of the a11y tree and tab order,
`prefers-reduced-motion` and `forced-colors` handled, RTL aware.

MIT
