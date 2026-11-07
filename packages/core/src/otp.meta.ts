import type { ComponentMeta, PropMeta } from './meta';
import { FIELD_ARIA, fieldProps } from './field.meta';

const SLOTS = ['root', 'label', 'control', 'input', 'slots', 'slot', 'caret', 'separator', 'description', 'error'] as const;
const perSlot = (description: string, type: PropMeta['type']): PropMeta => ({
  type: 'object',
  description,
  group: 'escape-hatch',
  keys: Object.fromEntries(SLOTS.map((s) => [s, { type, description: `The \`${s}\` slot.`, group: 'escape-hatch' }])),
});
const len = (description: string): PropMeta => ({ type: 'length', description, group: 'appearance' });

export const otpMeta: ComponentMeta = {
  name: 'otp',
  displayName: 'One-time code',
  pascal: 'Otp',
  description: 'A verification code in separate boxes, typed, pasted or filled from an SMS: one native input under the boxes, so the browser and password managers fill it.',
  pattern: 'https://html.spec.whatwg.org/multipage/form-control-infrastructure.html#attr-fe-autocomplete-one-time-code',
  importPath: '@pinfold/react/otp',
  slots: SLOTS,
  props: {
    ...fieldProps,
    length: { type: 'number', default: 6, description: 'How many characters.', group: 'data' },
    type: { type: 'enum', values: ['numeric', 'alphanumeric'], default: 'numeric', description: 'Digits only (a number keypad on phones), or letters and digits (shown upper case). Anything else typed or pasted is dropped.', group: 'behaviour' },
    value: { type: 'string', description: 'Controlled value.', group: 'data' },
    defaultValue: { type: 'string', description: 'Initial value when uncontrolled.', group: 'data' },
    onChange: { type: 'function', description: '`(value, event) => void`.', group: 'behaviour' },
    onComplete: { type: 'function', description: '`(value) => void`, once every box is filled: the moment to verify.', group: 'behaviour' },
    groups: { type: 'array', description: 'Box groups with a separator between, e.g. `[3, 3]`.', group: 'appearance' },
    separator: { type: 'node', default: '–', description: 'What sits between groups.', group: 'appearance' },
    mask: { type: 'boolean', default: false, description: 'Show dots instead of the characters.', group: 'appearance', control: true },
    variant: { type: 'enum', values: ['outline', 'filled', 'underline'], default: 'outline', description: 'Framed boxes, tinted boxes, or a line under each.', group: 'appearance', control: true },
    size: { type: 'enum', values: ['sm', 'md', 'lg'], default: 'md', description: 'Box size. Precedence: this config, `defaults.otp`, the provider, then md.', group: 'appearance', control: true },
    dimensions: { type: 'object', description: 'Exact measurements. Numbers are px.', group: 'appearance', keys: { slotSize: len('Box width and height.'), gap: len('Space between boxes.') } },
    unstyled: { type: 'boolean', default: false, description: 'Drop Pinfold classes; keep the behaviour, roles and data attributes.', group: 'appearance' },
    className: { type: 'string', description: 'Class on the root.', group: 'appearance' },
    style: { type: 'object', description: 'Inline style on the root.', group: 'appearance' },
    classNames: perSlot('Classes per slot.', 'string'),
    styles: perSlot('Inline styles per slot.', 'object'),
    slotProps: perSlot('Any DOM props per slot. `slotProps.input` reaches the native element.', 'object'),
    render: perSlot('Replace a slot element: `({ props, state, children }) => node`.', 'function'),
  },
  keyboard: [
    { keys: 'Typing / paste', action: 'Fills the boxes in order; a pasted or autofilled code fills them all.' },
    { keys: 'Backspace', action: 'Native: removes the last character.' },
  ],
  aria: [
    ...FIELD_ARIA,
    'One native `<input autocomplete="one-time-code">` holds the code: screen readers read one field, SMS autofill and password managers fill it, and `pattern` and `required` validate it.',
    'The boxes are drawn from its value and hidden from assistive tech.',
  ],
  dataAttributes: [
    { name: 'data-variant', on: 'root', values: '"outline" | "filled" | "underline"' },
    { name: 'data-size', on: 'root', values: 'the resolved size' },
    { name: 'data-complete', on: 'root', values: 'present when every box is filled' },
    { name: 'data-active', on: 'slot', values: 'the box the next character goes in, while focused' },
  ],
  cssVariables: ['--pinfold-otp-slot-size', '--pinfold-otp-gap'],
  examples: [
    {
      title: 'A six-digit code',
      code: "import { defineOtp } from '@pinfold/react/otp';\n\nexport const Code = defineOtp({ groups: [3, 3] });\n\n<Code label=\"Verification code\" name=\"code\" onComplete={verify} />",
    },
  ],
};
