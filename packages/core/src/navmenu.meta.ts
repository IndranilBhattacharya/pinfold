import type { ComponentMeta, PropMeta } from './meta';
import { RADIUS_PROP } from './meta-shared';

const SLOTS = ['root', 'list', 'item', 'link', 'trigger', 'chevron', 'panel', 'content', 'grid', 'panelLink', 'icon', 'description'] as const;
const perSlot = (description: string, type: PropMeta['type']): PropMeta => ({
  type: 'object',
  description,
  group: 'escape-hatch',
  keys: Object.fromEntries(SLOTS.map((s) => [s, { type, description: `The \`${s}\` slot.`, group: 'escape-hatch' }])),
});

export const navmenuMeta: ComponentMeta = {
  name: 'navmenu',
  displayName: 'Navigation menu',
  pascal: 'NavMenu',
  description: 'A site\'s top navigation: links, and buttons that open panels of links with icons and descriptions (a mega menu) on hover or press. The disclosure pattern, so links stay links; arrow keys move between entries.',
  pattern: 'https://www.w3.org/WAI/ARIA/apg/patterns/disclosure/examples/disclosure-navigation/',
  importPath: '@pinfold/react/navmenu',
  slots: SLOTS,
  props: {
    label: { type: 'string', required: true, description: 'Names the navigation landmark, e.g. "Main".', group: 'data' },
    items: {
      type: 'array',
      required: true,
      orString: true,
      description: 'Top-level entries: `{ label, href?, icon?, items?, content?, columns?, id?, disabled?, onClick?, target? }`, or a string. `items` (links: `{ label, href, description?, icon? }`) and `content` (any node, e.g. a featured card) make a panel.',
      group: 'data',
    },
    value: { type: 'string', description: 'The current page\'s key (id, else href, else label): usually the router\'s path.', group: 'data' },
    defaultValue: { type: 'string', description: 'The current page at first, when uncontrolled.', group: 'data' },
    onChange: { type: 'function', description: '`(key, item, event) => void`: a link or button was chosen.', group: 'events' },
    onNavigate: { type: 'function', description: '`(href, event) => void`: follow links yourself. Default the provider\'s `navigate`, else the browser.', group: 'events' },
    open: { type: 'string', orString: true, description: 'The open entry\'s key, controlled; `null` for none.', group: 'behaviour' },
    defaultOpen: { type: 'string', orString: true, description: 'The open entry at first.', group: 'behaviour' },
    onOpenChange: { type: 'function', description: '`(key | null) => void`.', group: 'events' },
    openOn: { type: 'enum', values: ['hover', 'click'], default: 'hover', description: 'Panels open when the pointer rests on an entry (and on a press), or on a press only. Touch and keyboard always use a press.', group: 'behaviour', control: true, silent: true },
    variant: { type: 'enum', values: ['ghost', 'underline', 'pills'], default: 'ghost', description: 'Top entries: a tint under the pointer, a bar under the current one, or the current one filled.', group: 'appearance', control: true },
    radius: RADIUS_PROP,
    size: { type: 'enum', values: ['sm', 'md', 'lg'], default: 'md', description: 'Precedence: this config, `defaults.navmenu`, the provider, then md.', group: 'appearance', control: true },
    tone: { type: 'enum', values: ['primary', 'neutral', 'success', 'warning', 'danger', 'info'], default: 'primary', description: 'Colour of the current entry and the link icons. Precedence: this config, `defaults.navmenu`, the provider, then primary.', group: 'appearance', control: true },
    dimensions: { type: 'object', description: 'Exact measurements. Numbers are px.', group: 'appearance', keys: { columnWidth: { type: 'length', description: 'Width of one link column (default 14rem).', group: 'appearance' } } },
    unstyled: { type: 'boolean', default: false, description: 'Drop Pinfold classes; keep the behaviour, roles and data attributes.', group: 'appearance' },
    className: { type: 'string', description: 'Class on the root.', group: 'appearance' },
    style: { type: 'object', description: 'Inline style on the root.', group: 'appearance' },
    classNames: perSlot('Classes per slot.', 'string'),
    styles: perSlot('Inline styles per slot.', 'object'),
    slotProps: perSlot('Any DOM props per slot.', 'object'),
    render: perSlot('Replace a slot element: `({ props, state, children }) => node`.', 'function'),
  },
  keyboard: [
    { keys: 'Tab', action: 'Every entry, then the links of an open panel.' },
    { keys: 'Enter / Space', action: 'Open or close a panel; follow a link.' },
    { keys: 'Arrow Right / Left, Home / End', action: 'Move between top entries.' },
    { keys: 'Arrow Down', action: 'On a panel button: open it and focus its first link.' },
    { keys: 'Arrow Down / Up', action: 'Move between the links of a panel.' },
    { keys: 'Escape', action: 'Close the panel and return to its button.' },
  ],
  aria: [
    'A `nav` landmark named by `label`, with a list of entries: links, or disclosure buttons (`aria-expanded`, `aria-controls`) for panels. No menu roles: the entries are page links.',
    'The current page has `aria-current="page"`; a button whose panel holds it is marked for the eye too.',
    'A closed panel is hidden from the keyboard and screen readers; focus leaving the menu, Escape or a press outside closes it.',
    'Hover opens after a short delay and closes after a grace period, so the pointer can cross to the panel (WCAG 1.4.13).',
  ],
  dataAttributes: [
    { name: 'data-open', on: 'trigger, panel', values: 'present while its panel is open' },
    { name: 'data-current', on: 'link, panelLink', values: 'present on the current page' },
    { name: 'data-holds-current', on: 'trigger', values: 'present when its panel holds the current page' },
  ],
  cssVariables: ['--pinfold-navmenu-column-width'],
  examples: [
    {
      title: 'Site header',
      code: "import { defineNavMenu } from '@pinfold/react/navmenu';\n\nexport const SiteNav = defineNavMenu();\n\n<SiteNav label=\"Main\" value={pathname} items={[\n  { label: 'Products', items: [\n    { label: 'Analytics', href: '/analytics', description: 'Know your traffic', icon: <ChartIcon /> },\n    { label: 'Automation', href: '/automation', description: 'Flows that run themselves', icon: <BoltIcon /> },\n  ] },\n  { label: 'Pricing', href: '/pricing' },\n]} />",
    },
  ],
};
