# Distribution

Status: all four packages are published to npm under the `@pinfold` scope (and `pinfold` for the CLI).

## Packages

- **`@pinfold/core`** — Framework-free component logic, keyboard navigation, unique ids, OKLCH palette engine, metadata, and config types.
  - *Imports:* `@pinfold/core`, `@pinfold/core/palette`, `@pinfold/core/meta`
- **`@pinfold/css`** — Design tokens, scoped reset, style packs, modular component stylesheets, shadcn token bridge, and Tailwind v3/v4 presets.
  - *Imports:* `@pinfold/css/core.css`, `@pinfold/css/<name>.css`, `@pinfold/css/packs.css`, `@pinfold/css/tailwind.css`, `@pinfold/css/shadcn.css`, `@pinfold/css/all.css`
- **`@pinfold/react`** — Presets (`define*`), headless hooks (`use*`), tags, `PinfoldProvider`, `defineConfig`, and component views.
  - *Imports:* `@pinfold/react`, `@pinfold/react/<name>`
- **`pinfold`** — The developer CLI and local MCP server for AI coding agents.
  - *Commands:* `npx pinfold init`, `npx pinfold add`, `npx pinfold theme`, `npx pinfold doctor`, `npx pinfold mcp`

- **Subpath exports** and `sideEffects: ["*.css"]` mean an unused component adds 0 bytes to the app bundle.
- **ESM and CJS builds**, plus `.d.ts`, `typesVersions` and a stub folder per subpath for older toolchains ([COMPATIBILITY.md](COMPATIBILITY.md)).
- **Future frameworks** (`@pinfold/vue`, `@pinfold/angular`) depend on `@pinfold/core` and `@pinfold/css`, and are published under the same org.
- **Budgets:** each entry point has a gzip budget enforced by `scripts/size-check.mjs`.

## Shipped inside `@pinfold/react`
Generated from meta at build time by `scripts/generate-artifacts.mjs`, so they always match the
installed version (the consumer smoke test checks they are in the tarball):
- `llms.txt` (rules for generating Pinfold code, plus the component list) and `llms-full.txt` (every
  option of every component).
- `schema/<name>.json`, the JSON Schema of the config.
- `registry/registry.json` (the shadcn registry index) and `registry/<name>.json`, a shadcn registry
  item. It installs `components/ui/<name>.tsx`, which re-exports the hook, `define*`, the tag and the
  types and imports the component's CSS, and declares `@pinfold/react` and `@pinfold/css` as
  dependencies.

## Local MCP server
`npx pinfold mcp` speaks the Model Context Protocol over stdio and answers from the installed meta:
`search_components`, `list_components`, `get_component`, `get_schema`, `validate_config` and `get_install_steps` (all read-only), plus
each component's reference as a resource. Nothing is hosted.

```json
{ "mcpServers": { "pinfold": { "command": "npx", "args": ["pinfold", "mcp"] } } }
```

## The shadcn registry
- Namespaced: add `"registries": { "@pinfold": "https://pinfold.indranildev.in/r/{name}.json" }` to `components.json`, then `npx shadcn add @pinfold/accordion`. Listing in shadcn's public registry index is **Planned**.
- Served by the site from the npm package. The fallback URL is `https://cdn.jsdelivr.net/npm/@pinfold/react/registry/accordion.json`.
- Tokens map onto shadcn's CSS variables (`--primary`, `--background`, …) as an opt-in, so Pinfold components look at home in shadcn apps (`@pinfold/css/shadcn.css`).

## Release process
- One version for every package. Releasing:
  1. `npm run version:set -- 0.4.0` writes it into every `package.json`, the `@pinfold/*` dependencies,
     the `version` constant in `@pinfold/core` and the CLI's MCP server, and refreshes the lockfile
     (`versions.test.ts` fails if any copy drifts).
  2. Commit and push; wait for CI.
  3. Actions → Release → Run workflow, then approve it (the `npm` environment requires a reviewer).
- Publish from GitHub Actions (`.github/workflows/release.yml`, manual trigger) with **npm trusted publishing** (OIDC) and `--provenance`. No long-lived tokens. The very first publish of each package is manual (a package must exist before a trusted publisher can be attached). The workflow audits the dependency tree and the installed tarballs (`npm audit`, zero findings allowed), then runs `scripts/publish.mjs`, which publishes the versions that are not on npm yet (a half-finished release can be re-run) and **fails when there is nothing new to publish**, so a forgotten version bump shows up red instead of a silent success.
- Changesets for changelogs (**Planned**).
- Maintainer account: 2FA with passkeys. Packages have no install scripts. A release fails if a runtime dependency appears.
- Pre-release tags (`next`) for internal feedback before each stable release.
