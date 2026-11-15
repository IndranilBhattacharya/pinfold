# App shell: spec

Status: **experimental**. Pattern: landmark regions.

## Usage
```tsx
import { defineAppShell } from '@pinfold/react/appshell';

export const Shell = defineAppShell({ dimensions: { maxWidth: 1120, padding: 24 } });

<Shell navbar={<TopBar />} sidebar={<AppNav label="Main" value={pathname} items={nav} />} footer={<Legal />}>
  <Outlet />
</Shell>
```
Precedence: use-site props, the preset, `defaults.appshell`, the library default. The page is `content` in a
config, or `children` on the tag. Every region takes anything: Pinfold's Navbar, Sidebar and Tabs, or your own.

## Config
| Key | Type | Default |
|---|---|---|
| `content`, `navbar`, `sidebar`, `aside`, `footer` | the regions; `sidebar` may be `({ drawer, sidebarOpen, collapsed }) => node` | |
| `sidebarCollapsible` | collapsing the inline sidebar folds it to what is inside (a rail) instead of hiding it | `false` |
| `sidebarCollapsed`, `defaultSidebarCollapsed`, `onSidebarCollapsedChange` | the inline sidebar is collapsed | `false` |
| `autoSaveId` | key to remember whether the sidebar is collapsed in localStorage | |
| `layout` | `'navbar-top'`: the bar spans the width above the sidebar. `'sidebar-full'`: the sidebar takes the full height, the bar sits beside it | `'navbar-top'` |
| `sidebarBehavior`, `breakpoint` | `'inline'` beside the page, `'drawer'` over it, `'auto'`: a drawer when the shell is narrower than `breakpoint` px | `'auto'`, `768` |
| `backdrop` | over the page while the drawer is open: `'dim' \| 'blur' \| 'none'` | `'dim'` |
| `sidebarOpen`, `defaultSidebarOpen`, `onSidebarOpenChange` | the drawer | `false` |
| `sidebarTrigger`, `closeOnNavigate` | a menu button at the start of the bar while the sidebar is a drawer, or to collapse an inline sidebar; following a link in the drawer closes it | `true`, `true` |
| `navbarPosition` | `'sticky' \| 'static'` | `'sticky'` |
| `scroll` | `'page'`: the page scrolls, the bar and sidebar stay in view. `'content'`: the shell has a height and only the page region scrolls (a Navbar in the bar with `shrinkOnScroll` / `hideOnScroll` follows that region by itself) | `'page'` |
| `dividers` | hairlines between the regions | `true` |
| `dimensions` | `gap`, `sidebarWidth`, `asideWidth`, `maxWidth` and `padding` of the page content, `height` | `0` (gap), none |
| `labels` | `openSidebar`, `closeSidebar`, `collapseSidebar`, `expandSidebar`, `sidebar` | |
| `unstyled`, `className`, `style`, `classNames` / `styles` / `slotProps` / `render` | slots: `root navbar trigger sidebar backdrop main content aside footer` | |

## Controller and parts
`useAppShell(config)` returns the component with `drawer`, `sidebarOpen`, `collapsed`, `openSidebar()`, `closeSidebar()`,
`toggleSidebar()` and `getTriggerProps()`. `<Shell.SidebarTrigger />` is the menu button for a place of your own
choosing (it renders while the sidebar is a drawer or `sidebarCollapsible`); set `sidebarTrigger: false` to drop the built-in one.

## Behaviour
- The shell measures its own width, not the window's: a shell inside a split view becomes narrow on its own.
- The sidebar sticks under the bar at the height left in the viewport; the shell reads the bar's real height.
- The drawer holds the focus while open, closes on Escape, on its backdrop and on a followed link, and returns
  focus to the menu button. Closed, it is `inert`.
- Each use is its own instance: observers and listeners are removed on unmount.
- Inactive (`inactiveAppShellOptions(config, drawer?)`): with no `sidebar`, the drawer options
  (`sidebarTrigger`, `backdrop`, `closeOnNavigate`) and `sidebarBehavior`, `breakpoint`; with
  `sidebarBehavior: 'inline'`, the drawer options and `breakpoint`; with `'drawer'`, `breakpoint`, `layout` and
  the collapse options; with `'auto'` and a measured shell wider than `breakpoint` (pass `drawer: false`), the
  drawer options, or narrower (`drawer: true`), `layout`; without `sidebarCollapsible`, `sidebarCollapsed`,
  `defaultSidebarCollapsed`, `onSidebarCollapsedChange` and `autoSaveId`; with no
  `navbar`, `navbarPosition` and `sidebarTrigger` (place `Shell.SidebarTrigger` yourself), and `layout`
  when there is no sidebar either; with `scroll: 'content'`, `navbarPosition`. In development the hook warns
  about the ones the config alone rules out.

## Composing
```tsx
// A dashboard: sidebar full height, the page scrolls inside, tabs in the page
<Shell layout="sidebar-full" scroll="content" backdrop="blur" navbar={<TopBar />} sidebar={<AppNav ... />} aside={<Activity />}>
  <Sections items={tabs} />
</Shell>
```

## Accessibility
- The page is `main`; the bar is a `header`; the footer a `footer`. The sidebar region adds no landmark: the
  navigation inside it does.
- As a drawer the sidebar is a `dialog` with a name; its button has `aria-expanded` and `aria-controls`.
