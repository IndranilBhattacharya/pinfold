# Combobox: spec

Status: **experimental**. Pattern: [APG combobox with list autocomplete](https://www.w3.org/WAI/ARIA/apg/patterns/combobox/examples/combobox-autocomplete-list/).

## Usage
```tsx
import { defineCombobox } from '@pinfold/react/combobox';
import '@pinfold/css/select.css'; // the combobox wears the select's styles

export const Search = defineCombobox();

// Suggest from your rows: accents and case ignored, matches marked
<Search label="City" items={cities} onChange={setCity} />

// Search a server: your items are the results
const [query, setQuery] = useState('');
const { data = [], isFetching } = useRepos(query);
<Search label="Repository" filter="none" items={data} loading={isFetching} onInputChange={setQuery} />

// A tag input: several values, free text allowed
<Search label="Tags" multiple allowCustom items={suggestions} value={tags} onChange={setTags} />
```
Precedence: use-site props, the preset, `defaults.combobox`, the provider (size, tone), the library
default.

## Config
| Key | Type | Default |
|---|---|---|
| field options | as Input | |
| `items` | as Select: strings or `{ value, label?, textValue?, description?, icon?, group?, disabled? }` | required |
| `multiple` | chips before the text; Backspace in an empty field removes the last | `false` |
| `value`, `defaultValue`, `onChange` | a value (array with `multiple`), `null` for none | none |
| `inputValue`, `defaultInputValue`, `onInputChange` | what is typed; `(text)` on every keystroke | uncontrolled, `''` |
| `filter` | `'contains' \| 'startsWith'` (any word start) \| `'none'` (your items are the results) | `'contains'` |
| `allowCustom` | typed text becomes a value: an `Add "…"` row, Enter, or leaving the field | `false` |
| `loading` | a loading row while there are none; `aria-busy` | `false` |
| `highlight` | mark the typed text in rows | `true` |
| `openOnFocus` | open before anything is typed | `false` |
| `clearable`, `maxChips`, `placeholder` | | `false`, `3`, none |
| `labels` | `{ empty, loading, clear, create(text) }` | English |
| `open`, `defaultOpen`, `onOpenChange`, `placement`, `variant`, `size`, `tone`, `dimensions` | as Select | |
| `unstyled`, `className`, `style`, `classNames` / `styles` / `slotProps` / `render` | slots `root label control chip input clear chevron popup group groupLabel option check icon detail empty description error` | |

Leaving the field with text that matches no row puts the text back to the chosen value (or keeps
it with `allowCustom`); leaving it empty clears the value. Controller: `value`, `inputValue`,
`isOpen`, `open()`, `close()`, `setValue(values)`, `focus()`.

Inactive (`inactiveComboboxOptions`): `maxChips` without `multiple`.

## Accessibility
- The input is `role="combobox"` with `aria-autocomplete="list"`, `aria-expanded` and
  `aria-controls`; focus stays in it and `aria-activedescendant` names the active row.
- Typing opens the list with the first match active, so Enter takes it. Escape closes, then clears.
- The list is `role="listbox"`, `aria-busy` while loading; matches are `<mark>`.
- With `name`, hidden inputs submit the chosen values; one value uses the input's own `required`.
