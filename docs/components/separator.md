# Separator: spec

Status: **experimental**. Pattern: [`separator` role](https://www.w3.org/TR/wai-aria-1.2/#separator).

## Usage
```tsx
import { defineSeparator } from '@pinfold/react/separator';

export const Divider = defineSeparator({ spacing: 'md' });
export const Or = defineSeparator({ label: 'or', spacing: 'lg' });
export const ToolbarRule = defineSeparator({ orientation: 'vertical', spacing: 'sm' });
export const Hairline = defineSeparator({ contrast: 'subtle' });
export const Section = defineSeparator({ contrast: 'strong', thickness: 'medium', spacing: 'lg' });
export const Fade = defineSeparator({ variant: 'gradient', label: 'or' });

<Divider />
<Or />
<Or orientation="vertical" />     // between two columns, e.g. social sign-in | email form
```
`useSeparator(config)` and `<Separator {...config} />` take the same config. Precedence: use-site
props, the preset, `defaults.separator`, the library default. A separator follows no provider size
or tone: its colour and thickness are the theme's border tokens, so style packs restyle it.

## Config
| Key | Type | Default |
|---|---|---|
| `label` | node, e.g. "or" or an icon with text; horizontal and vertical | none |
| `orientation` | `'horizontal' \| 'vertical'` | `'horizontal'` |
| `variant` | `'solid' \| 'dashed' \| 'dotted' \| 'gradient'` (fades out at the ends and away from a label) | `'solid'` |
| `contrast` | `'subtle' \| 'normal' \| 'strong'`: how much the line and its label stand out | `'normal'` |
| `thickness` | `'thin' \| 'medium' \| 'thick'`: the theme border width, twice it, four times it | `'thin'` |
| `labelPosition` | `'start' \| 'center' \| 'end'` (top, middle, bottom when vertical) | `'center'` |
| `spacing` | `'none' \| 'sm' \| 'md' \| 'lg'`: space on both sides | `'none'` |
| `decorative` | `boolean` | `true` |
| `dimensions` | `thickness, spacing, length`; `thickness` wins over the preset | theme border width, full length |
| `unstyled`, `className`, `style`, `classNames` / `styles` / `slotProps` / `render` (slots `root line label`) | | |

Contrast moves the line and the label together: `subtle` is a half-strength border with the subtle
text colour (dense lists, menus), `normal` the theme border with muted text, `strong` a line between
the strong border and the text colour, with the label in the text colour (between major sections).

Inactive (`inactiveSeparatorOptions`): `labelPosition` without a `label`; `decorative` with a label
(a labelled separator is read as its text); `thickness` when `dimensions.thickness` is set.

## ARIA
- Decorative by default (`role="none"`): screen readers skip it.
- `decorative: false` gives `role="separator"`, with `aria-orientation="vertical"` when vertical.
- A label is ordinary text; the lines around it are `aria-hidden`.
- Forced colours draw the line in the system text colour, whatever the contrast or variant.
- Right to left: a `gradient` line fades the other way, so it still fades away from the label.

## Compared with shadcn/ui, HeroUI and MUI
| shadcn/ui | HeroUI | MUI Divider | Pinfold |
|---|---|---|---|
| `orientation`, `decorative` | `orientation` | `orientation`, `flexItem` | `orientation`, `decorative` (a vertical one stretches in flex rows) |
| | | children (text) | `label`, `labelPosition` |
| | | `variant`: fullWidth, inset, middle | `spacing`, `dimensions.length` |
| className for dashes | | `sx` | `variant`: solid, dashed, dotted, gradient |
| | | | `contrast`, `thickness`; a label on a vertical separator |

## Deliberately excluded
- `inset` variants (use `dimensions.length` or a margin).
