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
 * 2026-11-01: accordion features (find-in-page, hash sync, mount policies,
 * transitions, change details, server twin) 6 -> 8, including the dev-only
 * validator chunk that apps never load; accordion CSS (container queries,
 * overflow policy, touch targets) 3 -> 4. New app row: what a production app
 * that renders one accordion actually ships.
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
  ['packages/core/dist/index.js', 11], // every component's rules live here; apps tree-shake to what they use (see the app row)
  ['packages/core/dist/palette.js', 4],
  ['packages/react/dist/index.js', 3],
  ['packages/react/dist/accordion/index.js', 9], // 2026-11-03: presets, tag prop split, no :has(); the app row is what ships
  ['packages/react/dist/button/index.js', 5], // entry + the shared provider/component chunks, like accordion
  ['packages/react/dist/spinner/index.js', 4],
  ['packages/react/dist/separator/index.js', 4],
  ['packages/react/dist/kbd/index.js', 4],
  ['packages/react/dist/skeleton/index.js', 4.5], // shares the provider, which now carries the app's router
  ['packages/react/dist/badge/index.js', 5],
  ['packages/react/dist/stepper/index.js', 8], // renders Pinfold buttons (Back, Next, Finish) and the step panels
  ['packages/react/dist/pagination/index.js', 7], // page size select, go to page, summary, sliding cursor, cursor-paged mode
  ['packages/react/dist/breadcrumb/index.js', 12], // renders Pinfold menus (crumb menus, collapsed crumbs), with the overlay layer
  ['packages/react/dist/tabs/index.js', 7], // close and add, link tabs, overflow fades
  ['packages/react/dist/otp/index.js', 6],
  ['packages/react/dist/number/index.js', 7],
  ['packages/react/dist/slider/index.js', 7],
  ['packages/react/dist/toolbar/index.js', 6],
  ['packages/react/dist/toggle/index.js', 6],
  ['packages/react/dist/switch/index.js', 6],
  ['packages/react/dist/radio/index.js', 6],
  ['packages/react/dist/checkbox/index.js', 6],
  ['packages/react/dist/input/index.js', 8],
  ['packages/react/dist/toast/index.js', 10],
  ['packages/react/dist/menu/index.js', 10],
  ['packages/react/dist/dialog/index.js', 10],
  ['packages/react/dist/popover/index.js', 10],
  ['packages/react/dist/tooltip/index.js', 10],
  ['packages/react/dist/progress/index.js', 5],
  ['packages/react/dist/card/index.js', 6],
  ['packages/react/dist/avatar/index.js', 10],
  ['packages/react/dist/alert/index.js', 6],
  ['packages/css/dist/core.css', 5],
  ['packages/css/dist/accordion.css', 4],
  ['packages/css/dist/button.css', 2],
  ['packages/css/dist/spinner.css', 2], // six animations (ring, arc, dots, bars, pulse, orbit)
  ['packages/css/dist/separator.css', 1],
  ['packages/css/dist/kbd.css', 1],
  ['packages/css/dist/skeleton.css', 1],
  ['packages/css/dist/badge.css', 2],
  ['packages/css/dist/stepper.css', 2.5], // label placement, the step panel and actions, error steps
  ['packages/css/dist/pagination.css', 2],
  ['packages/css/dist/breadcrumb.css', 2],
  ['packages/css/dist/tabs.css', 3], // five variants, four placements, overflow fades, close and add
  ['packages/css/dist/otp.css', 2],
  ['packages/css/dist/number.css', 2],
  ['packages/css/dist/slider.css', 2.5], // three variants (line, bar, minimal), step dots, marks, value bubble
  ['packages/css/dist/toolbar.css', 2],
  ['packages/css/dist/toggle.css', 2],
  ['packages/css/dist/switch.css', 2],
  ['packages/css/dist/radio.css', 2],
  ['packages/css/dist/checkbox.css', 2],
  ['packages/css/dist/input.css', 2],
  ['packages/css/dist/toast.css', 2],
  ['packages/css/dist/menu.css', 2],
  ['packages/css/dist/dialog.css', 2],
  ['packages/css/dist/popover.css', 2],
  ['packages/css/dist/tooltip.css', 2],
  ['packages/css/dist/progress.css', 2],
  ['packages/css/dist/card.css', 2],
  ['packages/css/dist/avatar.css', 2],
  ['packages/css/dist/alert.css', 2],
  ['packages/css/dist/packs.css', 2],
];

/** A production app rendering one accordion: minified, NODE_ENV=production, React excluded. */
const APP_BUDGET = 6;

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

if (existsSync('packages/react/dist/accordion/index.js')) {
  const { build } = await import('esbuild');
  const out = await build({
    stdin: {
      contents: "import { useAccordion } from '@pinfold/react/accordion'; globalThis.x = useAccordion;",
      resolveDir: process.cwd(),
    },
    bundle: true,
    minify: true,
    write: false,
    format: 'esm',
    external: ['react'],
    define: { 'process.env.NODE_ENV': '"production"' },
    alias: {
      '@pinfold/core': './packages/core/dist/index.js',
      '@pinfold/react/accordion': './packages/react/dist/accordion/index.js',
    },
    logLevel: 'silent',
  });
  const size = kb(gzipSync(out.outputFiles[0].contents).length);
  const over = size > APP_BUDGET;
  failed = failed || over;
  const mark = over ? '\x1b[31mover\x1b[0m' : '\x1b[32m ok \x1b[0m';
  console.log(`  ${String(size).padStart(6)}kB ${String(APP_BUDGET).padStart(5)}kB  app: useAccordion, production bundle  ${mark}`);
}

console.log(`\n  total ${kb(total * 1024)}kB gzipped across all published entry points\n`);

if (failed && strict) {
  console.error('  Over budget. Either trim it, or raise the ceiling on purpose.\n');
  process.exit(1);
}
