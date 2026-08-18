# @knotui/accordion

A complete WAI-ARIA accordion from one config object — or one hook.

```bash
npx knotui add accordion      # or: npm install @knotui/core @knotui/accordion
```

```jsx
import '@knotui/core/styles.css';
import '@knotui/accordion/styles.css';
import { Accordion } from '@knotui/accordion';

<Accordion
  items={[
    { title: 'Shipping', content: 'Ships in 2 days.' },
    { title: 'Returns', content: '30 days, no questions.', badge: 'New' },
  ]}
  variant="separated"
  mode="multiple"
/>
```

Lazy: `import { Accordion } from '@knotui/accordion/lazy';`

## Config

`items` is the only required key. Everything else is optional:

- **behaviour** — `mode`, `collapsible`, `value`/`defaultValue`/`onValueChange`,
  `onItemToggle`, `orientation`, `dir`, `loop`, `unmountClosed`, `id`
- **appearance** — `variant` (`solid` `outline` `separated` `filled` `ghost`),
  `size`, `tone`, `radius`, `indicator` (`chevron` `plus` `caret` `none` | node),
  `indicatorPosition`, `headingLevel`, `animate`, `dividers`
- **escape hatches** — `classNames`, `slotProps`, `render`, keyed by slot:
  `root item header trigger icon label title description badge indicator panel content`

Each item: `{ id?, title, content?, description?, icon?, badge?, disabled?, defaultOpen? }`

## Headless

```jsx
const api = useAccordion({ items, mode: 'multiple' });
// api.items · api.value · api.toggle(id) · api.openAll() · api.getTriggerProps(item)
```

## Accessibility

Buttons inside real headings, `aria-expanded`/`aria-controls`/`aria-labelledby`,
panels as labelled regions, Arrow/Home/End navigation, `aria-disabled` on
focusable rows, closed panels out of the a11y tree and tab order,
`prefers-reduced-motion` and `forced-colors` handled, RTL aware.

MIT
