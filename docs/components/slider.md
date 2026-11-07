# Slider: spec

Status: **experimental**. Pattern: [APG slider](https://www.w3.org/WAI/ARIA/apg/patterns/slider/) (multi-thumb).

## Usage
```tsx
import { defineSlider } from '@pinfold/react/slider';

export const Volume = defineSlider({ showValue: 'tooltip' });
export const Price = defineSlider({ min: 0, max: 500, step: 10, minGap: 20, formatValue: (v) => '$' + v });

<Volume label="Volume" defaultValue={[60]} onChangeEnd={save} />
<Price label="Price" name="price" defaultValue={[50, 300]} marks={[{ value: 0, label: '$0' }, { value: 500, label: '$500' }]} />
```
Values are always an array: one number, or two for a range. Precedence: use-site props, the
preset, `defaults.slider`, the provider (size, tone), the library default.

## Config
| Key | Type | Default |
|---|---|---|
| `label`, `hideLabel`, `description`, `error`, `invalid`, `disabled`, `name`, `id` | field options | |
| `value`, `defaultValue` | `number[]` | none, `[min]` |
| `onChange`, `onChangeEnd` | `(values, event)` while dragging; `(values)` on release | none |
| `min`, `max`, `step` | `number` | `0`, `100`, `1` |
| `minGap` | range: least distance between thumbs | `0` |
| `marks` | `{ value, label? }[]` | none |
| `showValue` | `'label' \| 'tooltip' \| 'never'` | `'label'` |
| `formatValue` | `(value) => string`, shown and read | the number |
| `thumbLabels` | range: thumb names after the label | `['Minimum', 'Maximum']` |
| `size`, `tone` | | `'md'`, `'primary'` (provider) |
| `dimensions` | `thickness, thumbSize` | from the size |
| `unstyled`, `className`, `style`, `classNames` / `styles` / `slotProps` / `render` (slots `root label value control track range input thumb marks mark description error`) | | |

Inactive (`inactiveSliderOptions`): `minGap` with one thumb; `formatValue` with `showValue: 'never'`.

## Accessibility
- Each thumb is a native `<input type="range">`: arrows, Page Up/Down, Home/End, touch and forms are
  the browser's. The visible track, range, marks and thumbs are drawn under the inputs, from the
  same position formula as the native thumb, so they line up.
- A range is a `group` named by the label; its thumbs read "Price, Minimum" and "Price, Maximum".
- `formatValue` is `aria-valuetext`. A form reset returns to `defaultValue`.

## Deliberately excluded
- Vertical sliders: a vertical native range needs `writing-mode` on form controls, above the
  browser floor (**Planned**).
