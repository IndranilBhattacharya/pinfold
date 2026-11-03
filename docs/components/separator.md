# Separator: spec

Status: **experimental**. Pattern: [`separator` role](https://www.w3.org/TR/wai-aria-1.2/#separator).

## Usage
```tsx
import { defineSeparator } from '@pinfold/react/separator';

export const Divider = defineSeparator({ spacing: 'md' });
export const Or = defineSeparator({ label: 'or', spacing: 'lg' });
export const ToolbarRule = defineSeparator({ orientation: 'vertical', spacing: 'sm' });

<Divider />
<Or />
```
`useSeparator(config)` and `<Separator {...config} />` take the same config. Precedence: use-site
props, the preset, `defaults.separator`, the library default. A separator follows no provider size
or tone: its colour and thickness are the theme's border tokens, so style packs restyle it.

## Config
| Key | Type | Default |
|---|---|---|
| `label` | node, e.g. "or" (horizontal only) | none |
| `orientation` | `'horizontal' \| 'vertical'` | `'horizontal'` |
| `variant` | `'solid' \| 'dashed' \| 'dotted'` | `'solid'` |
| `labelPosition` | `'start' \| 'center' \| 'end'` | `'center'` |
| `spacing` | `'none' \| 'sm' \| 'md' \| 'lg'`: space on both sides | `'none'` |
| `decorative` | `boolean` | `true` |
| `dimensions` | `thickness, spacing, length` | theme border width, full length |
| `unstyled`, `className`, `style`, `classNames` / `styles` / `slotProps` / `render` (slots `root line label`) | | |

Inactive: `labelPosition` without a `label`; `label` on a vertical separator; `decorative` with a
label (a labelled separator is read as its text).

## ARIA
- Decorative by default (`role="none"`): screen readers skip it.
- `decorative: false` gives `role="separator"`, with `aria-orientation="vertical"` when vertical.
- A label is ordinary text; the lines around it are `aria-hidden`.

## Compared with shadcn/ui, HeroUI and MUI
| shadcn/ui | HeroUI | MUI Divider | Pinfold |
|---|---|---|---|
| `orientation`, `decorative` | `orientation` | `orientation`, `flexItem` | `orientation`, `decorative` (a vertical one stretches in flex rows) |
| | | children (text) | `label`, `labelPosition` |
| | | `variant`: fullWidth, inset, middle | `spacing`, `dimensions.length` |
| className for dashes | | `sx` | `variant`: solid, dashed, dotted |

## Deliberately excluded
- `inset` variants (use `dimensions.length` or a margin).
