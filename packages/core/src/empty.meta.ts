import type { ComponentMeta, PropMeta } from './meta';

const SLOTS = ['root', 'media', 'title', 'description', 'actions'] as const;
const perSlot = (description: string, type: PropMeta['type']): PropMeta => ({
  type: 'object',
  description,
  group: 'escape-hatch',
  keys: Object.fromEntries(SLOTS.map((s) => [s, { type, description: `The \`${s}\` slot.`, group: 'escape-hatch' }])),
});

export const emptyMeta: ComponentMeta = {
  name: 'empty',
  displayName: 'Empty',
  description: 'An empty state: what is missing and what to do about it, where a list, a search or a page has nothing to show yet. An icon, a heading, a line and actions.',
  pattern: 'https://www.w3.org/WAI/tutorials/page-structure/headings/',
  importPath: '@pinfold/react/empty',
  requires: ['button'],
  slots: SLOTS,
  props: {
    title: { type: 'node', required: true, description: 'What is missing: "No invoices yet". A real heading.', group: 'data' },
    description: { type: 'node', description: 'What to do about it.', group: 'data' },
    media: { type: 'node', description: 'An icon or picture above the text (decorative). Default a tray; `null` for none.', group: 'data' },
    actions: { type: 'array', description: 'Button configs; the first is the main one.', group: 'data' },
    headingLevel: { type: 'enum', values: [2, 3, 4, 5, 6], default: 3, description: 'The title\'s heading level, to fit the page outline.', group: 'appearance' },
    variant: { type: 'enum', values: ['plain', 'dashed', 'card'], default: 'plain', description: 'On the page, in a dashed drop-zone frame, or on a raised card.', group: 'appearance', control: true },
    size: { type: 'enum', values: ['sm', 'md', 'lg'], default: 'md', description: 'Precedence: this config, `defaults.empty`, the provider, then md.', group: 'appearance', control: true },
    tone: { type: 'enum', values: ['primary', 'neutral', 'success', 'warning', 'danger', 'info'], default: 'primary', description: 'The icon tile and the main action. Precedence: this config, `defaults.empty`, the provider, then primary.', group: 'appearance', control: true },
    unstyled: { type: 'boolean', default: false, description: 'Drop Pinfold classes; keep the behaviour, roles and data attributes.', group: 'appearance' },
    className: { type: 'string', description: 'Class on the root.', group: 'appearance' },
    style: { type: 'object', description: 'Inline style on the root.', group: 'appearance' },
    classNames: perSlot('Classes per slot.', 'string'),
    styles: perSlot('Inline styles per slot.', 'object'),
    slotProps: perSlot('Any DOM props per slot.', 'object'),
    render: perSlot('Replace a slot element: `({ props, state, children }) => node`.', 'function'),
  },
  keyboard: [{ keys: 'Tab', action: 'The actions.' }],
  aria: ['The title is a real heading (`headingLevel`), so the empty state is found in the page outline; the media is decorative.', 'Actions are Pinfold buttons.'],
  dataAttributes: [{ name: 'data-variant', on: 'root', values: '"plain" | "dashed" | "card"' }],
  cssVariables: [],
  examples: [
    { title: 'No results', code: "import { defineEmpty } from '@pinfold/react/empty';\n\nexport const NoResults = defineEmpty();\n\n<NoResults title=\"No results\" description=\"Try fewer filters.\" actions={[{ label: 'Clear filters', onClick: clear }]} />" },
  ],
};
