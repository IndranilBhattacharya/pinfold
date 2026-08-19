import { defineConfig } from 'tsup';
import { copyFileSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';

export default defineConfig({
  entry: ['src/index.ts', 'src/palette.ts'],
  format: ['esm', 'cjs'],
  dts: true,
  clean: true,
  treeshake: true,
  minify: false,
  target: 'es2018',
  external: ['react'],
  async onSuccess() {
    mkdirSync('dist', { recursive: true });
    copyFileSync('src/styles/tokens.css', 'dist/tokens.css');
    copyFileSync('src/styles/reset.css', 'dist/reset.css');
    const bundle =
      readFileSync('src/styles/reset.css', 'utf8') +
      '\n' +
      readFileSync('src/styles/tokens.css', 'utf8');
    writeFileSync('dist/styles.css', bundle);
  },
});
