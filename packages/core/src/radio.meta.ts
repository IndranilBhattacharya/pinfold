import type { ComponentMeta, PropMeta } from './meta';
import { RADIUS_PROP } from './meta-shared';
import { FIELD_ARIA, VALIDATION_ARIA, fieldProps, validationProps } from './field.meta';

const SLOTS = ['root', 'label', 'items', 'item', 'input', 'box', 'itemLabel', 'itemDescription', 'itemStartContent', 'itemEndContent', 'description', 'error', 'statusIcon', 'validating'] as const;
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
  startContent: { type: 'node', description: 'Before the text: an icon or a logo (cards especially).', group: 'data' },
  endContent: { type: 'node', description: 'At the end of the row: a price, a badge.', group: 'data' },
};

export const radioMeta: ComponentMeta = {
  name: 'radio',
  displayName: 'Radio group',
  description: 'One choice from a list: native radios in a named group, as bare rows or cards.',
  pattern: 'https://www.w3.org/WAI/ARIA/apg/patterns/radio/',
  importPath: '@pinfold/react/radio',
  slots: SLOTS,
  props: {
    ...fieldProps,
    ...validationProps,
    label: { ...fieldProps.label, description: 'Names the group.' },
    items: { type: 'array', required: true, description: 'One row each.', group: 'data', items: row },
    value: { type: 'string', description: 'The selected value, controlled.', group: 'data' },
    defaultValue: { type: 'string', description: 'The selected value when uncontrolled. A form reset returns to it.', group: 'data' },
    onChange: { type: 'function', description: '`(value, event) => void`.', group: 'behaviour' },
    onFocus: { type: 'function', description: '`(event) => void`: a radio took focus (`event.target` says which).', group: 'events' },
    onBlur: { type: 'function', description: '`(event) => void`: a radio lost focus.', group: 'events' },
    onKeyDown: { type: 'function', description: '`(event) => void`: any key on a radio.', group: 'events' },
    icon: { type: 'node', description: 'The mark in the circle, in place of the dot: a node, or a function of `{ checked, disabled }`. Drawn in `currentColor`.', group: 'appearance' },
    orientation: { type: 'enum', values: ['vertical', 'horizontal'], default: 'vertical', description: 'Rows or a wrapping line.', group: 'appearance', control: true },
    variant: { type: 'enum', values: ['plain', 'card'], default: 'plain', description: 'Bare rows, or each row a bordered card.', group: 'appearance', control: true },
    animation: { type: 'enum', values: ['spring', 'ripple', 'none'], default: 'spring', description: 'How the dot arrives: `spring` grows it with a little overshoot, `ripple` also sends a ring out. Reduced motion and `disableAnimation` turn it off.', group: 'appearance', control: true },
    radius: RADIUS_PROP,
    size: { type: 'enum', values: ['sm', 'md', 'lg'], default: 'md', description: 'Dot and text size. Precedence: this config, `defaults.radio`, the provider, then md.', group: 'appearance', control: true },
    tone: {
      type: 'enum',
      values: ['primary', 'neutral', 'success', 'warning', 'danger', 'info'],
      default: 'primary',
      description: 'Colour when selected. Precedence: this config, `defaults.radio`, the provider, then primary.',
      group: 'appearance',
      control: true,
    },
    dimensions: { type: 'object', description: 'Exact measurements. Numbers are px.', group: 'appearance', keys: { size: len('Dot size.'), gap: len('Space between rows.') } },
    unstyled: { type: 'boolean', default: false, description: 'Drop Pinfold classes; keep the behaviour, roles and data attributes.', group: 'appearance' },
    className: { type: 'string', description: 'Class on the root.', group: 'appearance' },
    style: { type: 'object', description: 'Inline style on the root.', group: 'appearance' },
    classNames: perSlot('Classes per slot.', 'string'),
    styles: perSlot('Inline styles per slot.', 'object'),
    slotProps: perSlot('Any DOM props per slot. `slotProps.input` reaches each native element.', 'object'),
    render: perSlot('Replace a slot element: `({ props, state, children }) => node`.', 'function'),
  },
  keyboard: [
    { keys: 'Tab', action: 'Native: one stop for the whole group, on the selected row.' },
    { keys: 'Arrow keys', action: 'Native: move and select, wrapping, and following the reading direction.' },
    { keys: 'Space', action: 'Native: selects the focused row.' },
  ],
  aria: [
    ...FIELD_ARIA,
    ...VALIDATION_ARIA,
    'Native radios in a `<fieldset role="radiogroup">` named by a `<legend>`: roving focus and arrow keys are the browser\'s, so they cannot break.',
    'Without a `name` a unique one is generated, so the rows form a group.',
  ],
  dataAttributes: [
    { name: 'data-size', on: 'root', values: 'the resolved size' },
    { name: 'data-tone', on: 'root', values: 'the resolved tone' },
    { name: 'data-variant', on: 'root', values: '"plain" | "card"' },
    { name: 'data-orientation', on: 'root', values: '"vertical" | "horizontal"' },
    { name: 'data-invalid', on: 'root', values: 'present when invalid' },
    { name: 'data-checked', on: 'item', values: 'present on the selected row' },
    { name: 'data-validity', on: 'root', values: '"error" | "warning" | "success": the resolved status' },
  ],
  cssVariables: ['--pinfold-radio-size', '--pinfold-radio-gap'],
  examples: [
    {
      title: 'Preset',
      code: "import { defineRadio } from '@pinfold/react/radio';\n\nexport const Plan = defineRadio({ variant: 'card', required: true });\n\n<Plan\n  label=\"Plan\"\n  name=\"plan\"\n  defaultValue=\"pro\"\n  items={[\n    { value: 'free', label: 'Free', description: 'For trying it out' },\n    { value: 'pro', label: 'Pro', description: 'For growing teams' },\n  ]}\n/>",
    },
  ],
};
