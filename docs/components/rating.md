# Rating: spec

Status: **experimental**. Pattern: a [radio group](https://www.w3.org/WAI/ARIA/apg/patterns/radio/) of native radios.

## Usage
```tsx
import { defineRating } from '@pinfold/react/rating';

export const Stars = defineRating({ allowHalf: true });

<Stars label="Your rating" value={stars} onChange={setStars} name="rating" />
<Stars label="Average rating" value={4.3} readOnly showValue />
```
Precedence: use-site props, the preset, `defaults.rating`, the provider, the library default.

## Config
| Key | Type | Default |
|---|---|---|
| `label`, `hideLabel` | names the rating | required, `false` |
| `value`, `defaultValue`, `onChange` | 0 is none | `0` |
| `max`, `allowHalf` | symbols; half steps | `5`, `false` |
| `readOnly`, `clearable`, `disabled` | one image read as "4.3 out of 5"; choosing again clears | `false`, `true`, `false` |
| `showValue`, `icon`, `getValueLabel`, `name` | the number; the symbol; "3 stars"; the form field | `false`, a star, English |
| `size`, `tone` | the tone is gold (warning) unless set, never the provider's | `'md'`, `'warning'` |
| `unstyled`, `className`, `style`, `classNames` / `styles` / `slotProps` / `render` | slots as in the meta | |

## Accessibility
- A `radiogroup` named by `label` of native radios named "3 stars": keys, forms and screen readers work as for any radio group.
- Read-only, one `img` named "<label>: 4.3 out of 5".
- Filled and empty symbols differ in shape and strength, never colour alone; the pointer previews the value.
