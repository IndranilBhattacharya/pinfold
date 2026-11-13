# Rating: spec

Status: **experimental**. Pattern: a [radio group](https://www.w3.org/WAI/ARIA/apg/patterns/radio/) of native radios.

## Usage
```tsx
import { defineRating } from '@pinfold/react/rating';

export const Stars = defineRating({ allowHalf: true });

<Stars label="Your rating" value={stars} onChange={setStars} name="rating" />
<Stars label="Average rating" value={4.3} readOnly showValue />

// Words per value, an outline when empty, a preview event
<Stars label="Your rating" valueLabels={['Poor', 'Fair', 'Good', 'Great', 'Superb']} emptyIcon={<OutlineStar />} onHover={setPreview} />

// A face per value: icon and emptyIcon as functions of the symbol
const faces = ['😞', '🙁', '😐', '🙂', '😍'];
<Stars label="How was it?" icon={({ index }) => faces[index]} emptyIcon={({ index }) => <span className="grey">{faces[index]}</span>} />
```
Precedence: use-site props, the preset, `defaults.rating`, the provider, the library default.

## Config
| Key | Type | Default |
|---|---|---|
| `label`, `hideLabel` | names the rating | required, `false` |
| `value`, `defaultValue`, `onChange` | 0 is none | `0` |
| `onHover` | `(value)`: the pointer previews a value, whole or half; `null` when it leaves | none |
| `max`, `allowHalf` | symbols; half steps | `5`, `false` |
| `readOnly`, `clearable`, `disabled` | one image read as "4.3 out of 5"; choosing again clears | `false`, `true`, `false` |
| `showValue`, `getValueLabel`, `name` | the number; "3 stars"; the form field | `false`, English |
| `icon`, `emptyIcon` | the symbol, and the empty one when it differs (an outline): a node, or `({ index, value, fill, previewing, label }) => node` for a symbol per value or per state. A half is the full symbol clipped over the empty one | a star, `icon` faint |
| `valueLabels` | a word per whole value: shown after the symbols (the value under the pointer, else the chosen one; a half reads as the whole step it has reached: 3.5 is the third word), each symbol's tooltip, and part of the spoken name ("Good, 3 stars") | none |
| `size`, `tone` | the tone is gold (warning) unless set, never the provider's | `'md'`, `'warning'` |
| `unstyled`, `className`, `style`, `classNames` / `styles` / `slotProps` / `render` | slots `root label symbols symbol value hint`; `render.symbol` gets the symbol as `item` | |

Half steps: with `allowHalf` there are ten radios (0.5 to 5), and the pointer picks the half under
it (mirrored in right-to-left). While the pointer previews, the root has `data-previewing` and the
fill is a touch lighter.

Inactive (`inactiveRatingOptions`): `clearable`, `onChange`, `onHover` with `readOnly`.

## Accessibility
- A `radiogroup` named by `label` of native radios named "3 stars": keys, forms and screen readers work as for any radio group.
- Read-only, one `img` named "<label>: 4.3 out of 5".
- Filled and empty symbols differ in shape and strength, never colour alone; the pointer previews the value.
- The `valueLabels` word after the symbols is `aria-hidden`: each radio already says it.
