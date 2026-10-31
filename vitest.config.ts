import { defineConfig } from 'vitest/config';
import { resolve } from 'node:path';

const src = (p: string) => resolve(__dirname, 'packages', p);

export default defineConfig({
  // Classic runtime everywhere: works in every consumer toolchain.
  esbuild: { jsx: 'transform' },
  resolve: {
    // Exact-match regexes: '@lumae/react' must not swallow '@lumae/react/accordion'.
    alias: [
      { find: /^@lumae\/core$/, replacement: src('core/src/index.ts') },
      { find: /^@lumae\/core\/palette$/, replacement: src('core/src/palette.ts') },
      { find: /^@lumae\/react$/, replacement: src('react/src/index.ts') },
      { find: /^@lumae\/react\/([a-z-]+)$/, replacement: src('react/src/$1/index.ts') },
      { find: /^@lumae\/testing$/, replacement: src('testing/src/index.ts') },
    ],
  },
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: ['./vitest.setup.ts'],
    include: ['packages/**/*.test.{ts,tsx}'],
  },
});
