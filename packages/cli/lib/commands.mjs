/**
 * init, add, theme and doctor (docs/CLI.md). Each builds a Plan from what
 * `detect()` found, prints it, and applies it only with consent (`--yes` or a
 * prompt). Nothing here talks to the network except the package install,
 * through the project's own package manager.
 */
import { execSync } from 'node:child_process';
import { existsSync, readFileSync, readdirSync, statSync } from 'node:fs';
import { dirname, join, posix, relative } from 'node:path';
import { createTheme, toDTCG } from '@pinfold/core/palette';
import { describe as describeProject, detect } from './detect.mjs';
import { Plan, addCssImport, addImports, addNamedImport, addTailwindPreset } from './plan.mjs';

export const RADII = ['none', 'sm', 'md', 'lg', 'full'];
export const PACKS = ['default', 'glass', 'material', 'noise', 'brutalist'];
export const MODES = ['system', 'light', 'dark'];
const ROLES = ['primary', 'accent', 'neutral', 'success', 'warning', 'danger', 'info'];
const THEME_FILE = 'pinfold-theme.css';
const THEME_MARK = '/* pinfold-theme ';

/* ------------------------------------------------------------- helpers */

const toPosix = (p) => p.split('\\').join('/');
const entryDir = (p) => (p.entryFile ? posix.dirname(toPosix(p.entryFile)) : p.componentsDir.startsWith('src') ? 'src' : '.');
const themePath = (p) => posix.join(entryDir(p), THEME_FILE);
const ext = (p) => (p.language === 'ts' ? 'tsx' : 'jsx');

/** Relative import specifier from one project file to another. */
function specifier(fromFile, toFile) {
  const rel = toPosix(relative(dirname(fromFile), toFile));
  return rel.startsWith('.') ? rel : './' + rel;
}

/** The palette saved in the theme file's first line, so `theme` can change one flag and keep the rest. */
export function readPalette(source) {
  if (!source?.startsWith(THEME_MARK)) return null;
  try {
    return JSON.parse(source.slice(THEME_MARK.length, source.indexOf(' */')));
  } catch {
    return null;
  }
}

export function themeCss(palette) {
  return `${THEME_MARK}${JSON.stringify(palette)} */\n${createTheme(palette).css}`;
}

/** Palette flags (and a shared studio URL via --from) layered over a base palette. */
export function paletteFrom(flags, base = {}) {
  const fromUrl = flags.from ? Object.fromEntries(new URL(flags.from).searchParams) : {};
  const pick = (k) => flags[k] ?? fromUrl[k];
  const next = { ...base };
  for (const role of ROLES) {
    const v = pick(role);
    if (v !== undefined) next[role] = Number.isFinite(Number(v)) ? Number(v) : v;
  }
  if (pick('intensity') !== undefined) next.intensity = Number(pick('intensity'));
  if (RADII.includes(pick('radius'))) next.radius = pick('radius');
  next.primary ??= 'violet';
  next.radius ??= 'md';
  return { palette: next, style: pick('style'), mode: pick('mode') };
}

/** Packages missing from package.json, installed with the project's own package manager. */
function ensurePackages(project, flags, out) {
  const missing = ['@pinfold/react', '@pinfold/css'].filter((n) => !(n in project.deps));
  if (!missing.length) return;
  const pm = project.packageManager;
  const cmd = pm === 'npm' ? `npm install ${missing.join(' ')}` : `${pm} add ${missing.join(' ')}`;
  if (flags['dry-run'] || flags['no-install']) {
    out.log(`  run: ${cmd}`);
    return;
  }
  out.log(`  $ ${cmd}`);
  execSync(cmd, { cwd: project.cwd, stdio: 'inherit' });
}

/** Print the plan and apply it with consent. Returns false when nothing was written. */
async function commit(plan, flags, out) {
  if (plan.empty) {
    if (plan.notes.length) out.log(plan.describe(out.color));
    out.log(out.color.dim('  Nothing to change.'));
    return false;
  }
  out.log(plan.describe(out.color));
  if (flags['dry-run']) {
    out.log(out.color.dim('\n  Dry run: nothing written.'));
    return false;
  }
  if (!flags.yes && !(await out.confirm(`Apply ${plan.changes.size} change(s)?`))) {
    out.log('  Cancelled.');
    return false;
  }
  plan.apply();
  return true;
}

