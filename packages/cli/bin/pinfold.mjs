#!/usr/bin/env node
/**
 * Pinfold CLI (docs/CLI.md).
 *
 *   npx pinfold init                      interactive setup: language, components, theme, entry, Tailwind
 *   npx pinfold add accordion | all       components/ui/<name> plus its CSS import
 *   npx pinfold theme --primary emerald   regenerate the palette (--format css|tailwind|dtcg, --check, --from <url>)
 *   npx pinfold doctor                    check React, CSS order, provider, 'use client', browsers, duplicates
 *   npx pinfold palette | list            preview hues | show the registry
 *   npx pinfold new <name>                scaffold a component (repo contributors)
 *
 * Every write is planned, printed and confirmed (or `--yes`); `--dry-run`
 * prints only; existing files are merged into, never overwritten; running a
 * command twice changes nothing the second time.
 */
import { existsSync, mkdirSync, readFileSync, readdirSync, statSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { HUES, createTheme } from '@pinfold/core/palette';
import { MODES, PACKS, RADII, add, doctor, init, theme } from '../lib/commands.mjs';
import { describe as describeProject, detect } from '../lib/detect.mjs';

const HERE = dirname(fileURLToPath(import.meta.url));
const REGISTRY = JSON.parse(readFileSync(join(HERE, '..', 'registry.json'), 'utf8'));
const TEMPLATES = join(HERE, '..', 'templates', 'component');

const tty = process.stdout.isTTY && !process.env.NO_COLOR;
const paint = (code) => (s) => (tty ? `\x1b[${code}m${s}\x1b[0m` : String(s));
const color = { dim: paint(2), bold: paint(1), accent: paint('38;5;141'), ok: paint(32), warn: paint(33), err: paint(31) };
const swatch = (hex) => {
  const [r, g, b] = [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16));
  return tty ? `\x1b[48;2;${r};${g};${b}m  \x1b[0m` : '██';
};

/** `--name value`, `--name=value` and bare `--flag` into one object; the rest are positionals. */
function parse(argv) {
  const flags = { cwd: process.cwd() };
  const positional = [];
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (!a.startsWith('--')) {
      positional.push(a);
      continue;
    }
    const [key, inline] = a.slice(2).split('=');
    if (inline !== undefined) flags[key] = inline;
    else if (argv[i + 1] && !argv[i + 1].startsWith('--')) flags[key] = argv[++i];
    else flags[key] = true;
  }
  return { flags, positional };
}

const out = {
  color,
  log: (s) => console.log(s),
  error: (s) => console.error(`  ${color.err('error')} ${s}`),
  async confirm(message) {
    if (!process.stdin.isTTY) return false;
    const p = await import('@clack/prompts');
    const ok = await p.confirm({ message });
    return ok === true;
  },
};

