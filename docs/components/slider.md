# Slider: spec

Status: **experimental**. Pattern: [APG slider](https://www.w3.org/WAI/ARIA/apg/patterns/slider/) (multi-thumb).

## Usage
```tsx
import { defineSlider } from '@pinfold/react/slider';

export const Volume = defineSlider({ showValue: 'tooltip' });
export const Price = defineSlider({ min: 0, max: 500, step: 10, minGap: 20, formatValue: (v) => '$' + v });
export const Plan = defineSlider({ variant: 'bar', snapToMarks: true });

<Volume label="Volume" defaultValue={[60]} onChangeEnd={save} />
<Price label="Price" name="price" defaultValue={[50, 300]} marks={[{ value: 0, label: '$0' }, { value: 500, label: '$500' }]} />
<Plan label="Seats" marks={[{ value: 5, label: '5' }, { value: 20, label: '20' }, { value: 100, label: '100' }]} />
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
| `snapToMarks` | thumbs stop only on marks: drags land on the nearest, arrows go mark to mark | `false` |
| `showSteps` | a dot at every step (up to 40) | `false` |
| `variant` | `'line'` (slim track, round knob) \| `'bar'` (thick track, handle inside the fill) \| `'minimal'` (hairline, thumb shown while used) | `'line'` |
| `startContent`, `endContent` | decorative nodes either side of the track (speaker icons) | none |
| `showValue` | `'label' \| 'tooltip' \| 'never'` | `'label'` |
| `formatValue` | `(value) => string`, shown and read | the number |
| `thumbLabels` | range: thumb names after the label | `['Minimum', 'Maximum']` |
| `size`, `tone` | | `'md'`, `'primary'` (provider) |
| `orientation` | `horizontal`, or `vertical` with the minimum at the bottom | `'horizontal'` |
| `dimensions` | `thickness, thumbSize, length` (vertical track, 12rem) | from the size |
| `unstyled`, `className`, `style`, `classNames` / `styles` / `slotProps` / `render` (slots `root label value control track range steps input thumb marks mark startContent endContent description error`) | | |

Inactive (`inactiveSliderOptions`): `minGap` with one thumb; `formatValue` with `showValue: 'never'`;
`snapToMarks` without marks; `step` and `showSteps` while snapping; `showSteps` over 40 steps.

## Accessibility
- Each thumb is a native `<input type="range">`: arrows, Page Up/Down, Home/End, touch and forms are
  the browser's. The visible track, range, marks and thumbs are drawn under the inputs, from the
  same position formula as the native thumb, so they line up.
- A range is a `group` named by the label; its thumbs read "Price, Minimum" and "Price, Maximum".
- `formatValue` is `aria-valuetext`. A form reset returns to `defaultValue`.
- Snapping to marks, the input takes any value (`step="any"`) and the arrow, Page and Home/End
  keys move to the next mark; arrows follow the reading direction.

## Deliberately excluded
- A native vertical range (`writing-mode` on form controls) is above the browser floor: a vertical
  slider turns the whole control a quarter instead, so the native inputs keep their keys and hit
  testing, and `aria-orientation` says vertical.
