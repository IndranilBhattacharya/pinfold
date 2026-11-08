# Color picker: spec

Status: **experimental**. Pattern: [APG slider](https://www.w3.org/WAI/ARIA/apg/patterns/slider/) (the area and the sliders).

## Usage
```tsx
import { defineColorPicker } from '@pinfold/react/colorpicker';

export const BrandColor = defineColorPicker({ format: 'oklch', alpha: true });

<BrandColor label="Brand colour" value={color} onChange={setColor} swatches={['#4f46e5', '#0ea5e9', '#16a34a']} />
```
The value is any CSS colour in hex, `rgb()`, `hsl()` or `oklch()` (old and new syntax), and
comes back in `format`. `onChange(value, color)` also hands over `{ hex, rgb, hsl, oklch, alpha }`,
so one picker can feed a CSS variable and a design token at once. Precedence: use-site props, the
preset, `defaults.colorpicker`, the provider, the library default.

## Config
| Key | Type | Default |
|---|---|---|
| `label` | names the group | required |
| `value`, `defaultValue`, `onChange(value, color)` | any CSS colour | `'#6366f1'` |
| `format` | `hex`, `rgb`, `hsl`, `oklch` | `'hex'` |
| `alpha` | an opacity slider | `false` |
| `swatches` | colours one press away | none |
| `showInput`, `eyeDropper` | the text field; the screen eyedropper where the browser has it | `true`, `true` |
| `name`, `disabled` | a hidden input for forms; read only | none, `false` |
| `labels` | `{ area, hue, alpha, input, eyeDropper, swatches }` | English |
| `size` | `sm`, `md`, `lg` | `'md'` |
| `unstyled`, `className`, `style`, `classNames` / `styles` / `slotProps` / `render` | slots `root area thumb controls hue alpha preview eyedropper field input swatches swatch` | |

Controller: `value`, `setValue(anyCssColour)`.

Working space is sRGB (what hex holds and a screen shows); an `oklch()` input outside sRGB is
clipped. The hue is kept when a colour turns grey or black, so the thumbs never jump.

## Accessibility
- A group named by `label`. The area is a `slider` (focusable thumb): Left/Right change saturation,
  Up/Down brightness, Shift or Page Up/Down ten steps, Home/End the ends; `aria-valuetext` reads
  "saturation 60%, brightness 80%". Hue and opacity are native range inputs.
- The text field takes the typed colour on Enter or on leaving; one that does not parse is marked
  `aria-invalid` and reverts. Escape drops the draft.
- Swatches are buttons named by their colour, `aria-pressed` when current. The eyedropper button
  appears only where `EyeDropper` exists (after hydration, so the server and client agree).

## Deliberately excluded
- A trigger button with a popover: put the picker in a Popover's `content`.
- Wide-gamut (P3) editing and CMYK.
