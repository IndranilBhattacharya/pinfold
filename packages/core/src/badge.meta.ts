import type { ComponentMeta, PropMeta } from './meta';

const SLOTS = ['root', 'icon', 'label'] as const;
const perSlot = (description: string, type: PropMeta['type']): PropMeta => ({
  type: 'object',
  description,
  group: 'escape-hatch',
  keys: Object.fromEntries(SLOTS.map((s) => [s, { type, description: `The \`${s}\` slot.`, group: 'escape-hatch' }])),
});
const len = (description: string): PropMeta => ({ type: 'length', description, group: 'appearance' });

export const badgeMeta: ComponentMeta = {
  name: 'badge',
  displayName: 'Badge',
  description: 'A short status label, a count ("99+") or a dot, in six tones. Static text, never a control.',
  pattern: 'https://www.w3.org/WAI/WCAG22/Understanding/use-of-color.html',
  importPath: '@pinfold/react/badge',
  slots: SLOTS,
  props: {
    label: {
      type: 'node',
      description: 'The text ("New", "Beta"). With `count` or `dot` it is not shown but read after the number: `{ count: 3, label: "unread messages" }`.',
      group: 'data',
    },
    count: { type: 'number', description: 'Show a number instead of the label. Zero hides the badge unless `showZero`.', group: 'data' },
    max: { type: 'number', default: 99, description: 'Counts above it show as "max+".', group: 'behaviour' },
    showZero: { type: 'boolean', default: false, description: 'Keep a badge with `count: 0` visible.', group: 'behaviour', control: true },
    dot: { type: 'boolean', default: false, description: 'A small dot only; `label` becomes its spoken text.', group: 'appearance', control: true },
    icon: { type: 'node', description: 'An icon before the text. Decorative (`aria-hidden`).', group: 'data' },
    variant: { type: 'enum', values: ['solid', 'soft', 'outline'], default: 'solid', description: 'A filled badge, a tinted one, or a frame.', group: 'appearance', control: true },
    size: { type: 'enum', values: ['sm', 'md', 'lg'], default: 'md', description: 'Size preset. Precedence: this config, `defaults.badge`, the provider, then md.', group: 'appearance', control: true },
    tone: {
      type: 'enum',
      values: ['primary', 'neutral', 'success', 'warning', 'danger', 'info'],
      default: 'primary',
      description: 'Colour role. Precedence: this config, `defaults.badge`, the provider, then primary.',
      group: 'appearance',
      control: true,
    },
    radius: { type: 'enum', values: ['none', 'sm', 'md', 'full'], default: 'full', description: 'Corner shape: square to pill.', group: 'appearance', control: true },
    placement: {
      type: 'enum',
      values: ['inline', 'top-end', 'top-start', 'bottom-end', 'bottom-start'],
      default: 'inline',
      description: 'In the text flow, or pinned to a corner of the nearest positioned parent (an icon button, an avatar). Corners are logical, so they flip in RTL.',
      group: 'appearance',
      control: true,
    },
    dimensions: {
      type: 'object',
      description: 'Exact measurements. Numbers are px.',
      group: 'appearance',
      keys: {
        height: len('Badge height.'),
        paddingX: len('Inline padding.'),
        gap: len('Space between icon and text.'),
        fontSize: len('Font size.'),
        dotSize: len('Diameter of a dot.'),
      },
    },
    unstyled: { type: 'boolean', default: false, description: 'Drop Pinfold classes; keep the text and data attributes.', group: 'appearance' },
    className: { type: 'string', description: 'Class on the root.', group: 'appearance' },
    style: { type: 'object', description: 'Inline style on the root.', group: 'appearance' },
    classNames: perSlot('Classes per slot.', 'string'),
    styles: perSlot('Inline styles per slot.', 'object'),
    slotProps: perSlot('Any DOM props per slot.', 'object'),
    render: perSlot('Replace a slot element: `({ props, state, children }) => node`.', 'function'),
  },
  keyboard: [],
  aria: [
    'Plain text in a `<span>`: no role, not focusable, not a live region (a changing count does not interrupt the reader).',
    'A count or dot reads its `label` from visually hidden text: "3 unread messages", "Online". A dot without a label is skipped by screen readers.',
    'Colour never carries the meaning alone: the label (or spoken text) says it, and forced-colours mode draws a border.',
    'A count of zero is `hidden`, so it is neither seen nor read.',
  ],
  dataAttributes: [
    { name: 'data-variant', on: 'root', values: '"solid" | "soft" | "outline"' },
    { name: 'data-size', on: 'root', values: 'the resolved size' },
    { name: 'data-tone', on: 'root', values: 'the resolved tone' },
    { name: 'data-radius', on: 'root', values: '"none" | "sm" | "md" | "full"' },
    { name: 'data-placement', on: 'root', values: 'the placement' },
    { name: 'data-kind', on: 'root', values: '"label" | "count" | "dot"' },
  ],
  cssVariables: ['--pinfold-badge-height', '--pinfold-badge-padding-x', '--pinfold-badge-gap', '--pinfold-badge-font-size', '--pinfold-badge-dot-size'],
  examples: [
    {
      title: 'Presets',
      code: "import { defineBadge } from '@pinfold/react/badge';\n\nexport const Status = defineBadge({ variant: 'soft' });\nexport const Unread = defineBadge({ tone: 'danger', label: 'unread messages' });\n\n<Status label=\"Beta\" tone=\"info\" />\n<Unread count={120} />        // \"99+\", read as \"99+ unread messages\"",
    },
    {
      title: 'On an icon button',
      code: "const Online = defineBadge({ dot: true, tone: 'success', placement: 'bottom-end', label: 'Online' });\n<span style={{ position: 'relative', display: 'inline-flex' }}>\n  <Avatar />\n  <Online />\n</span>",
    },
  ],
};
