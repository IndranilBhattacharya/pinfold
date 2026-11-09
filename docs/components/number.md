# Number field: spec

Status: **experimental**. Pattern: [APG spinbutton](https://www.w3.org/WAI/ARIA/apg/patterns/spinbutton/).

## Usage
```tsx
import { defineNumberField } from '@pinfold/react/number';

export const Quantity = defineNumberField({ min: 1, max: 99 });
export const Price = defineNumberField({ step: 0.5, min: 0, steppers: 'end', startContent: '$' });

<Quantity label="Quantity" name="qty" defaultValue={1} />
<Price label="Price" name="price" onChange={setPrice} />
```
Precedence: use-site props, the preset, `defaults.number`, the provider (size), the library default.

## Config
| Key | Type | Default |
|---|---|---|
| field options | `label`, `hideLabel`, `description`, `error`, `invalid`, `required`, `disabled`, `nativeErrors`, `name`, `id` | |
| `value`, `defaultValue` | `number` (`null` empty, controlled) | none |
| `onChange` | `(value, event?)`; no event from the buttons | none |
| `min`, `max`, `step` | `number` | none, none, `1` |
| `placeholder`, `readOnly` | | none, `false` |
| `steppers` | `'split' \| 'end' \| 'none'`: around the number, or both after it | `'split'` |
| `incrementLabel`, `decrementLabel` | | `'Increase'`, `'Decrease'` |
| `startContent`, `endContent` | a currency, a unit | none |
| `variant` | `'outline' \| 'filled'` | `'outline'` |
| `radius` | `'none' \| 'sm' \| 'md' \| 'lg' \| 'full'` or a length; a preset rescales every corner inside, a length sets the frame | the theme radius |
| `size` | | `'md'` (provider) |
| `dimensions` | `width, height` | `10rem`, from the size |
| `unstyled`, `className`, `style`, `classNames` / `styles` / `slotProps` / `render` (slots `root label control input decrement increment startContent endContent description error`) | | |

Inactive (`inactiveNumberOptions`): the button labels with `steppers: 'none'`.

## Accessibility
- A native `<input type="number">`: a `spinbutton` the browser reads, steps with the arrow keys and
  validates (`min`, `max`, `step`, `required`), with the browser's message in the error slot.
- Each button is the field's full height and at least 24px wide (WCAG 2.5.8 target size); there is
  no stacked up/down pair, which would halve the height.
- The − and + buttons are pointer shortcuts: named, `aria-controls` the input, out of the tab order
  (the arrow keys do the same), repeat while held. At a limit they are natively `disabled`: the one
  exception to the library's `aria-disabled` rule, as they are never in the tab order.
- Pressing a button keeps focus in the field.

## Deliberately excluded
- Locale number formatting while typing (thousands separators): a native number input cannot hold
  them. Show a formatted value next to it, or use Input (**Planned** with Intl formatting).
