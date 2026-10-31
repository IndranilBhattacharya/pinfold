# Contributing to Lumae

Read [AGENTS.md](AGENTS.md) first. Its rules bind humans and AI agents alike.

## Setup
```bash
npm install
npm run verify      # typecheck, tests, build, gzip budget
npm run test:watch
```
Requirements: Node 20 or newer, npm 10 or newer.
The docs, playground and palette studio live in the sibling repo [`../lumae-site`](../lumae-site).

## What to contribute
- Fixes and tests for existing components.
- A new component **only** once there is an owner-approved spec in `docs/components/<name>.md` ([ROADMAP.md](docs/ROADMAP.md), "Component lifecycle").
- Docs corrections. Planned behaviour must be labelled **Planned**.

## Rules
- Follow [ARCHITECTURE.md](ARCHITECTURE.md). The conformance suite (`@lumae/testing`) must pass.
- Zero runtime dependencies. `core` and `css` never import a framework.
- Update the docs in the same pull request as the behaviour change.
- Commits use conventional prefixes: `feat:`, `fix:`, `docs:`, `chore:`, `test:`, `refactor:`.
- One logical change per pull request. Explain why, not just what.

## Security
Report vulnerabilities privately. See [SECURITY.md](SECURITY.md).

## License
By contributing you agree that your contributions are licensed under the [MIT License](LICENSE).
