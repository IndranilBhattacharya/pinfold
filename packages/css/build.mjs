#!/usr/bin/env node
/**
 * Assemble @pinfold/css. No bundler: rules ship exactly as written and reviewed; only the
 * comments are stripped.
 *
 *   dist/core.css       reset + tokens + what every form control shares (import first, once)
 *   dist/<name>.css     one per component
 *   dist/all.css        core + every component
 *   dist/tailwind.css   Tailwind v4 theme      tailwind/preset.cjs  Tailwind v3 preset
 */
import { copyFileSync, mkdirSync, readdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs';

// Comments explain the source; users download only the rules. Nothing else is rewritten.
const read = (f) => readFileSync(f, 'utf8').replace(/\/\*[\s\S]*?\*\//g, '').replace(/\n\s*\n+/g, '\n');
rmSync('dist', { recursive: true, force: true });
mkdirSync('dist');

const core = read('src/reset.css') + '\n' + read('src/tokens.css') + '\n' + read('src/field.css');
// Opt-in extras: packs.css (style packs) joins all.css; shadcn.css (an unlayered
// variable bridge) never does, because it rewrites another library's variables.
const extras = ['packs.css', 'shadcn.css'];
const components = readdirSync('src')
  .filter((f) => f.endsWith('.css') && f !== 'reset.css' && f !== 'tokens.css' && f !== 'field.css' && !extras.includes(f))
  .sort();

writeFileSync('dist/core.css', core);
for (const f of ['reset.css', 'tokens.css', 'field.css', ...components, ...extras]) writeFileSync(`dist/${f}`, read(`src/${f}`));
writeFileSync('dist/all.css', [core, ...components.map((f) => read(`src/${f}`)), read('src/packs.css')].join('\n'));
copyFileSync('tailwind/theme.css', 'dist/tailwind.css');

console.log(`@pinfold/css: core + ${components.length} component(s) -> dist/`);
