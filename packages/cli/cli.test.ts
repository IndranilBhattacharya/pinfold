// @vitest-environment node
import { mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync, existsSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join } from 'node:path';
import { afterEach, describe, expect, it } from 'vitest';
// @ts-ignore plain ESM modules
import { add, doctor, init, readPalette, stylesFor, suggest, theme } from './lib/commands.mjs';
// @ts-ignore
import { detect } from './lib/detect.mjs';

const registry = JSON.parse(readFileSync(join(import.meta.dirname, 'registry.json'), 'utf8'));
const dirs: string[] = [];

function project(files: Record<string, string>) {
  const cwd = mkdtempSync(join(tmpdir(), 'pinfold-cli-'));
  dirs.push(cwd);
  for (const [file, content] of Object.entries(files)) {
    mkdirSync(dirname(join(cwd, file)), { recursive: true });
    writeFileSync(join(cwd, file), content);
  }
  return cwd;
}
const read = (cwd: string, f: string) => readFileSync(join(cwd, f), 'utf8');
const quiet = () => {
  const lines: string[] = [];
  const id = (s: string) => s;
  return { lines, color: { dim: id, bold: id, accent: id, ok: id, warn: id, err: id }, log: (s: string) => lines.push(s), error: (s: string) => lines.push('error ' + s), confirm: async () => true };
};
const yes = (cwd: string, extra = {}) => ({ cwd, yes: true, 'no-install': true, ...extra });
const deps = { react: '^19.0.0', 'react-dom': '^19.0.0', '@pinfold/react': '0.1.0', '@pinfold/css': '0.1.0' };

const viteTs = () =>
  project({
    'package.json': JSON.stringify({ dependencies: { ...deps }, devDependencies: { vite: '^7', tailwindcss: '^4.1.0' } }),
    'tsconfig.json': '{}',
    'src/main.tsx': "import React from 'react';\nimport { createRoot } from 'react-dom/client';\nimport App from './App';\nimport './index.css';\n\ncreateRoot(document.getElementById('root')!).render(<App />);\n",
    'src/index.css': '@import "tailwindcss";\n\nbody { margin: 0; }\n',
  });

afterEach(() => {
  for (const d of dirs.splice(0)) rmSync(d, { recursive: true, force: true });
});

