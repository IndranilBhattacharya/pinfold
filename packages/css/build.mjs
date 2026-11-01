#!/usr/bin/env node
/**
 * Assemble @pinfold/css. No bundler: CSS is copied as written, so what ships is
 * exactly what was reviewed.
 *
 *   dist/core.css       reset + tokens (import first, once)
 *   dist/<name>.css     one per component
 *   dist/all.css        core + every component
 *   dist/tailwind.css   Tailwind v4 theme      tailwind/preset.cjs  Tailwind v3 preset
 */
import { copyFileSync, mkdirSync, readdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs';

const read = (f) => readFileSync(f, 'utf8');
rmSync('dist', { recursive: true, force: true });
mkdirSync('dist');

const core = read('src/reset.css') + '\n' + read('src/tokens.css');
const components = readdirSync('src')
  .filter((f) => f.endsWith('.css') && f !== 'reset.css' && f !== 'tokens.css')
  .sort();

writeFileSync('dist/core.css', core);
copyFileSync('src/reset.css', 'dist/reset.css');
copyFileSync('src/tokens.css', 'dist/tokens.css');
for (const f of components) copyFileSync(`src/${f}`, `dist/${f}`);
writeFileSync('dist/all.css', [core, ...components.map((f) => read(`src/${f}`))].join('\n'));
copyFileSync('tailwind/theme.css', 'dist/tailwind.css');

console.log(`@pinfold/css: core + ${components.length} component(s) -> dist/`);
