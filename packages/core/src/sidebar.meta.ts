import type { ComponentMeta, PropMeta } from './meta';
import { RADIUS_PROP } from './meta-shared';

const SLOTS = ['root', 'header', 'body', 'group', 'groupLabel', 'list', 'item', 'link', 'icon', 'badge', 'chevron', 'sublist', 'footer', 'toggle'] as const;
const perSlot = (description: string, type: PropMeta['type']): PropMeta => ({
  type: 'object',
  description,
  group: 'escape-hatch',
  keys: Object.fromEntries(SLOTS.map((s) => [s, { type, description: `The \`${s}\` slot.`, group: 'escape-hatch' }])),
});

export const sidebarMeta: ComponentMeta = {
  name: 'sidebar',
  displayName: 'Sidebar',
  description: 'App navigation down the side: links, buttons and sections that open, under group headings, with a header and a footer. Folds into a rail of icons. The current entry follows the router; links go through its navigate.',
  pattern: 'https://www.w3.org/WAI/ARIA/apg/patterns/disclosure/examples/disclosure-navigation/',
  importPath: '@pinfold/react/sidebar',
  slots: SLOTS,
  props: {
    label: { type: 'string', required: true, description: 'Names the navigation landmark, e.g. "Main".', group: 'data' },
    items: {
      type: 'array',
      required: true,
      orString: true,
      description: 'Entries: `{ label, href?, icon?, badge?, items?, group?, id?, disabled?, onClick?, target? }`, or a string. `items` makes a section that opens; `group` puts top-level entries under a heading.',
      group: 'data',
    },
    value: { type: 'string', description: 'The current entry\'s key (id, else href, else label), controlled: usually the router\'s path.', group: 'data' },
    defaultValue: { type: 'string', description: 'The current entry at first, when uncontrolled.', group: 'data' },
    onChange: { type: 'function', description: '`(key, item, event) => void`: an entry was chosen (links too).', group: 'events' },
    onNavigate: { type: 'function', description: '`(href, event) => void`: follow links yourself. Default the provider\'s `navigate`, else the browser.', group: 'events' },
    expanded: { type: 'string[]', description: 'Open sections (their keys), controlled.', group: 'data' },
    defaultExpanded: { type: 'string[]', description: 'Open sections at first. Default the sections that hold the current entry.', group: 'data' },
    onExpandedChange: { type: 'function', description: '`(keys) => void`.', group: 'events' },
    collapsible: { type: 'boolean', default: false, description: 'A button at the foot folds the sidebar into a rail of icons.', group: 'behaviour', control: true },
    collapsed: { type: 'boolean', description: 'A rail of icons, controlled.', group: 'appearance' },
    defaultCollapsed: { type: 'boolean', default: false, description: 'Start as a rail.', group: 'appearance', control: true },
    onCollapsedChange: { type: 'function', description: '`(collapsed) => void`.', group: 'events' },
    header: { type: 'node', description: 'Above the entries: a logo, a team switcher.', group: 'data' },
    footer: { type: 'node', description: 'Under the entries: the account, help.', group: 'data' },
    labels: {
      type: 'object',
      description: 'Text read and shown, for translation.',
      group: 'data',
      keys: {
        collapse: { type: 'string', description: 'Default "Collapse sidebar".', group: 'data' },
        expand: { type: 'string', description: 'Default "Expand sidebar".', group: 'data' },
      },
    },
    variant: { type: 'enum', values: ['soft', 'plain', 'solid'], default: 'soft', description: 'The current entry: a tint, a bar at its edge, or a solid fill.', group: 'appearance', control: true },
    radius: RADIUS_PROP,
    size: { type: 'enum', values: ['sm', 'md', 'lg'], default: 'md', description: 'Precedence: this config, `defaults.sidebar`, the provider, then md.', group: 'appearance', control: true },
    tone: { type: 'enum', values: ['primary', 'neutral', 'success', 'warning', 'danger', 'info'], default: 'primary', description: 'Colour of the current entry. Precedence: this config, `defaults.sidebar`, the provider, then primary.', group: 'appearance', control: true },
    dimensions: { type: 'object', description: 'Exact measurements. Numbers are px.', group: 'appearance', keys: { width: { type: 'length', description: 'Open width (default 16rem).', group: 'appearance' } } },
    unstyled: { type: 'boolean', default: false, description: 'Drop Pinfold classes; keep the behaviour, roles and data attributes.', group: 'appearance' },
    className: { type: 'string', description: 'Class on the root.', group: 'appearance' },
    style: { type: 'object', description: 'Inline style on the root.', group: 'appearance' },
    classNames: perSlot('Classes per slot.', 'string'),
    styles: perSlot('Inline styles per slot.', 'object'),
    slotProps: perSlot('Any DOM props per slot.', 'object'),
    render: perSlot('Replace a slot element: `({ props, state, children }) => node`.', 'function'),
  },
  keyboard: [
    { keys: 'Tab', action: 'Every entry in order; entries in closed sections are skipped.' },
    { keys: 'Enter', action: 'Follow a link, or press a button or section.' },
    { keys: 'Space', action: 'Press a button or section.' },
  ],
  aria: [
    'A `nav` landmark named by `label`; entries are links (`href`) or buttons; group headings name their lists.',
    'The current entry has `aria-current="page"`; a section holding it is marked for the eye too.',
    'Sections are disclosure buttons with `aria-expanded` and `aria-controls`; closed ones are hidden from the keyboard and screen readers.',
    'In a rail the text is visually hidden, not removed, so every entry keeps its name; the collapse button has `aria-expanded`.',
  ],
  dataAttributes: [
    { name: 'data-collapsed', on: 'root', values: 'present as a rail' },
    { name: 'data-current', on: 'link', values: 'present on the current entry' },
    { name: 'data-holds-current', on: 'link', values: 'present on a section that holds it' },
    { name: 'data-open', on: 'sublist', values: 'present while open' },
  ],
  cssVariables: ['--pinfold-sidebar-width'],
  examples: [
    {
      title: 'App navigation',
      code: "import { defineSidebar } from '@pinfold/react/sidebar';\n\nexport const AppNav = defineSidebar({ collapsible: true });\n\n<AppNav label=\"Main\" value={pathname} items={[\n  { label: 'Inbox', href: '/inbox', icon: <InboxIcon />, badge: 4 },\n  { label: 'Projects', icon: <FolderIcon />, items: [{ label: 'Pinfold', href: '/p/pinfold' }] },\n  { label: 'Settings', href: '/settings', icon: <CogIcon />, group: 'Account' },\n]} />",
    },
  ],
};
