# Checkbox: spec

Status: **experimental**. Pattern: [APG checkbox](https://www.w3.org/WAI/ARIA/apg/patterns/checkbox/). A native `<input type="checkbox">`.

## Usage
```tsx
import { defineCheckbox } from '@pinfold/react/checkbox';

export const Terms = defineCheckbox({ required: true });
export const Topics = defineCheckbox({ variant: 'card', orientation: 'horizontal' });

<Terms label="I accept the terms" name="terms" />
<Topics label="Topics" name="topics" items={[{ value: 'news', label: 'News' }, { value: 'tips', label: 'Tips' }]} onChange={setTopics} />
```
`useCheckbox(config)` and `<Checkbox {...config} />` take the same config. `items` makes it a group.
Precedence: use-site props, the preset, `defaults.checkbox`, the provider (size, tone), the library default.

## Config
| Key | Type | Default |
|---|---|---|
| `label`, `hideLabel`, `description`, `error`, `invalid`, `required`, `disabled`, `nativeErrors`, `name`, `id` | as [input](input.md) | |
| `checked`, `defaultChecked` | `boolean` | uncontrolled, `false` |
| `indeterminate` | `boolean`: read as "mixed" | `false` |
| `formValue` | `string` | `'on'` |
| `onChange` | one: `(checked, event)`; a group: `(values, event)` | none |
| `onFocus`, `onBlur`, `onKeyDown` | `(event) => void` on each box (`event.target` says which) | none |
| `icon` | the mark in the box: a node, or `({ checked, indeterminate, disabled }) => node`, in `currentColor` | a tick (a dash when indeterminate) |
| validation | `validate` (gets `checked`, or a group's values; the first box carries the custom validity), `validateOn` (`'blur'`), `messages`, `status`, `onValidate`, `onInvalid`; `error` may be a function of `{ message, validating, status }`. See [Input: Validation](input.md#validation) | |
| `items` | `{ value, label, description?, disabled?, startContent?, endContent? }[]`, a group; start content is decorative (a logo), end content sits at the end of the row (a price) | none |
| `value`, `defaultValue` | group: `string[]` | uncontrolled |
| `orientation` | group: `'vertical' \| 'horizontal'` | `'vertical'` |
| `variant` | group: `'plain' \| 'card'` (the checked card takes a frame in the tone) | `'plain'` |
| `animation` | `'draw'`: the box fills, then the tick is traced · `'pop'`: the mark springs in · `'none'` | `'draw'` |
| `radius` | `'none' \| 'sm' \| 'md' \| 'lg' \| 'full'` or a length; a preset rescales every corner inside, a length sets the frame | the theme radius |
| `size`, `tone` | as everywhere | provider, then `'md'`, `'primary'` |
| `dimensions` | `size, gap` | from the size |
| `unstyled`, `className`, `style`, `classNames` / `styles` / `slotProps` / `render` (slots `root label items item input box itemLabel itemDescription itemStartContent itemEndContent description error statusIcon validating`) | | |

Controller: `focus()`, `validate()`, `setError(message)`, `clearError()`. A row's `render` override receives `item`:
the row plus `index` and `checked`; each row carries `data-checked`.

`variant: 'card'` makes each choice of a group a selectable card: the whole card is the target, it
tints and takes a frame in the tone when checked, and shows focus around the card. A single checkbox's
description and messages line up with its label. Blur validation runs when focus leaves the group, not
between its boxes.

Inactive (`inactiveCheckboxOptions`): `checked`, `defaultChecked`,
`indeterminate`, `formValue` in a group; `orientation`, `variant`, `value`, `defaultValue` outside one.

## Accessibility
- A native input, transparent over the drawn box: focus, Space, forms and assistive tech are the
  browser's. The whole row is the click target (at least 24px tall, WCAG 2.5.8).
- Named by the label alone; a row's description is linked with `aria-describedby`, so it is not
  repeated as part of the name.
- A group is a `<fieldset>` named by a `<legend>`. `required` on a group means at least one.

## Deliberately excluded
- A "select all" row: use `indeterminate` and your own state; what "all" means is the app's.
