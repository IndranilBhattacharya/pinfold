import type { ComponentMeta, PropMeta } from './meta';
import { RADIUS_PROP } from './meta-shared';
import { FIELD_ARIA, VALIDATION_ARIA, fieldProps, validationProps } from './field.meta';

const SLOTS = ['root', 'label', 'control', 'value', 'placeholder', 'chip', 'chipRemove', 'clear', 'chevron', 'popup', 'group', 'groupLabel', 'option', 'check', 'avatar', 'icon', 'detail', 'endContent', 'description', 'empty', 'error', 'statusIcon', 'validating'] as const;
const perSlot = (description: string, type: PropMeta['type']): PropMeta => ({
  type: 'object',
  description,
  group: 'escape-hatch',
  keys: Object.fromEntries(SLOTS.map((s) => [s, { type, description: `The \`${s}\` slot.`, group: 'escape-hatch' }])),
});
const len = (description: string): PropMeta => ({ type: 'length', description, group: 'appearance' });

/** The rows a select and a combobox share. */
export const listItemsProp: PropMeta = {
  type: 'array',
  orString: true,
  required: true,
  description: 'The rows. A string is a row whose value and label are that string: `items={["India", "Japan"]}`. Rows with the same `group` sit together under its name.',
  group: 'data',
  items: {
    value: { type: 'string', required: true, description: 'Stable value: what `value` and `onChange` hold, and what the form submits.', group: 'data' },
    label: { type: 'node', description: 'Shown. Default the value.', group: 'data' },
    textValue: { type: 'string', description: 'The text to match and type ahead on, when `label` is not a string.', group: 'data' },
    description: { type: 'node', description: 'A second line.', group: 'data' },
    icon: { type: 'node', description: 'Before the label.', group: 'data' },
    avatar: { type: 'node', description: 'Before the label, in a circle: an image URL or your own node.', group: 'data' },
    endContent: { type: 'node', description: 'At the end of the row: a role, a count, a badge.', group: 'data' },
    tone: { type: 'enum', values: ['primary', 'neutral', 'success', 'warning', 'danger', 'info'], description: 'The chip\'s colour once chosen.', group: 'appearance' },
    group: { type: 'string', description: 'Rows with the same group sit together under this name.', group: 'data' },
    disabled: { type: 'boolean', description: 'Shown, never chosen.', group: 'behaviour' },
  },
};

export const listChoiceProps = (name: string): Record<string, PropMeta> => ({
  open: { type: 'boolean', description: 'The list, controlled.', group: 'behaviour' },
  defaultOpen: { type: 'boolean', default: false, description: 'Open on first render.', group: 'behaviour' },
  onOpenChange: { type: 'function', description: '`(open) => void`.', group: 'events' },
  placement: {
    type: 'enum',
    values: ['top', 'top-start', 'top-end', 'bottom', 'bottom-start', 'bottom-end'],
    default: 'bottom-start',
    description: 'Where the list opens; it flips when there is no room.',
    group: 'appearance',
  },
  variant: { type: 'enum', values: ['outline', 'filled', 'underline'], default: 'outline', description: 'The field: framed, tinted, or a line under it (as Input).', group: 'appearance', control: true },
  radius: RADIUS_PROP,
  size: { type: 'enum', values: ['sm', 'md', 'lg'], default: 'md', description: `Precedence: this config, \`defaults.${name}\`, the provider, then md.`, group: 'appearance', control: true },
  tone: {
    type: 'enum',
    values: ['primary', 'neutral', 'success', 'warning', 'danger', 'info'],
    default: 'primary',
    description: `Colour of the check and the chosen rows. Precedence: this config, \`defaults.${name}\`, the provider, then primary.`,
    group: 'appearance',
    control: true,
  },
  dimensions: { type: 'object', description: 'Exact measurements. Numbers are px.', group: 'appearance', keys: { width: len('Width of the field (default the full width).'), maxHeight: len('Tallest the list gets before it scrolls.') } },
  unstyled: { type: 'boolean', default: false, description: 'Drop Pinfold classes; keep the behaviour, roles and data attributes.', group: 'appearance' },
  className: { type: 'string', description: 'Class on the root.', group: 'appearance' },
  style: { type: 'object', description: 'Inline style on the root.', group: 'appearance' },
});

