import type { ComponentMeta, PropMeta } from './meta';

const SLOTS = ['root', 'navbar', 'trigger', 'sidebar', 'backdrop', 'main', 'content', 'aside', 'footer'] as const;
const perSlot = (description: string, type: PropMeta['type']): PropMeta => ({
  type: 'object',
  description,
  group: 'escape-hatch',
  keys: Object.fromEntries(SLOTS.map((s) => [s, { type, description: `The \`${s}\` slot.`, group: 'escape-hatch' }])),
});
const length = (description: string): PropMeta => ({ type: 'length', description, group: 'appearance' });

export const appshellMeta: ComponentMeta = {
  name: 'appshell',
  displayName: 'App shell',
  pascal: 'AppShell',
  description: 'The frame of an app: a bar on top, a sidebar, the page, an optional panel on the far side and a footer. You fill each region with anything (a Navbar, a Sidebar, Tabs, your own); the shell does the layout, keeps the bar and sidebar in view, and turns the sidebar into a drawer with a backdrop on a narrow screen.',
  pattern: 'https://www.w3.org/WAI/ARIA/apg/practices/landmark-regions/',
  importPath: '@pinfold/react/appshell',
  slots: SLOTS,
  props: {
    content: { type: 'node', description: 'The page. On the tag, `children` work too.', group: 'data' },
    navbar: { type: 'node', description: 'The bar on top: a Navbar, or anything.', group: 'data' },
    sidebar: { type: 'node', description: 'The navigation beside the page: a Sidebar, or anything. A function gets `{ drawer, sidebarOpen }`.', group: 'data' },
    aside: { type: 'node', description: 'A panel on the far side: details, a table of contents.', group: 'data' },
    footer: { type: 'node', description: 'Under the page.', group: 'data' },
    layout: { type: 'enum', values: ['navbar-top', 'sidebar-full'], default: 'navbar-top', description: 'The bar spans the whole width above the sidebar, or the sidebar takes the full height and the bar sits beside it.', group: 'appearance', control: true },
    sidebarBehavior: { type: 'enum', values: ['auto', 'inline', 'drawer'], default: 'auto', description: 'The sidebar sits beside the page, slides over it as a drawer, or does the first on a wide shell and the second on a narrow one.', group: 'behaviour', control: true },
    breakpoint: { type: 'number', default: 768, description: 'With `auto`: the shell width (px) under which the sidebar becomes a drawer.', group: 'behaviour' },
    backdrop: { type: 'enum', values: ['dim', 'blur', 'none'], default: 'dim', description: 'What lies over the page while the drawer is open: a dark veil, a blurred one, or nothing.', group: 'appearance', control: true },
    sidebarOpen: { type: 'boolean', description: 'The drawer is open, controlled.', group: 'data' },
    defaultSidebarOpen: { type: 'boolean', default: false, description: 'The drawer is open at first.', group: 'data' },
    onSidebarOpenChange: { type: 'function', description: '`(open) => void`.', group: 'events' },
    sidebarTrigger: { type: 'boolean', default: true, description: 'A menu button at the start of the bar while the sidebar is a drawer. Turn it off to place `Shell.SidebarTrigger` yourself.', group: 'appearance', control: true },
    closeOnNavigate: { type: 'boolean', default: true, description: 'Following a link in the drawer closes it.', group: 'behaviour' },
    navbarPosition: { type: 'enum', values: ['sticky', 'static'], default: 'sticky', description: 'The bar stays at the top while the page scrolls, or scrolls away with it.', group: 'behaviour', control: true },
    scroll: { type: 'enum', values: ['page', 'content'], default: 'page', description: 'The whole page scrolls (the bar and sidebar stay in view), or the shell has a height and only the page region scrolls.', group: 'behaviour', control: true },
    dividers: { type: 'boolean', default: true, description: 'Hairlines between the regions.', group: 'appearance', control: true },
    labels: {
      type: 'object',
      description: 'Text read, for translation.',
      group: 'data',
      keys: {
        openSidebar: { type: 'string', description: 'Default "Open navigation".', group: 'data' },
        closeSidebar: { type: 'string', description: 'Default "Close navigation".', group: 'data' },
        sidebar: { type: 'string', description: 'Names the drawer. Default "Navigation".', group: 'data' },
      },
    },
    dimensions: {
      type: 'object',
      description: 'Exact measurements. Numbers are px.',
      group: 'appearance',
      keys: {
        sidebarWidth: length('Default: as wide as what is in it (16rem as a drawer).'),
        asideWidth: length('Default 18rem.'),
        maxWidth: length('Widest the page content gets; it is centred beyond that.'),
        padding: length('Space around the page content.'),
        height: length('With `scroll: content`: the shell\'s height. Default the viewport\'s.'),
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
    { keys: 'Escape', action: 'Closes the drawer; focus returns to the menu button.' },
    { keys: 'Tab', action: 'While the drawer is open it holds the focus; closed, it is out of the tab order.' },
  ],
  aria: [
    'The page is the `main` landmark; the bar is a `header`, the footer a `footer`. The sidebar region adds no landmark of its own: a Sidebar inside it is the `nav`.',
    'As a drawer the sidebar is a `dialog` named by `labels.sidebar`; the menu button has `aria-expanded` and controls it. Closed, the drawer is `inert`.',
    'The backdrop is decorative; pressing it closes the drawer.',
  ],
  dataAttributes: [
    { name: 'data-layout / data-scroll / data-backdrop / data-navbar-position', on: 'root', values: 'the options' },
    { name: 'data-drawer', on: 'root', values: 'present while the sidebar is a drawer' },
    { name: 'data-sidebar-open', on: 'root', values: 'present while the drawer is open' },
  ],
  cssVariables: ['--pinfold-appshell-sidebar-width', '--pinfold-appshell-aside-width', '--pinfold-appshell-max-width', '--pinfold-appshell-padding', '--pinfold-appshell-height'],
  examples: [
    {
      title: 'A bar, a sidebar and the page',
      code: "import { defineAppShell } from '@pinfold/react/appshell';\n\nexport const Shell = defineAppShell({ dimensions: { maxWidth: 1120, padding: 24 } });\n\n<Shell navbar={<TopBar />} sidebar={<AppNav label=\"Main\" value={pathname} items={nav} />}>\n  <Outlet />\n</Shell>",
    },
    { title: 'A dashboard that scrolls inside', code: "<Shell layout=\"sidebar-full\" scroll=\"content\" backdrop=\"blur\" navbar={<TopBar />} sidebar={<AppNav ... />} aside={<Activity />}>\n  <Dashboard />\n</Shell>" },
  ],
};