/** Interactive `init`: every question has the detected or recommended default. */
async function askInit(flags) {
  const p = await import('@clack/prompts');
  const project = detect(flags.cwd);
  p.intro(color.bold('Pinfold'));
  p.log.info(`Detected: ${describeProject(project)}`);
  const cancelled = (v) => {
    if (p.isCancel(v)) {
      p.cancel('Cancelled.');
      process.exit(0);
    }
    return v;
  };
  const language = cancelled(
    await p.select({ message: 'Language', initialValue: project.language, options: [{ value: 'ts', label: 'TypeScript' }, { value: 'js', label: 'JavaScript' }] }),
  );
  const components = cancelled(
    await p.multiselect({
      message: 'Components (a = all)',
      initialValues: REGISTRY.components.map((c) => c.name),
      options: REGISTRY.components.map((c) => ({ value: c.name, label: c.name, hint: c.description })),
    }),
  );
  const primary = cancelled(await p.text({ message: `Brand hue (${Object.keys(HUES).join(', ')}, or 0-360)`, initialValue: String(flags.primary ?? 'violet') }));
  const style = cancelled(await p.select({ message: 'Style pack', initialValue: 'default', options: PACKS.map((v) => ({ value: v, label: v })) }));
  const radius = cancelled(await p.select({ message: 'Radius', initialValue: 'md', options: RADII.map((v) => ({ value: v, label: v })) }));
  const mode = cancelled(await p.select({ message: 'Colour mode', initialValue: 'system', options: MODES.map((v) => ({ value: v, label: v })) }));
  const entryFile = cancelled(await p.text({ message: 'Entry file', initialValue: project.entryFile ?? '', placeholder: 'e.g. src/main.tsx' }));

  const preview = createTheme({ primary: Number.isFinite(Number(primary)) ? Number(primary) : primary });
  const accent = preview.contrast.find((r) => r.role === 'primary' && r.step === 600 && r.against === 'light-surface');
  p.log.info(`Brand ${[100, 300, 500, 700, 900].map((s) => swatch(preview.vars[`--pinfold-primary-${s}`])).join('')}  text contrast ${accent.ratio}:1`);
  p.outro('Review the changes below.');
  return { language, components, entryFile: entryFile || null, theme: { primary, style, radius, mode } };
}

/* --------------------------------------------------- palette, list, new */

function palette() {
  console.log(color.bold('\n  Built-in hues\n'));
  for (const name of Object.keys(HUES)) {
    const t = createTheme({ primary: name });
    const bar = [100, 200, 300, 400, 500, 600, 700, 800, 900].map((s) => swatch(t.vars[`--pinfold-primary-${s}`])).join('');
    console.log(`  ${name.padEnd(9)}${bar}  ${color.dim(String(HUES[name]) + '°')}`);
  }
  console.log(color.dim('\n  npx pinfold theme --primary <name> --accent <name> --radius lg\n'));
}

function list() {
  console.log(color.bold('\n  Available\n'));
  for (const x of REGISTRY.components) {
    console.log(`  ${color.accent(x.name.padEnd(14))}${x.description}`);
    console.log(`  ${''.padEnd(14)}${color.dim(`variants: ${x.variants.join(', ')} · hook: ${x.hook}()`)}`);
  }
  console.log(color.bold('\n  Planned\n'));
  console.log('  ' + color.dim(REGISTRY.planned.join(', ')) + '\n');
}

/**
 * Scaffold a component inside the Pinfold monorepo (contributors only): the
 * React adapter, the stylesheet and the subpath export, already shaped for
 * the conformance suite.
 */
