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
| `content`, `navbar`, `sidebar`, `aside`, `footer` | the regions; `sidebar` may be `({ drawer, sidebarOpen }) => node` | |
| `layout` | `'navbar-top'`: the bar spans the width above the sidebar. `'sidebar-full'`: the sidebar takes the full height, the bar sits beside it | `'navbar-top'` |
| `sidebarBehavior`, `breakpoint` | `'inline'` beside the page, `'drawer'` over it, `'auto'`: a drawer when the shell is narrower than `breakpoint` px | `'auto'`, `768` |
| `backdrop` | over the page while the drawer is open: `'dim' \| 'blur' \| 'none'` | `'dim'` |
| `sidebarOpen`, `defaultSidebarOpen`, `onSidebarOpenChange` | the drawer | `false` |
| `sidebarTrigger`, `closeOnNavigate` | a menu button at the start of the bar while the sidebar is a drawer; following a link in the drawer closes it | `true`, `true` |
| `navbarPosition` | `'sticky' \| 'static'` | `'sticky'` |
| `scroll` | `'page'`: the page scrolls, the bar and sidebar stay in view. `'content'`: the shell has a height and only the page region scrolls | `'page'` |
| `dividers` | hairlines between the regions | `true` |
| `dimensions` | `sidebarWidth`, `asideWidth`, `maxWidth` and `padding` of the page content, `height` | |
| `labels` | `openSidebar`, `closeSidebar`, `sidebar` | |
| `unstyled`, `className`, `style`, `classNames` / `styles` / `slotProps` / `render` | slots: `root navbar trigger sidebar backdrop main content aside footer` | |

## Controller and parts
`useAppShell(config)` returns the component with `drawer`, `sidebarOpen`, `openSidebar()`, `closeSidebar()`,
`toggleSidebar()` and `getTriggerProps()`. `<Shell.SidebarTrigger />` is the menu button for a place of your own
choosing (it renders only while the sidebar is a drawer); set `sidebarTrigger: false` to drop the built-in one.

## Behaviour
- The shell measures its own width, not the window's: a shell inside a split view becomes narrow on its own.
- The sidebar sticks under the bar at the height left in the viewport; the shell reads the bar's real height.
- The drawer holds the focus while open, closes on Escape, on its backdrop and on a followed link, and returns
  focus to the menu button. Closed, it is `inert`.
- Each use is its own instance: observers and listeners are removed on unmount.

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
