import type { ComponentMeta, PropMeta } from './meta';

const SLOTS = ['root', 'list', 'item', 'link', 'icon', 'separator', 'ellipsis'] as const;
const perSlot = (description: string, type: PropMeta['type']): PropMeta => ({
  type: 'object',
  description,
  group: 'escape-hatch',
  keys: Object.fromEntries(SLOTS.map((s) => [s, { type, description: `The \`${s}\` slot.`, group: 'escape-hatch' }])),
});

export const breadcrumbMeta: ComponentMeta = {
  name: 'breadcrumb',
  displayName: 'Breadcrumb',
  description: 'The path to the current page as a trail of links, collapsing the middle of a long trail behind a button that reveals it.',
  pattern: 'https://www.w3.org/WAI/ARIA/apg/patterns/breadcrumb/',
  importPath: '@pinfold/react/breadcrumb',
  slots: SLOTS,
  props: {
    items: {
      type: 'array',
      required: true,
      description: 'One crumb each, from the top of the site to the current page. The last one is the current page.',
      group: 'data',
      items: {
        label: { type: 'node', required: true, description: 'The text.', group: 'data' },
        href: { type: 'string', description: 'Where it goes. The current page needs none.', group: 'data' },
        icon: { type: 'node', description: 'Before the text.', group: 'data' },
        onClick: { type: 'function', description: 'For client-side routing.', group: 'behaviour' },
      },
    },
    label: { type: 'string', default: 'Breadcrumb', description: 'The accessible name of the navigation landmark.', group: 'data' },
    separator: { type: 'enum', values: ['chevron', 'slash', 'dot'], orNode: true, default: 'chevron', description: 'Between crumbs: a named mark, or your own node.', group: 'appearance', control: true },
    maxItems: { type: 'number', description: 'Collapse the middle crumbs behind a button when there are more than this.', group: 'behaviour' },
    itemsBeforeCollapse: { type: 'number', default: 1, description: 'Crumbs kept before the collapsed ones.', group: 'behaviour' },
    itemsAfterCollapse: { type: 'number', default: 2, description: 'Crumbs kept after the collapsed ones.', group: 'behaviour' },
    expandLabel: { type: 'string', default: 'Show the full path', description: 'The name of the button that reveals collapsed crumbs.', group: 'data' },
    variant: { type: 'enum', values: ['plain', 'soft'], default: 'plain', description: '`plain`: text links. `soft`: the trail sits in a tinted tray.', group: 'appearance', control: true },
    size: { type: 'enum', values: ['sm', 'md', 'lg'], default: 'md', description: 'Precedence: this config, `defaults.breadcrumb`, the provider, then md.', group: 'appearance', control: true },
    unstyled: { type: 'boolean', default: false, description: 'Drop Pinfold classes; keep the behaviour, roles and data attributes.', group: 'appearance' },
    className: { type: 'string', description: 'Class on the root.', group: 'appearance' },
    style: { type: 'object', description: 'Inline style on the root.', group: 'appearance' },
    classNames: perSlot('Classes per slot.', 'string'),
    styles: perSlot('Inline styles per slot.', 'object'),
    slotProps: perSlot('Any DOM props per slot. `slotProps.link` reaches every link; `render.link` swaps in your router\'s link.', 'object'),
    render: perSlot('Replace a slot element: `({ props, state, children }) => node`.', 'function'),
  },
  keyboard: [
    { keys: 'Tab', action: 'Each link, then the button that reveals collapsed crumbs.' },
    { keys: 'Enter', action: 'Follow a link; on the reveal button, show every crumb and move focus to the first one revealed.' },
  ],
  aria: [
    '`<nav aria-label="Breadcrumb">` around an ordered list: a landmark, and the count of levels is read.',
    'The current page has `aria-current="page"` and is not a link.',
    'Separators are drawn by CSS or hidden from screen readers, so only the crumbs are read.',
  ],
  dataAttributes: [
    { name: 'data-variant', on: 'root', values: '"plain" | "soft"' },
    { name: 'data-size', on: 'root', values: 'the resolved size' },
    { name: 'data-current', on: 'item', values: 'present on the current page' },
  ],
  cssVariables: [],
  examples: [
    {
      title: 'A trail',
      code: "import { defineBreadcrumb } from '@pinfold/react/breadcrumb';\n\nexport const Trail = defineBreadcrumb({ maxItems: 4 });\n\n<Trail items={[\n  { label: 'Home', href: '/' },\n  { label: 'Projects', href: '/projects' },\n  { label: 'Pinfold', href: '/projects/pinfold' },\n  { label: 'Settings' },\n]} />",
    },
  ],
};
