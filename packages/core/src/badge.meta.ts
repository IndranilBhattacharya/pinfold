import type { ComponentMeta, PropMeta } from './meta';

const SLOTS = ['root', 'dot', 'icon', 'label', 'count', 'anchor'] as const;
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
  description: 'A short status label, a count, a status dot, or any mix of them, in the text flow or pinned to an anchor such as an avatar or an icon button.',
  pattern: 'https://www.w3.org/WAI/WCAG22/Understanding/use-of-color.html',
  importPath: '@pinfold/react/badge',
  slots: SLOTS,
  props: {
    label: { type: 'node', description: 'The text ("Beta", "Inbox"). Always shown.', group: 'data' },
    count: { type: 'number', description: 'A number, shown after the label if there is one. Zero does not show unless `showZero`; a badge with nothing else to show hides.', group: 'data' },
    max: { type: 'number', default: 99, description: 'Counts above it show as "max+".', group: 'behaviour' },
    showZero: { type: 'boolean', default: false, description: 'Show a `count` of 0.', group: 'behaviour', control: true },
    dot: { type: 'boolean', default: false, description: 'A status dot: before the label ("● Online"), or on its own.', group: 'appearance', control: true },
    icon: { type: 'node', description: 'An icon before the label. Decorative (`aria-hidden`).', group: 'data' },
    srLabel: {
      type: 'string',
      description: 'Read by screen readers, never shown: what a bare number or dot means. `{ count: 3, srLabel: "unread messages" }` is read "3 unread messages".',
      group: 'data',
    },
    anchor: { type: 'node', description: 'Pin the badge to this: an avatar, an icon button, anything. The two render together in a positioned wrapper.', group: 'data' },
    placement: { type: 'enum', values: ['top-end', 'top-start', 'bottom-end', 'bottom-start'], default: 'top-end', description: 'Which corner of the anchor. Logical, so it flips in RTL.', group: 'appearance', control: true },
    anchorShape: { type: 'enum', values: ['rect', 'circle'], default: 'rect', description: '`circle` tucks the badge in, onto the edge of a round anchor.', group: 'appearance', control: true },
    variant: { type: 'enum', values: ['soft', 'solid', 'outline'], default: 'soft', description: 'A tint with a fine ring, a filled badge, or a frame.', group: 'appearance', control: true },
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
    dimensions: {
      type: 'object',
      description: 'Exact measurements. Numbers are px.',
      group: 'appearance',
      keys: {
        height: len('Badge height.'),
        paddingX: len('Inline padding.'),
        gap: len('Space between the parts.'),
        fontSize: len('Font size.'),
        dotSize: len('Diameter of the dot.'),
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
    '`srLabel` is visually hidden text, read after what shows: "3 unread messages", "Online". A dot on its own without one warns in development: it says nothing to a screen reader.',
    'Colour never carries the meaning alone: the label or `srLabel` says it, and forced-colours mode draws a border.',
    'A badge with nothing to show (a count of zero and no label) is `hidden`: neither seen nor read.',
    'A pinned badge ignores the pointer, so it never steals a click from the anchor under it.',
  ],
  dataAttributes: [
    { name: 'data-variant', on: 'root', values: '"soft" | "solid" | "outline"' },
    { name: 'data-size', on: 'root', values: 'the resolved size' },
    { name: 'data-tone', on: 'root', values: 'the resolved tone' },
    { name: 'data-radius', on: 'root', values: '"none" | "sm" | "md" | "full"' },
    { name: 'data-dot-only', on: 'root', values: 'present for a dot on its own' },
    { name: 'data-placement', on: 'root', values: 'the corner, when anchored' },
    { name: 'data-anchor-shape', on: 'root', values: '"rect" | "circle", when anchored' },
  ],
  cssVariables: ['--pinfold-badge-height', '--pinfold-badge-padding-x', '--pinfold-badge-gap', '--pinfold-badge-font-size', '--pinfold-badge-dot-size'],
  examples: [
    {
      title: 'Presets',
      code: "import { defineBadge } from '@pinfold/react/badge';\n\nexport const Status = defineBadge({ dot: true });\nexport const Unread = defineBadge({ tone: 'danger', variant: 'solid', srLabel: 'unread messages' });\n\n<Status label=\"Online\" tone=\"success\" />   // ● Online\n<Unread label=\"Inbox\" count={3} />          // Inbox 3, read \"Inbox 3 unread messages\"",
    },
    {
      title: 'On an anchor',
      code: "const Notify = defineBadge({ tone: 'danger', variant: 'solid', srLabel: 'unread' });\nconst Online = defineBadge({ dot: true, tone: 'success', anchorShape: 'circle', placement: 'bottom-end', srLabel: 'Online' });\n\n<Notify count={3} anchor={<Button label=\"Inbox\" variant=\"outline\" />} />\n<Online anchor={<Avatar name=\"Ada Lovelace\" />} />",
    },
  ],
};
