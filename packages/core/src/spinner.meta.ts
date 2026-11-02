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
  description: 'An indeterminate loading indicator with a status label, from one config object.',
  pattern: 'https://www.w3.org/TR/wai-aria-1.2/#status',
  importPath: '@pinfold/react/spinner',
  slots: SLOTS,
  props: {
    size: {
      type: 'enum',
      values: ['sm', 'md', 'lg'],
      default: 'md',
      description: 'Size preset (the icon size of a control of that size). Precedence: this config, `defaults.spinner`, the provider, then md.',
      group: 'appearance',
      control: true,
    },
    tone: {
      type: 'enum',
      values: ['primary', 'neutral', 'success', 'warning', 'danger', 'info', 'current'],
      default: 'primary',
      description: 'Colour role, or `current` for the surrounding text colour. Precedence: this config, `defaults.spinner`, the provider, then primary.',
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
    style: { type: 'object', description: 'Inline style on the root.', group: 'appearance' },
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
    { name: 'data-size', on: 'root', values: 'the resolved size' },
    { name: 'data-tone', on: 'root', values: 'the resolved tone' },
  ],
  cssVariables: ['--pinfold-spinner-size', '--pinfold-spinner-thickness'],
  examples: [
    { title: 'Client hook', code: "import { useSpinner } from '@pinfold/react/spinner';\n\nconst Loading = useSpinner({ label: 'Loading invoices' });\nreturn <Loading />;" },
    { title: 'Decorative, next to text', code: "const Loading = useSpinner({ label: '', tone: 'current' });\nreturn <p><Loading /> Loading results…</p>;" },
  ],
};
