# @knotui/core

Tokens, theme engine and the six primitives every Knot UI component is built from.
Zero dependencies, React ≥ 16.8.

```bash
npm install @knotui/core
```

```js
import '@knotui/core/styles.css';   // reset + tokens
```

## Exports

| | |
| --- | --- |
| `KnotProvider` / `useKnot` | global `theme`, `radius`, `dir`, `size`, `tone` defaults |
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
:root { --knot-primary-500: oklch(0.66 0.16 152); --knot-radius-scale: 1.5; }
```

Or generate a full OKLCH ramp: `npx knotui theme --preset emerald --radius lg`.

MIT
