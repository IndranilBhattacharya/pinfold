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
```
Values are typed from `items`: `value`, `defaultValue` and `onChange` accept only those values, an
array with `multiple`. Precedence: use-site props, the preset, `defaults.select`, the provider
(size, tone), the library default.

## Config
| Key | Type | Default |
|---|---|---|
| field options | `label`, `hideLabel`, `description`, `error`, `invalid`, `required`, `disabled`, `nativeErrors`, `name`, `id` (as Input) | |
| `items` | strings, or `{ value, label?, textValue?, description?, icon?, group?, disabled? }` | required |
| `multiple` | choose several; the list stays open | `false` |
| `value`, `defaultValue`, `onChange` | a value (array with `multiple`), `null` for none; `(value, event)` | none |
| `placeholder` | while nothing is chosen | `'Select…'` |
| `clearable`, `clearLabel` | a button that empties the field | `false`, `'Clear'` |
| `display`, `maxChips` | with `multiple`: `'chips' \| 'text'`; chips before "+n" | `'chips'`, `3` |
| `emptyText` | the list with no rows | `'No options'` |
| `open`, `defaultOpen`, `onOpenChange` | the list | uncontrolled, `false` |
| `placement` | where the list opens; it flips | `'bottom-start'` |
| `variant` | `'outline' \| 'filled' \| 'underline'` | `'outline'` |
| `size`, `tone` | the tone colours the check and chosen rows | `'md'`, `'primary'` (provider) |
| `dimensions` | `width`, `maxHeight` | full width, `18rem` |
| `unstyled`, `className`, `style`, `classNames` / `styles` / `slotProps` / `render` | slots `root label control value placeholder chip clear chevron popup group groupLabel option check icon detail description empty error` | |

Controller: `value`, `isOpen`, `open()`, `close()`, `setValue(values)`, `focus()`.

Inactive (`inactiveSelectOptions`): `display` and `maxChips` without `multiple`.

## Accessibility
- The field is `role="combobox"` with `aria-haspopup="listbox"`; focus stays on it and
  `aria-activedescendant` names the active row. It is named by its label and its value.
- The list is `role="listbox"` (`aria-multiselectable` with `multiple`); rows are `option`s with
  `aria-selected`; groups are `group`s named by their heading. Disabled rows are skipped by keys.
- A hidden native `<select>` holds the value: forms submit and reset it, browsers autofill it, and
  `required` validates natively, its message shown in the error slot.
- Keys: Enter / Space / arrows open; arrows, Home, End, PageUp, PageDown move; letters jump; Enter
  or Space chooses; Escape or Alt+ArrowUp closes; Tab chooses the active row and moves on.
- The list renders only in the browser (never in server HTML) and joins the top layer.
