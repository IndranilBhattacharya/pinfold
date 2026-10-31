# @lumae/react

Hooks-first, config-driven, accessible React components. One subpath per component, so
an unused component adds nothing to your bundle. React 18+, TypeScript or JavaScript.

```bash
npm install @lumae/react @lumae/css
```

```js
// app entry, once
import '@lumae/css/core.css';
import '@lumae/css/accordion.css';
```

```jsx
import { useAccordion } from '@lumae/react/accordion';

function Support() {
  const Faq = useAccordion({
    items: [
      { title: 'Shipping', content: 'Ships in 2 days.' },
      { title: 'Returns', content: '30 days, no questions.', badge: 'New' },
    ],
  });
  return <Faq />;
}
```

The value `useAccordion` returns is the component, its controller (`Faq.toggle(id)`,
`Faq.openAll()`) and its parts (`<Faq.Trigger id>`, `<Faq.Panel id>`).

| Import | What |
| --- | --- |
| `@lumae/react` | `LumaeProvider`, `useLumae`, and helpers for building your own components |
| `@lumae/react/accordion` | `useAccordion`, `Accordion` and the types |
| `@lumae/react/accordion/lazy` | a code-split `Accordion` |

Full spec: [docs/components/accordion.md](../../docs/components/accordion.md).

MIT © Indranil Bhattacharya
