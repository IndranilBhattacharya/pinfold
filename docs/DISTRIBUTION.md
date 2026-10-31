# Distribution

Status: **Planned (A1, A7).** Today the packages are `@lumae/core`, `@lumae/accordion`,
`@lumae/tailwind`, `@lumae/testing` and `lumae`, and none are published.

## Packages (D-05)
| Package | Contents | Imports |
|---|---|---|
| `@lumae/core` | Framework-free: logic for each component, store, keyboard navigation, ids, palette engine, meta, config types | `@lumae/core`, `@lumae/core/palette` |
| `@lumae/css` | tokens, reset, style packs, the CSS for each component | `@lumae/css/core.css`, `@lumae/css/accordion.css`, `@lumae/css/all.css` |
| `@lumae/react` | hooks, `define*`, tags, `LumaeProvider`, `defineConfig`, views | `@lumae/react`, `@lumae/react/accordion` |
| `lumae` | the CLI | `npx lumae …` |

- **Subpath exports** and `sideEffects: ["*.css"]` mean an unused component adds 0 bytes to the app bundle.
- **ESM and CJS builds**, plus `.d.ts`, `typesVersions` and a stub folder per subpath for older toolchains ([COMPATIBILITY.md](COMPATIBILITY.md)).
- **Future frameworks** (`@lumae/vue`, `@lumae/angular`) depend on `@lumae/core` and `@lumae/css`, and are published under the same org.
- **Budgets:** each entry point has a gzip budget enforced by `scripts/size-check.mjs`.

## Shipped inside each package (A7)
- `AGENTS.md` and `llms.txt`, dense and generated from meta.
- `schema/<name>.json`, the JSON Schema of the config.
- `registry/<name>.json`, a shadcn registry item. It installs `components/ui/<name>.tsx` and declares `@lumae/react` as a dependency.

## The shadcn registry
- Namespaced: `npx shadcn add @lumae/accordion`, once listed in shadcn's registry index.
- Served by the site from the npm package. The fallback URL is `https://cdn.jsdelivr.net/npm/@lumae/react/registry/accordion.json`.
- Tokens map onto shadcn's CSS variables (`--primary`, `--background`, …) as an opt-in, so Lumae components look at home in shadcn apps (A5).

## Release process (D-18)
- Changesets for versioning and changelogs.
- Publish from GitHub Actions with **npm trusted publishing** (OIDC) and `--provenance`. No long-lived tokens.
- Owner account: 2FA with passkeys. Packages have no install scripts. A release fails if a runtime dependency appears.
- Pre-release tags (`next`) for internal feedback before each stable release.
