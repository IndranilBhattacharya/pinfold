# CLI: `npx lumae`

Status: **Planned (A6).** Today's `packages/cli/bin/lumae.mjs` has `init`, `add`, `theme`,
`palette` and `new`, and has no dependencies. A6 rebuilds it to this spec. The prompts use
`@clack/prompts`; CLI dependencies never reach the app bundle.

## Safety rules (every command)
- Never overwrite a file. Merge into it, or write a new one.
- Show a diff before writing. `--dry-run` prints the diff only. `--yes` skips the prompts for CI.
- Running a command twice changes nothing the second time.
- Use no network except the package install, which uses the package manager the project already uses (detected from its lockfile).

## `init`
```
◆  Detected: <framework> · <TS|JS> · Tailwind <v3|v4|none> · <npm|pnpm|yarn|bun>
◇  Language?            TypeScript | JavaScript         (detected: tsconfig.json or file extensions)
◇  Components?          multi-select, `a` = all
◇  Theme?               primary · neutral · style · radius · mode   (contrast report preview)
◇  Entry file?          detected per framework — confirm or type a path
◇  Tailwind             merge, never replace
◆  N files will change — show diff? (Y/n)
```
- **Framework detection.** Next.js (App Router: `app/layout.*`; Pages Router: `pages/_app.*`), Vite (`src/main.*`), React Router or Remix (`app/root.*`), Gatsby, Astro.
- **Files written:**
  - `lumae.config.(ts|js)`
  - CSS imports in the entry file (core, then each component, then the theme)
  - `LumaeProvider` wrapping the app, but only if the config needs it
  - `components/ui/<name>.(tsx|jsx)` for each component chosen
- **Tailwind:**
  - v4: append `@import` and an `@theme` token block to the global CSS file.
  - v3: edit `tailwind.config.*` at the code level to add the preset, without reformatting the file.

## `add <name…> | all`
- Installs `@lumae/react` and `@lumae/css` if they're missing.
- Adds the component's CSS import.
- Writes `components/ui/<name>.(tsx|jsx)`, a thin file the developer owns. It re-exports `use<Name>`, `define<Name>`, the tag and the types, so the app always imports from `@/components/ui/<name>`.
- JS output adds a JSDoc `@type` annotation, so editors still get types.

## `theme`
- With no flags it's interactive. With flags it's scriptable; the site's theme studio builds the command for you.
  Example: `--primary emerald --neutral 264 --style glass --radius lg --out src/theme.css --format css|tailwind|dtcg`.
- `--check` exits non-zero if any role or step misses WCAG AA contrast.
- `--from <url>` imports a theme shared from the site.

## `doctor`
Checks:
- the React version (18 or higher)
- the order of the CSS imports, and that the theme CSS is present
- that a provider exists when the config needs one
- that `'use client'` boundaries are correct in Next.js App Router projects
- the browser targets against Baseline 2023
- that `@lumae/*` packages aren't installed twice

Each problem is printed with its fix.

## `mcp` (A7)
Runs a local stdio MCP server that serves the meta, schema and docs from the installed package. Nothing is hosted.

## `new <name>` (contributors only)
Scaffolds a component that already passes conformance. See [AGENTS.md](../AGENTS.md) §5.
