import type { ComponentMeta, PropMeta } from './meta';
import { FIELD_ARIA, fieldProps } from './field.meta';
import { listChoiceProps, listItemsProp } from './select.meta';

const SLOTS = ['root', 'label', 'control', 'chip', 'input', 'clear', 'chevron', 'popup', 'group', 'groupLabel', 'option', 'check', 'icon', 'detail', 'empty', 'description', 'error'] as const;
const perSlot = (description: string, type: PropMeta['type']): PropMeta => ({
  type: 'object',
  description,
  group: 'escape-hatch',
  keys: Object.fromEntries(SLOTS.map((s) => [s, { type, description: `The \`${s}\` slot.`, group: 'escape-hatch' }])),
});

export const comboboxMeta: ComponentMeta = {
  name: 'combobox',
  displayName: 'Combobox',
  description:
    'A text field that suggests as you type: filters your rows (accents and case ignored, matches marked), or shows results you fetch with a loading row. One value, several as chips, or free text that becomes a value (a tag input).',
  pattern: 'https://www.w3.org/WAI/ARIA/apg/patterns/combobox/examples/combobox-autocomplete-list/',
  importPath: '@pinfold/react/combobox',
  requires: ['select'],
  slots: SLOTS,
  props: {
    ...fieldProps,
    items: listItemsProp,
    multiple: { type: 'boolean', default: false, description: 'Choose several: chips before the text, Backspace in an empty field removes the last.', group: 'behaviour', control: true },
    value: { type: 'string[]', orString: true, description: 'The chosen value (an array with `multiple`), controlled; `null` for none.', group: 'data' },
    defaultValue: { type: 'string[]', orString: true, description: 'The chosen value when uncontrolled.', group: 'data' },
    onChange: { type: 'function', description: '`(value, event) => void`: the value, an array with `multiple`, `null` when cleared.', group: 'events' },
    inputValue: { type: 'string', description: 'What is typed, controlled.', group: 'data' },
    defaultInputValue: { type: 'string', default: '', description: 'What is typed at first.', group: 'data' },
    onInputChange: { type: 'function', description: '`(text) => void` on every keystroke: fetch matching `items` here for a server search.', group: 'events' },
    filter: {
      type: 'enum',
      values: ['contains', 'startsWith', 'none'],
      default: 'contains',
      description: 'How typing narrows the rows. `startsWith` also matches the start of any word. `none`: your `items` are already the results (a server search).',
      group: 'behaviour',
      control: true,
      silent: true,
    },
    allowCustom: { type: 'boolean', default: false, description: 'What was typed becomes a value of its own: an "Add …" row, Enter, or leaving the field.', group: 'behaviour', control: true, silent: true },
    loading: { type: 'boolean', default: false, description: 'Rows are being fetched: a loading row while there are none, and `aria-busy` on the list.', group: 'behaviour', control: true },
    highlight: { type: 'boolean', default: true, description: 'Mark the typed text in each row.', group: 'appearance', control: true },
    openOnFocus: { type: 'boolean', default: false, description: 'Open on focus, before anything is typed.', group: 'behaviour', control: true, silent: true },
    clearable: { type: 'boolean', default: false, description: 'A button that empties the field.', group: 'behaviour', control: true },
    maxChips: { type: 'number', default: 3, description: 'With `multiple`: chips shown before "+3".', group: 'appearance' },
    placeholder: { type: 'string', description: 'A hint inside an empty field. Never instead of a label.', group: 'data' },
    labels: {
      type: 'object',
      description: 'Text shown and read, for translation.',
      group: 'data',
      keys: {
        empty: { type: 'node', description: 'Default "No results".', group: 'data' },
        loading: { type: 'node', description: 'Default "Loading…".', group: 'data' },
        clear: { type: 'string', description: 'Default "Clear".', group: 'data' },
        create: { type: 'function', description: '`(text) => node`: the row that adds what was typed. Default `Add "…"`.', group: 'data' },
      },
    },
    ...listChoiceProps('combobox'),
    classNames: perSlot('Classes per slot.', 'string'),
    styles: perSlot('Inline styles per slot.', 'object'),
    slotProps: perSlot('Any DOM props per slot.', 'object'),
    render: perSlot('Replace a slot element: `({ props, state, children }) => node`.', 'function'),
  },
  keyboard: [
    { keys: 'Typing', action: 'Opens the list and narrows it; the first match is active.' },
    { keys: 'ArrowDown / ArrowUp', action: 'Open the list, or move through the rows past disabled ones. Alt+ArrowUp closes.' },
    { keys: 'Enter', action: 'Choose the active row; with `allowCustom` and no row, keep what was typed.' },
    { keys: 'Escape', action: 'Close the list; pressed again, clear the text.' },
    { keys: 'Backspace', action: 'With `multiple` and nothing typed, remove the last chip.' },
  ],
  aria: [
    'The input is `role="combobox"` with `aria-autocomplete="list"`, `aria-expanded` and `aria-controls`; focus stays in it and `aria-activedescendant` names the active row.',
    'The list is `role="listbox"`, `aria-busy` while `loading`; rows are `role="option"` with `aria-selected`; matches are `<mark>`.',
    'With `name`, hidden inputs submit the chosen values.',
    ...FIELD_ARIA,
  ],
  dataAttributes: [
    { name: 'data-open', on: 'root', values: 'present while the list is open' },
    { name: 'data-filled', on: 'root', values: 'present when there is a value or text' },
    { name: 'data-loading', on: 'root', values: 'present while `loading`' },
    { name: 'data-active / data-selected', on: 'option', values: 'the active row; chosen rows' },
  ],
  cssVariables: ['--pinfold-select-width', '--pinfold-select-max-height'],
  examples: [
    { title: 'Suggest from a list', code: "import { defineCombobox } from '@pinfold/react/combobox';\n\nexport const Search = defineCombobox();\n\n<Search label=\"City\" items={cities} onChange={setCity} />" },
    {
      title: 'Search a server',
      code: "const [query, setQuery] = useState('');\nconst { data = [], isFetching } = useRepos(query);\n\n<Search label=\"Repository\" filter=\"none\" items={data} loading={isFetching} onInputChange={setQuery} />",
    },
    { title: 'A tag input', code: "<Search label=\"Tags\" multiple allowCustom items={suggestions} value={tags} onChange={setTags} />" },
  ],
};
