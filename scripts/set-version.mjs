#!/usr/bin/env node
/**
 * Set one version everywhere it lives, so a release always has something new to publish:
 *
 *   npm run version:set -- 1.2.1
 *
 * Writes every package.json (and the exact @pinfold/* dependencies between them), the
 * `version` constant in @pinfold/core and the CLI's MCP server version, then refreshes the
 * lockfile. `versions.test.ts` fails if any of them drift apart.
 */
import { execFileSync } from 'node:child_process';
import { existsSync, readFileSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';

const next = process.argv[2];
if (!/^\d+\.\d+\.\d+(-[\w.]+)?$/.test(next ?? '')) {
  console.error('usage: npm run version:set -- <x.y.z>');
  process.exit(1);
}

for (const dir of ['core', 'css', 'react', 'cli']) {
  const file = `packages/${dir}/package.json`;
  const pkg = JSON.parse(readFileSync(file, 'utf8'));
  pkg.version = next;
  for (const dep of Object.keys(pkg.dependencies ?? {})) if (dep.startsWith('@pinfold/')) pkg.dependencies[dep] = next;
  writeFileSync(file, JSON.stringify(pkg, null, 2) + '\n');
}
const replace = (file, pattern, value) => {
  const text = readFileSync(file, 'utf8');
  if (!pattern.test(text)) throw new Error(`no version found in ${file}`);
  writeFileSync(file, text.replace(pattern, value));
};
replace('packages/core/src/index.ts', /export const version = '[^']*';/, `export const version = '${next}';`);
replace('packages/cli/lib/mcp.mjs', /const VERSION = '[^']*';/, `const VERSION = '${next}';`);

// Sibling pinfold-ui (if available)
const uiPkg = resolve('..', 'pinfold-ui/package.json');
if (existsSync(uiPkg)) {
  const pkg = JSON.parse(readFileSync(uiPkg, 'utf8'));
  pkg.version = next;
  writeFileSync(uiPkg, JSON.stringify(pkg, null, 2) + '\n');
}

const npm = process.platform === 'win32' ? 'npm.cmd' : 'npm';
execFileSync(npm, ['install', '--package-lock-only', '--ignore-scripts'], { stdio: 'inherit', shell: process.platform === 'win32' });
console.log(`\n  every package is now ${next}. Commit, push, then run the Release workflow.`);
