# Color picker: spec

Status: **experimental**. Pattern: [APG slider](https://www.w3.org/WAI/ARIA/apg/patterns/slider/) (the area and the sliders).

## Usage
```tsx
import { defineColorPicker } from '@pinfold/react/colorpicker';

export const BrandColor = defineColorPicker({ format: 'oklch', alpha: true });

<BrandColor label="Brand colour" value={color} onChange={setColor} swatches={['#4f46e5', '#0ea5e9', '#16a34a']} />

// Presets in named rows, a description, and a check
<BrandColor label="Accent" description="Used for buttons and links."
  swatches={[
    { label: 'Brand', colors: [{ value: '#4f46e5', label: 'Indigo' }, '#0ea5e9'] },
    { label: 'Neutrals', colors: ['#0f172a', '#64748b', '#e2e8f0'] },
  ]}
  validate={(c) => (contrast(c, '#fff') < 3 ? { status: 'warning', message: 'Low contrast on white' } : null)} />
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
| `swatches` | colours one press away: colours, named colours `{ value, label }`, or named rows of them (presets) `{ label, colors }`, mixed freely; loose colours next to each other form one row | none |
| `description` | help text under the picker, linked with `aria-describedby` | none |
| validation | `validate`, `validateOn`, `onValidate`, `status`, `error` (a node, or a function of `{ message, validating, status }`), `invalid`: as Input. `validate` gets the value in `format`; results show when the picker is left after a change (then live while an error shows) or on `validate()` | `validateOn: 'blur'`, `invalid: false` |
| `showInput`, `eyeDropper` | the text field; the screen eyedropper where the browser has it | `true`, `true` |
| `name`, `disabled` | a hidden input for forms; read only | none, `false` |
| `labels` | `{ area, hue, alpha, input, eyeDropper, swatches }` | English |
| `radius` | `'none' \| 'sm' \| 'md' \| 'lg' \| 'full'` or a length; a preset rescales every corner inside, a length sets the frame | the theme radius |
| `size` | `sm`, `md`, `lg` | `'md'` |
| `unstyled`, `className`, `style`, `classNames` / `styles` / `slotProps` / `render` | slots `root area thumb controls hue alpha preview eyedropper field input swatches swatchGroup swatchLabel swatch description error statusIcon validating`; `render.swatch` gets `item` (`{ value, label, selected, group, index }`) | |

Controller: `value`, `setValue(anyCssColour)`, `validate()`, `setError(message)`, `clearError()`.

Working space is sRGB (what hex holds and a screen shows); an `oklch()` input outside sRGB is
clipped. The hue is kept when a colour turns grey or black, so the thumbs never jump.

## Accessibility
- A group named by `label`. The area is a `slider` (focusable thumb): Left/Right change saturation,
  Up/Down brightness, Shift or Page Up/Down ten steps, Home/End the ends; `aria-valuetext` reads
  "saturation 60%, brightness 80%". Hue and opacity are native range inputs.
- The text field takes the typed colour on Enter or on leaving; one that does not parse is marked
  `aria-invalid` and reverts. Escape drops the draft.
- Swatches are buttons named by their colour (or their `label`, the colour in the tooltip),
  `aria-pressed` when current; a named row is a `group` named by its heading. The eyedropper button
  appears only where `EyeDropper` exists (after hydration, so the server and client agree).
- The description and a validation message are linked to the group and the text field; an error
  sets `aria-invalid` and the text field's custom validity, so a plain form does not submit. A
  warning or success is linked without `aria-invalid`.

## Deliberately excluded
- A trigger button with a popover: put the picker in a Popover's `content`.
- Wide-gamut (P3) editing and CMYK.
