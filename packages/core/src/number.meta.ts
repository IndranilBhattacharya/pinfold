import type { ComponentMeta, PropMeta } from './meta';
import { RADIUS_PROP } from './meta-shared';
import { FIELD_ARIA, VALIDATION_ARIA, fieldProps, validationProps } from './field.meta';

const SLOTS = ['root', 'label', 'control', 'input', 'decrement', 'increment', 'startContent', 'endContent', 'description', 'error', 'statusIcon', 'validating'] as const;
const perSlot = (description: string, type: PropMeta['type']): PropMeta => ({
  type: 'object',
  description,
  group: 'escape-hatch',
  keys: Object.fromEntries(SLOTS.map((s) => [s, { type, description: `The \`${s}\` slot.`, group: 'escape-hatch' }])),
});
const len = (description: string): PropMeta => ({ type: 'length', description, group: 'appearance' });

export const numberMeta: ComponentMeta = {
  name: 'number',
  displayName: 'Number field',
  pascal: 'NumberField',
  description: 'A number with − and + buttons: a native number input, with steps, limits, units, press-and-hold and native validation.',
  pattern: 'https://www.w3.org/WAI/ARIA/apg/patterns/spinbutton/',
  importPath: '@pinfold/react/number',
  slots: SLOTS,
  props: {
    ...fieldProps,
    ...validationProps,
    value: { type: 'number', description: 'Controlled value; `null` is empty.', group: 'data' },
    defaultValue: { type: 'number', description: 'Initial value when uncontrolled. A form reset returns to it.', group: 'data' },
    onChange: { type: 'function', description: '`(value, event?) => void`; `value` is `null` when the field is empty. No `event` from the buttons.', group: 'behaviour' },
    onValueCommit: { type: 'function', description: '`(value) => void`: the value settled. A stepper press ended, an arrow key was released, Enter, or the field was left after a change. The moment to save.', group: 'events' },
    onFocus: { type: 'function', description: '`(event) => void`: the number took focus.', group: 'events' },
    onBlur: { type: 'function', description: '`(event) => void`: the number lost focus, after `onValueCommit` and validation on blur.', group: 'events' },
    onKeyDown: { type: 'function', description: '`(event) => void`: any key in the number; `preventDefault()` on Enter skips the commit.', group: 'events' },
    min: { type: 'number', description: 'Lowest value: native validation, and the − button stops there.', group: 'data' },
    max: { type: 'number', description: 'Highest value.', group: 'data' },
    step: { type: 'number', default: 1, description: 'What the buttons and arrow keys add; native validation checks values against it.', group: 'data' },
    placeholder: { type: 'string', description: 'A hint inside an empty field.', group: 'data' },
    readOnly: { type: 'boolean', default: false, description: 'Native `readonly`; the buttons are off.', group: 'behaviour', control: true },
    steppers: {
      type: 'enum',
      values: ['split', 'end', 'none'],
      default: 'split',
      description: '`split`: − before and + after the number. `end`: both after it, side by side. `none`: arrow keys only. Every button is a full-height target (WCAG 2.5.8).',
      group: 'appearance',
      control: true,
    },
    incrementLabel: { type: 'string', default: 'Increase', description: 'Accessible name and tooltip of +.', group: 'behaviour' },
    decrementLabel: { type: 'string', default: 'Decrease', description: 'Accessible name and tooltip of −.', group: 'behaviour' },
    incrementIcon: { type: 'node', description: 'The + button\'s icon.', group: 'appearance' },
    decrementIcon: { type: 'node', description: 'The − button\'s icon.', group: 'appearance' },
    startContent: { type: 'node', description: 'Before the number: a currency, an icon. A node or a function of state.', group: 'data' },
    endContent: { type: 'node', description: 'After the number: a unit. A node or a function of state.', group: 'data' },
    variant: { type: 'enum', values: ['outline', 'filled'], default: 'outline', description: 'A frame, or a tinted fill.', group: 'appearance', control: true },
    radius: RADIUS_PROP,
    size: { type: 'enum', values: ['sm', 'md', 'lg'], default: 'md', description: 'The same heights as a button and an input. Precedence: this config, `defaults.number`, the provider, then md.', group: 'appearance', control: true },
    dimensions: { type: 'object', description: 'Exact measurements. Numbers are px.', group: 'appearance', keys: { width: len('Field width (default 10rem).'), height: len('Control height.') } },
    unstyled: { type: 'boolean', default: false, description: 'Drop Pinfold classes; keep the behaviour, roles and data attributes.', group: 'appearance' },
    className: { type: 'string', description: 'Class on the root.', group: 'appearance' },
    style: { type: 'object', description: 'Inline style on the root.', group: 'appearance' },
    classNames: perSlot('Classes per slot.', 'string'),
    styles: perSlot('Inline styles per slot.', 'object'),
    slotProps: perSlot('Any DOM props per slot. `slotProps.input` reaches the native element.', 'object'),
    render: perSlot('Replace a slot element: `({ props, state, children }) => node`.', 'function'),
  },
  keyboard: [
    { keys: 'Arrow Up / Down', action: 'Native: one step.' },
    { keys: 'Tab', action: 'The number only: the buttons are pointer shortcuts, as the arrow keys do the same.' },
  ],
  aria: [
    ...FIELD_ARIA,
    ...VALIDATION_ARIA,
    'A native `<input type="number">` is a `spinbutton`: value, limits and steps are read and validated by the browser.',
    'The − and + buttons are named, out of the tab order (the arrow keys do the same), disabled at the limits, and repeat while held.',
  ],
  dataAttributes: [
    { name: 'data-steppers', on: 'root', values: '"split" | "end" | "none"' },
    { name: 'data-variant', on: 'root', values: '"outline" | "filled"' },
    { name: 'data-size', on: 'root', values: 'the resolved size' },
    { name: 'data-invalid', on: 'root', values: 'present when invalid' },
    { name: 'data-validity', on: 'root', values: '"error" | "warning" | "success": the resolved status' },
    { name: 'data-validating', on: 'root', values: 'present while an async `validate` runs' },
  ],
  cssVariables: ['--pinfold-number-width', '--pinfold-number-height'],
  examples: [
    {
      title: 'Quantity and a price',
      code: "import { defineNumberField } from '@pinfold/react/number';\n\nexport const Quantity = defineNumberField({ min: 1, max: 99 });\nexport const Price = defineNumberField({ step: 0.5, min: 0, steppers: 'end', startContent: '$' });\n\n<Quantity label=\"Quantity\" name=\"qty\" defaultValue={1} />\n<Price label=\"Price\" name=\"price\" onChange={setPrice} />",
    },
  ],
};
