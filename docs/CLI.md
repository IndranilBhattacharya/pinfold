# CLI: `npx pinfold`

Status: **shipped.** `packages/cli`: `bin/pinfold.mjs` (arguments, prompts), `lib/detect.mjs`
(project detection), `lib/plan.mjs` (the change plan and source edits), `lib/commands.mjs` (init,
add, theme, doctor). The prompts use `@clack/prompts`, the only dependency besides
`@pinfold/core`; CLI dependencies never reach the app bundle.

Tested in `cli.test.ts` (throwaway Vite + TS + Tailwind v4, Next.js + JS + Tailwind v3 projects)
and in `scripts/fixture-apps.mjs --cli`, which runs `init` and `add` twice in the Next.js, webpack and
Vite + TypeScript apps, requires the second run to change nothing, and then builds them (the Vite app is set
up by the CLI alone, type-checked and bundled).

## In short
```
npm install @pinfold/react @pinfold/css      # or let init install them
npx pinfold init                             # language, folder, theme; no components unless you pick some
npx pinfold add button table                 # one file each, plus the CSS they need
```

## Safety rules (every command)
- Never overwrite a file. Merge into it, or write a new one.
- Show a diff before writing. `--dry-run` prints the diff only. `--yes` skips the prompts for CI.
- Running a command twice changes nothing the second time.
- Use no network except the package install, which uses the package manager the project already uses (detected from its lockfile). `--no-install` skips it.
- Files Pinfold owns (the theme CSS) are regenerated; files the developer owns (`pinfold.config.*`, `components/ui/*`) are created once and then left alone.

## `init`
```
◆  Detected: <framework> · <TS|JS> · Tailwind <v3|v4|none> · <npm|pnpm|yarn|bun>
◇  Language?            TypeScript | JavaScript         (detected: tsconfig.json or file extensions)
◇  Components folder?   detected (`src/components/ui` or `components/ui`), or your own
◇  Components?          none by default; pick some, `a` = all (add more later with `add`)
◇  Theme?               brand colour (#hex, rgb(), oklch() or a hue name) · style · radius · mode
◇  Entry file?          detected per framework — confirm or type a path
◇  Tailwind             merge, never replace
◆  N files will change — show diff? (Y/n)
```
- **Framework detection.** Next.js (App Router: `app/layout.*`; Pages Router: `pages/_app.*`), Vite (`src/main.*`), React Router or Remix (`app/root.*`), Gatsby (`gatsby-browser.*`), Astro (no entry file: the CSS imports are printed), plain React (`src/index.*`).
- **`--yes` defaults:** the detected language, folder and entry, no components, `violet`, radius `md`, no style pack,
  system colour mode. `--components button,table` (or `all`) adds some; `--dir src/ui` picks the folder and saves it
  in `package.json` (`"pinfold": { "components": "src/ui" }`) so every later `add` uses it.
- **Files written:**
  - `pinfold.config.(ts|js)`
  - CSS imports in the entry file (core, then each component, then the theme)
  - `PinfoldProvider` wrapping the app, but only if the config needs it (a style pack, a fixed colour mode or a non-default radius). It wraps `{children}` (Next.js App Router), `<Component {...pageProps} />` (Pages Router) or `<App />` (Vite); otherwise it prints where to add it.
  - `components/ui/<name>.(tsx|jsx)` for each component chosen
- **Tailwind:**
  - v4: add `@import "@pinfold/css/tailwind.css";` (the `@theme` token mapping) after the global CSS file's last `@import`.
  - v3: add the preset to `presets` in `tailwind.config.*` (CommonJS `require` or an ESM import), without reformatting the file.

## `add <name…> | all`
- Installs `@pinfold/react` and `@pinfold/css` if they're missing from `package.json`.
- Adds the component's CSS import, and the CSS of every component it draws inside, all the way down (`add table`
  also imports pagination, select, date picker, calendar, checkbox, radio, input, number and button styles). They
  go after `core.css` and before the theme import.
- An unknown name stops the whole command before anything is written, with the closest name: `unknown component
  \`tabel\` (did you mean \`table\`?)`, exit code 1. `add` with no name is a usage error.
- `--dir <folder>` writes this run's files into another folder.
- Writes `components/ui/<name>.(tsx|jsx)`, a thin file the developer owns. It re-exports `use<Name>`, `define<Name>`, the tag and the types, so the app always imports from `@/components/ui/<name>`. It has no `'use client'`, so Server Components can import `define<Name>` from it.
- JS output adds a JSDoc `@type` annotation, so editors still get types.

## `theme`
- With no flags it's interactive. With flags it's scriptable; the site's theme studio builds the command for you.
  Example: `--primary emerald --neutral 264 --style glass --radius lg --out src/theme.css --format css|tailwind|dtcg`.
  Any role also takes your own colour: `--primary "#4f46e5" --success "rgb(22 163 74)"` (quote it in the shell).
- The palette is stored in the theme file's first line (`/* pinfold-theme {...} */`), so each run changes only the flags given.
- `--format dtcg` writes `<theme>.tokens.json` (W3C design tokens); `--format tailwind` prepends the Tailwind v4 import.
- `--check` exits non-zero if the accent text steps (600 on light surfaces, 400 on dark ones) miss WCAG AA (4.5:1).
- `--from <url>` imports a theme shared from the site: the palette is read from the URL's query string, with no request.
- `--style <pack>` also sets `stylePack` in `pinfold.config.*`.

## `doctor`
Checks:
- the React version (18 or higher)
- the order of the CSS imports, and that the theme CSS is present
- that a provider exists when the config needs one
- that `'use client'` boundaries are correct in Next.js App Router projects
- the browser targets against Baseline 2023
- that `@pinfold/*` packages aren't installed twice

Each problem is printed with its fix. Errors exit with status 1; warnings (no theme file, old browser targets, no entry) do not.

## `mcp`
Runs a local stdio MCP server (newline-delimited JSON-RPC 2.0) that serves the meta, schema and docs from the installed packages. Nothing is hosted. Tools: `list_components`, `get_component`, `get_schema`, `validate_config`, `get_install_steps`. See [DISTRIBUTION.md](DISTRIBUTION.md).

## `new <name>` (contributors only)
Scaffolds a component that already passes conformance. See [CONTRIBUTING.md](../CONTRIBUTING.md).
