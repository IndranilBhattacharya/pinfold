import type { ComponentMeta, PropMeta } from './meta';
import { RADIUS_PROP } from './meta-shared';
import { FIELD_ARIA, fieldProps } from './field.meta';

const SLOTS = ['root', 'label', 'value', 'control', 'track', 'range', 'steps', 'input', 'thumb', 'marks', 'mark', 'startContent', 'endContent', 'description', 'error'] as const;
const perSlot = (description: string, type: PropMeta['type']): PropMeta => ({
  type: 'object',
  description,
  group: 'escape-hatch',
  keys: Object.fromEntries(SLOTS.map((s) => [s, { type, description: `The \`${s}\` slot.`, group: 'escape-hatch' }])),
});
const len = (description: string): PropMeta => ({ type: 'length', description, group: 'appearance' });
const { label, hideLabel, description, error, invalid, disabled, name, id } = fieldProps;

export const sliderMeta: ComponentMeta = {
  name: 'slider',
  displayName: 'Slider',
  description: 'Pick a number, or a range with two thumbs, by dragging along a track: native range inputs, with marks and a live value.',
  pattern: 'https://www.w3.org/WAI/ARIA/apg/patterns/slider/',
  importPath: '@pinfold/react/slider',
  slots: SLOTS,
  props: {
    label,
    hideLabel,
    description,
    error,
    invalid,
    disabled,
    name,
    id,
    value: { type: 'array', description: 'Controlled values: one number, or two for a range.', group: 'data' },
    defaultValue: { type: 'array', description: 'Initial values when uncontrolled: `[40]`, or `[20, 80]` for a range. A form reset returns to it. Default `[min]`.', group: 'data' },
    onChange: { type: 'function', description: '`(values, event) => void`, while dragging.', group: 'behaviour' },
    onChangeEnd: { type: 'function', description: '`(values) => void`, once the pointer or key is released: the moment to save.', group: 'behaviour' },
    min: { type: 'number', default: 0, description: 'Lowest value.', group: 'data' },
    max: { type: 'number', default: 100, description: 'Highest value.', group: 'data' },
    step: { type: 'number', default: 1, description: 'Values snap to it.', group: 'data' },
    minGap: { type: 'number', default: 0, description: 'A range: the least distance between the thumbs, in values.', group: 'behaviour' },
    marks: { type: 'array', description: 'Ticks on the track: `{ value, label? }` each.', group: 'data', items: { value: { type: 'number', required: true, description: 'Where.', group: 'data' }, label: { type: 'node', description: 'Text under the tick.', group: 'data' } } },
    snapToMarks: { type: 'boolean', default: false, description: 'The thumbs stop only on `marks`: a drag lands on the nearest one, arrow keys move from mark to mark. `step` is then unused.', group: 'behaviour', control: true },
    showSteps: { type: 'boolean', default: false, description: 'A dot on the track at every step. Drawn up to 40 steps.', group: 'appearance', control: true },
    variant: {
      type: 'enum',
      values: ['line', 'bar', 'minimal'],
      default: 'line',
      description: '`line`: a slim track and a round thumb. `bar`: a thick track that fills, with a handle inside the fill. `minimal`: a hairline track whose thumb appears on hover, focus and drag (media scrubbers).',
      group: 'appearance',
      control: true,
    },
    orientation: { type: 'enum', values: ['horizontal', 'vertical'], default: 'horizontal', description: '`vertical`: the track stands up with the minimum at the bottom; length from `dimensions.length`.', group: 'appearance', control: true },
    startContent: { type: 'node', description: 'Before the track: an icon such as a quiet speaker. Decorative.', group: 'appearance' },
    endContent: { type: 'node', description: 'After the track: an icon such as a loud speaker. Decorative.', group: 'appearance' },
    showValue: { type: 'enum', values: ['label', 'tooltip', 'never'], default: 'label', description: '`label`: beside the label. `tooltip`: in a bubble over the thumb while it is hovered, focused or dragged. `never`.', group: 'appearance', control: true },
    formatValue: { type: 'function', description: '`(value) => string`: shown, and read as `aria-valuetext`. Default the number.', group: 'data' },
    thumbLabels: { type: 'array', description: 'A range: the names of the two thumbs, after the label.', group: 'data' },
    radius: RADIUS_PROP,
    size: { type: 'enum', values: ['sm', 'md', 'lg'], default: 'md', description: 'Track and thumb size. Precedence: this config, `defaults.slider`, the provider, then md.', group: 'appearance', control: true },
    tone: {
      type: 'enum',
      values: ['primary', 'neutral', 'success', 'warning', 'danger', 'info'],
      default: 'primary',
      description: 'Colour of the filled range. Precedence: this config, `defaults.slider`, the provider, then primary.',
      group: 'appearance',
      control: true,
    },
    dimensions: { type: 'object', description: 'Exact measurements. Numbers are px.', group: 'appearance', keys: { thickness: len('Track thickness.'), thumbSize: len('Thumb size.'), length: len('Track length when vertical (default 12rem).') } },
    unstyled: { type: 'boolean', default: false, description: 'Drop Pinfold classes; keep the behaviour, roles and data attributes.', group: 'appearance' },
    className: { type: 'string', description: 'Class on the root.', group: 'appearance' },
    style: { type: 'object', description: 'Inline style on the root.', group: 'appearance' },
    classNames: perSlot('Classes per slot.', 'string'),
    styles: perSlot('Inline styles per slot.', 'object'),
    slotProps: perSlot('Any DOM props per slot. `slotProps.input` reaches each native range input.', 'object'),
    render: perSlot('Replace a slot element: `({ props, state, children }) => node`.', 'function'),
  },
  keyboard: [
    { keys: 'Arrow keys', action: 'Native: one step.' },
    { keys: 'Page Up / Page Down', action: 'Native: a larger step.' },
    { keys: 'Home / End', action: 'Native: min / max.' },
    { keys: 'Tab', action: 'Each thumb is its own stop.' },
  ],
  aria: [
    ...FIELD_ARIA.slice(0, 1),
    'Each thumb is a native `<input type="range">`: keyboard, touch, forms and assistive tech are the browser\'s. A range has two, named "label, Minimum" and "label, Maximum" by default.',
    '`formatValue` is read as `aria-valuetext`, so "$40" is read, not "40".',
    'The filled range and marks are decorative; the value is always in the inputs.',
  ],
  dataAttributes: [
    { name: 'data-size', on: 'root', values: 'the resolved size' },
    { name: 'data-tone', on: 'root', values: 'the resolved tone' },
    { name: 'data-range', on: 'root', values: 'present with two thumbs' },
    { name: 'data-variant', on: 'root', values: '"line" | "bar" | "minimal"' },
  ],
  cssVariables: ['--pinfold-slider-thickness', '--pinfold-slider-thumb-size'],
  examples: [
    {
      title: 'Volume and a price range',
      code: "import { defineSlider } from '@pinfold/react/slider';\n\nexport const Volume = defineSlider({ showValue: 'tooltip' });\nexport const Price = defineSlider({ min: 0, max: 500, step: 10, minGap: 20, formatValue: (v) => `$${v}` });\n\n<Volume label=\"Volume\" defaultValue={[60]} onChangeEnd={save} />\n<Price label=\"Price\" name=\"price\" defaultValue={[50, 300]} />",
    },
  ],
};
