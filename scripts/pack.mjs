/**
 * Pack the publishable packages into `dir`, exactly as npm would publish them,
 * and return `{ '@pinfold/core': 'file:…tgz', … }` for a consumer manifest.
 * Shared by consumer-smoke.mjs and fixture-apps.mjs.
 */
import { execSync } from 'node:child_process';
import { readdirSync } from 'node:fs';
import { join, resolve } from 'node:path';

export const root = resolve(import.meta.dirname, '..');

export function packTarballs(dir, packages = ['core', 'css', 'react']) {
  for (const pkg of packages) {
    execSync(`npm pack --silent --pack-destination "${dir}"`, { cwd: join(root, 'packages', pkg) });
  }
  return Object.fromEntries(
    readdirSync(dir)
      .filter((f) => f.endsWith('.tgz'))
      .map((f) => {
        const name = f.replace(/-\d.*$/, '');
        const scoped = name.startsWith('pinfold-') ? `@pinfold/${name.slice('pinfold-'.length)}` : name;
        return [scoped, `file:${join(dir, f).replace(/\\/g, '/')}`];
      }),
  );
}

/** Make every package manager resolve @pinfold/core (a dependency of @pinfold/react) to the local tarball. */
export function pinCore(tgz) {
  const pin = { '@pinfold/core': tgz['@pinfold/core'] };
  return { overrides: pin, pnpm: { overrides: pin }, resolutions: pin };
}
