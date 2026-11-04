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
| `items` | `{ value, label, description?, disabled? }[]`, a group | none |
| `value`, `defaultValue` | group: `string[]` | uncontrolled |
| `orientation` | group: `'vertical' \| 'horizontal'` | `'vertical'` |
| `variant` | group: `'plain' \| 'card'` | `'plain'` |
| `size`, `tone` | as everywhere | provider, then `'md'`, `'primary'` |
| `dimensions` | `size, gap` | from the size |
| `unstyled`, `className`, `style`, `classNames` / `styles` / `slotProps` / `render` (slots `root label items item input box itemLabel itemDescription description error`) | | |

Controller: `focus()`. Inactive (`inactiveCheckboxOptions`): `checked`, `defaultChecked`,
`indeterminate`, `formValue` in a group; `orientation`, `variant`, `value`, `defaultValue` outside one.

## Accessibility
- A native input, transparent over the drawn box: focus, Space, forms and assistive tech are the
  browser's. The whole row is the click target (at least 24px tall, WCAG 2.5.8).
- Named by the label alone; a row's description is linked with `aria-describedby`, so it is not
  repeated as part of the name.
- A group is a `<fieldset>` named by a `<legend>`. `required` on a group means at least one.

## Deliberately excluded
- A "select all" row: use `indeterminate` and your own state; what "all" means is the app's.
