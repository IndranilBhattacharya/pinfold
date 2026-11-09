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
`useProgress(config)` and `<Progress {...config} />` take the same config. Precedence: use-site props,
the preset, `defaults.progress`, the provider (size, tone), the library default.

## Config
| Key | Type | Default |
|---|---|---|
| `value` | `number`; unset = indeterminate (a meter reads it as `min`) | none |
| `min`, `max` | `number` | `0`, `100` |
| `label` | node, the accessible name | none |
| `hideLabel` | `boolean`, label for screen readers only | `false` |
| `showValue` | `boolean`, the value text beside the label or inside the ring | `true` |
| `formatValue` | `(value, { min, max, percent }) => string`, shown and read | whole percent |
| `kind` | `'progress' \| 'meter'` | `'progress'` |
| `shape` | `'bar' \| 'circle'` | `'bar'` |
| `radius` | `'none' \| 'sm' \| 'md' \| 'lg' \| 'full'` or a length; a preset rescales every corner inside, a length sets the frame | the theme radius |
| `size`, `tone` | as everywhere | provider, then `'md'`, `'primary'` |
| `dimensions` | `thickness` (bar), `size` (ring), `width` (bar) | from the size |
| `unstyled`, `className`, `style`, `classNames` / `styles` / `slotProps` / `render` (slots `root label value track indicator`) | | |

Inactive (`inactiveProgressOptions`): `showValue`, `formatValue` while indeterminate.

## Accessibility
- `aria-valuemin/max/now` and `aria-valuetext` (the formatted text); the visible value is
  `aria-hidden` so it is not read twice.
- Indeterminate has no `aria-valuenow`: read as busy, not as 0%.
- Named through `aria-labelledby`; missing label warns in development.
- Not a live region. The motion stops under reduced motion and with `disableAnimation`; the bar
  sweeps the other way in RTL.
- The default text ("42%") is not locale-formatted, so server and client agree; pass
  `formatValue` for a localised one.

## Compared with shadcn/ui, HeroUI and MUI
| shadcn/ui | HeroUI | MUI | Pinfold |
|---|---|---|---|
| `Progress value` | `Progress`, `CircularProgress` | `LinearProgress`, `CircularProgress` | one config, `shape` |
| | `isIndeterminate` | `variant="indeterminate"` | no `value` |
| | `showValueLabel`, `formatOptions` | | `showValue`, `formatValue` |
| | `Meter` | | `kind: 'meter'` |

## Deliberately excluded
- Buffer / striped bars: rare, and the stripes are motion for its own sake.
