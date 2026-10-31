# @lumae/core

The framework-free layer of [Lumae](../../README.md): the
helpers, keyboard rules and OKLCH palette engine that every Lumae adapter shares. No React,
no dependencies. A test fails the build if a framework import ever appears here.

Most apps never install this directly. `@lumae/react` depends on it.

## Exports

| | |
| --- | --- |
| `cn`, `mergeProps`, `composeRefs` | class joining and prop merging (handlers chain, styles merge) |
| `variants` | `cva`-style class resolution |
| `nextIndexFromKey` | the WAI-ARIA roving-focus key map (orientation, RTL, loop) |
| `dimensionVars` | `dimensions` config → `--lumae-<component>-*` custom properties |
| `resolveNode`, `dataAttr`, `ariaAttr` | slot value and attribute helpers |
| `warnOnce`, `__DEV__` | dev-only diagnostics, stripped in production |

## Palette

```js
import { createTheme, contrastRatio } from '@lumae/core/palette';

const theme = createTheme({ primary: 'emerald', accent: 'amber', radius: 'lg' });
theme.vars;      // { '--lumae-primary-500': '#009b60', … }
theme.css;       // the stylesheet `npx lumae theme` writes
theme.contrast;  // WCAG report per role and step
```

Seven roles × eleven OKLCH steps, gamut-mapped, with sRGB hex fallbacks.

MIT © Indranil Bhattacharya
