<div align="center">

<img src=".github/assets/logo.svg" width="72" height="72" alt="Pinfold" />

# Pinfold

## Configure once. Ship everywhere.

The typed React component library driven by a single config object. Fully accessible, endlessly themeable, zero friction.

[![npm](https://img.shields.io/npm/v/@pinfold/react?color=7c3aed&label=%40pinfold%2Freact)](https://www.npmjs.com/package/@pinfold/react)
[![license](https://img.shields.io/npm/l/@pinfold/react?color=4f46e5)](LICENSE)
[![provenance](https://img.shields.io/badge/npm-provenance-0ea5e9)](https://www.npmjs.com/package/@pinfold/react)
[![WCAG 2.2 AA](https://img.shields.io/badge/WCAG-2.2%20AA-16a34a)](docs/a11y/screen-readers.md)
[![dependencies](https://img.shields.io/badge/runtime%20dependencies-0-16a34a)](packages/react/package.json)

[**Documentation**](https://pinfold.indranildev.in/docs) · [**Components**](https://pinfold.indranildev.in/docs/table) · [**Theming**](https://pinfold.indranildev.in/docs/theming) · [**AI and MCP**](https://pinfold.indranildev.in/docs/ai)

<img src=".github/assets/banner.png" alt="Pinfold: configure once, ship everywhere" width="100%" />

</div>

## In 30 seconds

```bash
npx pinfold init          # detects Next.js, Vite or React Router, TypeScript or JavaScript, Tailwind
npx pinfold add table     # one small file you own, plus every stylesheet it needs
```

```tsx
import { defineTable } from '@pinfold/react/table';

// Define the look once, outside your components. It works in Server Components too.
export const Orders = defineTable({ sortable: true, filterable: true, toolbar: true });

export function OrdersPage({ orders }: { orders: Order[] }) {
  return <Orders label="Orders" rows={orders} pageSize={25} />;
}
```

That is a data grid with sorting, filters, a quick search, column hiding, paging, keyboard navigation and
correct ARIA. The config is typed against your rows, so a misspelt column is a compile error.

## Why Pinfold

- **Write less** — A component is data, not a tree of nested parts. Shorter to write, easy to diff, and the exact shape a coding agent gets right on the first try.
- **Accessible, with proof** — Every component follows its WAI-ARIA pattern and is tested on every build in every style pack, light and dark. WCAG 2.2 AA compliant: zero axe violations, full keyboard navigation, focus management, contrast, forced colours, and reduced motion.
- **Never boxed in** — Each part has a semantic name: add a class, merge props, or render with custom components. A headless hook gives you all state and behavior with zero markup.
- **Your brand, any format** — `#hex`, `rgb()`, `oklch()`, or hue names. Eleven OKLCH steps per role with automatic contrast-safe text colors on every fill.
- **Server-ready** — `define<Name>()` presets work in Server Components and loops; hooks are there when you need client state. Full HTML rendered on the server.
- **Zero runtime dependencies** — One subpath and one stylesheet per component. CSS in native cascade layers so your styles and Tailwind utilities always win, with zero runtime dependencies.

## Three ways to use a component

```tsx
// 1. A preset (the default): one look, used anywhere, Server Components included
export const Danger = defineButton({ variant: 'soft', tone: 'danger' });
{rows.map((r) => <Danger key={r.id} label="Delete" onClick={() => remove(r.id)} />)}

// 2. A hook, in a client component: the component and its controller
const Faq = useAccordion({ items, mode: 'multiple' });
<button onClick={Faq.openAll}>Expand all</button>
<Faq />

// 3. Your own markup: prop getters with every ARIA attribute
<div {...Faq.getRootProps()}>…</div>
```

Precedence for every option: the props, the preset, `defaults` in your config, the provider, the library default.

## Components

51 components, each with a live playground, examples, complete API, keyboard map, and ARIA patterns on the [documentation site](https://pinfold.indranildev.in/docs) and in [`docs/components`](docs/components).

- **Layout** — [App shell](https://pinfold.indranildev.in/docs/appshell) · [Navbar](https://pinfold.indranildev.in/docs/navbar) · [Sidebar](https://pinfold.indranildev.in/docs/sidebar) · [Navigation menu](https://pinfold.indranildev.in/docs/navmenu) · [Tabs](https://pinfold.indranildev.in/docs/tabs) · [Breadcrumb](https://pinfold.indranildev.in/docs/breadcrumb) · [Pagination](https://pinfold.indranildev.in/docs/pagination) · [Stepper](https://pinfold.indranildev.in/docs/stepper) · [Resizable](https://pinfold.indranildev.in/docs/resizable) · [Scroll area](https://pinfold.indranildev.in/docs/scrollarea)
- **Data display** — [Table](https://pinfold.indranildev.in/docs/table) · [Card](https://pinfold.indranildev.in/docs/card) · [Accordion](https://pinfold.indranildev.in/docs/accordion) · [Tree view](https://pinfold.indranildev.in/docs/treeview) · [Timeline](https://pinfold.indranildev.in/docs/timeline) · [Carousel](https://pinfold.indranildev.in/docs/carousel) · [Avatar](https://pinfold.indranildev.in/docs/avatar) · [Badge](https://pinfold.indranildev.in/docs/badge) · [Tag group](https://pinfold.indranildev.in/docs/tags) · [Kbd](https://pinfold.indranildev.in/docs/kbd) · [Empty](https://pinfold.indranildev.in/docs/empty) · [Skeleton](https://pinfold.indranildev.in/docs/skeleton)
- **Forms** — [Input](https://pinfold.indranildev.in/docs/input) · [Number field](https://pinfold.indranildev.in/docs/number) · [One-time code](https://pinfold.indranildev.in/docs/otp) · [Checkbox](https://pinfold.indranildev.in/docs/checkbox) · [Radio group](https://pinfold.indranildev.in/docs/radio) · [Switch](https://pinfold.indranildev.in/docs/switch) · [Toggle](https://pinfold.indranildev.in/docs/toggle) · [Toolbar](https://pinfold.indranildev.in/docs/toolbar) · [Slider](https://pinfold.indranildev.in/docs/slider) · [Select](https://pinfold.indranildev.in/docs/select) · [Combobox](https://pinfold.indranildev.in/docs/combobox) · [Calendar](https://pinfold.indranildev.in/docs/calendar) · [Date picker](https://pinfold.indranildev.in/docs/datepicker) · [Color picker](https://pinfold.indranildev.in/docs/colorpicker) · [Rating](https://pinfold.indranildev.in/docs/rating) · [File upload](https://pinfold.indranildev.in/docs/fileupload)
- **Overlays** — [Dialog](https://pinfold.indranildev.in/docs/dialog) · [Popover](https://pinfold.indranildev.in/docs/popover) · [Tooltip](https://pinfold.indranildev.in/docs/tooltip) · [Menu](https://pinfold.indranildev.in/docs/menu) · [Command](https://pinfold.indranildev.in/docs/command) · [Toast](https://pinfold.indranildev.in/docs/toast) · [Tour](https://pinfold.indranildev.in/docs/tour)
- **Feedback & Actions** — [Alert](https://pinfold.indranildev.in/docs/alert) · [Progress](https://pinfold.indranildev.in/docs/progress) · [Spinner](https://pinfold.indranildev.in/docs/spinner) · [Button](https://pinfold.indranildev.in/docs/button) · [Separator](https://pinfold.indranildev.in/docs/separator) · [Cursor](https://pinfold.indranildev.in/docs/cursor)

## For coding agents

A local MCP server answers from the version you installed, so an agent never invents an option.

```bash
claude mcp add pinfold -- npx -y pinfold mcp
```

Tools: `search_components`, `list_components`, `get_component`, `get_schema`, `validate_config` and
`get_install_steps`. `llms.txt`, `llms-full.txt` and a JSON Schema per component ship inside `@pinfold/react`
and at [pinfold.indranildev.in/llms.txt](https://pinfold.indranildev.in/llms.txt). Setup for Cursor, VS Code and
Windsurf is in the [AI guide](https://pinfold.indranildev.in/docs/ai).

## With shadcn

```json
{ "registries": { "@pinfold": "https://pinfold.indranildev.in/r/{name}.json" } }
```

```bash
npx shadcn@latest add @pinfold/table
```

The registry item brings the component file, the packages and every stylesheet it needs.
`@pinfold/css/shadcn.css` maps shadcn's variables onto Pinfold, so both follow one theme.

## Theming

```bash
npx pinfold theme --primary "#4f46e5" --style glass --radius lg --check
```

Seven roles, eleven steps each, generated in OKLCH with sRGB fallbacks and a WCAG report. Style packs (`glass`,
`material`, `noise`, `brutalist`) restyle surfaces, edges and shadows of every component at once. Tailwind v3 and
v4 share the same variables. The [palette studio](https://pinfold.indranildev.in/docs/theming) shows it live.

## Packages

- **[`@pinfold/react`](packages/react)** — The components: presets, hooks, and tags with one subpath each.
- **[`@pinfold/css`](packages/css)** — Tokens, reset, per-component stylesheets, style packs, and Tailwind / shadcn bridges.
- **[`@pinfold/core`](packages/core)** — Framework-free rules, metadata, and the OKLCH palette engine.
- **[`pinfold`](packages/cli)** — The CLI: `init`, `add`, `theme`, `doctor`, and `mcp`.

React 18 and 19 · TypeScript 4.7+ or JavaScript · Next.js, Vite, React Router, Remix, Gatsby, Astro · browsers from Baseline 2023.

## Docs in this repository

- [`ARCHITECTURE.md`](ARCHITECTURE.md) — The contract and principles every component follows.
- [`docs/components`](docs/components) — Component specifications and design tokens.
- [`docs/COMPATIBILITY.md`](docs/COMPATIBILITY.md) — React, TypeScript, bundlers, SSR frameworks, and browser support.
- [`docs/a11y/screen-readers.md`](docs/a11y/screen-readers.md) — Accessibility verification and screen-reader test matrix.
- [`docs/CLI.md`](docs/CLI.md) · [`docs/DISTRIBUTION.md`](docs/DISTRIBUTION.md) — CLI reference, packaging, registry, and MCP server.
- [`CONTRIBUTING.md`](CONTRIBUTING.md) — Local development, guidelines, and component checklist.

## Develop

```bash
npm install
npm run verify    # types, tests, build, bundle budgets
```

## License

[MIT](LICENSE) © 2026 Indranil Bhattacharya
