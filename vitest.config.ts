import { defineConfig } from 'vitest/config';
import { resolve } from 'node:path';

export default defineConfig({
  // Classic runtime everywhere, so the source stays React 16.8-compatible.
  esbuild: { jsx: 'transform' },
  resolve: {
    alias: {
      '@knotui/core': resolve(__dirname, 'packages/core/src/index.ts'),
      '@knotui/accordion': resolve(__dirname, 'packages/accordion/src/index.ts'),
    },
  },
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: ['./vitest.setup.ts'],
    include: ['packages/**/*.test.{ts,tsx}'],
  },
});
