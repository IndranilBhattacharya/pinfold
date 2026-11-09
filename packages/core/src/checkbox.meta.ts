import type { ComponentMeta, PropMeta } from './meta';
import { RADIUS_PROP } from './meta-shared';
import { FIELD_ARIA, fieldProps } from './field.meta';

const SLOTS = ['root', 'label', 'items', 'item', 'input', 'box', 'itemLabel', 'itemDescription', 'description', 'error'] as const;
const perSlot = (description: string, type: PropMeta['type']): PropMeta => ({
  type: 'object',
  description,
  group: 'escape-hatch',
  keys: Object.fromEntries(SLOTS.map((s) => [s, { type, description: `The \`${s}\` slot.`, group: 'escape-hatch' }])),
});
const len = (description: string): PropMeta => ({ type: 'length', description, group: 'appearance' });
const row: Record<string, PropMeta> = {
  value: { type: 'string', required: true, description: 'The form value of this row.', group: 'data' },
  label: { type: 'node', required: true, description: 'The name of this row.', group: 'data' },
  description: { type: 'node', description: 'Help text for this row.', group: 'data' },
  disabled: { type: 'boolean', default: false, description: 'This row only.', group: 'behaviour' },
};

export const checkboxMeta: ComponentMeta = {
  name: 'checkbox',
  displayName: 'Checkbox',
  description: 'A native checkbox with its label and error wired up, an indeterminate state, or a group from a list.',
  pattern: 'https://www.w3.org/WAI/ARIA/apg/patterns/checkbox/',
  importPath: '@pinfold/react/checkbox',
  slots: SLOTS,
  props: {
    ...fieldProps,
    checked: { type: 'boolean', description: 'Controlled state.', group: 'data' },
    defaultChecked: { type: 'boolean', default: false, description: 'Initial state when uncontrolled. A form reset returns to it.', group: 'data' },
    indeterminate: { type: 'boolean', default: false, description: 'Shown and read as partly checked, e.g. a "select all" with some selected.', group: 'data', control: true },
    formValue: { type: 'string', default: 'on', description: 'What the form submits when checked.', group: 'data' },
    onChange: { type: 'function', description: 'One checkbox: `(checked, event) => void`. A group: `(values, event) => void`.', group: 'behaviour' },
    items: { type: 'array', description: 'A group: one row each. `label` then names the group.', group: 'data', items: row },
    value: { type: 'string[]', description: 'Group: the checked values, controlled.', group: 'data' },
    defaultValue: { type: 'string[]', description: 'Group: the checked values when uncontrolled.', group: 'data' },
    orientation: { type: 'enum', values: ['vertical', 'horizontal'], default: 'vertical', description: 'Group: rows or a wrapping line.', group: 'appearance', control: true },
    variant: { type: 'enum', values: ['plain', 'card'], default: 'plain', description: 'Group: bare rows, or each row a bordered card.', group: 'appearance', control: true },
    animation: { type: 'enum', values: ['draw', 'pop', 'none'], default: 'draw', description: 'How the mark arrives: `draw` traces the tick, `pop` springs it in. Reduced motion and `disableAnimation` turn it off.', group: 'appearance', control: true },
    radius: RADIUS_PROP,
    size: { type: 'enum', values: ['sm', 'md', 'lg'], default: 'md', description: 'Box and text size. Precedence: this config, `defaults.checkbox`, the provider, then md.', group: 'appearance', control: true },
    tone: {
      type: 'enum',
      values: ['primary', 'neutral', 'success', 'warning', 'danger', 'info'],
      default: 'primary',
      description: 'Colour when checked. Precedence: this config, `defaults.checkbox`, the provider, then primary.',
      group: 'appearance',
      control: true,
    },
    dimensions: { type: 'object', description: 'Exact measurements. Numbers are px.', group: 'appearance', keys: { size: len('Box size.'), gap: len('Space between rows.') } },
    unstyled: { type: 'boolean', default: false, description: 'Drop Pinfold classes; keep the behaviour, roles and data attributes.', group: 'appearance' },
    className: { type: 'string', description: 'Class on the root.', group: 'appearance' },
    style: { type: 'object', description: 'Inline style on the root.', group: 'appearance' },
    classNames: perSlot('Classes per slot.', 'string'),
    styles: perSlot('Inline styles per slot.', 'object'),
    slotProps: perSlot('Any DOM props per slot. `slotProps.input` reaches each native element.', 'object'),
    render: perSlot('Replace a slot element: `({ props, state, children }) => node`.', 'function'),
  },
  keyboard: [
    { keys: 'Space', action: 'Native: toggles the focused checkbox.' },
    { keys: 'Tab', action: 'Native: each checkbox is its own stop.' },
  ],
  aria: [
    ...FIELD_ARIA,
    'A native `<input type="checkbox">`, so it submits with forms and needs no scripted key handling. The whole row is its click target.',
    '`indeterminate` sets the native property, which is read as "mixed".',
    'A group is a `<fieldset>` named by a `<legend>`. `required` on a group means at least one.',
  ],
  dataAttributes: [
    { name: 'data-size', on: 'root', values: 'the resolved size' },
    { name: 'data-tone', on: 'root', values: 'the resolved tone' },
    { name: 'data-variant', on: 'root', values: '"plain" | "card"' },
    { name: 'data-orientation', on: 'root', values: '"vertical" | "horizontal"' },
    { name: 'data-invalid', on: 'root', values: 'present when invalid' },
    { name: 'data-group', on: 'root', values: 'present on a group' },
  ],
  cssVariables: ['--pinfold-checkbox-size', '--pinfold-checkbox-gap'],
  examples: [
    {
      title: 'Presets',
      code: "import { defineCheckbox } from '@pinfold/react/checkbox';\n\nexport const Terms = defineCheckbox({ required: true });\nexport const Topics = defineCheckbox({ variant: 'card', orientation: 'horizontal' });\n\n<Terms label=\"I accept the terms\" name=\"terms\" />\n<Topics label=\"Topics\" name=\"topics\" items={[{ value: 'news', label: 'News' }, { value: 'tips', label: 'Tips' }]} onChange={setTopics} />",
    },
  ],
};
