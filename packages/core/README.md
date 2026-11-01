# @pinfold/core

The framework-free layer of [Pinfold](../../README.md): each component's behaviour rules, the
helpers, keyboard rules, component metadata and the OKLCH palette engine that every Pinfold
adapter shares. No React,
no dependencies. A test fails the build if a framework import ever appears here.

Most apps never install this directly. `@pinfold/react` depends on it.

## Exports

| | |
| --- | --- |
| `cn`, `mergeProps`, `composeRefs` | class joining and prop merging (handlers chain, styles merge) |
| `variants` | `cva`-style class resolution |
| `nextIndexFromKey` | the WAI-ARIA roving-focus key map (orientation, RTL, loop) |
| `dimensionVars` | `dimensions` config → `--pinfold-<component>-*` custom properties |
| `resolveNode`, `dataAttr`, `ariaAttr` | slot value and attribute helpers |
| `warnOnce`, `__DEV__` | dev-only diagnostics, stripped in production |
| `setAccordionItem`, `openAllAccordion`, `accordionFocusTarget`, … | the accordion's rules as pure functions |

## Metadata

`@pinfold/core/meta`: `accordionMeta` (every option, default, slot, keyboard key and ARIA rule),
`validateConfig`, `toJsonSchema` and `metaToMarkdown`. Docs, the playground, the CLI, the MCP
server and dev validation are all generated from it. Apps never ship it.

## Palette

```js
import { createTheme, contrastRatio, toDTCG } from '@pinfold/core/palette';

const theme = createTheme({ primary: 'emerald', accent: 'amber', radius: 'lg' });
theme.vars;      // { '--pinfold-primary-500': '#009b60', … }
theme.css;       // the stylesheet `npx pinfold theme` writes
theme.contrast;  // WCAG report per role and step
toDTCG(theme);   // W3C design tokens
```

Seven roles × eleven OKLCH steps, gamut-mapped, with sRGB hex fallbacks.

MIT © Indranil Bhattacharya
