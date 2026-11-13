# Select: spec

Status: **experimental**. Pattern: [APG select-only combobox](https://www.w3.org/WAI/ARIA/apg/patterns/combobox/examples/combobox-select-only/).

## Usage
```tsx
import { defineSelect } from '@pinfold/react/select';

export const Field = defineSelect();

// One line
<Field label="Country" items={['India', 'Japan', 'Kenya']} />

// Rows with groups, descriptions, icons; controlled
<Field label="Plan" value={plan} onChange={setPlan} items={[
  { value: 'free', label: 'Free', group: 'Personal' },
  { value: 'pro', label: 'Pro', description: '$12 a month', group: 'Personal' },
  { value: 'team', label: 'Team', description: '$48 a month', group: 'Business' },
]} />

// Several values as chips, in a form
<Field label="Labels" name="labels" multiple clearable items={labels} defaultValue={['bug']} />

// People: avatars, an email under each name, a role at the end; checked before submit
<Field label="Owner" name="owner" required
  items={people.map((p) => ({ value: p.id, label: p.name, avatar: p.photo, description: p.email, endContent: p.role, group: p.team }))}
  validate={(id) => (id === me ? 'Pick someone else' : null)} />

// The value drawn your way
<Field label="Reviewers" multiple items={people} renderValue={(chosen) => `${chosen.length} reviewers`} />
```
Values are typed from `items`: `value`, `defaultValue` and `onChange` accept only those values, an
array with `multiple`. Precedence: use-site props, the preset, `defaults.select`, the provider
(size, tone), the library default.

## Config
| Key | Type | Default |
|---|---|---|
| field options | `label`, `hideLabel`, `description`, `error`, `invalid`, `required`, `disabled`, `nativeErrors`, `name`, `id` (as Input) | |
| validation | `validate`, `validateOn`, `messages`, `onValidate`, `onInvalid`, `status`, `error` as a function: as Input. `validate` gets the value (an array with `multiple`) | `validateOn: 'blur'` |
| `items` | strings, or `{ value, label?, textValue?, description?, icon?, avatar?, endContent?, tone?, group?, disabled? }`. `avatar` is an image URL or a node, drawn in a circle; `endContent` sits at the end of the row; `tone` colours the row's chip; extra fields reach `render` overrides as `item.data` | required |
| `multiple` | choose several; the list stays open | `false` |
| `value`, `defaultValue`, `onChange` | a value (array with `multiple`), `null` for none; `(value, event)` | none |
| `placeholder` | while nothing is chosen | `'Select…'` |
| `clearable`, `clearLabel` | a button that empties the field | `false`, `'Clear'` |
| `display`, `maxChips` | with `multiple`: `'chips' \| 'text'`; chips before "+n" | `'chips'`, `3` |
| `chipVariant` | with `multiple`: `'soft' \| 'solid' \| 'outline'` | `'soft'` |
| `renderValue` | `(selected, state) => node`: draw the chosen value in the field; `selected` holds each chosen row with its state and `remove` | none |
| `onRemove` | `(value, item)`: a chip's remove mark unchose a value | none |
| `onClear` | `()`: the clear button emptied the field | none |
| `emptyText` | the list with no rows | `'No options'` |
| `open`, `defaultOpen`, `onOpenChange` | the list | uncontrolled, `false` |
| `placement` | where the list opens; it flips | `'bottom-start'` |
| `variant` | `'outline' \| 'filled' \| 'underline'` | `'outline'` |
| `radius` | `'none' \| 'sm' \| 'md' \| 'lg' \| 'full'` or a length; a preset rescales every corner inside, a length sets the frame | the theme radius |
| `size`, `tone` | the tone colours the check and chosen rows | `'md'`, `'primary'` (provider) |
| `dimensions` | `width`, `maxHeight` | full width, `18rem` |
| `unstyled`, `className`, `style`, `classNames` / `styles` / `slotProps` / `render` | slots `root label control value placeholder chip chipRemove clear chevron popup group groupLabel option check avatar icon detail endContent description empty error statusIcon validating`; `render.option` and `render.chip` get `item` (`{ value, label, text, description, icon, avatar, endContent, tone, group, data, selected, active, disabled, index, remove? }`) | |

Controller: `value`, `isOpen`, `open()`, `close()`, `setValue(values)`, `clear()`, `focus()`, and
validation's `validate()`, `setError(message)`, `clearError()`.

Validation works as every field's: results show when the field is left after a choice (then live
while an error shows), on submit, or on `validate()`; a `warning` or `success` tones the frame and
the message without blocking the form. An error is also the hidden select's custom validity.

Inactive (`inactiveSelectOptions`): `display`, `maxChips`, `chipVariant`, `onRemove` without
`multiple`; `maxChips`, `chipVariant` with `display: 'text'` or `renderValue`; `onClear` without
`clearable`.

## Accessibility
- The field is `role="combobox"` with `aria-haspopup="listbox"`; focus stays on it and
  `aria-activedescendant` names the active row. It is named by its label and its value.
- The list is `role="listbox"` (`aria-multiselectable` with `multiple`); rows are `option`s with
  `aria-selected`; groups are `group`s named by their heading. Disabled rows are skipped by keys.
- A hidden native `<select>` holds the value: forms submit and reset it, browsers autofill it, and
  `required` validates natively, its message shown in the error slot. On submit, focus goes to the
  field, not the hidden select. A `validate` error is linked with `aria-describedby` and sets
  `aria-invalid`; a warning or success message is linked without it; `aria-busy` while an async
  `validate` runs.
- Keys: Enter / Space / arrows open; arrows, Home, End, PageUp, PageDown move; letters jump; Enter
  or Space chooses; Escape or Alt+ArrowUp closes; Tab chooses the active row and moves on.
- The list renders only in the browser (never in server HTML) and joins the top layer.