export const selectMeta: ComponentMeta = {
  name: 'select',
  displayName: 'Select',
  description: 'A field that opens a list to choose one value, or several as chips. Rows from strings or objects, in groups, with descriptions and icons; type ahead to jump. A native select underneath submits, resets and validates.',
  pattern: 'https://www.w3.org/WAI/ARIA/apg/patterns/combobox/examples/combobox-select-only/',
  importPath: '@pinfold/react/select',
  slots: SLOTS,
  props: {
    ...fieldProps,
    ...validationProps,
    items: listItemsProp,
    multiple: { type: 'boolean', default: false, description: 'Choose several: `value` is an array, chosen rows show as chips, the list stays open.', group: 'behaviour', control: true },
    value: { type: 'string[]', orString: true, description: 'The chosen value (an array with `multiple`), controlled; `null` for none.', group: 'data' },
    defaultValue: { type: 'string[]', orString: true, description: 'The chosen value when uncontrolled. A form reset returns to it.', group: 'data' },
    onChange: { type: 'function', description: '`(value, event) => void`: the value, an array with `multiple`, `null` when cleared.', group: 'events' },
    placeholder: { type: 'string', default: 'Select…', description: 'Shown while nothing is chosen.', group: 'data' },
    clearable: { type: 'boolean', default: false, description: 'A button that empties the field.', group: 'behaviour', control: true },
    clearLabel: { type: 'string', default: 'Clear', description: 'The clear button\'s name.', group: 'data' },
    display: { type: 'enum', values: ['chips', 'text'], default: 'chips', description: 'With `multiple`: chips with a remove mark each, or the labels as text.', group: 'appearance', control: true },
    maxChips: { type: 'number', default: 3, description: 'With `multiple`: chips shown before "+3".', group: 'appearance' },
    chipVariant: { type: 'enum', values: ['soft', 'solid', 'outline'], default: 'soft', description: 'With `multiple`: the chips\' look. A row\'s `tone` colours its chip.', group: 'appearance', control: true },
    renderValue: { type: 'function', description: '`(selected, state) => node`: draw the chosen value in the field yourself. `selected` holds each chosen row with its state and `remove`; the placeholder shows while it is empty.', group: 'data' },
    onRemove: { type: 'function', description: '`(value, item) => void`: with `multiple`, a chip\'s remove mark unchose a value.', group: 'events' },
    onClear: { type: 'function', description: '`() => void`: the clear button emptied the field.', group: 'events' },
    emptyText: { type: 'node', default: 'No options', description: 'Shown in the list when there are no rows.', group: 'data' },
    ...listChoiceProps('select'),
    classNames: perSlot('Classes per slot.', 'string'),
    styles: perSlot('Inline styles per slot.', 'object'),
    slotProps: perSlot('Any DOM props per slot.', 'object'),
    render: perSlot('Replace a slot element: `({ props, state, children }) => node`.', 'function'),
  },
  keyboard: [
    { keys: 'Enter / Space / ArrowDown / ArrowUp', action: 'Open the list on the chosen row (ArrowUp: the last).' },
    { keys: 'ArrowDown / ArrowUp / Home / End / PageDown / PageUp', action: 'Move through the rows, past disabled ones.' },
    { keys: 'Enter / Space', action: 'Choose the active row (with `multiple`, toggle it and stay open).' },
    { keys: 'Letters', action: 'Jump to the next row that starts with what was typed.' },
    { keys: 'Escape / Alt+ArrowUp', action: 'Close the list.' },
    { keys: 'Tab', action: 'Choose the active row (one value) and move on.' },
  ],
  aria: [
    'The field is `role="combobox"` (select-only) with `aria-haspopup="listbox"`, `aria-expanded` and `aria-controls`; focus stays on it and `aria-activedescendant` names the active row.',
    'It is named by the label and the chosen value. The list is `role="listbox"` (`aria-multiselectable` with `multiple`), rows are `role="option"` with `aria-selected`; groups are `role="group"` named by their heading.',
    'A hidden native `<select>` holds the value: forms submit and reset it, browsers autofill it, and `required` validates natively.',
    'Chips\' remove marks are for pointers; the list is the keyboard way to unchoose.',
    'A `validate` error is also the native select\'s custom validity, so a plain form does not submit; on submit the field (not the hidden select) takes focus.',
    ...FIELD_ARIA,
    ...VALIDATION_ARIA,
  ],
  dataAttributes: [
    { name: 'data-variant', on: 'root', values: '"outline" | "filled" | "underline"' },
    { name: 'data-open', on: 'root', values: 'present while the list is open' },
    { name: 'data-filled', on: 'root', values: 'present when a value is chosen' },
    { name: 'data-multiple', on: 'root', values: 'present with `multiple`' },
    { name: 'data-chip-variant', on: 'root', values: 'multiple: "soft" | "solid" | "outline"' },
    { name: 'data-validity', on: 'root', values: '"error" | "warning" | "success": the resolved status' },
    { name: 'data-validating', on: 'root', values: 'present while an async `validate` runs' },
    { name: 'data-active / data-selected', on: 'option', values: 'the active row; chosen rows' },
  ],
  cssVariables: ['--pinfold-select-width', '--pinfold-select-max-height'],
  examples: [
    {
      title: 'One line',
      code: "import { defineSelect } from '@pinfold/react/select';\n\nexport const Field = defineSelect();\n\n<Field label=\"Country\" items={['India', 'Japan', 'Kenya']} />",
    },
    {
      title: 'Rows with groups, descriptions and icons',
      code: "<Field label=\"Plan\" value={plan} onChange={setPlan} items={[\n  { value: 'free', label: 'Free', group: 'Personal' },\n  { value: 'pro', label: 'Pro', description: '$12 a month', group: 'Personal' },\n  { value: 'team', label: 'Team', description: '$48 a month', group: 'Business' },\n]} />",
    },
    { title: 'Several values', code: "<Field label=\"Labels\" multiple clearable items={labels} defaultValue={['bug']} name=\"labels\" />" },
    {
      title: 'People, checked before submit',
      code: "<Field label=\"Owner\" name=\"owner\" required items={people.map((p) => ({ value: p.id, label: p.name, avatar: p.photo, description: p.email, endContent: p.role }))}\n  validate={(id) => (id === me ? 'Pick someone else' : null)} />",
    },
  ],
};
