# Switch: spec

Status: **experimental**. Pattern: [APG switch](https://www.w3.org/WAI/ARIA/apg/patterns/switch/). A native checkbox with `role="switch"`.

## Usage
```tsx
import { defineSwitch } from '@pinfold/react/switch';

export const Setting = defineSwitch({ labelPosition: 'start' });

<Setting label="Email alerts" description="At most one a day" defaultChecked onChange={save} />
```
`useSwitch(config)` and `<Switch {...config} />` take the same config. Precedence: use-site props, the
preset, `defaults.switch`, the provider (size, tone), the library default.

Use a switch for a setting that applies at once; use a [checkbox](checkbox.md) for a choice that
applies when a form is submitted.

## Config
| Key | Type | Default |
|---|---|---|
| `label`, `hideLabel`, `description`, `error`, `invalid`, `required`, `disabled`, `nativeErrors`, `name`, `id` | as [input](input.md) | |
| `checked`, `defaultChecked` | `boolean` | uncontrolled, `false` |
| `formValue` | `string` | `'on'` |
| `onChange` | `(checked, event) => void` | none |
| `labelPosition` | `'end' \| 'start'` | `'end'` |
| `variant` | `'solid'`: filled track, white thumb · `'slim'`: thin rail, larger thumb · `'icon'`: check or cross in the thumb · `'outline'`: hollow track, the thumb takes the colour and the track glows | `'solid'` |
| `animation` | `'spring'`: the thumb stretches while pressed and lands with a little overshoot · `'slide'`: a plain glide · `'none'` | `'spring'` |
| `radius` | `'none' \| 'sm' \| 'md' \| 'lg' \| 'full'` or a length; a preset rescales every corner inside, a length sets the frame | the theme radius |
| `size`, `tone` | as everywhere | provider, then `'md'`, `'primary'` |
| `dimensions` | `width, height` | from the size |
| `unstyled`, `className`, `style`, `classNames` / `styles` / `slotProps` / `render` (slots `root item input box thumb itemLabel description error`) | | |

Controller: `focus()`.

## Accessibility
- Read as a switch, on or off. Space toggles; Enter submits the form, as with any checkbox.
- The thumb moves and the track fills, so state never rests on colour alone. It flips in RTL.
- The whole row is the click target.
