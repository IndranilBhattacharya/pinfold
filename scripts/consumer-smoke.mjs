#!/usr/bin/env node
/**
 * Install the *packed* packages into a throwaway app and use them the way a
 * consumer would. Proves the published artefacts, not the source. D-14.
 *
 *   node scripts/consumer-smoke.mjs [--pm npm|pnpm|yarn|bun] [--react 18|19] [--ts 5.6.3]
 *
 * Checks: ESM import, CJS require, server render (all panel text in the HTML),
 * and, with --ts (npm only), the published .d.ts files under node10, node16
 * and (TS 5+) bundler resolution. Run `npm run build` first.
 */
import { execSync } from 'node:child_process';
import { mkdirSync, mkdtempSync, readFileSync, readdirSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';

const arg = (name, fallback) => {
  const i = process.argv.indexOf(`--${name}`);
  return i === -1 ? fallback : process.argv[i + 1];
};
const pm = arg('pm', 'npm');
const react = arg('react', '18');
const ts = arg('ts', null);
const root = resolve(import.meta.dirname, '..');
const run = (cmd, cwd) => execSync(cmd, { cwd, stdio: 'inherit', env: { ...process.env, CI: '1' } });

const work = mkdtempSync(join(tmpdir(), 'pinfold-smoke-'));
const app = join(work, 'app');
mkdirSync(app);

// 1. Pack exactly what npm would publish.
for (const pkg of ['core', 'css', 'react']) {
  execSync(`npm pack --silent --pack-destination "${work}"`, { cwd: join(root, 'packages', pkg) });
}
const tgz = Object.fromEntries(
  readdirSync(work)
    .filter((f) => f.endsWith('.tgz'))
    .map((f) => [`@pinfold/${f.replace(/^pinfold-/, '').replace(/-\d.*$/, '')}`, `file:${join(work, f).replace(/\\/g, '/')}`]),
);

// 2. A consumer app. Every package manager reads its own override field, so the
//    react tarball's dependency on @pinfold/core resolves to the local tarball too.
const pin = { '@pinfold/core': tgz['@pinfold/core'] };
const manifest = {
  name: 'pinfold-smoke',
  private: true,
  version: '0.0.0',
  dependencies: { ...tgz, react: `^${react}`, 'react-dom': `^${react}` },
  devDependencies: ts ? { typescript: ts, '@types/react': `^${react}`, '@types/react-dom': `^${react}` } : {},
  overrides: pin,
  pnpm: { overrides: pin },
  resolutions: pin,
};
writeFileSync(join(app, 'package.json'), JSON.stringify(manifest, null, 2));

const check = (load) => `
const React = ${load('react')};
const { renderToString } = ${load('react-dom/server')};
const { Accordion } = ${load('@pinfold/react/accordion')};
const { createTheme } = ${load('@pinfold/core/palette')};
const html = renderToString(React.createElement(Accordion, {
  items: [{ id: 'a', title: 'Alpha', content: 'Alpha body' }, { id: 'b', title: 'Beta', content: 'Beta body' }],
}));
for (const text of ['Alpha', 'Alpha body', 'Beta body', 'aria-expanded', 'pinfold-accordion']) {
  if (!html.includes(text)) throw new Error('server HTML is missing ' + JSON.stringify(text) + ':\\n' + html);
}
if (!createTheme({ primary: 'emerald' }).vars['--pinfold-primary-500']) throw new Error('palette broken');
console.log('ok', ${JSON.stringify(pm)}, React.version);
`;
writeFileSync(join(app, 'esm.mjs'), check((m) => `await import(${JSON.stringify(m)})`));
writeFileSync(join(app, 'cjs.cjs'), check((m) => `require(${JSON.stringify(m)})`));

// 3. Install and run.
const install = { npm: 'npm install --no-audit --no-fund', pnpm: 'pnpm install', yarn: 'yarn install --no-immutable', bun: 'bun install' }[pm];
if (pm === 'yarn') writeFileSync(join(app, 'yarn.lock'), ''); // standalone project, not a parent workspace
run(install, app);
const node = pm === 'yarn' ? 'yarn node' : 'node';
run(`${node} esm.mjs`, app);
run(`${node} cjs.cjs`, app);

// 4. Published types, from a consumer's point of view.
if (ts) {
  writeFileSync(
    join(app, 'index.ts'),
    `import * as React from 'react';
import { useAccordion, type AccordionConfig } from '@pinfold/react/accordion';
import { PinfoldProvider } from '@pinfold/react';
import { createTheme } from '@pinfold/core/palette';

const config: AccordionConfig = { items: [{ id: 'a', title: 'A', content: 'B' }], variant: 'separated' };
export function App(): React.ReactElement {
  const Faq = useAccordion(config);
  Faq.toggle('a');
  return React.createElement(PinfoldProvider, null, React.createElement(Faq, { className: 'x' }));
}
export const vars: Record<string, string> = createTheme({ primary: 'emerald' }).vars;
`,
  );
  // Read the installed version: --ts may be a tag such as 'latest'.
  const installed = JSON.parse(readFileSync(join(app, 'node_modules/typescript/package.json'), 'utf8')).version;
  const major = Number(installed.split('.')[0]);
  const modes = [
    // node10 resolution was removed in TypeScript 6; it only matters to older compilers.
    ...(major < 6 ? [{ module: 'commonjs', moduleResolution: 'node' }] : []),
    { module: 'node16', moduleResolution: 'node16' },
    ...(major >= 5 ? [{ module: 'esnext', moduleResolution: 'bundler' }] : []),
  ];
  for (const m of modes) {
    writeFileSync(
      join(app, 'tsconfig.json'),
      JSON.stringify({
        compilerOptions: { ...m, target: 'es2019', lib: ['dom', 'es2019'], strict: true, noEmit: true, skipLibCheck: true, esModuleInterop: true },
        files: ['index.ts'],
      }),
    );
    console.log(`tsc ${installed} · moduleResolution ${m.moduleResolution}`);
    run('npx tsc -p tsconfig.json', app);
  }
}

rmSync(work, { recursive: true, force: true });
console.log(`\nconsumer smoke passed (${pm}, React ${react}${ts ? `, TypeScript ${ts}` : ''})`);
