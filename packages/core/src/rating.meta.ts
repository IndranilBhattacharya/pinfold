import type { ComponentMeta, PropMeta } from './meta';

const SLOTS = ['root', 'label', 'symbols', 'symbol', 'value'] as const;
const perSlot = (description: string, type: PropMeta['type']): PropMeta => ({
  type: 'object',
  description,
  group: 'escape-hatch',
  keys: Object.fromEntries(SLOTS.map((s) => [s, { type, description: `The \`${s}\` slot.`, group: 'escape-hatch' }])),
});
const TONES = ['primary', 'neutral', 'success', 'warning', 'danger', 'info'];

export const ratingMeta: ComponentMeta = {
  name: 'rating',
  displayName: 'Rating',
  description: 'Stars (or any symbol) to give a score, in whole or half steps, with a preview under the pointer; or a read-only score such as 4.3 out of 5. Native radios underneath.',
  pattern: 'https://www.w3.org/WAI/ARIA/apg/patterns/radio/',
  importPath: '@pinfold/react/rating',
  slots: SLOTS,
  props: {
    label: { type: 'string', required: true, description: 'Names the rating, e.g. "Rate this recipe".', group: 'data' },
    hideLabel: { type: 'boolean', default: false, description: 'Keep the label for screen readers only.', group: 'appearance', control: true },
    value: { type: 'number', description: 'Controlled value (0 is none).', group: 'data' },
    defaultValue: { type: 'number', default: 0, description: 'The value when uncontrolled.', group: 'data' },
    onChange: { type: 'function', description: '`(value) => void`.', group: 'events' },
    max: { type: 'number', default: 5, description: 'How many symbols.', group: 'data' },
    allowHalf: { type: 'boolean', default: false, description: 'Half steps: 3.5.', group: 'behaviour', control: true },
    readOnly: { type: 'boolean', default: false, description: 'Shown, not changed: one image read as "4.3 out of 5", partly filled symbols.', group: 'behaviour', control: true },
    clearable: { type: 'boolean', default: true, description: 'Choosing the current value again clears it.', group: 'behaviour', control: true, silent: true },
    disabled: { type: 'boolean', default: false, description: 'Native `disabled` on every choice.', group: 'behaviour', control: true },
    showValue: { type: 'boolean', default: false, description: 'The number after the symbols, e.g. "4.5".', group: 'appearance', control: true },
    icon: { type: 'node', description: 'The symbol: a star by default; a heart, a flame, any icon.', group: 'appearance' },
    getValueLabel: { type: 'function', description: '`(value) => string`: each choice\'s spoken name. Default "3 stars".', group: 'data' },
    name: { type: 'string', description: 'The form field name: the chosen value is submitted.', group: 'data' },
    size: { type: 'enum', values: ['sm', 'md', 'lg'], default: 'md', description: 'Precedence: this config, `defaults.rating`, the provider, then md.', group: 'appearance', control: true },
    tone: { type: 'enum', values: TONES, default: 'warning', description: 'The filled symbols\' colour: gold (warning) unless asked. Never from the provider.', group: 'appearance', control: true },
    unstyled: { type: 'boolean', default: false, description: 'Drop Pinfold classes; keep the behaviour, roles and data attributes.', group: 'appearance' },
    className: { type: 'string', description: 'Class on the root.', group: 'appearance' },
    style: { type: 'object', description: 'Inline style on the root.', group: 'appearance' },
    classNames: perSlot('Classes per slot.', 'string'),
    styles: perSlot('Inline styles per slot.', 'object'),
    slotProps: perSlot('Any DOM props per slot.', 'object'),
    render: perSlot('Replace a slot element: `({ props, state, children }) => node`.', 'function'),
  },
  keyboard: [
    { keys: 'Tab', action: 'Into the rating (the chosen value, else the first).' },
    { keys: 'Arrow keys', action: 'A step up or down (the native radio group).' },
    { keys: 'Space', action: 'Choose the focused step; on the chosen one, clear it (`clearable`).' },
  ],
  aria: [
    'A `radiogroup` named by `label`, one native radio per step named "3 stars" (`getValueLabel`): forms, keys and screen readers work as for any radio group.',
    'Read-only, it is one `img` named "<label>: 4.3 out of 5"; the symbols are decorative.',
    'The fill is never colour alone: filled and empty symbols differ in shape (solid and faint).',
  ],
  dataAttributes: [
    { name: 'data-readonly / data-disabled', on: 'root', values: 'present when set' },
    { name: 'data-fill', on: 'symbol', values: '"0" | "0.5" | "1"' },
  ],
  cssVariables: [],
  examples: [
    { title: 'Give a score', code: "import { defineRating } from '@pinfold/react/rating';\n\nexport const Stars = defineRating({ allowHalf: true });\n\n<Stars label=\"Your rating\" value={stars} onChange={setStars} name=\"rating\" />" },
    { title: 'Show an average', code: "<Stars label=\"Average rating\" value={4.3} readOnly showValue />" },
  ],
};
