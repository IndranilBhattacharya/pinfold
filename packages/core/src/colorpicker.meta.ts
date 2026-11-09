import type { ComponentMeta, PropMeta } from './meta';
import { RADIUS_PROP } from './meta-shared';

const SLOTS = ['root', 'area', 'thumb', 'controls', 'hue', 'alpha', 'preview', 'eyedropper', 'field', 'input', 'swatches', 'swatch'] as const;
const perSlot = (description: string, type: PropMeta['type']): PropMeta => ({
  type: 'object',
  description,
  group: 'escape-hatch',
  keys: Object.fromEntries(SLOTS.map((s) => [s, { type, description: `The \`${s}\` slot.`, group: 'escape-hatch' }])),
});

export const colorpickerMeta: ComponentMeta = {
  name: 'colorpicker',
  displayName: 'Color picker',
  pascal: 'ColorPicker',
  description: 'Pick a colour: a saturation and brightness area, hue and opacity sliders, a text field that takes hex, rgb(), hsl() or oklch(), swatches, and the screen eyedropper where the browser has it. The value is written in the format you choose.',
  pattern: 'https://www.w3.org/WAI/ARIA/apg/patterns/slider/',
  importPath: '@pinfold/react/colorpicker',
  slots: SLOTS,
  props: {
    label: { type: 'string', required: true, description: 'Names the picker, e.g. "Brand colour".', group: 'data' },
    value: { type: 'string', description: 'Any CSS colour in hex, rgb(), hsl() or oklch(), controlled.', group: 'data' },
    defaultValue: { type: 'string', default: '#6366f1', description: 'The colour at first, when uncontrolled.', group: 'data' },
    onChange: { type: 'function', description: '`(value, color) => void`: the value in `format`, and `{ hex, rgb, hsl, oklch, alpha }`.', group: 'events' },
    format: { type: 'enum', values: ['hex', 'rgb', 'hsl', 'oklch'], default: 'hex', description: 'How the value is written, in the text field and to `onChange`.', group: 'data', control: true },
    alpha: { type: 'boolean', default: false, description: 'An opacity slider; the value carries alpha below 1.', group: 'appearance', control: true },
    swatches: { type: 'string[]', description: 'Colours one press away.', group: 'data' },
    showInput: { type: 'boolean', default: true, description: 'The text field for typing or pasting a colour.', group: 'appearance', control: true },
    eyeDropper: { type: 'boolean', default: true, description: 'A button that picks a colour from the screen, where the browser can (Chromium: EyeDropper API).', group: 'appearance', control: true },
    name: { type: 'string', description: 'Submits the value with a form.', group: 'data' },
    disabled: { type: 'boolean', default: false, description: 'Shown, not changeable; out of the form.', group: 'behaviour', control: true },
    labels: {
      type: 'object',
      description: 'Text read and shown, for translation.',
      group: 'data',
      keys: {
        area: { type: 'string', description: 'Default "Saturation and brightness".', group: 'data' },
        hue: { type: 'string', description: 'Default "Hue".', group: 'data' },
        alpha: { type: 'string', description: 'Default "Opacity".', group: 'data' },
        input: { type: 'string', description: 'Default the format, e.g. "Hex".', group: 'data' },
        eyeDropper: { type: 'string', description: 'Default "Pick a colour from the screen".', group: 'data' },
        swatches: { type: 'string', description: 'Default "Swatches".', group: 'data' },
      },
    },
    radius: RADIUS_PROP,
    size: { type: 'enum', values: ['sm', 'md', 'lg'], default: 'md', description: 'Precedence: this config, `defaults.colorpicker`, the provider, then md.', group: 'appearance', control: true },
    unstyled: { type: 'boolean', default: false, description: 'Drop Pinfold classes; keep the behaviour, roles and data attributes.', group: 'appearance' },
    className: { type: 'string', description: 'Class on the root.', group: 'appearance' },
    style: { type: 'object', description: 'Inline style on the root.', group: 'appearance' },
    classNames: perSlot('Classes per slot.', 'string'),
    styles: perSlot('Inline styles per slot.', 'object'),
    slotProps: perSlot('Any DOM props per slot.', 'object'),
    render: perSlot('Replace a slot element: `({ props, state, children }) => node`.', 'function'),
  },
  keyboard: [
    { keys: 'Arrow Left / Right', action: 'Area: less or more saturation. Sliders: step.' },
    { keys: 'Arrow Up / Down', action: 'Area: more or less brightness. Sliders: step.' },
    { keys: 'Shift + Arrow, Page Up / Down', action: 'Ten steps.' },
    { keys: 'Home / End', action: 'The ends.' },
    { keys: 'Enter', action: 'In the text field: take the typed colour (also on leaving it).' },
  ],
  aria: [
    'A group named by `label`. The area is a slider for saturation (`aria-valuetext` reads both, "saturation 60%, brightness 80%"); hue and opacity are native range inputs.',
    'The text field takes any CSS colour; one that does not parse is marked invalid and reverts on leaving.',
    'Swatches are buttons named by their colour, pressed when current; the eyedropper button shows only where the browser has the API.',
  ],
  dataAttributes: [{ name: 'data-disabled', on: 'root', values: 'present when disabled' }],
  cssVariables: [],
  examples: [
    {
      title: 'A brand colour in OKLCH',
      code: "import { defineColorPicker } from '@pinfold/react/colorpicker';\n\nexport const BrandColor = defineColorPicker({ format: 'oklch', alpha: true });\n\n<BrandColor label=\"Brand colour\" value={color} onChange={setColor} swatches={['#4f46e5', '#0ea5e9', '#16a34a']} />",
    },
  ],
};
