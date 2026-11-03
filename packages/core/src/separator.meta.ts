import type { ComponentMeta, PropMeta } from './meta';

const SLOTS = ['root', 'line', 'label'] as const;
const perSlot = (description: string, type: PropMeta['type']): PropMeta => ({
  type: 'object',
  description,
  group: 'escape-hatch',
  keys: Object.fromEntries(SLOTS.map((s) => [s, { type, description: `The \`${s}\` slot.`, group: 'escape-hatch' }])),
});
const len = (description: string): PropMeta => ({ type: 'length', description, group: 'appearance' });

export const separatorMeta: ComponentMeta = {
  name: 'separator',
  displayName: 'Separator',
  description: 'A line between groups of content, optionally with a label ("or"), solid, dashed or dotted.',
  pattern: 'https://www.w3.org/TR/wai-aria-1.2/#separator',
  importPath: '@pinfold/react/separator',
  slots: SLOTS,
  props: {
    label: { type: 'node', description: 'Text in the line, e.g. "or". Read as ordinary text.', group: 'data' },
    orientation: {
      type: 'enum',
      values: ['horizontal', 'vertical'],
      default: 'horizontal',
      description: 'A vertical separator stretches to the height of its row.',
      group: 'appearance',
      control: true,
    },
    variant: { type: 'enum', values: ['solid', 'dashed', 'dotted'], default: 'solid', description: 'Line style.', group: 'appearance', control: true },
    labelPosition: { type: 'enum', values: ['start', 'center', 'end'], default: 'center', description: 'Where the label sits along the line.', group: 'appearance', control: true },
    spacing: {
      type: 'enum',
      values: ['none', 'sm', 'md', 'lg'],
      default: 'none',
      description: 'Space on both sides of the line (above and below, or left and right).',
      group: 'appearance',
      control: true,
    },
    decorative: {
      type: 'boolean',
      default: true,
      description: 'Purely visual (hidden from assistive tech). Set `false` when it separates sections that a screen reader should hear as separate.',
      group: 'behaviour',
      control: true,
    },
    dimensions: {
      type: 'object',
      description: 'Exact measurements. Numbers are px.',
      group: 'appearance',
      keys: { thickness: len('Line thickness.'), spacing: len('Space on both sides. Overrides `spacing`.'), length: len('Line length (default: the full width or height).') },
    },
    unstyled: { type: 'boolean', default: false, description: 'Drop Pinfold classes; keep the role and data attributes.', group: 'appearance' },
    className: { type: 'string', description: 'Class on the root.', group: 'appearance' },
    style: { type: 'object', description: 'Inline style on the root.', group: 'appearance' },
    classNames: perSlot('Classes per slot.', 'string'),
    styles: perSlot('Inline styles per slot.', 'object'),
    slotProps: perSlot('Any DOM props per slot.', 'object'),
    render: perSlot('Replace a slot element: `({ props, state, children }) => node`.', 'function'),
  },
  keyboard: [],
  aria: [
    'Decorative by default: `role="none"`, so screen readers skip it.',
    '`decorative: false` gives `role="separator"` (with `aria-orientation` when vertical).',
    'A label is ordinary text; the lines around it are decorative.',
  ],
  dataAttributes: [
    { name: 'data-orientation', on: 'root', values: '"horizontal" | "vertical"' },
    { name: 'data-variant', on: 'root', values: '"solid" | "dashed" | "dotted"' },
    { name: 'data-label-position', on: 'root', values: '"start" | "center" | "end"' },
    { name: 'data-spacing', on: 'root', values: '"none" | "sm" | "md" | "lg"' },
  ],
  cssVariables: ['--pinfold-separator-thickness', '--pinfold-separator-spacing', '--pinfold-separator-length'],
  examples: [
    { title: 'Preset', code: "import { defineSeparator } from '@pinfold/react/separator';\n\nexport const Divider = defineSeparator({ spacing: 'md' });\nexport const Or = defineSeparator({ label: 'or', spacing: 'lg' });\n\n<Divider />\n<Or />" },
    { title: 'Between toolbar groups', code: "const Vertical = defineSeparator({ orientation: 'vertical', spacing: 'sm' });\n<div style={{ display: 'flex' }}>…<Vertical />…</div>" },
  ],
};
