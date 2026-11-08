import type { ComponentMeta, PropMeta } from './meta';

const SLOTS = ['root', 'step', 'button', 'indicator', 'connector', 'text', 'label', 'description'] as const;
const perSlot = (description: string, type: PropMeta['type']): PropMeta => ({
  type: 'object',
  description,
  group: 'escape-hatch',
  keys: Object.fromEntries(SLOTS.map((s) => [s, { type, description: `The \`${s}\` slot.`, group: 'escape-hatch' }])),
});

export const stepperMeta: ComponentMeta = {
  name: 'stepper',
  displayName: 'Stepper',
  description: 'Progress through the steps of a task: done, current and still to come, joined by a line that fills as you go. Visited steps can be revisited.',
  pattern: 'https://www.w3.org/WAI/ARIA/apg/patterns/landmarks/examples/navigation.html',
  importPath: '@pinfold/react/stepper',
  slots: SLOTS,
  props: {
    items: {
      type: 'array',
      required: true,
      description: 'One step each.',
      group: 'data',
      items: {
        label: { type: 'node', required: true, description: 'The step name.', group: 'data' },
        description: { type: 'node', description: 'A line under it.', group: 'data' },
        icon: { type: 'node', description: 'In the circle instead of the number.', group: 'data' },
      },
    },
    label: { type: 'string', default: 'Progress', description: 'The accessible name of the list.', group: 'data' },
    value: { type: 'number', description: 'The current step (from 0), controlled. The length of `items` marks every step done.', group: 'data' },
    defaultValue: { type: 'number', default: 0, description: 'The current step when uncontrolled.', group: 'data' },
    onChange: { type: 'function', description: '`(step, event) => void`: with it, done steps are buttons that go back to them.', group: 'behaviour' },
    variant: {
      type: 'enum',
      values: ['circle', 'dot', 'bar'],
      default: 'circle',
      description: '`circle`: numbered circles (a check when done) joined by a line. `dot`: small dots, for many steps. `bar`: a segment per step with the names under it.',
      group: 'appearance',
      control: true,
    },
    orientation: { type: 'enum', values: ['horizontal', 'vertical'], default: 'horizontal', description: 'A row, or a column with the names beside the marks.', group: 'appearance', control: true },
    size: { type: 'enum', values: ['sm', 'md', 'lg'], default: 'md', description: 'Precedence: this config, `defaults.stepper`, the provider, then md.', group: 'appearance', control: true },
    tone: {
      type: 'enum',
      values: ['primary', 'neutral', 'success', 'warning', 'danger', 'info'],
      default: 'primary',
      description: 'Colour of done and current steps. Precedence: this config, `defaults.stepper`, the provider, then primary.',
      group: 'appearance',
      control: true,
    },
    unstyled: { type: 'boolean', default: false, description: 'Drop Pinfold classes; keep the behaviour, roles and data attributes.', group: 'appearance' },
    className: { type: 'string', description: 'Class on the root.', group: 'appearance' },
    style: { type: 'object', description: 'Inline style on the root.', group: 'appearance' },
    classNames: perSlot('Classes per slot.', 'string'),
    styles: perSlot('Inline styles per slot.', 'object'),
    slotProps: perSlot('Any DOM props per slot.', 'object'),
    render: perSlot('Replace a slot element: `({ props, state, children }) => node`.', 'function'),
  },
  keyboard: [{ keys: 'Tab / Enter', action: 'With `onChange`, each done step is a button: Tab to it, Enter goes back.' }],
  aria: [
    'An ordered list named by `label`: the number of steps is read.',
    'The current step has `aria-current="step"`; each step reads its state ("done", "current", "not started") as hidden text, never colour alone.',
    'Steps not yet reached are never buttons, so the order of the task is kept.',
  ],
  dataAttributes: [
    { name: 'data-variant', on: 'root', values: '"circle" | "dot" | "bar"' },
    { name: 'data-orientation', on: 'root', values: '"horizontal" | "vertical"' },
    { name: 'data-size', on: 'root', values: 'the resolved size' },
    { name: 'data-tone', on: 'root', values: 'the resolved tone' },
    { name: 'data-status', on: 'step', values: '"complete" | "current" | "upcoming"' },
  ],
  cssVariables: [],
  examples: [
    {
      title: 'Checkout steps',
      code: "import { defineStepper } from '@pinfold/react/stepper';\n\nexport const Checkout = defineStepper();\n\n<Checkout value={step} onChange={setStep} items={[\n  { label: 'Cart' },\n  { label: 'Shipping', description: 'Address and speed' },\n  { label: 'Payment' },\n]} />",
    },
  ],
};
