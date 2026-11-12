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
      'badge/client': 'src/badge/client.ts',
      'colorpicker/client': 'src/colorpicker/client.ts',
      'navbar/client': 'src/navbar/client.ts',
      'appshell/client': 'src/appshell/client.ts',
      'scrollarea/client': 'src/scrollarea/client.ts',
      'navmenu/client': 'src/navmenu/client.ts',
      'sidebar/client': 'src/sidebar/client.ts',
      'resizable/client': 'src/resizable/client.ts',
      'carousel/client': 'src/carousel/client.ts',
      'empty/client': 'src/empty/client.ts',
      'timeline/client': 'src/timeline/client.ts',
      'rating/client': 'src/rating/client.ts',
      'table/client': 'src/table/client.ts',
      'datepicker/client': 'src/datepicker/client.ts',
      'calendar/client': 'src/calendar/client.ts',
      'command/client': 'src/command/client.ts',
      'tags/client': 'src/tags/client.ts',
      'combobox/client': 'src/combobox/client.ts',
      'select/client': 'src/select/client.ts',
      'stepper/client': 'src/stepper/client.ts',
      'pagination/client': 'src/pagination/client.ts',
      'breadcrumb/client': 'src/breadcrumb/client.ts',
      'tabs/client': 'src/tabs/client.ts',
      'otp/client': 'src/otp/client.ts',
      'number/client': 'src/number/client.ts',
      'slider/client': 'src/slider/client.ts',
      'toolbar/client': 'src/toolbar/client.ts',
      'toggle/client': 'src/toggle/client.ts',
      'switch/client': 'src/switch/client.ts',
      'radio/client': 'src/radio/client.ts',
      'checkbox/client': 'src/checkbox/client.ts',
      'input/client': 'src/input/client.ts',
      'toast/client': 'src/toast/client.ts',
      'menu/client': 'src/menu/client.ts',
      'dialog/client': 'src/dialog/client.ts',
      'popover/client': 'src/popover/client.ts',
      'tooltip/client': 'src/tooltip/client.ts',
      'progress/client': 'src/progress/client.ts',
      'card/client': 'src/card/client.ts',
      'avatar/client': 'src/avatar/client.ts',
      'alert/client': 'src/alert/client.ts',
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
        'badge/index': 'src/badge/index.ts',
        'colorpicker/index': 'src/colorpicker/index.ts',
        'navbar/index': 'src/navbar/index.ts',
        'appshell/index': 'src/appshell/index.ts',
        'scrollarea/index': 'src/scrollarea/index.ts',
        'navmenu/index': 'src/navmenu/index.ts',
        'sidebar/index': 'src/sidebar/index.ts',
        'resizable/index': 'src/resizable/index.ts',
        'carousel/index': 'src/carousel/index.ts',
        'empty/index': 'src/empty/index.ts',
        'timeline/index': 'src/timeline/index.ts',
        'rating/index': 'src/rating/index.ts',
        'table/index': 'src/table/index.ts',
        'datepicker/index': 'src/datepicker/index.ts',
        'calendar/index': 'src/calendar/index.ts',
        'command/index': 'src/command/index.ts',
        'tags/index': 'src/tags/index.ts',
        'combobox/index': 'src/combobox/index.ts',
        'select/index': 'src/select/index.ts',
        'stepper/index': 'src/stepper/index.ts',
        'pagination/index': 'src/pagination/index.ts',
        'breadcrumb/index': 'src/breadcrumb/index.ts',
        'tabs/index': 'src/tabs/index.ts',
        'otp/index': 'src/otp/index.ts',
        'number/index': 'src/number/index.ts',
        'slider/index': 'src/slider/index.ts',
        'toolbar/index': 'src/toolbar/index.ts',
        'toggle/index': 'src/toggle/index.ts',
        'switch/index': 'src/switch/index.ts',
        'radio/index': 'src/radio/index.ts',
        'checkbox/index': 'src/checkbox/index.ts',
        'input/index': 'src/input/index.ts',
        'toast/index': 'src/toast/index.ts',
        'menu/index': 'src/menu/index.ts',
        'dialog/index': 'src/dialog/index.ts',
        'popover/index': 'src/popover/index.ts',
        'tooltip/index': 'src/tooltip/index.ts',
        'progress/index': 'src/progress/index.ts',
        'card/index': 'src/card/index.ts',
        'avatar/index': 'src/avatar/index.ts',
        'alert/index': 'src/alert/index.ts',
      },
      splitting: false,
      esbuildPlugins: [keepClientExternal(format === 'esm' ? '.js' : '.cjs')],
    }),
  ),
]);
