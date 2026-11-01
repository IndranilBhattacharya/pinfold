# @pinfold/react

Hooks-first, config-driven, accessible React components. One subpath per component, so
an unused component adds nothing to your bundle. React 18+, TypeScript or JavaScript.

```bash
npm install @pinfold/react @pinfold/css
```

```js
// app entry, once
import '@pinfold/css/core.css';
import '@pinfold/css/accordion.css';
```

```jsx
import { useAccordion } from '@pinfold/react/accordion';

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

In a Server Component, use the non-hook twin from the same import path:

```jsx
import { defineAccordion } from '@pinfold/react/accordion';

export default async function Page() {
  const Faq = defineAccordion({ items: await getFaq(), fields: { id: 'slug', title: 'question', content: 'answer' } });
  return <Faq />;
}
```

Global defaults: `defineConfig({ theme, radius, stylePack, defaults: { accordion: {...} } })`,
passed once to `<PinfoldProvider config={config}>`.

| Import | What |
| --- | --- |
| `@pinfold/react` | `PinfoldProvider`, `defineConfig`, `usePinfold`, and helpers for building your own components |
| `@pinfold/react/accordion` | `useAccordion`, `defineAccordion`, `Accordion` and the types |
| `@pinfold/react/accordion/lazy` | a code-split `Accordion` |

Also in the package, generated from the components' metadata: `llms.txt` and `llms-full.txt`
(model-readable docs), `schema/<name>.json` (JSON Schema of each config) and `registry/` (the
shadcn registry).

Full spec: [docs/components/accordion.md](../../docs/components/accordion.md).

MIT © Indranil Bhattacharya
