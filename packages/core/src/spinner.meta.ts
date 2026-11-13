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
    variant: {
      type: 'enum',
      values: ['ring', 'arc', 'dots', 'bars', 'pulse', 'orbit', 'dual', 'track'],
      default: 'ring',
      description:
        'The animation: a turning ring, a comet arc, rising dots, an equaliser, a breathing dot with a ripple, a dot in orbit, two counter-turning rings (`dual`), or an arc that grows and shrinks on a visible track (`track`).',
      group: 'appearance',
      control: true,
    },
    speed: {
      type: 'enum',
      values: ['slow', 'normal', 'fast'],
      default: 'normal',
      description: 'Pace of the cycle. `dimensions.duration` sets an exact one.',
      group: 'appearance',
      control: true,
    },
    thickness: {
      type: 'enum',
      values: ['thin', 'normal', 'thick'],
      default: 'normal',
      description: 'Stroke weight of the stroked variants (ring, arc, dual, track, orbit). `dimensions.thickness` sets an exact one.',
      group: 'appearance',
      control: true,
    },
    size: {
      type: 'enum',
      values: ['sm', 'md', 'lg'],
      default: 'md',
      description: 'Size preset: 16, 24 or 36 px. Precedence: this config, `defaults.spinner`, the provider, then md.',
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
        thickness: { type: 'length', description: 'Stroke thickness (ring, arc, dual, track, orbit). Wins over `thickness`.', group: 'appearance' },
        duration: { type: 'length', description: 'One cycle, e.g. `\'1.2s\'`. Wins over `speed`; slower under reduced motion unless set.', group: 'appearance' },
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
    'Keeps moving under `prefers-reduced-motion` (it is the only signal), but at less than half speed, whatever the `speed`.',
    'The moving parts are decorative spans inside the status, never read.',
  ],
  dataAttributes: [
    { name: 'data-variant', on: 'root', values: '"ring" | "arc" | "dots" | "bars" | "pulse" | "orbit" | "dual" | "track"' },
    { name: 'data-speed', on: 'root', values: '"slow" | "normal" | "fast"' },
    { name: 'data-thickness', on: 'root', values: '"thin" | "normal" | "thick"' },
    { name: 'data-size', on: 'root', values: 'the resolved size' },
    { name: 'data-tone', on: 'root', values: 'the resolved tone' },
  ],
  cssVariables: ['--pinfold-spinner-size', '--pinfold-spinner-thickness', '--pinfold-spinner-duration'],
  examples: [
    { title: 'Preset', code: "import { defineSpinner } from '@pinfold/react/spinner';\n\nexport const InlineSpinner = defineSpinner({ variant: 'dots', label: '', tone: 'current', size: 'sm' });\n// <p><InlineSpinner /> Loading results…</p>" },
    { title: 'Variants', code: "export const Track = defineSpinner({ variant: 'track', thickness: 'thick' });\nexport const Calm = defineSpinner({ variant: 'pulse', speed: 'slow', tone: 'neutral' });" },
    { title: 'Client hook', code: "import { useSpinner } from '@pinfold/react/spinner';\n\nconst Loading = useSpinner({ label: 'Loading invoices' });\nreturn <Loading />;" },
    { title: 'Decorative, next to text', code: "const Loading = useSpinner({ label: '', tone: 'current' });\nreturn <p><Loading /> Loading results…</p>;" },
  ],
};