/* ------------------------------------------------------------ registry */

export function componentFile(name, language) {
  const pascal = name.replace(/(^|-)([a-z])/g, (_, __, ch) => ch.toUpperCase());
  const head = [
    '/**',
    ` * Pinfold ${name}. This file is yours: import from here across the app,`,
    ' * and change shared defaults in one place.',
    ` * Docs: https://pinfold.indranildev.in/docs/${name}`,
    ' */',
  ];
  const values = `export { use${pascal}, define${pascal}, ${pascal} } from '@pinfold/react/${name}';`;
  if (language === 'ts') {
    return [...head, values, `export type { ${pascal}Config, ${pascal}ItemConfig, ${pascal}Api } from '@pinfold/react/${name}';`, ''].join('\n');
  }
  return [...head, `/** @typedef {import('@pinfold/react/${name}').${pascal}Config} ${pascal}Config */`, values, ''].join('\n');
}

/** Plan one component: its owned file and its stylesheet import. */
function planComponent(plan, project, name) {
  plan.create(posix.join(project.componentsDir, `${name}.${ext(project)}`), componentFile(name, project.language));
  if (project.entryFile) plan.update(toPosix(project.entryFile), (src) => addImports(src, ['@pinfold/css/core.css', `@pinfold/css/${name}.css`]));
}

/* ------------------------------------------------------------- commands */

export async function add(names, flags, out, registry) {
  const project = detect(flags.cwd);
  const wanted = names.includes('all') ? registry.components.map((c) => c.name) : names;
  if (!wanted.length) throw new Error('nothing to add. Try `npx pinfold add accordion`.');
  const plan = new Plan(project.cwd);
  for (const name of wanted) {
    if (!registry.components.some((c) => c.name === name)) {
      plan.note(`skip ${name}: not in the registry yet`);
      continue;
    }
    planComponent(plan, project, name);
  }
  if (!project.entryFile) plan.note(`no entry file found: import '@pinfold/css/core.css' and each component's CSS yourself`);
  ensurePackages(project, flags, out);
  await commit(plan, flags, out);
}

export async function init(flags, out, registry, answers = {}) {
  const project = detect(flags.cwd);
  if (answers.language) project.language = answers.language;
  if (answers.entryFile) project.entryFile = answers.entryFile;
  out.log(`  ${out.color.dim('Detected:')} ${describeProject(project)}`);

  const existingTheme = readPalette(new Plan(project.cwd).read(themePath(project)));
  const { palette, style, mode } = paletteFrom({ ...flags, ...answers.theme }, existingTheme ?? {});
  const stylePack = PACKS.includes(style) ? style : 'default';
  const theme = MODES.includes(mode) ? mode : 'system';
  const components = answers.components ?? registry.components.map((c) => c.name);

  const plan = new Plan(project.cwd);

  // 1. The global config, written once and then owned by the developer.
  const configPath = project.configFile ?? `pinfold.config.${project.language === 'ts' ? 'ts' : 'js'}`;
  const config = { theme, radius: palette.radius, ...(stylePack !== 'default' ? { stylePack } : {}) };
  plan.create(
    configPath,
    [
      "import { defineConfig } from '@pinfold/react';",
      '',
      '// Global Pinfold config. Precedence: component config, then `defaults`, then this.',
      'export default defineConfig({',
      ...Object.entries(config).map(([k, v]) => `  ${k}: '${v}',`),
      '  defaults: {},',
      '});',
      '',
    ].join('\n'),
  );

  // 2. Theme CSS (Pinfold owns and regenerates it), imported after core and component CSS.
  const themeFile = themePath(project);
  plan.generate(themeFile, themeCss(palette));

  // 3. Components and their stylesheets.
  for (const name of components) planComponent(plan, project, name);

  if (project.entryFile) {
    const entry = toPosix(project.entryFile);
    const css = ['@pinfold/css/core.css', ...(stylePack !== 'default' ? ['@pinfold/css/packs.css'] : []), specifier(entry, themeFile)];
    plan.update(entry, (src) => addImports(src, css));
    // 4. Provider, only when the config differs from the library defaults.
    if (theme !== 'system' || palette.radius !== 'md' || stylePack !== 'default') wrapProvider(plan, project, entry, configPath);
  } else {
    plan.note(`no entry file found: import '@pinfold/css/core.css' and './${THEME_FILE}' in your app entry`);
  }

  // 5. Tailwind: merge, never replace.
  if (project.tailwind === 4 && project.globalCss) plan.update(toPosix(project.globalCss), (css) => addCssImport(css, '@pinfold/css/tailwind.css'));
  if (project.tailwind === 3 && project.tailwindConfig) plan.update(project.tailwindConfig, addTailwindPreset);

  ensurePackages(project, flags, out);
  if (await commit(plan, flags, out)) out.log(`\n  Next: use it, e.g. ${out.color.accent(`import { useAccordion } from '@/components/ui/accordion'`)}\n`);
}

