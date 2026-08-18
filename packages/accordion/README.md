# @knotui/accordion

A complete WAI-ARIA accordion from one config object — or one hook.

```bash
npx knotui add accordion      # or: npm install @knotui/core @knotui/accordion
```

```jsx
import '@knotui/core/styles.css';
import '@knotui/accordion/styles.css';
import { useAccordion } from '@knotui/accordion';

function Faq() {
  const faq = useAccordion({
    items: [
      { title: 'Shipping', content: 'Ships in 2 days.' },
      { title: 'Returns', content: '30 days, no questions.', badge: 'New' },
    ],
    variant: 'separated',
    mode: 'multiple',
  });

  return faq.render();
}
```

`faq` is also the controller: `faq.value`, `faq.toggle(id)`, `faq.openAll()`,
`faq.isOpen(id)`, `faq.focusItem(i)`.

Prefer a tag? `<Accordion {...sameConfig} />` is a one-line wrapper over the hook.
Lazy: `import { Accordion } from '@knotui/accordion/lazy';`

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

Each item: `{ id?, title, content?, description?, icon?, badge?, disabled?, defaultOpen? }`

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
