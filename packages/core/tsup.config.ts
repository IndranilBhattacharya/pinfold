import { defineConfig } from 'tsup';

export default defineConfig({
  entry: ['src/index.ts', 'src/palette.ts'],
  format: ['esm', 'cjs'],
  dts: true,
  clean: true,
  treeshake: true,
  minify: false,
  target: 'es2018',
});