function wrapProvider(plan, project, entry, configPath) {
  const targets = {
    app: /\{children\}/,
    pages: /<Component \{\.\.\.pageProps\} \/>/,
    vite: /<App \/>/,
    react: /<App \/>/,
  };
  const key = project.framework === 'next' ? project.router : project.framework;
  const target = targets[key];
  plan.update(entry, (src) => {
    if (src.includes('PinfoldProvider')) return src;
    if (!target || !target.test(src)) {
      plan.note(`wrap your app in <PinfoldProvider config={pinfoldConfig}> (could not find where in ${entry})`);
      return src;
    }
    let out = src.replace(target, (m) => `<PinfoldProvider config={pinfoldConfig}>${m}</PinfoldProvider>`);
    out = addNamedImport(out, 'PinfoldProvider', '@pinfold/react');
    return addNamedImport(out, 'pinfoldConfig', specifier(entry, configPath).replace(/\.(ts|js|mjs)$/, ''), true);
  });
}

export async function theme(flags, out) {
  const project = detect(flags.cwd);
  const plan = new Plan(project.cwd);
  const file = flags.out ?? themePath(project);
  const { palette, style } = paletteFrom(flags, readPalette(plan.read(file)) ?? {});
  const built = createTheme(palette);
  const format = flags.format ?? 'css';

  if (format === 'dtcg') plan.generate(file.replace(/\.css$/, '.tokens.json'), JSON.stringify(toDTCG(built), null, 2) + '\n');
  else if (format === 'tailwind') plan.generate(file, `@import "@pinfold/css/tailwind.css";\n${themeCss(palette)}`);
  else plan.generate(file, themeCss(palette));

  if (PACKS.includes(style) && project.configFile) {
    plan.update(project.configFile, (src) =>
      /stylePack:/.test(src)
        ? src.replace(/stylePack:\s*['"][a-z]+['"]/, `stylePack: '${style}'`)
        : src.replace(/defineConfig\(\{/, `defineConfig({\n  stylePack: '${style}',`),
    );
  }

  await commit(plan, { ...flags, yes: flags.yes ?? true }, out);

  if (flags.check) {
    // The accent is text in both modes: step 600 on light surfaces, 400 on dark ones.
    const failing = built.contrast.filter(
      (r) =>
        (r.role === 'primary' || r.role === 'accent') &&
        ((r.step === 600 && r.against === 'light-surface') || (r.step === 400 && r.against === 'dark-surface')) &&
        !r.passes.text,
    );
    for (const r of built.contrast.filter((r) => r.role === 'primary' || r.role === 'accent')) {
      out.log(`  ${r.role.padEnd(8)} ${String(r.step).padEnd(4)} ${r.against.padEnd(14)} ${String(r.ratio).padStart(5)}:1`);
    }
    if (failing.length) {
      out.error(`contrast: ${failing.map((r) => `${r.role}-${r.step} on ${r.against} (${r.ratio}:1)`).join(', ')} below 4.5:1`);
      return 1;
    }
    out.log(out.color.ok('  contrast: accent text passes WCAG AA in light and dark mode'));
  }
  return 0;
}

/* --------------------------------------------------------------- doctor */

export function doctor(flags, out) {
  const project = detect(flags.cwd);
  const problems = [];
  const warn = [];
  const read = (f) => (f && existsSync(join(project.cwd, f)) ? readFileSync(join(project.cwd, f), 'utf8') : '');

  // React 18+
  const reactPkg = join(project.cwd, 'node_modules/react/package.json');
  const reactVersion = existsSync(reactPkg) ? JSON.parse(readFileSync(reactPkg, 'utf8')).version : String(project.deps.react ?? '').replace(/^[^\d]*/, '');
  if (reactVersion && Number(reactVersion.split('.')[0]) < 18) {
    problems.push(`React ${reactVersion} found; Pinfold needs React 18 or newer. Upgrade guide: https://react.dev/blog/2022/03/08/react-18-upgrade-guide`);
  }

  // CSS imports: core before components; theme present.
  const entry = read(project.entryFile);
  if (project.entryFile) {
    const at = (spec) => entry.indexOf(spec);
    if (at('@pinfold/css/core.css') === -1) problems.push(`${project.entryFile}: missing import '@pinfold/css/core.css'. Fix: npx pinfold init`);
    for (const m of entry.matchAll(/@pinfold\/css\/([a-z-]+)\.css/g)) {
      if (m[1] !== 'core' && at('@pinfold/css/core.css') > m.index) problems.push(`${project.entryFile}: import '@pinfold/css/core.css' before '@pinfold/css/${m[1]}.css'.`);
    }
    if (!entry.includes(THEME_FILE)) warn.push(`${project.entryFile}: no ${THEME_FILE} import; the default palette applies. Fix: npx pinfold theme`);
  } else {
    warn.push('no entry file detected; check your CSS imports by hand.');
  }

  // Provider when the config needs one.
  const config = read(project.configFile);
  const needsProvider = /stylePack:|theme:\s*['"](light|dark)['"]|radius:\s*['"](none|sm|lg|full)['"]|defaults:\s*\{\s*\w/.test(config);
  if (needsProvider && !entry.includes('PinfoldProvider')) problems.push(`${project.configFile} sets options, but no <PinfoldProvider config={…}> wraps the app in ${project.entryFile}.`);

  // 'use client' in Next.js App Router files that call hooks.
  if (project.framework === 'next' && project.router === 'app') {
    for (const file of walk(project.cwd, existsSync(join(project.cwd, 'src/app')) ? 'src/app' : 'app')) {
      const src = read(file);
      if (/\buse[A-Z]\w*\(/.test(src) && /@pinfold\/react|components\/ui\//.test(src) && !/^\s*['"]use client['"]/.test(src)) {
        problems.push(`${file}: calls a Pinfold hook without 'use client'. Add the directive, or use define<Name>() in a Server Component.`);
      }
    }
  }

  // Browser targets vs Baseline 2023.
  const browsers = [].concat(project.pkg.browserslist ?? [], read('.browserslistrc').split('\n')).join(',');
  if (/\bie\b|op_mini|chrome\s*[<>]=?\s*(\d{1,2}|10\d|110)\b/i.test(browsers)) {
    warn.push('browserslist targets browsers older than Baseline 2023 (Chrome/Edge 111, Firefox 113, Safari 16.4); Pinfold CSS needs @layer, color-mix() and container queries.');
  }

  // Duplicate @pinfold installs.
  const versions = new Set(findInstalls(join(project.cwd, 'node_modules')).map((p) => JSON.parse(readFileSync(p, 'utf8')).version));
  if (versions.size > 1) problems.push(`@pinfold/core is installed more than once (${[...versions].join(', ')}); dedupe so every component shares one provider.`);

  for (const w of warn) out.log(`  ${out.color.warn('warn')}  ${w}`);
  for (const p of problems) out.log(`  ${out.color.err('error')} ${p}`);
  if (!problems.length) out.log(out.color.ok(`  doctor: no problems${warn.length ? ` (${warn.length} warning${warn.length > 1 ? 's' : ''})` : ''}`));
  return problems.length ? 1 : 0;
}

function walk(root, dir) {
  const abs = join(root, dir);
  if (!existsSync(abs)) return [];
  return readdirSync(abs).flatMap((name) => {
    const rel = posix.join(dir, name);
    if (statSync(join(root, rel)).isDirectory()) return walk(root, rel);
    return /\.(tsx|jsx|ts|js)$/.test(name) ? [rel] : [];
  });
}

function findInstalls(nodeModules, depth = 0, out = []) {
  const core = join(nodeModules, '@pinfold/core/package.json');
  if (existsSync(core)) out.push(core);
  if (depth > 3 || !existsSync(nodeModules)) return out;
  for (const scope of ['@pinfold']) {
    const dir = join(nodeModules, scope);
    if (!existsSync(dir)) continue;
    for (const pkg of readdirSync(dir)) findInstalls(join(dir, pkg, 'node_modules'), depth + 1, out);
  }
  return out;
}
