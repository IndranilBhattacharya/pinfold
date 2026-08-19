import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { resolve } from 'node:path';

const pkg = (...p: string[]) => resolve(__dirname, '../../packages', ...p);

// The docs app consumes package *source* under the real public specifiers, so
// every snippet on the page is copy-pasteable and demos never hit a stale build.
export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: [
      { find: '@knotui/core/reset.css', replacement: pkg('core/src/styles/reset.css') },
      { find: '@knotui/core/styles.css', replacement: pkg('core/src/styles/tokens.css') },
      { find: '@knotui/accordion/styles.css', replacement: pkg('accordion/src/accordion.css') },
      { find: '@knotui/core/palette', replacement: pkg('core/src/palette.ts') },
      { find: '@knotui/core', replacement: pkg('core/src/index.ts') },
      { find: '@knotui/accordion', replacement: pkg('accordion/src/index.ts') },
    ],
  },
  server: { port: 5180 },
});
