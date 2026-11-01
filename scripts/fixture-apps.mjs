#!/usr/bin/env node
/**
 * Real apps on the packed packages (A4, D-07, D-13). Run `npm run build` first.
 *
 *   node scripts/fixture-apps.mjs [--app next|webpack|all] [--cli]
 *
 * next     Next.js App Router (Server Component + defineAccordion + ISR, a
 *          Client Component page) and Pages Router (getStaticProps + ISR),
 *          all JS. `next build` fails on any RSC boundary mistake; then the
 *          served HTML must contain every panel's text, with stable ids.
 * webpack  A plain-JS (CommonJS, no JSX) app, webpack production build: the
 *          bundle must work and must not contain the dev-only validator.
 * --cli    Before building, run `pinfold init --yes` and `pinfold add accordion`
 *          in each app, twice, and require the second run to change nothing (A6).
 */
import { execSync, spawn } from 'node:child_process';
import { cpSync, existsSync, mkdtempSync, readFileSync, readdirSync, rmSync, statSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { packTarballs, pinCore, root } from './pack.mjs';

const arg = (name, fallback) => {
  const i = process.argv.indexOf(`--${name}`);
  return i === -1 ? fallback : process.argv[i + 1];
};
const which = arg('app', 'all');
const withCli = process.argv.includes('--cli');
const run = (cmd, cwd) => execSync(cmd, { cwd, stdio: 'inherit', env: { ...process.env, CI: '1', NEXT_TELEMETRY_DISABLED: '1' } });

const work = mkdtempSync(join(tmpdir(), 'pinfold-fixtures-'));
const tgz = packTarballs(work, withCli ? ['core', 'css', 'react', 'cli'] : ['core', 'css', 'react']);
const { pinfold: cliTgz, ...libs } = tgz;

function scaffold(name, deps) {
  const app = join(work, name);
  cpSync(join(root, 'fixtures', name), app, { recursive: true });
  const manifest = {
    name: `pinfold-fixture-${name}`,
    private: true,
    version: '0.0.0',
    dependencies: { ...libs, ...deps },
    devDependencies: cliTgz ? { pinfold: cliTgz } : {},
    ...pinCore(libs),
  };
  writeFileSync(join(app, 'package.json'), JSON.stringify(manifest, null, 2));
  run('npm install --no-audit --no-fund --loglevel=error', app);
  if (withCli) cliTwice(app);
  return app;
}

/** `init` then `add`, twice. The second pass must leave every file byte-identical. */
function cliTwice(app) {
  const pass = () => {
    run('npx pinfold init --yes', app);
    run('npx pinfold add accordion --yes', app);
    return snapshot(app);
  };
  const first = pass();
  const second = pass();
  const changed = Object.keys({ ...first, ...second }).filter((f) => first[f] !== second[f]);
  if (changed.length) throw new Error(`pinfold init/add is not idempotent; second run changed: ${changed.join(', ')}`);
  console.log('  cli: init + add are idempotent');
}

function snapshot(dir, base = dir, out = {}) {
  for (const entry of readdirSync(dir)) {
    if (entry === 'node_modules' || entry === '.next' || entry === 'dist' || entry === 'package-lock.json') continue;
    const file = join(dir, entry);
    if (statSync(file).isDirectory()) snapshot(file, base, out);
    else out[file.slice(base.length + 1)] = readFileSync(file, 'utf8');
  }
  return out;
}

function expectAll(label, html, texts) {
  for (const text of texts) if (!html.includes(text)) throw new Error(`${label}: HTML is missing ${JSON.stringify(text)}`);
  console.log(`  ok ${label}`);
}

async function next() {
  const app = scaffold('next', { next: '^16', react: '^19', 'react-dom': '^19' });
  run('npx next build', app);
  const port = 3100 + Math.floor(Math.random() * 500);
  const server = spawn(process.execPath, [join(app, 'node_modules/next/dist/bin/next'), 'start', '-p', String(port)], {
    cwd: app,
    stdio: 'ignore',
  });
  try {
    const get = async (path) => {
      for (let i = 0; i < 60; i++) {
        try {
          const res = await fetch(`http://localhost:${port}${path}`);
          if (res.ok) return res.text();
        } catch {}
        await new Promise((r) => setTimeout(r, 500));
      }
      throw new Error(`next start never served ${path}`);
    };
    const home = await get('/');
    expectAll('next app router (server component, ISR)', home, [
      'Server question one',
      'Server answer one',
      'Server answer two',
      'aria-controls="faq-panel-returns"',
      'data-variant="separated"', // from defaults in pinfold.config.js
    ]);
    if ((await get('/')) !== home) throw new Error('next app router: HTML differs between requests (ids not deterministic)');
    expectAll('next client component', await get('/client'), ['Client question one', 'Client answer one', 'Client answer two']);
    expectAll('next pages router (ISR)', await get('/legacy'), ['Pages question', 'Pages answer', 'legacy-panel-p1']);
  } finally {
    server.kill();
  }
}

function webpack() {
  const app = scaffold('webpack-js', { react: '^18', 'react-dom': '^18', webpack: '^5', 'webpack-cli': '^7' });
  writeFileSync(
    join(app, 'webpack.config.js'),
    "module.exports = { mode: 'production', entry: './src/index.js', output: { path: __dirname + '/dist' } };\n",
  );
  run('npx webpack --no-color', app);
  const bundle = readFileSync(join(app, 'dist/main.js'), 'utf8');
  if (!bundle.includes('aria-controls')) throw new Error('webpack: the accordion is missing from the bundle');
  if (bundle.includes('Did you mean')) throw new Error('webpack: the dev-only validator leaked into the production bundle');
  console.log(`  ok webpack js-only production bundle (${Math.round(bundle.length / 1024)} kB minified, validator stripped)`);
}

try {
  if (which === 'next' || which === 'all') await next();
  if (which === 'webpack' || which === 'all') webpack();
  console.log('\nfixture apps passed');
} finally {
  if (existsSync(work)) rmSync(work, { recursive: true, force: true });
}
