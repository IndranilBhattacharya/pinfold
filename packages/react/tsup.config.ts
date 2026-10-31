import { readFileSync } from 'node:fs';
import { defineConfig } from 'tsup';

// Entries come from package.json `exports`, the single source of truth:
// './accordion' -> import.default './dist/accordion/index.js' -> src/accordion/index.ts
const { exports } = JSON.parse(readFileSync('package.json', 'utf8'));
const entry: Record<string, string> = {};
for (const target of Object.values<any>(exports)) {
  if (typeof target !== 'object') continue;
  const out = target.import.default.replace(/^\.\/dist\//, '').replace(/\.js$/, '');
  entry[out] = `src/${out}.ts`;
}

export default defineConfig({
  entry,
  format: ['esm', 'cjs'],
  dts: true,
  clean: true,
  treeshake: true,
  // Shared modules (provider, hooks) land in common chunks, so every subpath
  // sees the same React context instance.
  splitting: true,
  target: 'es2018',
  external: ['react', '@lumae/core'],
});
