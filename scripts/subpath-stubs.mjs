#!/usr/bin/env node
/**
 * Write a stub folder per JS subpath export (`<pkg>/accordion/package.json`) so
 * bundlers that ignore the `exports` map (webpack 4, old Jest resolvers) still
 * resolve `@lumae/<pkg>/accordion`. D-14.
 *
 * Reads the package's own `exports`, so it never drifts. Run from the package dir.
 */
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { join, posix } from 'node:path';

const { exports } = JSON.parse(readFileSync('package.json', 'utf8'));

for (const [key, target] of Object.entries(exports)) {
  if (key === '.' || typeof target !== 'object') continue; // root, CSS, package.json
  const sub = key.slice(2); // './accordion/lazy' -> 'accordion/lazy'
  const up = '../'.repeat(sub.split('/').length);
  const rel = (p) => posix.join(up, p);
  mkdirSync(sub, { recursive: true });
  writeFileSync(
    join(sub, 'package.json'),
    JSON.stringify(
      {
        private: true,
        main: rel(target.require.default),
        module: rel(target.import.default),
        types: rel(target.require.types),
      },
      null,
      2,
    ) + '\n',
  );
}
