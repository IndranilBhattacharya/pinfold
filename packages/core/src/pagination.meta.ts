import type { ComponentMeta, PropMeta } from './meta';

const SLOTS = ['root', 'list', 'item', 'gap', 'previous', 'next', 'first', 'last'] as const;
const perSlot = (description: string, type: PropMeta['type']): PropMeta => ({
  type: 'object',
  description,
  group: 'escape-hatch',
  keys: Object.fromEntries(SLOTS.map((s) => [s, { type, description: `The \`${s}\` slot.`, group: 'escape-hatch' }])),
});

export const paginationMeta: ComponentMeta = {
  name: 'pagination',
  displayName: 'Pagination',
  description: 'Move between pages of results: numbered pages around the current one, gaps for the rest, previous and next. Buttons, or real links for crawlable pages.',
  pattern: 'https://www.w3.org/WAI/ARIA/apg/patterns/landmarks/examples/navigation.html',
  importPath: '@pinfold/react/pagination',
  slots: SLOTS,
  props: {
    count: { type: 'number', required: true, description: 'How many pages there are.', group: 'data' },
    page: { type: 'number', description: 'The current page (from 1), controlled.', group: 'data' },
    defaultPage: { type: 'number', default: 1, description: 'The current page when uncontrolled.', group: 'data' },
    onChange: { type: 'function', description: '`(page, event) => void`.', group: 'behaviour' },
    getHref: { type: 'function', description: '`(page) => string`: every page is a real link (crawlable, opens in a new tab). Without it, pages are buttons.', group: 'data' },
    label: { type: 'string', default: 'Pagination', description: 'The accessible name of the navigation landmark.', group: 'data' },
    siblings: { type: 'number', default: 1, description: 'Pages shown either side of the current one.', group: 'behaviour' },
    boundaries: { type: 'number', default: 1, description: 'Pages always shown at each end.', group: 'behaviour' },
    showControls: { type: 'boolean', default: true, description: 'Previous and next buttons.', group: 'appearance', control: true },
    showEdges: { type: 'boolean', default: false, description: 'First and last buttons too.', group: 'appearance', control: true },
    variant: {
      type: 'enum',
      values: ['ghost', 'soft', 'outline'],
      default: 'ghost',
      description: 'The other pages: quiet, tinted or framed. The current page is always filled with the tone.',
      group: 'appearance',
      control: true,
    },
    size: { type: 'enum', values: ['sm', 'md', 'lg'], default: 'md', description: 'Precedence: this config, `defaults.pagination`, the provider, then md.', group: 'appearance', control: true },
    tone: {
      type: 'enum',
      values: ['primary', 'neutral', 'success', 'warning', 'danger', 'info'],
      default: 'primary',
      description: 'Colour of the current page. Precedence: this config, `defaults.pagination`, the provider, then primary.',
      group: 'appearance',
      control: true,
    },
    disabled: { type: 'boolean', default: false, description: 'Every control.', group: 'behaviour', control: true },
    labels: {
      type: 'object',
      description: 'Names read by screen readers, for translation.',
      group: 'data',
      keys: {
        previous: { type: 'string', description: 'Default "Previous page".', group: 'data' },
        next: { type: 'string', description: 'Default "Next page".', group: 'data' },
        first: { type: 'string', description: 'Default "First page".', group: 'data' },
        last: { type: 'string', description: 'Default "Last page".', group: 'data' },
        page: { type: 'function', description: '`(page) => string`. Default "Page 3".', group: 'data' },
      },
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
    { keys: 'Tab', action: 'Each page and control in turn.' },
    { keys: 'Enter / Space', action: 'Go to that page.' },
  ],
  aria: [
    '`<nav>` named by `label`, around a list: a landmark, and the number of items is read.',
    'The current page has `aria-current="page"`. Each page reads "Page 3"; gaps are hidden from screen readers.',
    'Previous and next at the ends are disabled with `aria-disabled`: they stay focusable, so the row does not shift focus away.',
  ],
  dataAttributes: [
    { name: 'data-variant', on: 'root', values: '"ghost" | "soft" | "outline"' },
    { name: 'data-size', on: 'root', values: 'the resolved size' },
    { name: 'data-tone', on: 'root', values: 'the resolved tone' },
    { name: 'data-current', on: 'item', values: 'present on the current page' },
  ],
  cssVariables: [],
  examples: [
    {
      title: 'Results pages',
      code: "import { definePagination } from '@pinfold/react/pagination';\n\nexport const Pages = definePagination();\n\n<Pages count={24} page={page} onChange={setPage} />\n<Pages count={24} defaultPage={3} getHref={(p) => `/blog?page=${p}`} />",
    },
  ],
};
