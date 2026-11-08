# Stepper: spec

Status: **experimental**. Pattern: an ordered list with `aria-current="step"`, and a labelled group for the current step's content.

## Usage
```tsx
import { defineStepper } from '@pinfold/react/stepper';

export const Checkout = defineStepper();

// A wizard: content, Back / Next / Finish, a check before leaving a step
<Checkout
  items={[
    { label: 'Cart', content: <Cart /> },
    { label: 'Shipping', content: <ShippingForm />, error: !addressValid },
    { label: 'Payment', optional: true, content: <Payment /> },
  ]}
  onNext={(step) => step !== 1 || checkAddress()}   // false (or a promise of it) stays
  onComplete={placeOrder}                            // a promise keeps Finish loading
  doneContent={<Receipt />}
/>

// Progress only, beside your own flow
<Checkout value={step} items={['Cart', 'Shipping', 'Payment']} variant="bar" />
```
Precedence: use-site props, the preset, `defaults.stepper`, the provider (size, tone), the library
default.

## Config
| Key | Type | Default |
|---|---|---|
| `items` | `{ label, description?, icon?, content?, optional?, error?, disabled? }[]` or strings | required |
| `value`, `defaultValue` | from 0; the length of `items` marks every step done | none, `0` |
| `onChange` | `(step, event)`: after Back, Next or a click; with it, steps are buttons | none |
| `onNext` | `(step) => boolean \| Promise<boolean>`: before Next leaves a step | none |
| `onComplete` | `() => void \| Promise`: Finish on the last step | none |
| `linear` | only done steps can be clicked; `false`: any step | `true` |
| `showActions` | Back and Next under the content | `true` |
| `doneContent` | the panel once every step is done | none |
| `labels` | `{ back, next, finish, optional, status: { complete, current, upcoming, error } }` | English |
| `variant` | `'circle' \| 'dot' \| 'bar'` | `'circle'` |
| `orientation` | `'horizontal' \| 'vertical'` (content opens under the current step) | `'horizontal'` |
| `labelPlacement` | `'bottom' \| 'end'` (names beside the marks) | `'bottom'` |
| `size`, `tone` | | `'md'`, `'primary'` (provider) |
| `label` | the list's name | `'Progress'` |
| `unstyled`, `className`, `style`, `classNames` / `styles` / `slotProps` / `render` (slots `root list step button indicator connector text label description panel actions`) | | |

Controller: `value`, `isFirst`, `isLast`, `isComplete`, `setValue`, `next` (skips `onNext`),
`previous`, `reset`.

Inactive (`inactiveStepperOptions`): `orientation` and `labelPlacement` with `bar`;
`labelPlacement` when vertical; `linear` without `onChange`; `showActions` and `doneContent` when
no step has `content`.

The panel is a card on the control tokens, so style packs reach it; it slides in after a change,
never on load.

## Accessibility
- An ordered list named by `label`; each step reads its state ("done", "current", "not started",
  "error") as hidden text, never colour alone; the error mark is an icon too.
- The content is a `group` labelled by its step's name. After Back or Next, focus moves to it, so
  reading starts at the new step.
- Back and Next are Pinfold buttons: a pending `onNext` or `onComplete` shows loading and sets
  `aria-busy`.
- With `linear`, steps not yet reached are never buttons, so the order of the task holds.
