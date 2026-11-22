/**
 * Read a React project without touching it: framework, router, language, Tailwind major, package manager,
 * entry file, global CSS and where components live.
 */
import { existsSync, readFileSync, readdirSync } from 'node:fs';
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

export function readPinfoldJson(cwd) {
  const file = join(cwd, 'pinfold.json');
  if (existsSync(file)) {
    try {
      return JSON.parse(readFileSync(file, 'utf8'));
    } catch {}
  }
  return null;
}

export function detect(cwd = process.cwd()) {
  const pkg = readPackageJson(cwd) ?? {};
  const pinfoldCfg = pkg?.pinfold ?? readPinfoldJson(cwd) ?? {};
  const deps = { ...pkg.dependencies, ...pkg.devDependencies };
  const has = (name) => name in deps;

  let framework = null;
  let router = null;
  if (has('next')) {
    framework = 'next';
    router = first(cwd, [...exts('app/layout'), ...exts('src/app/layout')]) ? 'app' : 'pages';
  } else if (has('@react-router/dev') || has('@remix-run/react')) {
    framework = 'react-router';
  } else if (has('gatsby')) {
    framework = 'gatsby';
  } else if (has('astro')) {
    framework = 'astro';
  } else if (has('vite')) {
    framework = 'vite';
  } else if (has('react')) {
    framework = 'react';
  }

  // 1. Stored config in package.json or pinfold.json
  // 2. Existing pinfold.config.ts / pinfold.config.js
  // 3. Existing component files in components directory
  // 4. tsconfig.json / jsconfig.json or typescript dependency
  let language = null;
  if (pinfoldCfg.language === 'ts' || pinfoldCfg.language === 'js') {
    language = pinfoldCfg.language;
  } else if (existsSync(join(cwd, 'pinfold.config.ts'))) {
    language = 'ts';
  } else if (existsSync(join(cwd, 'pinfold.config.js')) || existsSync(join(cwd, 'pinfold.config.mjs')) || existsSync(join(cwd, 'pinfold.config.cjs'))) {
    language = 'js';
  } else {
    const candidateDirs = [pinfoldCfg.components, 'src/components/ui', 'components/ui', 'src/ui', 'ui'].filter(Boolean);
    for (const dir of candidateDirs) {
      const full = join(cwd, dir);
      if (existsSync(full)) {
        try {
          const files = readdirSync(full);
          if (files.some((f) => f.endsWith('.tsx') || f.endsWith('.ts'))) {
            language = 'ts';
            break;
          } else if (files.some((f) => f.endsWith('.jsx') || f.endsWith('.js'))) {
            language = 'js';
            break;
          }
        } catch {}
      }
    }
  }

  if (!language) {
    if (existsSync(join(cwd, 'tsconfig.json'))) language = 'ts';
    else if (existsSync(join(cwd, 'jsconfig.json'))) language = 'js';
    else if (has('typescript')) language = 'ts';
    else language = 'js';
  }

  const twMajor = major(deps.tailwindcss);
  const tailwind = twMajor == null ? null : twMajor >= 4 ? 4 : 3;

  const packageManager = existsSync(join(cwd, 'pnpm-lock.yaml'))
    ? 'pnpm'
    : existsSync(join(cwd, 'yarn.lock'))
      ? 'yarn'
      : existsSync(join(cwd, 'bun.lockb')) || existsSync(join(cwd, 'bun.lock'))
        ? 'bun'
        : 'npm';

  const entryMap = {
    next: router === 'app' ? [...exts('app/layout'), ...exts('src/app/layout')] : [...exts('pages/_app'), ...exts('src/pages/_app')],
    vite: [...exts('src/main'), ...exts('src/index')],
    'react-router': exts('app/root'),
    gatsby: exts('gatsby-browser'),
    astro: [],
    react: [...exts('src/index'), ...exts('src/main')],
  };
  const entryCandidates = (framework ? entryMap[framework] : null) ?? [...exts('src/index'), ...exts('src/main'), ...exts('index'), ...exts('main')];

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
  const entryFile = pinfoldCfg.entry && existsSync(join(cwd, pinfoldCfg.entry)) ? pinfoldCfg.entry : first(cwd, entryCandidates);

  return {
    cwd,
    pkg,
    pinfoldCfg,
    deps,
    framework,
    router,
    language,
    tailwind,
    tailwindConfig,
    packageManager,
    entryFile,
    globalCss,
    componentsDir: pinfoldCfg.components ?? (srcDir === 'src' ? 'src/components/ui' : 'components/ui'),
    configFile: first(cwd, ['pinfold.config.ts', 'pinfold.config.js', 'pinfold.config.mjs', 'pinfold.config.cjs']),
  };
}

export function describe(p) {
  const fw = p.framework === 'next'
    ? `Next.js (${p.router === 'app' ? 'App Router' : 'Pages Router'})`
    : p.framework === 'vite'
      ? 'Vite'
      : p.framework === 'react-router'
        ? 'React Router'
        : p.framework === 'gatsby'
          ? 'Gatsby'
          : p.framework === 'astro'
            ? 'Astro'
            : p.framework === 'react'
              ? 'React'
              : 'no framework detected';
  return [fw, p.language === 'ts' ? 'TypeScript' : 'JavaScript', p.tailwind ? `Tailwind v${p.tailwind}` : 'no Tailwind', p.packageManager].join(' · ');
}
