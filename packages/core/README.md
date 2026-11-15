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

Each role takes a hue name, a hue angle, or your own colour in any CSS syntax:

```js
const brand = createTheme({ primary: '#4f46e5', success: 'rgb(22 163 74)', warning: 'oklch(0.85 0.17 90)' });
brand.anchors.primary; // { step: 600, color: '#4f46e5' }: your colour sits on its nearest step
```

- The ramp keeps Pinfold's lightness curve and takes the hue and colourfulness from your colour; your colour
  itself is placed on the step nearest its lightness.
- Text on solid fills (buttons, badges, selected tabs) is white or near black, whichever reads better. A fill
  where even the better one is under 5:1 moves darker or lighter until it reaches 5:1, so a yellow or neon
  brand keeps readable buttons in both modes.
- `success`, `warning`, `danger` and `info` reach every component's tones once you set them; unset, they
  keep the tuned defaults.
- A grey brand keeps the tuned slate neutrals.

MIT © Indranil Bhattacharya
