// @vitest-environment node
/** One version everywhere (`npm run version:set -- x.y.z` writes them all). */
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';
import { version } from './index';

const root = resolve(import.meta.dirname, '../../..');
const pkg = (dir: string) => JSON.parse(readFileSync(resolve(root, 'packages', dir, 'package.json'), 'utf8'));

describe('versions', () => {
  it('every published package, its @pinfold dependencies and the version constants agree', () => {
    const found: Record<string, string> = { 'core version constant': version };
    for (const dir of ['core', 'css', 'react', 'cli']) {
      const p = pkg(dir);
      found[p.name] = p.version;
      for (const [dep, range] of Object.entries<string>(p.dependencies ?? {})) if (dep.startsWith('@pinfold/')) found[`${p.name} -> ${dep}`] = range;
    }
    found['cli mcp VERSION'] = readFileSync(resolve(root, 'packages/cli/lib/mcp.mjs'), 'utf8').match(/const VERSION = '([^']*)'/)![1];
    expect(new Set(Object.values(found)), JSON.stringify(found, null, 2)).toEqual(new Set([pkg('core').version]));
  });
});
