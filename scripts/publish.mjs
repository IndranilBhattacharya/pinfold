#!/usr/bin/env node
/**
 * Publish every package whose version is not on npm yet, in dependency order.
 * Versions already on the registry are skipped, so a half-finished release can be re-run.
 * A run with nothing new to publish fails: bump with `npm run version:set -- <x.y.z>` first.
 *
 *   node scripts/publish.mjs --tag latest [--dry-run]
 *
 * Used by .github/workflows/release.yml (trusted publishing, provenance).
 */
import { execFileSync } from 'node:child_process';
import { readFileSync } from 'node:fs';

const args = process.argv.slice(2);
const tag = args.includes('--tag') ? args[args.indexOf('--tag') + 1] : 'latest';
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
  // A release that publishes nothing is a mistake, not a success: fail so it shows up red.
  console.error('\nNothing to publish: every version is already on npm. Run `npm run version:set -- <x.y.z>`, commit, push, then release again.');
  process.exit(1);
}

/**
 * Trusted publishing check. npm swaps the CI's OIDC token for a short-lived publish token; when
 * npm rejects the swap it silently falls back to no auth and the publish fails with a bare
 * "404 Not Found - PUT". Do the same swap first, for every package, so a rejected one stops the
 * release before anything is published and prints npm's own reason.
 */
async function checkTrustedPublishing(names) {
  const { ACTIONS_ID_TOKEN_REQUEST_URL: url, ACTIONS_ID_TOKEN_REQUEST_TOKEN: bearer } = process.env;
  if (!url || !bearer) return; // not in GitHub Actions (or no `id-token: write`): nothing to check
  const id = await fetch(`${url}&audience=npm:registry.npmjs.org`, { headers: { Authorization: `Bearer ${bearer}` } });
  if (!id.ok) throw new Error(`GitHub refused an OIDC token (${id.status}). The job needs \`permissions: id-token: write\`.`);
  const { value } = await id.json();
  const failed = [];
  for (const name of names) {
    const res = await fetch(`https://registry.npmjs.org/-/npm/v1/oidc/token/exchange/package/${name.replace('/', '%2f')}`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${value}` },
    });
    if (res.ok) console.log(`ok       trusted publisher for ${name}`);
    else failed.push(`  ${name}: ${res.status} ${(await res.text()).slice(0, 300)}`);
  }
  if (failed.length) {
    const repo = process.env.GITHUB_REPOSITORY ?? '<owner>/<repo>';
    console.error(
      `\nnpm rejected trusted publishing:\n${failed.join('\n')}\n\n` +
        `On npmjs.com, open each package above → Settings → Trusted publisher → GitHub Actions, and enter exactly:\n` +
        `  Organization or user: ${repo.split('/')[0]}\n  Repository: ${repo.split('/')[1]}\n` +
        `  Workflow filename: release.yml\n  Environment name: npm\n` +
        `A package that has never been published needs one manual \`npm publish\` first.`,
    );
    process.exit(1);
  }
}

if (!dryRun) await checkTrustedPublishing(todo.map((p) => p.name));

for (const { name } of todo) {
  // Provenance needs the CI's OIDC token; a local dry run turns it off (packages set it in publishConfig).
  const argv = ['publish', '-w', name, '--access', 'public', '--tag', tag];
  argv.push(...(dryRun ? ['--dry-run', '--provenance=false'] : ['--provenance']));
  execFileSync(npm, argv, { stdio: 'inherit', shell: process.platform === 'win32' });
}
