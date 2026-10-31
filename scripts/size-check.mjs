#!/usr/bin/env node
/**
 * Bundle budget. "Lightweight" is a claim until something fails the build when
 * it stops being true, so every published entry point has a gzip ceiling here.
 *
 *   node scripts/size-check.mjs          report
 *   node scripts/size-check.mjs --strict exit 1 when over budget (used in CI)
 */
import { gzipSync } from 'node:zlib';
import { readFileSync, existsSync } from 'node:fs';
import { dirname, join } from 'node:path';

/**
 * An entry plus every relative chunk it statically imports: with code splitting,
 * the entry file alone undercounts what a consumer actually downloads.
 */
function withChunks(file, seen = new Set()) {
  if (seen.has(file)) return seen;
  seen.add(file);
  if (file.endsWith('.js')) {
    const code = readFileSync(file, 'utf8');
    for (const [, rel] of code.matchAll(/(?:import|export)[^'"]*?from\s*['"](\.{1,2}\/[^'"]+)['"]/g)) {
      withChunks(join(dirname(file), rel), seen);
    }
  }
  return seen;
}

/**
 * Gzipped kB ceilings. Raise deliberately, in a commit that says why.
 *
 * 2026-10-31: re-layout into core/css/react. Entry sizes now include the
 * shared chunks they import. Core is framework-free and smaller (4 -> 3).
 *
 * 2026-08-19: core CSS 4 -> 5 and accordion 4 -> 5. The CSS grew when every
 * rule moved inside a cascade layer (which is what lets Tailwind utilities win
 * for free); the accordion grew for sub-components, unstyled mode, per-row
 * overrides and state-function config fields.
 */
const BUDGETS = [
  ['packages/core/dist/index.js', 3],
  ['packages/core/dist/palette.js', 4],
  ['packages/react/dist/index.js', 3],
  ['packages/react/dist/accordion/index.js', 6],
  ['packages/css/dist/core.css', 5],
  ['packages/css/dist/accordion.css', 3],
];

const strict = process.argv.includes('--strict');
const kb = (bytes) => Math.round((bytes / 1024) * 100) / 100;

let failed = false;
let total = 0;

console.log('\n  gzip     budget   file');
for (const [file, budget] of BUDGETS) {
  if (!existsSync(file)) {
    console.log(`  ${'—'.padStart(6)}   ${String(budget).padStart(5)}kB  ${file}  (not built)`);
    continue;
  }
  const size = kb(gzipSync(Buffer.concat([...withChunks(file)].map((f) => readFileSync(f)))).length);
  total += size;
  const over = size > budget;
  failed = failed || over;
  const mark = over ? '\x1b[31mover\x1b[0m' : '\x1b[32m ok \x1b[0m';
  console.log(`  ${String(size).padStart(6)}kB ${String(budget).padStart(5)}kB  ${file}  ${mark}`);
}

console.log(`\n  total ${kb(total * 1024)}kB gzipped across all published entry points\n`);

if (failed && strict) {
  console.error('  Over budget. Either trim it, or raise the ceiling on purpose.\n');
  process.exit(1);
}
