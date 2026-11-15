<div align="center">

<img src="https://raw.githubusercontent.com/IndranilBhattacharya/pinfold/main/.github/assets/logo.svg" width="64" height="64" alt="Pinfold" />

# @pinfold/react

**Config in. Interfaces out.** Accessible React components from one typed object.

[Documentation](https://pinfold.indranildev.in/docs) · [Components](https://pinfold.indranildev.in/docs/table) · [Theming](https://pinfold.indranildev.in/docs/theming) · [GitHub](https://github.com/IndranilBhattacharya/pinfold)

<img src="https://raw.githubusercontent.com/IndranilBhattacharya/pinfold/main/.github/assets/banner.png" alt="Pinfold" width="100%" />

</div>

51 components, from a button to a data grid that scrolls a billion rows. Each one follows its WAI-ARIA pattern,
works with the keyboard alone, and is checked with axe on every build. One subpath per component, so what you
don't import never reaches your bundle. React 18 and 19, TypeScript or JavaScript, zero runtime dependencies.

## Install

```bash
npx pinfold init        # sets everything up, or by hand:
npm install @pinfold/react @pinfold/css
```

Import the styles once, in your app entry: the core, then each component you use.

```ts
import '@pinfold/css/core.css';
import '@pinfold/css/table.css';
```

## Use

```tsx
import { defineTable } from '@pinfold/react/table';

// A preset: define the look once, outside components. Works in Server Components and loops.
export const Orders = defineTable({ sortable: true, filterable: true, toolbar: true });

export function OrdersPage({ orders }: { orders: Order[] }) {
  return <Orders label="Orders" rows={orders} pageSize={25} />;
}
```

Every component has the same three forms with the same config:

| | |
| --- | --- |
| `define<Name>(config)` | A preset you use as a tag. Server Components included. |
| `use<Name>(config)` | The component and its controller, e.g. `Faq.openAll()`, `Grid.downloadCsv()`. |
| `<Name {...config} />` | The plain tag, when one instance is all you need. |

## Make it yours

Every part has a name. Style it, merge props into it, or draw it with your own component; Pinfold keeps the
keys, focus and ARIA working.

```tsx
<Faq
  classNames={{ trigger: 'px-6 text-base' }}
  slotProps={{ panel: { 'data-analytics': 'faq' } }}
  render={{ indicator: ({ item }) => (item.open ? <Minus /> : <Plus />) }}
/>
```

## Provider (optional)

```tsx
import { PinfoldProvider } from '@pinfold/react';
import '@pinfold/css/packs.css';

<PinfoldProvider theme="system" stylePack="glass" navigate={router.push}>
  {children}
</PinfoldProvider>
```

Precedence for every option: the props, the preset, `defaults` in your config, the provider, the library default.

## Components

**Layout** App shell, Navbar, Sidebar, Navigation menu, Tabs, Breadcrumb, Pagination, Stepper, Resizable,
Scroll area · **Data display** Table, Card, Accordion, Tree view, Timeline, Carousel, Avatar, Badge, Tag group,
Kbd, Empty, Skeleton · **Forms** Input, Number field, One-time code, Checkbox, Radio group, Switch, Toggle,
Toolbar, Slider, Select, Combobox, Calendar, Date picker, Color picker, Rating, File upload · **Overlays**
Dialog, Popover, Tooltip, Menu, Command, Toast, Tour · **Feedback** Alert, Progress, Spinner · **Actions**
Button, Separator, Cursor.

Import each from its own path: `@pinfold/react/<name>`, e.g. `@pinfold/react/datepicker`.

## For coding agents

`llms.txt`, `llms-full.txt` and a JSON Schema per component (`schema/<name>.json`) ship in this package and
match its version. `npx pinfold mcp` runs a local MCP server over them.

## Links

- [Docs and playgrounds](https://pinfold.indranildev.in/docs)
- [Changelog and releases](https://github.com/IndranilBhattacharya/pinfold/releases)
- [`@pinfold/css`](https://www.npmjs.com/package/@pinfold/css) · [`@pinfold/core`](https://www.npmjs.com/package/@pinfold/core) · [`pinfold` CLI](https://www.npmjs.com/package/pinfold)

MIT © Indranil Bhattacharya
