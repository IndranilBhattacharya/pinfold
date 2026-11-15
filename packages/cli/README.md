<div align="center">

<img src="https://raw.githubusercontent.com/IndranilBhattacharya/pinfold/main/.github/assets/logo.svg" width="56" height="56" alt="Pinfold" />

# pinfold

The CLI for [Pinfold](https://pinfold.indranildev.in): set up a project, add components, generate a theme, check
the setup, and run an MCP server for coding agents.

</div>

```bash
npx pinfold init           # language, components folder, theme; asks before writing
npx pinfold add table      # one file you own, plus every stylesheet it needs
```

It shows a diff before writing, never overwrites a file, and running a command twice changes nothing the second
time. It uses the package manager your lockfile names and no other network.

## Commands

| Command | |
| --- | --- |
| `init` | Detects Next.js (App or Pages Router), Vite, React Router, Remix, Gatsby or Astro, TypeScript or JavaScript, Tailwind v3 or v4 and your package manager. Writes `pinfold.config`, the CSS imports, the provider when needed and the Tailwind bridge. `--yes` accepts the defaults, `--components a,b` or `all` adds some, `--dir src/ui` picks the folder and remembers it. |
| `add <name…>` | Writes `components/ui/<name>.tsx` (or `.jsx`), a thin file you own, and imports the component's stylesheet and those of every component it draws inside. An unknown name stops with a suggestion and writes nothing. |
| `theme` | Generates the theme CSS from your colours: `--primary "#4f46e5" --success "rgb(22 163 74)" --style glass --radius lg`. `--check` fails if text contrast misses WCAG AA; `--format tailwind` or `dtcg` for Tailwind v4 or design tokens. |
| `doctor` | Checks the React version, the CSS order, the provider, `use client` boundaries in Next.js, browser targets and duplicate packages. |
| `mcp` | A local MCP server (stdio) over the installed packages' metadata. |

`--dry-run` prints the diff without writing. `--no-install` skips installing packages.

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