describe('pinfold CLI', () => {
  it('detects framework, language, Tailwind and entry', () => {
    const p = detect(viteTs());
    expect(p).toMatchObject({ framework: 'vite', language: 'ts', tailwind: 4, entryFile: 'src/main.tsx', globalCss: 'src/index.css', componentsDir: 'src/components/ui' });
  });

  it('init wires config, theme, components, CSS and Tailwind v4; a second run changes nothing', async () => {
    const cwd = viteTs();
    await init(yes(cwd, { components: 'accordion' }), quiet(), registry);
    expect(read(cwd, 'pinfold.config.ts')).toContain("import { defineConfig } from '@pinfold/react';");
    expect(read(cwd, 'src/components/ui/accordion.tsx')).toContain("export { useAccordion, defineAccordion, Accordion } from '@pinfold/react/accordion';");
    expect(readPalette(read(cwd, 'src/pinfold-theme.css'))).toEqual({ primary: 'violet', radius: 'md' });
    const main = read(cwd, 'src/main.tsx');
    expect(main.indexOf("import '@pinfold/css/core.css';")).toBeGreaterThan(main.indexOf("import './index.css';"));
    expect(main.indexOf('@pinfold/css/core.css')).toBeLessThan(main.indexOf('@pinfold/css/accordion.css'));
    expect(main).toContain("import './pinfold-theme.css';");
    expect(main).not.toContain('PinfoldProvider'); // defaults need no provider
    expect(read(cwd, 'src/index.css')).toContain('@import "tailwindcss";\n@import "@pinfold/css/tailwind.css";');

    const before = JSON.stringify(['src/main.tsx', 'src/index.css', 'pinfold.config.ts', 'src/pinfold-theme.css'].map((f) => read(cwd, f)));
    const second = quiet();
    await init(yes(cwd, { components: 'accordion' }), second, registry);
    await add(['accordion'], yes(cwd), second, registry);
    expect(second.lines.join('\n')).toContain('Nothing to change.');
    expect(JSON.stringify(['src/main.tsx', 'src/index.css', 'pinfold.config.ts', 'src/pinfold-theme.css'].map((f) => read(cwd, f)))).toBe(before);
    expect(doctor({ cwd }, quiet())).toBe(0);
  });

  it('wraps the app in a provider only when the config needs it', async () => {
    const cwd = viteTs();
    await init(yes(cwd, { style: 'glass', radius: 'lg' }), quiet(), registry);
    const main = read(cwd, 'src/main.tsx');
    expect(main).toContain('<PinfoldProvider config={pinfoldConfig}><App /></PinfoldProvider>');
    expect(main).toContain("import pinfoldConfig from '../pinfold.config';");
    expect(main).toContain("import '@pinfold/css/packs.css';");
    expect(read(cwd, 'pinfold.config.ts')).toContain("stylePack: 'glass',");
    expect(doctor({ cwd }, quiet())).toBe(0);
  });

  it('writes JS files with JSDoc types, Next.js App Router layout imports and a Tailwind v3 preset', async () => {
    const cwd = project({
      'package.json': JSON.stringify({ dependencies: { ...deps, next: '^16' }, devDependencies: { tailwindcss: '^3.4.0' } }),
      'app/layout.jsx': "import './globals.css';\n\nexport default function RootLayout({ children }) {\n  return <html><body>{children}</body></html>;\n}\n",
      'app/globals.css': '@tailwind base;\n',
      'tailwind.config.js': "module.exports = {\n  content: ['./app/**/*.jsx'],\n};\n",
    });
    await init(yes(cwd, { components: 'accordion' }), quiet(), registry);
    expect(read(cwd, 'components/ui/accordion.jsx')).toContain("@typedef {import('@pinfold/react/accordion').AccordionConfig} AccordionConfig");
    expect(existsSync(join(cwd, 'pinfold.config.js'))).toBe(true);
    expect(read(cwd, 'app/layout.jsx')).toContain("import './pinfold-theme.css';");
    expect(read(cwd, 'tailwind.config.js')).toBe("module.exports = {\n  presets: [require('@pinfold/css/tailwind')],\n  content: ['./app/**/*.jsx'],\n};\n");
  });

  it('never overwrites a file the developer owns', async () => {
    const cwd = viteTs();
    writeFileSync(join(cwd, 'pinfold.config.ts'), '// mine\n');
    mkdirSync(join(cwd, 'src/components/ui'), { recursive: true });
    writeFileSync(join(cwd, 'src/components/ui/accordion.tsx'), '// mine too\n');
    const out = quiet();
    await init(yes(cwd, { components: 'accordion' }), out, registry);
    expect(read(cwd, 'pinfold.config.ts')).toBe('// mine\n');
    expect(read(cwd, 'src/components/ui/accordion.tsx')).toBe('// mine too\n');
    expect(out.lines.join('\n')).toContain('kept src/components/ui/accordion.tsx');
  });

  it('prints a dry run without writing', async () => {
    const cwd = viteTs();
    const out = quiet();
    await init({ cwd, 'dry-run': true, components: 'accordion' }, out, registry);
    expect(out.lines.join('\n')).toMatch(/create\s+src\/components\/ui\/accordion.tsx/);
    expect(existsSync(join(cwd, 'pinfold.config.ts'))).toBe(false);
  });

  it('theme regenerates one flag at a time, exports DTCG, imports a studio URL and checks contrast', async () => {
    const cwd = viteTs();
    await init(yes(cwd), quiet(), registry);
    await theme({ cwd, primary: 'emerald' }, quiet());
    expect(readPalette(read(cwd, 'src/pinfold-theme.css'))).toEqual({ primary: 'emerald', radius: 'md' });
    await theme({ cwd, radius: 'lg' }, quiet());
    expect(readPalette(read(cwd, 'src/pinfold-theme.css'))).toEqual({ primary: 'emerald', radius: 'lg' });
    await theme({ cwd, from: 'https://pinfold.indranildev.in/studio?primary=rose&accent=200&radius=sm' }, quiet());
    expect(readPalette(read(cwd, 'src/pinfold-theme.css'))).toMatchObject({ primary: 'rose', accent: 200, radius: 'sm' });
    await theme({ cwd, format: 'dtcg' }, quiet());
    expect(JSON.parse(read(cwd, 'src/pinfold-theme.tokens.json')).pinfold.color.primary['500'].$type).toBe('color');
    // The ramp keeps step 600 (light) and 400 (dark) at AA for every hue, even pale yellow.
    for (const primary of ['rose', 95, 200]) {
      const out = quiet();
      expect(await theme({ cwd, primary, check: true }, out)).toBe(0);
      expect(out.lines.join('\n')).toMatch(/primary\s+600\s+light-surface\s+\d/);
    }
  });

  it('doctor reports CSS order, a missing provider, missing use client and old React', async () => {
    const cwd = project({
      'package.json': JSON.stringify({ dependencies: { ...deps, react: '^17.0.2', next: '^16' } }),
      'app/layout.jsx': "import '@pinfold/css/accordion.css';\nimport '@pinfold/css/core.css';\nexport default function L({ children }) { return children; }\n",
      'app/page.jsx': "import { useAccordion } from '@pinfold/react/accordion';\nexport default function P() { const F = useAccordion({ items: [] }); return <F />; }\n",
      'pinfold.config.js': "export default defineConfig({ stylePack: 'glass' });\n",
    });
    const out = quiet();
    expect(doctor({ cwd }, out)).toBe(1);
    const report = out.lines.join('\n');
    expect(report).toContain('React 17');
    expect(report).toContain("import '@pinfold/css/core.css' before '@pinfold/css/accordion.css'");
    expect(report).toContain('no <PinfoldProvider');
    expect(report).toContain("app/page.jsx: calls a Pinfold hook without 'use client'");
  });

  it('init --yes adds no components: you add what you use', async () => {
    const cwd = viteTs();
    const out = quiet();
    await init(yes(cwd), out, registry);
    expect(existsSync(join(cwd, 'src/components/ui'))).toBe(false);
    expect(read(cwd, 'src/main.tsx')).toContain("import '@pinfold/css/core.css';");
    expect(out.lines.join('\n')).toContain('npx pinfold add button');
  });

  it('add brings the styles of every part a component draws, all the way down, after core', async () => {
    expect(stylesFor('table')).toEqual(expect.arrayContaining(['table', 'pagination', 'select', 'datepicker', 'calendar', 'checkbox', 'input', 'number', 'radio', 'button']));
    expect(stylesFor('button')).toEqual(['button']);
    const cwd = viteTs();
    await init(yes(cwd), quiet(), registry);
    const out = quiet();
    await add(['table'], yes(cwd), out, registry);
    const main = read(cwd, 'src/main.tsx');
    for (const name of stylesFor('table')) {
      expect(main).toContain(`import '@pinfold/css/${name}.css';`);
      expect(main.indexOf('@pinfold/css/core.css')).toBeLessThan(main.indexOf(`@pinfold/css/${name}.css`));
    }
    // The theme stays last so it wins.
    expect(main.lastIndexOf('pinfold-theme.css')).toBeGreaterThan(main.lastIndexOf('@pinfold/css/'));
    expect(read(cwd, 'src/components/ui/table.tsx')).toContain("from '@pinfold/react/table'");
    expect(existsSync(join(cwd, 'src/components/ui/pagination.tsx'))).toBe(false);
    expect(out.lines.join('\n')).toMatch(/table draws [a-z, ]*pagination[a-z, ]*: their styles are imported too/);
    // Again: nothing changes.
    const again = quiet();
    await add(['table'], yes(cwd), again, registry);
    expect(again.lines.join('\n')).toContain('Nothing to change.');
  });

  it('an unknown name stops with a suggestion and writes nothing; no name is a usage error', async () => {
    const cwd = viteTs();
    const before = read(cwd, 'src/main.tsx');
    await expect(add(['button', 'tabel'], yes(cwd), quiet(), registry)).rejects.toThrow(/unknown component `tabel` \(did you mean `table`\?\)\. Nothing was written/);
    expect(read(cwd, 'src/main.tsx')).toBe(before);
    expect(existsSync(join(cwd, 'src/components/ui/button.tsx'))).toBe(false);
    await expect(add([], yes(cwd), quiet(), registry)).rejects.toThrow(/name the components to add/);
    await expect(init(yes(cwd, { components: 'buton' }), quiet(), registry)).rejects.toThrow(/did you mean `button`/);
    expect(suggest('datpicker', ['datepicker', 'calendar'])).toBe('datepicker');
    expect(suggest('zzzz', ['datepicker', 'calendar'])).toBeNull();
  });

  it('--dir: init remembers the folder for every later add; add --dir picks one for this run', async () => {
    const cwd = viteTs();
    await init(yes(cwd, { dir: 'src/ui', components: 'button' }), quiet(), registry);
    expect(read(cwd, 'src/ui/button.tsx')).toContain("from '@pinfold/react/button'");
    expect(JSON.parse(read(cwd, 'package.json')).pinfold).toEqual({ components: 'src/ui' });
    await add(['badge'], yes(cwd), quiet(), registry);
    expect(existsSync(join(cwd, 'src/ui/badge.tsx'))).toBe(true);
    await add(['kbd'], yes(cwd, { dir: 'src/elsewhere' }), quiet(), registry);
    expect(existsSync(join(cwd, 'src/elsewhere/kbd.tsx'))).toBe(true);
    const second = quiet();
    await init(yes(cwd, { dir: 'src/ui', components: 'button' }), second, registry);
    expect(second.lines.join('\n')).toContain('Nothing to change.');
  });

  it('works in a folder whose path has spaces', async () => {
    const cwd = project({ 'my app/package.json': JSON.stringify({ dependencies: { ...deps }, devDependencies: { vite: '^7' } }), 'my app/tsconfig.json': '{}', 'my app/src/main.tsx': "import App from './App';\ncreateRoot(document.getElementById('root')!).render(<App />);\n" });
    const app = join(cwd, 'my app');
    await init(yes(app, { components: 'button' }), quiet(), registry);
    expect(read(app, 'src/components/ui/button.tsx')).toContain('useButton');
    expect(read(app, 'src/main.tsx')).toContain("import '@pinfold/css/button.css';");
  });
});
