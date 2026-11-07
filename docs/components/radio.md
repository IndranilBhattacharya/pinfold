# Radio group: spec

Status: **experimental**. Pattern: [APG radio group](https://www.w3.org/WAI/ARIA/apg/patterns/radio/). Native radios.

## Usage
```tsx
import { defineRadio } from '@pinfold/react/radio';

export const Plan = defineRadio({ variant: 'card', required: true });

<Plan
  label="Plan"
  name="plan"
  defaultValue="pro"
  items={[
    { value: 'free', label: 'Free', description: 'For trying it out' },
    { value: 'pro', label: 'Pro', description: 'For growing teams' },
  ]}
/>
```
`useRadio(config)` and `<Radio {...config} />` take the same config. Precedence: use-site props, the
preset, `defaults.radio`, the provider (size, tone), the library default.

## Config
| Key | Type | Default |
|---|---|---|
| `label`, `hideLabel`, `description`, `error`, `invalid`, `required`, `disabled`, `nativeErrors`, `id` | as [input](input.md) | |
| `name` | `string`; generated without one, so the rows form a group | generated |
| `items` | `{ value, label, description?, disabled? }[]` (required) | |
| `value`, `defaultValue` | `string` | uncontrolled |
| `onChange` | `(value, event) => void` | none |
| `orientation` | `'vertical' \| 'horizontal'` | `'vertical'` |
| `variant` | `'plain' \| 'card'` (the selected card takes a frame in the tone) | `'plain'` |
| `animation` | `'spring'`: the dot grows with a little overshoot · `'ripple'`: a ring also goes out from the one just picked · `'none'` | `'spring'` |
| `size`, `tone` | as everywhere | provider, then `'md'`, `'primary'` |
| `dimensions` | `size, gap` | from the size |
| `unstyled`, `className`, `style`, `classNames` / `styles` / `slotProps` / `render` (slots `root label items item input box itemLabel itemDescription description error`) | | |

Controller: `focus()` (the selected row, or the first).

## Accessibility
- A `<fieldset role="radiogroup">` named by a `<legend>`, with `aria-invalid`, `aria-required` and
  the group's help text and error linked.
- Native radios: one Tab stop, arrow keys that move and select, and wrapping are the browser's, and
  follow the reading direction.
- A disabled group uses the fieldset's native `disabled`.
