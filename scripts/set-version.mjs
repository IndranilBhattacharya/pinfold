#!/usr/bin/env node
/**
 * Set one version everywhere it lives, so a release always has something new to publish:
 *
 *   npm run version:set -- 0.3.0
 *
 * Writes every package.json (and the exact @pinfold/* dependencies between them), the
 * `version` constant in @pinfold/core and the CLI's MCP server version, then refreshes the
 * lockfile. `versions.test.ts` fails if any of them drift apart.
 */
import { execFileSync } from 'node:child_process';
import { readFileSync, writeFileSync } from 'node:fs';

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

const npm = process.platform === 'win32' ? 'npm.cmd' : 'npm';
execFileSync(npm, ['install', '--package-lock-only', '--ignore-scripts'], { stdio: 'inherit', shell: process.platform === 'win32' });
console.log(`\n  every package is now ${next}. Commit, push, then run the Release workflow.`);
