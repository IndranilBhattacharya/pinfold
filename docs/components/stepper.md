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

// A guard on every move (Back, Next, Finish, a click on a step), sync or async
<Checkout items={steps} onChange={setStep} linear={false}
  beforeChange={(from, to) => to < from || validate(from)} />

// Your own marks: per status for every step, or per step (a node or a function of its status)
<Checkout connector="joined" icons={{ complete: <Check />, error: <Cross /> }} items={[
  { label: 'Plan', icon: <Compass /> },
  { label: 'Build', icon: (step) => (step.status === 'current' ? <Spinner /> : <Hammer />) },
  'Ship',
]} />
```
Precedence: use-site props, the preset, `defaults.stepper`, the provider (size, tone), the library
default.

## Config
| Key | Type | Default |
|---|---|---|
| `items` | `{ label, description?, icon?, content?, optional?, error?, disabled? }[]` or strings; `icon` is a node or `(step) => node` (`step.status`) | required |
| `value`, `defaultValue` | from 0; the length of `items` marks every step done | none, `0` |
| `onChange` | `(step, event)`: after Back, Next or a click; with it, steps are buttons | none |
| `onNext` | `(step) => boolean \| Promise<boolean>`: before Next leaves a step | none |
| `onComplete` | `() => void \| Promise`: Finish on the last step | none |
| `beforeChange` | `(from, to) => boolean \| Promise<boolean>`: before any move; `false` stays; a promise keeps the pressed button loading | none |
| `icons` | `{ complete, current, upcoming, error }`: your mark per status for every step; a step's `icon` wins | ours (check, number, error mark) |
| `connector` | `'gap'` (the line stops short of the marks) \| `'joined'` (it touches them) | `'gap'` |
| `responsive` | a horizontal stepper on a box under 30rem shows "Step 2 of 5" and the current name over its marks (`labels.progress`); the list is still read in full | `true` |
| `linear` | only done steps can be clicked; `false`: any step | `true` |
| `showActions` | Back and Next under the content | `true` |
| `doneContent` | the panel once every step is done | none |
| `labels` | `{ back, next, finish, optional, status: { complete, current, upcoming, error }, progress(step, total) }` | English |
| `variant` | `'circle' \| 'dot' \| 'bar' \| 'text'` (numbers and names in a row) | `'circle'` |
| `orientation` | `'horizontal' \| 'vertical'` (content opens under the current step) | `'horizontal'` |
| `labelPlacement` | `'bottom' \| 'end'` (names beside the marks) | `'bottom'` |
| `radius` | `'none' \| 'sm' \| 'md' \| 'lg' \| 'full'` or a length; a preset rescales every corner inside, a length sets the frame | the theme radius |
| `size`, `tone` | | `'md'`, `'primary'` (provider) |
| `label` | the list's name | `'Progress'` |
| `unstyled`, `className`, `style`, `classNames` / `styles` / `slotProps` / `render` (slots `root summary list step button indicator connector text label description panel actions`) | | |

Controller: `value`, `isFirst`, `isLast`, `isComplete`, `setValue` (skips `beforeChange`), `goTo`
(through `beforeChange`), `next` (skips `onNext`), `previous`, `reset`. `render` overrides of the
repeating parts and `icon` functions get `item`: the step plus `index` and `status`.

Inactive (`inactiveStepperOptions`): `orientation`, `labelPlacement`, `icons` and `connector` with
`bar`; `labelPlacement` and `responsive` when vertical; `labelPlacement` with `text`; `linear` without `onChange`; `showActions` and `doneContent` when
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
