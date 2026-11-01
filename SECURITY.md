# Security policy

## Reporting a vulnerability
Report privately through GitHub's **Report a vulnerability** (Security Advisories) on this
repository. Do not open a public issue.

Include the affected package and version, the impact, and steps to reproduce.
Expect an acknowledgement within 72 hours and a fix or mitigation plan within 14 days.

## Supported versions
Pre-release: only the latest `next` tag is supported. After 1.0, the latest minor of the current major is supported.

## Supply-chain policy (D-18)
- **Zero runtime dependencies** in published packages. A release fails if one appears.
- **No install scripts** (`preinstall`, `install`, `postinstall`) in published packages.
- **Trusted publishing.** Releases are published only from GitHub Actions through npm's OIDC trusted publishing, with **provenance** (`npm publish --provenance`). There are no long-lived npm tokens.
- **Maintainer accounts** use 2FA with passkeys.
- Dev dependencies are watched by Dependabot. CI runs `npm audit` for production dependencies.
- OpenSSF Scorecard runs on the repository.
- You can verify a release's provenance with `npm audit signatures`.

## Scope notes
- Pinfold does not use `dangerouslySetInnerHTML` for any content you pass in.
- In React Server Components, any config passed to `define*` is serialised into the page payload. **Never put secrets in component config.**
