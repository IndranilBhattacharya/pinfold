# @lumae/core

Tokens, theme engine and the six primitives every Lumae component is built from.
Zero dependencies, React ≥ 16.8.

```bash
npm install @lumae/core
```

```js
import '@lumae/core/styles.css';   // reset + tokens
```

## Exports

| | |
| --- | --- |
| `LumaeProvider` / `useLumae` | global `theme`, `radius`, `dir`, `size`, `tone` defaults |
| `useControllableState` | one hook for controlled + uncontrolled |
| `useEvent` | stable callback identity, fresh closure |
| `useId` | SSR-safe, works before React 18 |
| `mergeProps` / `cn` / `composeRefs` | prop merging with handler chaining |
| `variants` | `cva`-style class resolution in 20 lines |
| `nextIndexFromKey` | WAI-ARIA roving focus key map |
| `slotProps` / `renderSlot` | the per-slot escape hatches |
| `createLazyComponent` | dynamic import + Suspense in one call |

## Theming

Everything resolves through CSS custom properties. Override any of them:

```css
:root { --lumae-primary-500: oklch(0.66 0.16 152); --lumae-radius-scale: 1.5; }
```

Or generate a full OKLCH ramp: `npx lumae theme --preset emerald --radius lg`.

MIT
