import type { ComponentMeta, PropMeta } from './meta';
import { FIELD_ARIA, fieldProps } from './field.meta';

const SLOTS = ['root', 'label', 'control', 'input', 'startContent', 'endContent', 'clear', 'description', 'error'] as const;
const perSlot = (description: string, type: PropMeta['type']): PropMeta => ({
  type: 'object',
  description,
  group: 'escape-hatch',
  keys: Object.fromEntries(SLOTS.map((s) => [s, { type, description: `The \`${s}\` slot.`, group: 'escape-hatch' }])),
});
const len = (description: string): PropMeta => ({ type: 'length', description, group: 'appearance' });

export const inputMeta: ComponentMeta = {
  name: 'input',
  displayName: 'Input',
  description: 'A text field with its label, help text and error wired up: single line or multiline, with icons, a clear button and native validation.',
  pattern: 'https://html.spec.whatwg.org/multipage/input.html',
  importPath: '@pinfold/react/input',
  slots: SLOTS,
  props: {
    ...fieldProps,
    type: { type: 'enum', values: ['text', 'email', 'password', 'search', 'url', 'tel'], default: 'text', description: 'The native type: it picks the mobile keyboard and the built-in validation.', group: 'behaviour' },
    value: { type: 'string', description: 'Controlled value.', group: 'data' },
    defaultValue: { type: 'string', description: 'Initial value when uncontrolled. A form reset returns to it.', group: 'data' },
    onChange: { type: 'function', description: '`(value, event) => void`. `event` is absent when the clear button did it.', group: 'behaviour' },
    placeholder: { type: 'string', description: 'A hint inside an empty field. Never instead of a label.', group: 'data' },
    autoComplete: { type: 'string', description: 'Native `autocomplete`, e.g. `email`: lets browsers and password managers fill it in.', group: 'behaviour' },
    inputMode: { type: 'string', description: 'Native `inputmode`, e.g. `numeric`, for the mobile keyboard.', group: 'behaviour' },
    maxLength: { type: 'number', description: 'Native `maxlength`.', group: 'behaviour' },
    minLength: { type: 'number', description: 'Native `minlength`.', group: 'behaviour' },
    pattern: { type: 'string', description: 'Native `pattern`.', group: 'behaviour' },
    readOnly: { type: 'boolean', default: false, description: 'Native `readonly`: can be focused, selected and submitted, not edited.', group: 'behaviour', control: true },
    multiline: { type: 'boolean', default: false, description: 'A `<textarea>`.', group: 'appearance', control: true },
    rows: { type: 'number', default: 3, description: 'Multiline: visible rows.', group: 'appearance' },
    autosize: { type: 'boolean', default: false, description: 'Multiline: grows with its content.', group: 'behaviour', control: true },
    startContent: { type: 'node', description: 'Before the text: an icon or a unit. Decorative unless it is a control.', group: 'data' },
    endContent: { type: 'node', description: 'After the text.', group: 'data' },
    clearable: { type: 'boolean', default: false, description: 'A clear button while it has a value.', group: 'behaviour', control: true },
    clearLabel: { type: 'string', default: 'Clear', description: 'Accessible name and tooltip of the clear button.', group: 'behaviour' },
    variant: { type: 'enum', values: ['outline', 'filled'], default: 'outline', description: 'A frame, or a tinted fill with a frame.', group: 'appearance', control: true },
    size: { type: 'enum', values: ['sm', 'md', 'lg'], default: 'md', description: 'The same heights as a button. Precedence: this config, `defaults.input`, the provider, then md.', group: 'appearance', control: true },
    dimensions: {
      type: 'object',
      description: 'Exact measurements. Numbers are px.',
      group: 'appearance',
      keys: { width: len('Field width (default: the container).'), height: len('Control height.'), paddingX: len('Inline padding.'), radius: len('Corner radius.') },
    },
    unstyled: { type: 'boolean', default: false, description: 'Drop Pinfold classes; keep the behaviour, roles and data attributes.', group: 'appearance' },
    className: { type: 'string', description: 'Class on the root.', group: 'appearance' },
    style: { type: 'object', description: 'Inline style on the root.', group: 'appearance' },
    classNames: perSlot('Classes per slot.', 'string'),
    styles: perSlot('Inline styles per slot.', 'object'),
    slotProps: perSlot('Any DOM props per slot. `slotProps.input` reaches the native element.', 'object'),
    render: perSlot('Replace a slot element: `({ props, state, children }) => node`.', 'function'),
  },
  keyboard: [{ keys: 'Tab', action: 'Native: into the field, then the clear button.' }],
  aria: FIELD_ARIA,
  dataAttributes: [
    { name: 'data-variant', on: 'root', values: '"outline" | "filled"' },
    { name: 'data-size', on: 'root', values: 'the resolved size' },
    { name: 'data-invalid', on: 'root', values: 'present when invalid' },
    { name: 'data-disabled', on: 'root', values: 'present when disabled' },
  ],
  cssVariables: ['--pinfold-input-width', '--pinfold-input-height', '--pinfold-input-padding-x', '--pinfold-input-radius'],
  examples: [
    {
      title: 'Presets',
      code: "import { defineInput } from '@pinfold/react/input';\n\nexport const Email = defineInput({ type: 'email', autoComplete: 'email', required: true });\nexport const Search = defineInput({ type: 'search', clearable: true, hideLabel: true, startContent: <SearchIcon /> });\n\n<Email label=\"Work email\" name=\"email\" description=\"We never share it.\" />\n<Search label=\"Search\" onChange={setQuery} />",
    },
    { title: 'Multiline', code: "const Notes = defineInput({ multiline: true, autosize: true, rows: 2 });\n<Notes label=\"Notes\" name=\"notes\" />" },
  ],
};
