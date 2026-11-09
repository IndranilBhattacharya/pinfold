import type { ComponentMeta, PropMeta } from './meta';
import { RADIUS_PROP } from './meta-shared';

const SLOTS = ['root', 'list', 'step', 'button', 'indicator', 'connector', 'text', 'label', 'description', 'panel', 'actions'] as const;
const perSlot = (description: string, type: PropMeta['type']): PropMeta => ({
  type: 'object',
  description,
  group: 'escape-hatch',
  keys: Object.fromEntries(SLOTS.map((s) => [s, { type, description: `The \`${s}\` slot.`, group: 'escape-hatch' }])),
});

export const stepperMeta: ComponentMeta = {
  name: 'stepper',
  displayName: 'Stepper',
  description:
    'A task in steps: the marks (done, current, error, to come) joined by a line that fills as you go, the current step\'s content, and Back / Next / Finish that can wait on validation.',
  pattern: 'https://www.w3.org/WAI/ARIA/apg/patterns/landmarks/examples/navigation.html',
  importPath: '@pinfold/react/stepper',
  requires: ['button'],
  slots: SLOTS,
  props: {
    items: {
      type: 'array',
      orString: true,
      required: true,
      description: 'One step each. A string is a step with that name: `items={["Cart", "Shipping", "Payment"]}`.',
      group: 'data',
      items: {
        label: { type: 'node', required: true, description: 'The step name.', group: 'data' },
        description: { type: 'node', description: 'A line under it.', group: 'data' },
        icon: { type: 'node', description: 'In the circle instead of the number.', group: 'data' },
        content: { type: 'node', description: 'What the step shows while it is current: a form, a summary. With it, Back and Next show.', group: 'data' },
        optional: { type: 'boolean', description: 'Marked "Optional".', group: 'data' },
        error: { type: 'boolean', description: 'Something needs fixing here: the danger tone and an error mark, read as "error".', group: 'data' },
        disabled: { type: 'boolean', description: 'Never a button, even with `linear: false`.', group: 'behaviour' },
      },
    },
    label: { type: 'string', default: 'Progress', description: 'The accessible name of the list of steps.', group: 'data' },
    value: { type: 'number', description: 'The current step (from 0), controlled. The length of `items` marks every step done.', group: 'data' },
    defaultValue: { type: 'number', default: 0, description: 'The current step when uncontrolled.', group: 'data' },
    onChange: { type: 'function', description: '`(step, event) => void` after Back, Next or a click on a step. With it, steps are buttons: done ones, or any with `linear: false`.', group: 'events' },
    onNext: { type: 'function', description: '`(step) => boolean | Promise<boolean>`: before Next leaves a step. `false` stays (an invalid form); a promise shows Next as loading.', group: 'events' },
    onComplete: { type: 'function', description: '`() => void | Promise`: Finish on the last step (after `onNext`). A promise shows Finish as loading.', group: 'events' },
    linear: { type: 'boolean', default: true, description: 'Only done steps can be clicked. `false`: any step (a non-linear wizard).', group: 'behaviour', control: true, silent: true },
    showActions: { type: 'boolean', default: true, description: 'Back and Next (Finish on the last step) under the content. Off: drive it with the controller.', group: 'appearance', control: true },
    doneContent: { type: 'node', description: 'Shown in the panel once every step is done.', group: 'data' },
    labels: {
      type: 'object',
      description: 'Text shown and read, for translation.',
      group: 'data',
      keys: {
        back: { type: 'string', description: 'Default "Back".', group: 'data' },
        next: { type: 'string', description: 'Default "Next".', group: 'data' },
        finish: { type: 'string', description: 'Default "Finish".', group: 'data' },
        optional: { type: 'string', description: 'Default "Optional".', group: 'data' },
        status: { type: 'object', description: 'Spoken after each step name: `{ complete, current, upcoming, error }`. Default "done", "current", "not started", "error".', group: 'data' },
      },
    },
    variant: { type: 'enum', values: ['circle', 'dot', 'bar'], default: 'circle', description: '`circle`: numbered circles, a check when done. `dot`: small dots. `bar`: a segment per step.', group: 'appearance', control: true },
    orientation: { type: 'enum', values: ['horizontal', 'vertical'], default: 'horizontal', description: 'A row, or a column with each step\'s content opening under it.', group: 'appearance', control: true },
    labelPlacement: { type: 'enum', values: ['bottom', 'end'], default: 'bottom', description: 'Step names under the marks, or beside them (the line runs between steps).', group: 'appearance', control: true },
    radius: RADIUS_PROP,
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
  keyboard: [
    { keys: 'Tab', action: 'Each clickable step, then into the step\'s content, then Back and Next.' },
    { keys: 'Enter / Space', action: 'Go to a clickable step; press Back or Next. After Back or Next, focus moves to the new step\'s content.' },
  ],
  aria: [
    'An ordered list named by `label`: the number of steps is read.',
    'The current step has `aria-current="step"`; each step reads its state ("done", "current", "not started", "error") as hidden text, never colour alone.',
    'The content is a group labelled by its step\'s name. Back and Next are Pinfold buttons: a pending `onNext` sets `aria-busy`.',
    'With `linear` (the default), steps not yet reached are never buttons, so the order of the task is kept.',
  ],
  dataAttributes: [
    { name: 'data-variant', on: 'root', values: '"circle" | "dot" | "bar"' },
    { name: 'data-orientation', on: 'root', values: '"horizontal" | "vertical"' },
    { name: 'data-label-placement', on: 'root', values: '"bottom" | "end"' },
    { name: 'data-size', on: 'root', values: 'the resolved size' },
    { name: 'data-tone', on: 'root', values: 'the resolved tone' },
    { name: 'data-status', on: 'step', values: '"complete" | "current" | "upcoming" | "error"' },
  ],
  cssVariables: [],
  examples: [
    {
      title: 'A checkout wizard',
      code: "import { defineStepper } from '@pinfold/react/stepper';\n\nexport const Checkout = defineStepper();\n\n<Checkout\n  items={[\n    { label: 'Cart', content: <Cart /> },\n    { label: 'Shipping', content: <ShippingForm />, error: !shippingValid },\n    { label: 'Payment', content: <Payment /> },\n  ]}\n  onNext={(step) => (step === 1 ? form.validate() : true)}\n  onComplete={placeOrder}\n  doneContent={<Receipt />}\n/>",
    },
    {
      title: 'Progress only',
      code: "<Checkout value={step} items={['Cart', 'Shipping', 'Payment']} variant=\"bar\" />",
    },
  ],
};
