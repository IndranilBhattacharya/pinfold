# Progress: spec

Status: **experimental**. Roles: [progressbar](https://www.w3.org/TR/wai-aria-1.2/#progressbar), [meter](https://www.w3.org/TR/wai-aria-1.2/#meter).

## Usage
```tsx
import { defineProgress } from '@pinfold/react/progress';

export const Upload = defineProgress();
export const Disk = defineProgress({ kind: 'meter', tone: 'warning', formatValue: (v, { max }) => `${v} of ${max} GB` });
export const Busy = defineProgress({ shape: 'circle', hideLabel: true });

<Upload label="Uploading report.pdf" value={progress} />
<Disk label="Storage" value={42} max={64} />
<Busy label="Loading results" />        // no value: indeterminate
```

More varieties from the same config:

```tsx
export const Steps = defineProgress({ variant: 'segmented', segments: 4, valuePosition: 'end' });
export const Gauge = defineProgress({ kind: 'meter', shape: 'semicircle', tones: [{ at: 70, tone: 'warning' }, { at: 90, tone: 'danger' }] });
export const Player = defineProgress({ showValue: false, size: 'sm' });
export const Deploy = defineProgress({ variant: 'striped', valuePosition: 'inside', size: 'lg' });

<Steps label="Setup" value={2} max={4} formatValue={(v, { max }) => `Step ${v} of ${max}`} />
<Gauge label="CPU" value={cpu} />
<Player label="Playback" value={played} buffer={loaded} onComplete={playNext} />
<Upload
  label={(s) => (s.complete ? 'Uploaded' : 'Uploading report.pdf')}
  value={progress}
  description="2.1 MB"
  valueLabel={(s) => `${s.value} of ${s.max} MB`}
  endContent={<CancelButton />}
/>
```
`useProgress(config)` and `<Progress {...config} />` take the same config. Precedence: use-site props,
the preset, `defaults.progress`, the provider (size, tone), the library default.

## Config
| Key | Type | Default |
|---|---|---|
| `value` | `number`; unset = indeterminate (a meter reads it as `min`) | none |
| `min`, `max` | `number` | `0`, `100` |
| `buffer` | `number`, a secondary value drawn lighter behind the indicator (loaded vs played) | none |
| `label` | node or `(state) => node`, the accessible name | none |
| `description` | node or `(state) => node`, a line under it, linked with `aria-describedby` | none |
| `startContent`, `endContent` | node or `(state) => node`, before and after the bar or ring | none |
| `hideLabel` | `boolean`, label for screen readers only | `false` |
| `showValue` | `boolean`, the value text | `true` |
| `valuePosition` | `'auto' \| 'top' \| 'bottom' \| 'end' \| 'inside'`; `auto` is above a bar, inside a ring or gauge | `'auto'` |
| `valueLabel` | node or `(state) => node`: the visible value; screen readers still hear `formatValue` | the value text |
| `formatValue` | `(value, { min, max, percent }) => string`, shown and read | whole percent |
| `kind` | `'progress' \| 'meter'` | `'progress'` |
| `shape` | `'bar' \| 'circle' \| 'semicircle'` (a gauge) | `'bar'` |
| `variant` | `'solid' \| 'striped' \| 'segmented'` | `'solid'` |
| `segments` | `number`, steps of a segmented progress (2 to 48) | `5` |
| `tones` | `{ at, tone }[]`: from `at` (value units) up, that tone; below every step, `tone` | none |
| `onComplete` | `() => void`, once each time the value reaches `max` from below | none |
| `radius` | `'none' \| 'sm' \| 'md' \| 'lg' \| 'full'` or a length; a preset rescales every corner inside, a length sets the frame | the theme radius |
| `size`, `tone` | as everywhere | provider, then `'md'`, `'primary'` |
| `dimensions` | `thickness` (bar), `size` (ring), `width` (bar) | from the size |
| `unstyled`, `className`, `style`, `classNames` / `styles` / `slotProps` / `render` (slots `root label value track indicator buffer segment description start end`) | | |

The state handed to every function and `render` override: `kind, shape, variant, size, tone` (after
`tones`), `percent` (0–100 or `null`), `value, min, max, bufferPercent, text` (the value text),
`indeterminate, complete, valuePosition` (resolved). `render.segment` and `render.indicator` on a
segmented progress also get `item: { index, fill }`.

### Varieties
- **Bar** (`solid`): a soft gradient fill on a tinted track. `striped`: diagonal bands that travel
  along the fill (a full-width moving band while indeterminate). `segmented`: equal steps with a gap,
  each filled in turn; a password score or "step 2 of 4" is `max: segments` and a whole value.
- **Ring** (`circle`): starts at 12 o'clock with rounded caps; `segmented` cuts it into arcs.
- **Gauge** (`semicircle`): a half ring drawn left to right, the value under its centre and the label
  below.
- **Indeterminate** (no `value`), in every shape: the bar sweeps, stripes travel, segments light up in
  turn, the ring turns, the gauge sweeps back and forth.
- **Value placement**: `top` (beside the label), `bottom` (beside the description), `end` (after the
  bar, or in the caption next to a ring), `inside` (on the fill, which grows to hold it; just past a
  short fill; the centre of a ring or gauge). A segmented bar has no single fill, so `inside` moves
  to its end.

Inactive (`inactiveProgressOptions`): `showValue`, `formatValue` and `valuePosition` while
indeterminate (and `valuePosition` with `showValue: false`); `radius` on a ring or gauge; `striped`
on a ring or gauge; `segments` unless segmented; `buffer` on a meter, while indeterminate or when
segmented; `onComplete` on a meter.

## Accessibility
- `aria-valuemin/max/now` and `aria-valuetext` (the formatted text); the visible value is
  `aria-hidden` so it is not read twice.
- Indeterminate has no `aria-valuenow`: read as busy, not as 0%.
- Named through `aria-labelledby`; missing label warns in development.
- Not a live region. The motion (sweeps, stripes, transitions) stops under reduced motion and with
  `disableAnimation`; the bar sweeps and the stripes travel the other way in RTL.
- `description` is linked with `aria-describedby`. A custom `valueLabel` is `aria-hidden` like the
  default value text: `aria-valuetext` (from `formatValue`) is what is read.
- Forced colours: tracks get an outline, fills and arcs use `Highlight`.
- The default text ("42%") is not locale-formatted, so server and client agree; pass
  `formatValue` for a localised one.

## Compared with shadcn/ui, HeroUI and MUI
| shadcn/ui | HeroUI | MUI | Pinfold |
|---|---|---|---|
| `Progress value` | `Progress`, `CircularProgress` | `LinearProgress`, `CircularProgress` | one config, `shape` |
| | `isIndeterminate` | `variant="indeterminate"` | no `value` |
| | `showValueLabel`, `formatOptions`, `valueLabel` | | `showValue`, `formatValue`, `valueLabel` (node or function), `valuePosition` |
| | `isStriped` | `variant="buffer"` | `variant`: striped, segmented; `buffer`; `shape: 'semicircle'` |
| | | | `tones` by threshold, `onComplete`, `description`, `startContent` / `endContent` |
| | `Meter` | | `kind: 'meter'` |

## Deliberately excluded
- A live region: a progress that announced every change would drown the page; announce completion
  yourself from `onComplete` if it matters.
