import { readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';

/**
 * core and css must stay framework-free so a future Vue or Angular
 * adapter reuses them unchanged. Any framework import here fails the build.
 */
const FRAMEWORKS = /from\s+['"](react|react-dom|vue|@angular\/[^'"]+|svelte|solid-js|preact)(\/[^'"]*)?['"]|require\(\s*['"](react|vue|@angular)/;

function files(dir: string): string[] {
  return readdirSync(dir, { withFileTypes: true }).flatMap((e) =>
    e.isDirectory() ? files(join(dir, e.name)) : [join(dir, e.name)],
  );
}

describe('framework isolation', () => {
  for (const pkg of ['packages/core/src', 'packages/css']) {
    it(`${pkg} imports no UI framework`, () => {
      const offenders = files(pkg)
        .filter((f) => /\.(ts|tsx|js|mjs|cjs|css)$/.test(f) && !f.endsWith('.test.ts'))
        .filter((f) => FRAMEWORKS.test(readFileSync(f, 'utf8')));
      expect(offenders).toEqual([]);
    });
  }
});
