#!/usr/bin/env node
/**
 * Publish every package whose version is not on npm yet, in dependency order.
 * Versions already on the registry are skipped, so a release can be re-run and a package
 * that did not change keeps its version (D-22).
 *
 *   node scripts/publish.mjs --tag latest [--dry-run]
 *
 * Used by .github/workflows/release.yml (trusted publishing, provenance).
 */
import { execFileSync } from 'node:child_process';
import { readFileSync } from 'node:fs';

const args = process.argv.slice(2);
const tag = args[args.indexOf('--tag') + 1] ?? 'latest';
const dryRun = args.includes('--dry-run');
const npm = process.platform === 'win32' ? 'npm.cmd' : 'npm';
const run = (argv) => execFileSync(npm, argv, { encoding: 'utf8', shell: process.platform === 'win32' });

const packages = ['core', 'css', 'react', 'cli'].map((dir) => {
  const { name, version } = JSON.parse(readFileSync(`packages/${dir}/package.json`, 'utf8'));
  return { name, version };
});

function published({ name, version }) {
  try {
    return run(['view', `${name}@${version}`, 'version', '--json']).trim() !== '';
  } catch {
    return false; // E404: the package or the version does not exist yet
  }
}

const todo = packages.filter((p) => !published(p));
for (const p of packages) console.log(`${todo.includes(p) ? 'publish' : 'skip   '}  ${p.name}@${p.version}`);
if (!todo.length) {
  console.log('\nEvery version is already on npm. Bump a version to release it.');
  process.exit(0);
}

for (const { name } of todo) {
  // Provenance needs the CI's OIDC token; a local dry run turns it off (packages set it in publishConfig).
  const argv = ['publish', '-w', name, '--access', 'public', '--tag', tag];
  argv.push(...(dryRun ? ['--dry-run', '--provenance=false'] : ['--provenance']));
  execFileSync(npm, argv, { stdio: 'inherit', shell: process.platform === 'win32' });
}
