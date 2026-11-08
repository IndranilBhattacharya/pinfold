# Stepper: spec

Status: **experimental**. Pattern: an ordered list with `aria-current="step"`.

## Usage
```tsx
import { defineStepper } from '@pinfold/react/stepper';

export const Checkout = defineStepper();

<Checkout value={step} onChange={setStep} items={[
  { label: 'Cart' },
  { label: 'Shipping', description: 'Address and speed' },
  { label: 'Payment' },
]} />
```
`value` is the current step from 0; `items.length` marks every step done. With `onChange`, steps
already done are buttons that go back to them; steps not reached never are. The controller has
`next()`, `previous()` and `setValue()` for the app's own buttons. Precedence: use-site props, the
preset, `defaults.stepper`, the provider (size, tone), the library default.

## Config
| Key | Type | Default |
|---|---|---|
| `items` | `{ label, description?, icon? }[]` | required |
| `label` | the list's name | `'Progress'` |
| `value`, `defaultValue`, `onChange` | from 0; `(step, event)` | none, `0` |
| `variant` | `'circle'` (numbers, a check when done) \| `'dot'` \| `'bar'` (a segment per step) | `'circle'` |
| `orientation` | `'horizontal' \| 'vertical'` | `'horizontal'` |
| `size`, `tone` | | `'md'`, `'primary'` (provider) |
| `unstyled`, `className`, `style`, `classNames` / `styles` / `slotProps` / `render` (slots `root step button indicator connector text label description`) | | |

Inactive (`inactiveStepperOptions`): `orientation` with `variant: 'bar'`.

## Accessibility
- An `<ol>` named by `label`, so the number of steps is read; the current step has
  `aria-current="step"`.
- Each step speaks its state ("done", "current", "not started") as hidden text. On screen, state is
  the mark too (a check, the number, a halo), never colour alone.
- The line between steps fills as they are done (a `background-size` transition) and mirrors in
  right-to-left text.
