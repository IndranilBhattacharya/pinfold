# Distribution

Status: the four packages below exist in this repo and build; only the `pinfold` name placeholder is
published so far.

## Packages (D-05)
| Package | Contents | Imports |
|---|---|---|
| `@pinfold/core` | Framework-free: logic for each component, keyboard navigation, ids, palette engine, meta (validator, JSON schema, docs renderer), config types | `@pinfold/core`, `@pinfold/core/palette`, `@pinfold/core/meta` |
| `@pinfold/css` | tokens, reset, style packs, the CSS for each component, the shadcn variable bridge, Tailwind v3/v4 | `@pinfold/css/core.css`, `@pinfold/css/accordion.css`, `@pinfold/css/packs.css`, `@pinfold/css/shadcn.css`, `@pinfold/css/all.css` |
| `@pinfold/react` | hooks, `define*`, tags, `PinfoldProvider`, `defineConfig`, views | `@pinfold/react`, `@pinfold/react/accordion` |
| `pinfold` | the CLI and the local MCP server | `npx pinfold …`, `npx pinfold mcp` |

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
`list_components`, `get_component`, `get_schema`, `validate_config` and `get_install_steps`, plus
each component's reference as a resource. Nothing is hosted.

```json
{ "mcpServers": { "pinfold": { "command": "npx", "args": ["pinfold", "mcp"] } } }
```

## The shadcn registry
- Namespaced: add `"registries": { "@pinfold": "https://pinfold.indranildev.in/r/{name}.json" }` to `components.json`, then `npx shadcn add @pinfold/accordion`. Listing in shadcn's public registry index (a pull request to shadcn) is a launch step for the owner.
- Served by the site from the npm package. The fallback URL is `https://cdn.jsdelivr.net/npm/@pinfold/react/registry/accordion.json`.
- Tokens map onto shadcn's CSS variables (`--primary`, `--background`, …) as an opt-in, so Pinfold components look at home in shadcn apps (`@pinfold/css/shadcn.css`).

## Release process (D-18)
- Changesets for versioning and changelogs (**Planned**, before the first publish).
- Publish from GitHub Actions (`.github/workflows/release.yml`, manual trigger) with **npm trusted publishing** (OIDC) and `--provenance`. No long-lived tokens. The very first publish of each package is manual (a package must exist before a trusted publisher can be attached). The workflow audits the dependency tree and the installed tarballs (`npm audit`, zero findings allowed), then runs `scripts/publish.mjs`, which publishes only the package versions that are not on npm yet: bump a version to release that package; a re-run is safe.
- Owner account: 2FA with passkeys. Packages have no install scripts. A release fails if a runtime dependency appears.
- Pre-release tags (`next`) for internal feedback before each stable release.
