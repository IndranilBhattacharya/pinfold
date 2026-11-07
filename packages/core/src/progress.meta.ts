import type { ComponentMeta, PropMeta } from './meta';

const SLOTS = ['root', 'label', 'value', 'track', 'indicator'] as const;
const perSlot = (description: string, type: PropMeta['type']): PropMeta => ({
  type: 'object',
  description,
  group: 'escape-hatch',
  keys: Object.fromEntries(SLOTS.map((s) => [s, { type, description: `The \`${s}\` slot.`, group: 'escape-hatch' }])),
});
const len = (description: string): PropMeta => ({ type: 'length', description, group: 'appearance' });

export const progressMeta: ComponentMeta = {
  name: 'progress',
  displayName: 'Progress',
  description: 'How far a task has got (a bar or a ring, determinate or indeterminate), or a measurement within a range (a meter).',
  pattern: 'https://www.w3.org/TR/wai-aria-1.2/#progressbar',
  importPath: '@pinfold/react/progress',
  slots: SLOTS,
  props: {
    value: { type: 'number', description: 'The current value. Leave it unset for an indeterminate progress (work started, length unknown).', group: 'data' },
    min: { type: 'number', default: 0, description: 'The start of the range.', group: 'data' },
    max: { type: 'number', default: 100, description: 'The end of the range.', group: 'data' },
    label: { type: 'node', description: 'What is progressing ("Uploading report.pdf"). Also the accessible name.', group: 'data' },
    hideLabel: { type: 'boolean', default: false, description: 'Keep the label for screen readers only.', group: 'appearance', control: true },
    showValue: { type: 'boolean', default: true, description: 'Show the value text ("42%") next to the label, or inside a ring.', group: 'appearance', control: true },
    formatValue: { type: 'function', description: 'The value text, shown and read: `(value, { min, max, percent }) => string`. Default: a whole percentage ("42%"), the same on server and client.', group: 'appearance' },
    kind: {
      type: 'enum',
      values: ['progress', 'meter'],
      default: 'progress',
      description: '`progress` (`role="progressbar"`) for a task; `meter` (`role="meter"`) for a measurement such as disk usage or a password score.',
      group: 'behaviour',
      control: true,
      silent: true,
    },
    shape: { type: 'enum', values: ['bar', 'circle'], default: 'bar', description: 'A horizontal bar or a ring.', group: 'appearance', control: true },
    size: { type: 'enum', values: ['sm', 'md', 'lg'], default: 'md', description: 'Bar thickness or ring size. Precedence: this config, `defaults.progress`, the provider, then md.', group: 'appearance', control: true },
    tone: {
      type: 'enum',
      values: ['primary', 'neutral', 'success', 'warning', 'danger', 'info'],
      default: 'primary',
      description: 'Colour role. Precedence: this config, `defaults.progress`, the provider, then primary.',
      group: 'appearance',
      control: true,
    },
    dimensions: {
      type: 'object',
      description: 'Exact measurements. Numbers are px.',
      group: 'appearance',
      keys: { thickness: len('Bar height or ring stroke.'), size: len('Ring diameter.'), width: len('Bar length (default: full width).') },
    },
    unstyled: { type: 'boolean', default: false, description: 'Drop Pinfold classes; keep the roles and data attributes.', group: 'appearance' },
    className: { type: 'string', description: 'Class on the root.', group: 'appearance' },
    style: { type: 'object', description: 'Inline style on the root.', group: 'appearance' },
    classNames: perSlot('Classes per slot.', 'string'),
    styles: perSlot('Inline styles per slot.', 'object'),
    slotProps: perSlot('Any DOM props per slot.', 'object'),
    render: perSlot('Replace a slot element: `({ props, state, children }) => node`.', 'function'),
  },
  keyboard: [],
  aria: [
    '`role="progressbar"` (or `role="meter"`) with `aria-valuemin`, `aria-valuemax`, `aria-valuenow` and `aria-valuetext` (the formatted value).',
    'Indeterminate: no `aria-valuenow`, so it is read as busy rather than as 0%.',
    'Named by its label through `aria-labelledby`; `hideLabel` keeps the name and hides the text. Without a label it warns in development.',
    'Not a live region: updates are read when the user reaches it. The indeterminate motion stops under reduced motion and with the provider\'s `disableAnimation`.',
  ],
  dataAttributes: [
    { name: 'data-kind', on: 'root', values: '"progress" | "meter"' },
    { name: 'data-shape', on: 'root', values: '"bar" | "circle"' },
    { name: 'data-size', on: 'root', values: 'the resolved size' },
    { name: 'data-tone', on: 'root', values: 'the resolved tone' },
    { name: 'data-indeterminate', on: 'root', values: 'present without a value' },
  ],
  cssVariables: ['--pinfold-progress-thickness', '--pinfold-progress-size', '--pinfold-progress-width'],
  examples: [
    {
      title: 'Presets',
      code: "import { defineProgress } from '@pinfold/react/progress';\n\nexport const Upload = defineProgress();\nexport const Disk = defineProgress({ kind: 'meter', tone: 'warning', formatValue: (v, { max }) => `${v} of ${max} GB` });\n\n<Upload label=\"Uploading report.pdf\" value={progress} />\n<Disk label=\"Storage\" value={42} max={64} />",
    },
    { title: 'Indeterminate ring', code: "const Busy = defineProgress({ shape: 'circle', hideLabel: true });\n<Busy label=\"Loading results\" />" },
  ],
};
