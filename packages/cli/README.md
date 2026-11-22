<div align="center">

<img src="https://raw.githubusercontent.com/IndranilBhattacharya/pinfold/main/.github/assets/logo.svg" width="64" height="64" alt="Pinfold" />

# pinfold

The command-line tool for [Pinfold](https://pinfold.indranildev.in): initialize projects, add components, generate themes, check project health, and serve MCP context to coding agents.

[![npm](https://img.shields.io/npm/v/pinfold?color=7c3aed&label=pinfold)](https://www.npmjs.com/package/pinfold)
[![license](https://img.shields.io/npm/l/pinfold?color=4f46e5)](LICENSE)

[Documentation](https://pinfold.indranildev.in/docs) · [Components](https://pinfold.indranildev.in/docs/table) · [AI & MCP](https://pinfold.indranildev.in/docs/ai) · [GitHub](https://github.com/IndranilBhattacharya/pinfold)

<img src="https://raw.githubusercontent.com/IndranilBhattacharya/pinfold/main/.github/assets/banner.png" alt="Pinfold CLI" width="100%" />

</div>

```bash
npx pinfold init           # language, components folder, theme; asks before writing
npx pinfold add table      # one file you own, plus every stylesheet it needs
```

It shows a diff before writing, never overwrites a file, and running a command twice changes nothing the second
time. It uses the package manager your lockfile names and requires no network other than your chosen package manager.

## Commands

- **`npx pinfold init`** — Detects Next.js (App or Pages Router), Vite, React Router, Remix, Gatsby or Astro, TypeScript or JavaScript, Tailwind v3 or v4 and your package manager. Writes `pinfold.config`, CSS imports, provider when needed and Tailwind bridge. Remembers chosen language, directory and configuration for future additions.
  - `--yes`: accept defaults
  - `--ts` / `--js`: configure language directly
  - `--dir <folder>`: choose components folder (default `src/components/ui`)
  - `--components <a,b|all>`: add components immediately
  - `--primary <color>`: set brand color (`#hex`, hue name, 0-360)
  - `--style <pack>`: choose style pack (`default`, `glass`, `material`, `noise`, `brutalist`)
  - `--radius <size>`: choose radius (`none`, `sm`, `md`, `lg`, `full`)
- **`npx pinfold add <name…|all>`** — Writes `components/ui/<name>.tsx` (or `.jsx`), a thin file you own, and imports the component's stylesheet and those of every component it draws inside. Automatically respects the language and folder configured in `pinfold.config` / `package.json`. Suggests closest match if a name is misspelled.
- **`npx pinfold theme`** — Generates the theme CSS from your colours: `--primary "#7c3aed" --style glass --radius lg`. `--check` verifies text contrast against WCAG AA; `--format tailwind` or `dtcg` exports for Tailwind v4 or design tokens.
- **`npx pinfold doctor`** — Checks the React version, CSS import order, provider setup, `use client` boundaries in Next.js, browser targets and duplicate packages.
- **`npx pinfold mcp`** — Built-in local Model Context Protocol (MCP) server over the installed packages' metadata for AI coding agents.

Pass `--dry-run` to print the diff without writing, or `--no-install` to skip package installation.

## MCP server

```bash
claude mcp add pinfold -- npx -y pinfold mcp
```

```json
{ "mcpServers": { "pinfold": { "command": "npx", "args": ["-y", "pinfold", "mcp"] } } }
```

Read-only tools: `search_components`, `list_components`, `get_component`, `get_schema`, `validate_config` and
`get_install_steps`. Everything comes from the installed version, so your agent never sees an option that does not
exist. See [AI and MCP](https://pinfold.indranildev.in/docs/ai).

MIT © Indranil Bhattacharya · [Docs](https://pinfold.indranildev.in/docs) · [GitHub](https://github.com/IndranilBhattacharya/pinfold)
