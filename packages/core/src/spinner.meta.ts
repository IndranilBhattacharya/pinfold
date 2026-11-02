import type { ComponentMeta, PropMeta } from './meta';

const SLOTS = ['root'] as const;

const perSlot = (description: string, type: PropMeta['type']): PropMeta => ({
  type: 'object',
  description,
  group: 'escape-hatch',
  keys: Object.fromEntries(SLOTS.map((s) => [s, { type, description: `The \`${s}\` slot.`, group: 'escape-hatch' }])),
});

export const spinnerMeta: ComponentMeta = {
  name: 'spinner',
  displayName: 'Spinner',
  kind: 'atom',
  description: 'An indeterminate loading indicator with a live status label.',
  pattern: 'https://www.w3.org/TR/wai-aria-1.2/#status',
  importPath: '@pinfold/react/spinner',
  slots: SLOTS,
  props: {
    size: {
      type: 'enum',
      values: ['sm', 'md', 'lg'],
      auto: 'provider, md',
      description: 'Size preset, matching the icon size of a control of that size.',
      group: 'appearance',
      control: true,
    },
    tone: {
      type: 'enum',
      values: ['primary', 'neutral', 'success', 'warning', 'danger', 'info'],
      auto: 'current text colour',
      description: 'Colour role. Unset follows the surrounding text colour.',
      group: 'appearance',
      control: true,
    },
    label: {
      type: 'string',
      default: 'Loading',
      description: 'What a screen reader announces. An empty string makes the spinner decorative (no role, hidden).',
      group: 'data',
    },
    dimensions: {
      type: 'object',
      description: 'Exact measurements, each winning over the size preset. Numbers are px.',
      group: 'appearance',
      keys: {
        size: { type: 'length', description: 'Diameter.', group: 'appearance' },
        thickness: { type: 'length', description: 'Ring thickness.', group: 'appearance' },
      },
    },
    unstyled: {
      type: 'boolean',
      default: false,
      description: 'Drop Pinfold classes; keep the role, label and data attributes.',
      group: 'appearance',
    },
    className: { type: 'string', description: 'Class on the root.', group: 'appearance' },
    classNames: perSlot('Classes per slot.', 'string'),
    styles: perSlot('Inline styles per slot.', 'object'),
    slotProps: perSlot('Any DOM props per slot.', 'object'),
    render: perSlot('Replace a slot element: `({ props, state, children }) => node`.', 'function'),
  },
  keyboard: [],
  aria: [
    '`role="status"` with the label as its accessible name, so it is announced politely once.',
    '`label=""` makes it decorative: no role and `aria-hidden`, e.g. next to visible "Loading…" text.',
    'Keeps turning under `prefers-reduced-motion` (it is the only signal), but slower.',
  ],
  dataAttributes: [
    { name: 'data-size', on: 'root', values: 'present only when `size` is set' },
    { name: 'data-tone', on: 'root', values: 'present only when `tone` is set' },
  ],
  cssVariables: ['--pinfold-spinner-size', '--pinfold-spinner-thickness'],
  examples: [
    { title: 'Basic', code: "import { Spinner } from '@pinfold/react/spinner';\n\n<Spinner />" },
    { title: 'Decorative, next to text', code: '<p><Spinner label="" /> Loading results…</p>' },
  ],
};