function scaffold(name, flags) {
  if (!name) throw new Error('name required. Try `npx pinfold new tabs`.');
  if (!/^[a-z][a-z0-9-]*$/.test(name)) throw new Error('name must be kebab-case, e.g. `date-picker`.');
  const root = flags.root ?? '.';
  const reactDir = join(root, 'packages', 'react', 'src', name);
  const cssFile = join(root, 'packages', 'css', 'src', `${name}.css`);
  const pkgFile = join(root, 'packages', 'react', 'package.json');
  if (!existsSync(pkgFile)) throw new Error('run this from the Pinfold repo root (or pass --root).');
  if (existsSync(reactDir) || existsSync(cssFile)) throw new Error(`${name} already exists.`);

  const pascal = name.replace(/(^|-)([a-z])/g, (_, __, ch) => ch.toUpperCase());
  const tokens = { NAME: name, PASCAL: pascal, CAMEL: pascal[0].toLowerCase() + pascal.slice(1) };
  const apply = (text) => text.replace(/__(NAME|PASCAL|CAMEL)__/g, (_, key) => tokens[key]);
  const copy = (from, to) => {
    mkdirSync(to, { recursive: true });
    for (const entry of readdirSync(from)) {
      const src = join(from, entry);
      const dest = join(to, apply(entry).replace(/\.tmpl$/, ''));
      if (statSync(src).isDirectory()) copy(src, dest);
      else writeFileSync(dest, apply(readFileSync(src, 'utf8')));
    }
  };
  copy(join(TEMPLATES, 'react'), reactDir);
  writeFileSync(cssFile, apply(readFileSync(join(TEMPLATES, 'css', '__NAME__.css.tmpl'), 'utf8')));

  // The exports map drives the tsup entries and the webpack-4 stubs.
  const pkg = JSON.parse(readFileSync(pkgFile, 'utf8'));
  const sub = (p) => ({
    import: { types: `./dist/${p}.d.ts`, default: `./dist/${p}.js` },
    require: { types: `./dist/${p}.d.cts`, default: `./dist/${p}.cjs` },
  });
  const { ['./package.json']: pkgJson, ...rest } = pkg.exports;
  pkg.exports = { ...rest, [`./${name}`]: sub(`${name}/index`), [`./${name}/lazy`]: sub(`${name}/lazy`), './package.json': pkgJson };
  pkg.typesVersions['*'][name] = [`./dist/${name}/index.d.cts`];
  pkg.typesVersions['*'][`${name}/lazy`] = [`./dist/${name}/lazy.d.cts`];
  pkg.files = [...new Set([...pkg.files, name])];
  writeFileSync(pkgFile, JSON.stringify(pkg, null, 2) + '\n');

  console.log(`\n  ${color.ok('created')} ${reactDir}\n  ${color.ok('created')} ${cssFile}`);
  console.log(`  ${color.ok('wired')}   @pinfold/react/${name} in packages/react/package.json\n`);
  console.log(`  Next: write docs/components/${name}.md, implement the WAI-ARIA pattern, add the`);
  console.log(`  client/define split and the tsup entries, register it, then ${color.accent('npm run verify')}\n`);
}

function help() {
  console.log(`
  ${color.bold('pinfold')} ${color.dim('— config-driven React UI')}

  ${color.accent('init')}     [--yes] [--dry-run] [--no-install] [--primary violet] [--style glass] [--radius lg] [--mode dark]
  ${color.accent('add')}      <component…|all> [--yes] [--dry-run] [--no-install]
  ${color.accent('theme')}    [--primary emerald] [--accent blue] [--neutral 264] [--success|--warning|--danger|--info <hue>]
           [--intensity 1.1] [--radius lg] [--style glass] [--out path] [--format css|tailwind|dtcg]
           [--from <studio url>] [--check] [--dry-run]
  ${color.accent('doctor')}
  ${color.accent('palette')}  preview every built-in hue
  ${color.accent('list')}     show the registry
  ${color.accent('new')}      <name> [--root path]   scaffold a component (repo contributors)

  Hues: ${color.dim(Object.keys(HUES).join(', '))}. Any 0-360 number works too.
`);
}

/* ------------------------------------------------------------- dispatch */

const [command, ...rest] = process.argv.slice(2);
const { flags, positional } = parse(rest);
try {
  switch (command) {
    case 'init': {
      const interactive = process.stdin.isTTY && !flags.yes && !flags['dry-run'];
      await init(flags, out, REGISTRY, interactive ? await askInit(flags) : {});
      break;
    }
    case 'add':
      await add(positional, flags, out, REGISTRY);
      break;
    case 'theme':
      process.exitCode = await theme(flags, out);
      break;
    case 'doctor':
      process.exitCode = doctor(flags, out);
      break;
    case 'palette':
      palette();
      break;
    case 'list':
      list();
      break;
    case 'new':
      scaffold(positional[0], flags);
      break;
    case 'mcp':
      await (await import('../lib/mcp.mjs')).serve();
      break;
    case undefined:
    case 'help':
    case '--help':
    case '-h':
      help();
      break;
    default:
      out.error(`unknown command \`${command}\``);
      help();
      process.exitCode = 1;
  }
} catch (error) {
  out.error(error.message);
  process.exitCode = 1;
}
