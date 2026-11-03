import { readFileSync, readdirSync, writeFileSync } from 'node:fs';
import { basename, join } from 'node:path';
import { defineConfig, type Options } from 'tsup';
import type { Plugin } from 'esbuild';

/**
 * Two builds, so one import path works in Server and Client Components:
 *
 * 1. Client modules (`client`, `accordion/client`, `accordion/lazy`) get a
 *    'use client' banner. Code splitting puts shared modules (provider,
 *    hooks) in common chunks, so every subpath sees one React context.
 * 2. Barrels (every `index`) stay server-safe: they hold `defineConfig` /
 *    `define<Name>` and re-export their sibling client module, which is kept
 *    external (`./client` -> `./client.js`).
 *
 * Entry names must match package.json `exports`.
 */
const keepClientExternal = (ext: string): Plugin => ({
  name: 'pinfold:external-client',
  setup(build) {
    build.onResolve({ filter: /^\.\/client$/ }, () => ({ path: `./client${ext}`, external: true }));
  },
});

/** tsup's ESM-to-CJS pass for split chunks drops the banner; put it back on every client .cjs file. */
function directiveOnClientCjs() {
  const walk = (dir: string): string[] =>
    readdirSync(join('dist', dir), { withFileTypes: true }).flatMap((e) =>
      e.isDirectory() ? walk(join(dir, e.name)) : e.name.endsWith('.cjs') ? [join(dir, e.name)] : [],
    );
  for (const file of walk('')) {
    if (basename(file) === 'index.cjs') continue; // barrels stay server-safe
    const code = readFileSync(join('dist', file), 'utf8');
    if (!code.startsWith("'use client'") && !code.startsWith('"use client"')) {
      writeFileSync(join('dist', file), '"use client";\n' + code);
    }
  }
}

const shared: Options = {
  format: ['esm', 'cjs'],
  dts: true,
  clean: false,
  treeshake: true,
  target: 'es2018',
  external: ['react', '@pinfold/core'],
};

export default defineConfig([
  {
    ...shared,
    entry: {
      client: 'src/client.ts',
      'accordion/client': 'src/accordion/client.ts',
      'accordion/lazy': 'src/accordion/lazy.ts',
      'button/client': 'src/button/client.ts',
      'spinner/client': 'src/spinner/client.ts',
      'separator/client': 'src/separator/client.ts',
      'kbd/client': 'src/kbd/client.ts',
      'skeleton/client': 'src/skeleton/client.ts',
    },
    splitting: true,
    // Rollup's tree-shaking pass strips module directives; esbuild's own tree-shaking keeps the banner.
    treeshake: false,
    banner: { js: "'use client';" },
    onSuccess: () => Promise.resolve(directiveOnClientCjs()),
  },
  ...(['esm', 'cjs'] as const).map(
    (format): Options => ({
      ...shared,
      format: [format],
      // One declaration build is enough for both formats; tsup names them .d.ts / .d.cts.
      dts: true,
      entry: {
        index: 'src/index.ts',
        'accordion/index': 'src/accordion/index.ts',
        'button/index': 'src/button/index.ts',
        'spinner/index': 'src/spinner/index.ts',
        'separator/index': 'src/separator/index.ts',
        'kbd/index': 'src/kbd/index.ts',
        'skeleton/index': 'src/skeleton/index.ts',
      },
      splitting: false,
      esbuildPlugins: [keepClientExternal(format === 'esm' ? '.js' : '.cjs')],
    }),
  ),
]);
