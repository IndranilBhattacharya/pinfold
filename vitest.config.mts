import { defineConfig, type Plugin } from 'vitest/config';
import { resolve } from 'node:path';
import { transformAsync } from '@babel/core';

const src = (p: string) => resolve(import.meta.dirname, 'packages', p);

/**
 * Run the real React Compiler over `*.compiled.jsx` fixtures only, the way a
 * consumer app with the compiler enabled would. JSX is left for esbuild.
 */
function reactCompiler(): Plugin {
  return {
    name: 'pinfold:react-compiler',
    enforce: 'pre',
    async transform(code, id) {
      if (!id.endsWith('.compiled.jsx')) return null;
      const out = await transformAsync(code, {
        filename: id,
        babelrc: false,
        configFile: false,
        plugins: ['@babel/plugin-syntax-jsx', ['babel-plugin-react-compiler', { target: '18' }]],
        sourceMaps: true,
      });
      return out?.code ? { code: out.code, map: out.map } : null;
    },
  };
}

export default defineConfig({
  plugins: [reactCompiler()],
  // Classic runtime everywhere: works in every consumer toolchain.
  esbuild: { jsx: 'transform' },
  resolve: {
    // Exact-match regexes: '@pinfold/react' must not swallow '@pinfold/react/accordion'.
    alias: [
      { find: /^@pinfold\/core$/, replacement: src('core/src/index.ts') },
      { find: /^@pinfold\/core\/palette$/, replacement: src('core/src/palette.ts') },
      { find: /^@pinfold\/core\/meta$/, replacement: src('core/src/meta.ts') },
      { find: /^@pinfold\/react$/, replacement: src('react/src/index.ts') },
      { find: /^@pinfold\/react\/([a-z-]+)$/, replacement: src('react/src/$1/index.ts') },
      { find: /^@pinfold\/testing$/, replacement: src('testing/src/index.ts') },
    ],
  },
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: ['./vitest.setup.ts'],
    include: ['packages/**/*.test.{ts,tsx}'],
  },
});
