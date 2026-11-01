/**
 * Read a React project without touching it: framework, router, language,
 * Tailwind major, package manager, entry file, global CSS and where
 * components live. Every command starts here.
 */
import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';

const first = (cwd, candidates) => candidates.find((f) => existsSync(join(cwd, f))) ?? null;
const exts = (base, list = ['tsx', 'jsx', 'ts', 'js']) => list.map((e) => `${base}.${e}`);
const major = (range) => {
  const m = String(range ?? '').match(/(\d+)/);
  return m ? Number(m[1]) : null;
};

export function readPackageJson(cwd) {
  const file = join(cwd, 'package.json');
  return existsSync(file) ? JSON.parse(readFileSync(file, 'utf8')) : null;
}

export function detect(cwd = process.cwd()) {
  const pkg = readPackageJson(cwd) ?? {};
  const deps = { ...pkg.dependencies, ...pkg.devDependencies };
  const has = (name) => name in deps;

  let framework = 'react';
  let router = null;
  if (has('next')) {
    framework = 'next';
    router = first(cwd, [...exts('app/layout'), ...exts('src/app/layout')]) ? 'app' : 'pages';
  } else if (has('@react-router/dev') || has('@remix-run/react')) framework = 'react-router';
  else if (has('gatsby')) framework = 'gatsby';
  else if (has('astro')) framework = 'astro';
  else if (has('vite')) framework = 'vite';

  const language = existsSync(join(cwd, 'tsconfig.json')) ? 'ts' : 'js';

  const twMajor = major(deps.tailwindcss);
  const tailwind = twMajor == null ? null : twMajor >= 4 ? 4 : 3;

  const packageManager = existsSync(join(cwd, 'pnpm-lock.yaml'))
    ? 'pnpm'
    : existsSync(join(cwd, 'yarn.lock'))
      ? 'yarn'
      : existsSync(join(cwd, 'bun.lockb')) || existsSync(join(cwd, 'bun.lock'))
        ? 'bun'
        : 'npm';

  const entry = {
    next: router === 'app' ? [...exts('app/layout'), ...exts('src/app/layout')] : [...exts('pages/_app'), ...exts('src/pages/_app')],
    vite: [...exts('src/main'), ...exts('src/index')],
    'react-router': exts('app/root'),
    gatsby: exts('gatsby-browser'),
    astro: [],
    react: [...exts('src/index'), ...exts('src/main')],
  }[framework];

  const globalCss = first(cwd, [
    'app/globals.css',
    'src/app/globals.css',
    'styles/globals.css',
    'src/styles/globals.css',
    'src/index.css',
    'app/app.css',
    'src/global.css',
  ]);

  const tailwindConfig = first(cwd, ['tailwind.config.js', 'tailwind.config.cjs', 'tailwind.config.mjs', 'tailwind.config.ts']);
  const srcDir = existsSync(join(cwd, 'src')) ? 'src' : '.';
  const entryFile = first(cwd, entry);

  return {
    cwd,
    pkg,
    deps,
    framework,
    router,
    language,
    tailwind,
    tailwindConfig,
    packageManager,
    entryFile,
    globalCss,
    componentsDir: srcDir === 'src' ? 'src/components/ui' : 'components/ui',
    configFile: first(cwd, ['pinfold.config.ts', 'pinfold.config.js', 'pinfold.config.mjs']),
  };
}

export function describe(p) {
  const fw = p.framework === 'next' ? `Next.js (${p.router === 'app' ? 'App Router' : 'Pages Router'})` : p.framework;
  return [fw, p.language === 'ts' ? 'TypeScript' : 'JavaScript', p.tailwind ? `Tailwind v${p.tailwind}` : 'no Tailwind', p.packageManager].join(' · ');
}
