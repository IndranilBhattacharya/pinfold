import type { ComponentMeta, PropMeta } from './meta';
import { RADIUS_PROP } from './meta-shared';

const SLOTS = ['root', 'list', 'item', 'link', 'icon', 'separator', 'ellipsis', 'menuButton'] as const;
const perSlot = (description: string, type: PropMeta['type']): PropMeta => ({
  type: 'object',
  description,
  group: 'escape-hatch',
  keys: Object.fromEntries(SLOTS.map((s) => [s, { type, description: `The \`${s}\` slot.`, group: 'escape-hatch' }])),
});
const link: Record<string, PropMeta> = {
  label: { type: 'node', required: true, description: 'The text.', group: 'data' },
  href: { type: 'string', description: 'Where it goes.', group: 'data' },
  icon: { type: 'node', description: 'Before the text.', group: 'data' },
  onClick: { type: 'function', description: 'Runs before navigation; `event.preventDefault()` stops it.', group: 'events' },
};

export const breadcrumbMeta: ComponentMeta = {
  name: 'breadcrumb',
  displayName: 'Breadcrumb',
  description:
    'The path to the current page, from items or straight from a URL path. A crumb can open a menu of the other pages at its level; long trails collapse into a menu. Clicks go to your router.',
  pattern: 'https://www.w3.org/WAI/ARIA/apg/patterns/breadcrumb/',
  importPath: '@pinfold/react/breadcrumb',
  requires: ['menu'],
  slots: SLOTS,
  props: {
    items: {
      type: 'array',
      orString: true,
      description: 'One crumb each, from the top of the site to the current page (the last one). A string is a crumb with no link.',
      group: 'data',
      items: {
        ...link,
        menu: { type: 'array', description: 'Other pages at this level (`{ label, href }` each): a menu opens from a button beside the crumb, or from the crumb itself when it has no `href`.', group: 'data' },
        disabled: { type: 'boolean', description: 'Shown as text, never a link.', group: 'behaviour' },
      },
    },
    path: { type: 'string', description: 'Build the crumbs from a URL path instead: `path={location.pathname}`. One crumb per segment, each linking to the path up to it.', group: 'data' },
    pathLabels: { type: 'object', description: 'Names for path segments, by segment or by href (`{ "user-settings": "Settings" }`), or `(segment, href) => node`. Unnamed segments are made readable ("user-settings" reads "User settings").', group: 'data' },
    homeLabel: { type: 'node', default: 'Home', description: 'The first crumb of a `path` (an icon works too).', group: 'data' },
    onNavigate: { type: 'function', description: '`(href, event) => void`: handles plain clicks on crumbs and menu rows (client-side routing). Without it, the provider\'s `navigate`, then the browser.', group: 'events' },
    label: { type: 'string', default: 'Breadcrumb', description: 'The accessible name of the navigation landmark.', group: 'data' },
    separator: { type: 'enum', values: ['chevron', 'slash', 'dot', 'arrow'], orNode: true, default: 'chevron', description: 'Between crumbs: a named mark, or your own node.', group: 'appearance', control: true },
    maxItems: { type: 'number', description: 'Collapse the middle crumbs when there are more than this.', group: 'behaviour' },
    itemsBeforeCollapse: { type: 'number', default: 1, description: 'Crumbs kept before the collapsed ones.', group: 'behaviour' },
    itemsAfterCollapse: { type: 'number', default: 2, description: 'Crumbs kept after the collapsed ones.', group: 'behaviour' },
    collapse: { type: 'enum', values: ['menu', 'expand'], default: 'menu', description: '`menu`: the ellipsis opens a menu of the hidden crumbs. `expand`: it shows them in place.', group: 'behaviour' },
    expandLabel: { type: 'string', default: 'Show the full path', description: 'The name of the ellipsis button.', group: 'data' },
    menuLabel: { type: 'string', default: 'Other pages', description: 'The name of the button that opens a crumb\'s `menu`.', group: 'data' },
    variant: {
      type: 'enum',
      values: ['plain', 'soft', 'outline', 'pills'],
      default: 'plain',
      description: '`plain`: crumbs that light up on hover. `soft`: a tinted bar. `outline`: a raised bar. `pills`: every crumb a chip, the current one in the tone.',
      group: 'appearance',
      control: true,
    },
    radius: RADIUS_PROP,
    size: { type: 'enum', values: ['sm', 'md', 'lg'], default: 'md', description: 'Precedence: this config, `defaults.breadcrumb`, the provider, then md.', group: 'appearance', control: true },
    tone: {
      type: 'enum',
      values: ['primary', 'neutral', 'success', 'warning', 'danger', 'info'],
      default: 'primary',
      description: 'Colour of the current crumb with `pills`. Precedence: this config, `defaults.breadcrumb`, the provider, then primary.',
      group: 'appearance',
      control: true,
    },
    dimensions: { type: 'object', description: 'Exact measurements. Numbers are px.', group: 'appearance', keys: { itemWidth: { type: 'length', description: 'Longest a crumb gets before its text is cut (default 22ch). The full text is its tooltip.', group: 'appearance' } } },
    unstyled: { type: 'boolean', default: false, description: 'Drop Pinfold classes; keep the behaviour, roles and data attributes.', group: 'appearance' },
    className: { type: 'string', description: 'Class on the root.', group: 'appearance' },
    style: { type: 'object', description: 'Inline style on the root.', group: 'appearance' },
    classNames: perSlot('Classes per slot.', 'string'),
    styles: perSlot('Inline styles per slot.', 'object'),
    slotProps: perSlot('Any DOM props per slot. `slotProps.link` reaches every link; `render.link` swaps in your router\'s link.', 'object'),
    render: perSlot('Replace a slot element: `({ props, state, children }) => node`.', 'function'),
  },
  keyboard: [
    { keys: 'Tab', action: 'Each link, menu button and the ellipsis in turn.' },
    { keys: 'Enter', action: 'Follow a link. On a menu button or the ellipsis (`collapse: "menu"`), open the menu; with `collapse: "expand"`, show every crumb and move focus to the first one revealed.' },
    { keys: 'Arrow keys / Escape', action: 'Inside a menu: move between pages, close and return to the button.' },
  ],
  aria: [
    '`<nav aria-label="Breadcrumb">` around an ordered list: a landmark, and the count of levels is read.',
    'The current page has `aria-current="page"` and is not a link.',
    'A crumb\'s menu is a menu button (`aria-haspopup`, `aria-expanded`) named by `menuLabel`, next to the crumb\'s link; its rows are real links.',
    'Separators are hidden from screen readers, so only the crumbs are read.',
  ],
  dataAttributes: [
    { name: 'data-variant', on: 'root', values: '"plain" | "soft" | "outline" | "pills"' },
    { name: 'data-size', on: 'root', values: 'the resolved size' },
    { name: 'data-tone', on: 'root', values: 'the resolved tone' },
    { name: 'data-current', on: 'item', values: 'present on the current page' },
  ],
  cssVariables: ['--pinfold-breadcrumb-item-width'],
  examples: [
    {
      title: 'From the URL',
      code: "import { defineBreadcrumb } from '@pinfold/react/breadcrumb';\n\nexport const Trail = defineBreadcrumb({ maxItems: 4 });\n\n<Trail path={location.pathname} pathLabels={{ 'user-settings': 'Settings' }} onNavigate={navigate} />",
    },
    {
      title: 'Crumbs with other pages at their level',
      code: "<Trail items={[\n  { label: 'Home', href: '/' },\n  { label: 'Projects', href: '/projects', menu: projects.map((p) => ({ label: p.name, href: `/projects/${p.id}` })) },\n  'Settings',\n]} />",
    },
  ],
};
