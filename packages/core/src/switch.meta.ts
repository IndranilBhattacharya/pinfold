import type { ComponentMeta, PropMeta } from './meta';
import { FIELD_ARIA, fieldProps } from './field.meta';

const SLOTS = ['root', 'item', 'input', 'box', 'thumb', 'itemLabel', 'description', 'error'] as const;
const perSlot = (description: string, type: PropMeta['type']): PropMeta => ({
  type: 'object',
  description,
  group: 'escape-hatch',
  keys: Object.fromEntries(SLOTS.map((s) => [s, { type, description: `The \`${s}\` slot.`, group: 'escape-hatch' }])),
});
const len = (description: string): PropMeta => ({ type: 'length', description, group: 'appearance' });

export const switchMeta: ComponentMeta = {
  name: 'switch',
  displayName: 'Switch',
  description: 'An on/off setting that applies at once: a native checkbox with `role="switch"`, its label and error wired up.',
  pattern: 'https://www.w3.org/WAI/ARIA/apg/patterns/switch/',
  importPath: '@pinfold/react/switch',
  slots: SLOTS,
  props: {
    ...fieldProps,
    checked: { type: 'boolean', description: 'Controlled state.', group: 'data' },
    defaultChecked: { type: 'boolean', default: false, description: 'Initial state when uncontrolled. A form reset returns to it.', group: 'data' },
    formValue: { type: 'string', default: 'on', description: 'What the form submits when on.', group: 'data' },
    onChange: { type: 'function', description: '`(checked, event) => void`.', group: 'behaviour' },
    labelPosition: { type: 'enum', values: ['end', 'start'], default: 'end', description: 'The label after the switch, or before it (a settings row).', group: 'appearance', control: true },
    variant: { type: 'enum', values: ['solid', 'slim', 'icon', 'outline'], default: 'solid', description: '`solid`: a filled track and a white thumb. `slim`: a thin rail under a larger thumb. `icon`: the thumb carries a check or a cross. `outline`: a hollow track; the thumb takes the colour.', group: 'appearance', control: true },
    animation: { type: 'enum', values: ['spring', 'slide', 'none'], default: 'spring', description: '`spring`: the thumb stretches while pressed and lands with a little overshoot. `slide`: a plain glide. Reduced motion and `disableAnimation` turn it off.', group: 'appearance', control: true },
    size: { type: 'enum', values: ['sm', 'md', 'lg'], default: 'md', description: 'Track and text size. Precedence: this config, `defaults.switch`, the provider, then md.', group: 'appearance', control: true },
    tone: {
      type: 'enum',
      values: ['primary', 'neutral', 'success', 'warning', 'danger', 'info'],
      default: 'primary',
      description: 'Colour when on. Precedence: this config, `defaults.switch`, the provider, then primary.',
      group: 'appearance',
      control: true,
    },
    dimensions: { type: 'object', description: 'Exact measurements. Numbers are px.', group: 'appearance', keys: { width: len('Track width.'), height: len('Track height.') } },
    unstyled: { type: 'boolean', default: false, description: 'Drop Pinfold classes; keep the behaviour, roles and data attributes.', group: 'appearance' },
    className: { type: 'string', description: 'Class on the root.', group: 'appearance' },
    style: { type: 'object', description: 'Inline style on the root.', group: 'appearance' },
    classNames: perSlot('Classes per slot.', 'string'),
    styles: perSlot('Inline styles per slot.', 'object'),
    slotProps: perSlot('Any DOM props per slot. `slotProps.input` reaches the native element.', 'object'),
    render: perSlot('Replace a slot element: `({ props, state, children }) => node`.', 'function'),
  },
  keyboard: [{ keys: 'Space', action: 'Native: toggles. (Enter does not, as with any checkbox: it submits the form.)' }],
  aria: [
    ...FIELD_ARIA,
    'A native `<input type="checkbox" role="switch">`: read as on or off, submits with forms, needs no scripted key handling. The whole row is its click target.',
    'The thumb moves and the track fills, so state never rests on colour alone. The thumb side flips in RTL.',
  ],
  dataAttributes: [
    { name: 'data-size', on: 'root', values: 'the resolved size' },
    { name: 'data-tone', on: 'root', values: 'the resolved tone' },
    { name: 'data-label-position', on: 'root', values: '"end" | "start"' },
    { name: 'data-variant', on: 'root', values: '"solid" | "slim" | "icon" | "outline"' },
    { name: 'data-invalid', on: 'root', values: 'present when invalid' },
  ],
  cssVariables: ['--pinfold-switch-width', '--pinfold-switch-height'],
  examples: [
    {
      title: 'Presets',
      code: "import { defineSwitch } from '@pinfold/react/switch';\n\nexport const Setting = defineSwitch({ labelPosition: 'start' });\n\n<Setting label=\"Email alerts\" description=\"At most one a day\" defaultChecked onChange={save} />\n\nexport const Wifi = defineSwitch({ variant: 'icon', tone: 'success' });\n<Wifi label=\"Wi-Fi\" />",
    },
  ],
};
