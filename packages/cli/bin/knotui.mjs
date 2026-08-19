#!/usr/bin/env node
/**
 * Knot UI CLI.
 *
 *   npx knotui init                       scaffold knot.config.json + theme CSS
 *   npx knotui add accordion tabs         install components one at a time
 *   npx knotui theme --primary emerald    regenerate the palette
 *   npx knotui theme --check              WCAG contrast report for the palette
 *   npx knotui palette                    preview every built-in hue
 *   npx knotui new <name>                 scaffold a new component package
 *   npx knotui list                       show the component registry
 *
 * The palette maths lives in `@knotui/core/palette` — one implementation shared
 * by the CLI, the build and the runtime, so they cannot drift.
 */
import { execSync } from 'node:child_process';
import { createInterface } from 'node:readline/promises';
import { existsSync, mkdirSync, readFileSync, readdirSync, statSync, writeFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { HUES, createTheme } from '@knotui/core/palette';

const HERE = dirname(fileURLToPath(import.meta.url));
const REGISTRY = JSON.parse(readFileSync(join(HERE, '..', 'registry.json'), 'utf8'));
const TEMPLATES = join(HERE, '..', 'templates', 'component');
const CONFIG_FILE = 'knot.config.json';
const RADII = ['none', 'sm', 'md', 'lg', 'full'];

const c = {
  dim: (s) => `\x1b[2m${s}\x1b[0m`,
  bold: (s) => `\x1b[1m${s}\x1b[0m`,
  accent: (s) => `\x1b[38;5;141m${s}\x1b[0m`,
  ok: (s) => `\x1b[32m${s}\x1b[0m`,
  warn: (s) => `\x1b[33m${s}\x1b[0m`,
  err: (s) => `\x1b[31m${s}\x1b[0m`,
  swatch: (hex) => {
    const [r, g, b] = [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16));
    return `\x1b[48;2;${r};${g};${b}m  \x1b[0m`;
  },
};

/* -------------------------------------------------------------------- utils */

const arg = (argv, name, fallback) => {
  const i = argv.indexOf(`--${name}`);
  if (i === -1) return fallback;
  const next = argv[i + 1];
  return next && !next.startsWith('--') ? next : fallback;
};
const flag = (argv, name) => argv.includes(`--${name}`);
const positional = (argv) => {
  const out = [];
  for (let i = 0; i < argv.length; i++) {
    if (argv[i].startsWith('--')) {
      if (argv[i + 1] && !argv[i + 1].startsWith('--')) i++;
      continue;
    }
    out.push(argv[i]);
  }
  return out;
};

const readConfig = () =>
  existsSync(CONFIG_FILE) ? JSON.parse(readFileSync(CONFIG_FILE, 'utf8')) : null;

const writeConfig = (cfg) => writeFileSync(CONFIG_FILE, JSON.stringify(cfg, null, 2) + '\n');

function detectPackageManager() {
  if (existsSync('pnpm-lock.yaml')) return 'pnpm';
  if (existsSync('yarn.lock')) return 'yarn';
  if (existsSync('bun.lockb')) return 'bun';
  return 'npm';
}

function install(packages, { dryRun }) {
  const pm = detectPackageManager();
  const cmd = pm === 'npm' ? `npm install ${packages.join(' ')}` : `${pm} add ${packages.join(' ')}`;
  console.log(c.dim(`  $ ${cmd}`));
  if (dryRun) return;
  execSync(cmd, { stdio: 'inherit' });
}

/** Best-effort: find the app entry so the CSS imports can be wired for them. */
function findEntry() {
  const candidates = [
    'src/main.tsx', 'src/main.ts', 'src/main.jsx', 'src/index.tsx', 'src/index.jsx',
    'app/layout.tsx', 'src/app/layout.tsx', 'src/App.tsx', 'pages/_app.tsx',
  ];
  return candidates.find((f) => existsSync(f)) ?? null;
}

function ensureImport(file, spec) {
  const src = readFileSync(file, 'utf8');
  if (src.includes(spec)) return false;
  writeFileSync(file, `import '${spec}';\n${src}`);
  return true;
}

/* ------------------------------------------------------------------- theme */

/** Read palette flags off argv, layered over whatever is already configured. */
function paletteFromArgs(argv, base = {}) {
  const next = { ...base };
  for (const role of ['primary', 'accent', 'neutral', 'success', 'warning', 'danger', 'info']) {
    const value = arg(argv, role);
    if (value !== undefined) next[role] = Number.isFinite(Number(value)) ? Number(value) : value;
  }
  const preset = arg(argv, 'preset');
  if (preset) next.primary = preset;
  const intensity = arg(argv, 'intensity');
  if (intensity !== undefined) next.intensity = Number(intensity);
  const radius = arg(argv, 'radius');
  if (radius !== undefined && RADII.includes(radius)) next.radius = radius;
  if (!next.primary) next.primary = 'violet';
  if (!next.radius) next.radius = 'md';
  return next;
}

function emitTheme(cfg) {
  const theme = createTheme(cfg.theme);
  const path = resolve(cfg.cssPath);
  mkdirSync(dirname(path), { recursive: true });
  writeFileSync(path, theme.css);
  console.log(`  ${c.ok('theme')}   ${cfg.cssPath}`);
  printSwatches(theme);
  return theme;
}

function printSwatches(theme) {
  const steps = [100, 300, 500, 700, 900];
  for (const role of Object.keys(theme.ramps)) {
    const bar = steps.map((s) => c.swatch(theme.vars[`--knot-${role}-${s}`])).join('');
    console.log(`  ${c.dim(role.padEnd(9))}${bar}  ${c.dim(theme.vars[`--knot-${role}-500`])}`);
  }
}

function printContrast(theme) {
  console.log(c.bold('\n  WCAG 2.2 contrast — brand steps against page surfaces\n'));
  console.log(c.dim('  role      step  surface        ratio   body  large/UI'));
  let worst = null;
  for (const row of theme.contrast) {
    const mark = (ok) => (ok ? c.ok('  pass') : c.err('  fail'));
    console.log(
      `  ${row.role.padEnd(9)} ${String(row.step).padEnd(5)} ${row.against.padEnd(14)} ` +
        `${String(row.ratio).padStart(5)}  ${mark(row.passes.text)} ${mark(row.passes.ui)}`,
    );
    if (!worst || row.ratio < worst.ratio) worst = row;
  }
  console.log(
    c.dim(
      `\n  Body text needs 4.5:1, large text and UI boundaries need 3:1.` +
        `\n  Lowest here: ${worst.role}-${worst.step} on ${worst.against} at ${worst.ratio}:1.` +
        `\n  Failing a step only matters if you put text on it — the ramp keeps` +
        `\n  darker steps for exactly that reason.\n`,
    ),
  );
}

/* ---------------------------------------------------------------- commands */

async function init(argv) {
  const interactive = process.stdin.isTTY && !flag(argv, 'yes');
  let palette = paletteFromArgs(argv);

  if (interactive && !arg(argv, 'preset') && !arg(argv, 'primary')) {
    const rl = createInterface({ input: process.stdin, output: process.stdout });
    console.log(c.bold('\n  Knot UI setup\n'));
    console.log('  Hues: ' + c.dim(Object.keys(HUES).join(', ')) + '\n');
    const brand = (await rl.question(c.accent('  Brand hue [violet]: '))).trim() || 'violet';
    const accent = (await rl.question(c.accent('  Accent hue [same as brand]: '))).trim();
    const radius = (await rl.question(c.accent(`  Radius ${RADII.join('|')} [md]: `))).trim() || 'md';
    await rl.close();
    palette = { primary: brand, radius: RADII.includes(radius) ? radius : 'md' };
    if (accent) palette.accent = accent;
  }

  const cfg = {
    $schema: 'https://knotui.dev/config.schema.json',
    theme: palette,
    cssPath: arg(argv, 'css', 'src/knot-theme.css'),
    components: [],
  };
  writeConfig(cfg);
  console.log(`\n  ${c.ok('created')} ${CONFIG_FILE}`);
  emitTheme(cfg);

  install([REGISTRY.core.package], { dryRun: flag(argv, 'dry-run') });

  const entry = flag(argv, 'dry-run') ? null : findEntry();
  const local = './' + cfg.cssPath.split('/').pop();
  if (entry) {
    ensureImport(entry, local);
    ensureImport(entry, REGISTRY.core.styles);
    console.log(`  ${c.ok('wired')}   ${entry}`);
  } else {
    console.log(
      `\n  Add to your entry file:\n` +
        `    ${c.dim(`import '${REGISTRY.core.styles}';`)}\n` +
        `    ${c.dim(`import '${local}';`)}`,
    );
  }

  console.log(`\n  Next: ${c.accent('npx knotui add accordion')}\n`);
}

function theme(argv) {
  const cfg = readConfig();
  if (!cfg) return fail(`no ${CONFIG_FILE}. Run \`npx knotui init\` first.`);
  cfg.theme = paletteFromArgs(argv, cfg.theme);
  writeConfig(cfg);
  const built = emitTheme(cfg);
  if (flag(argv, 'check')) printContrast(built);
}

function palette(argv) {
  const names = Object.keys(HUES);
  console.log(c.bold('\n  Built-in hues\n'));
  for (const name of names) {
    const t = createTheme({ primary: name });
    const bar = [100, 200, 300, 400, 500, 600, 700, 800, 900]
      .map((s) => c.swatch(t.vars[`--knot-primary-${s}`]))
      .join('');
    console.log(`  ${name.padEnd(9)}${bar}  ${c.dim(String(HUES[name]) + '°')}`);
  }
  console.log(c.dim('\n  npx knotui theme --primary <name> --accent <name> --radius lg\n'));
  if (flag(argv, 'check')) printContrast(createTheme({ primary: arg(argv, 'primary', 'violet') }));
}

function add(argv) {
  const names = positional(argv);
  if (names.length === 0) return fail('nothing to add. Try `npx knotui add accordion`.');

  const cfg = readConfig();
  const wanted = names.includes('all') ? REGISTRY.components.map((x) => x.name) : names;
  const found = [];
  for (const name of wanted) {
    const entry = REGISTRY.components.find((x) => x.name === name);
    if (!entry) {
      console.log(`  ${c.warn('skip')}    ${name} — not in the registry yet`);
      continue;
    }
    found.push(entry);
  }
  if (found.length === 0) return;

  install(found.map((f) => f.package), { dryRun: flag(argv, 'dry-run') });

  const entryFile = flag(argv, 'dry-run') ? null : findEntry();
  for (const f of found) {
    if (entryFile) ensureImport(entryFile, f.styles);
    console.log(`  ${c.ok('added')}   ${c.bold(f.name)}  ${c.dim(f.snippet)}`);
  }
  if (entryFile) console.log(`  ${c.ok('styles')}  imported in ${entryFile}`);
  else console.log('\n' + found.map((f) => c.dim(`    import '${f.styles}';`)).join('\n'));

  if (cfg) {
    cfg.components = [...new Set([...(cfg.components ?? []), ...found.map((f) => f.name)])];
    writeConfig(cfg);
  }
  console.log('');
}

/**
 * Scaffold a component package from the templates. This is the seam an agent
 * (or a human) starts from: the four files already carry the layering,
 * the conformance test and the token discipline the architecture requires.
 */
function scaffold(argv) {
  const [name] = positional(argv);
  if (!name) return fail('name required. Try `npx knotui new tabs`.');
  if (!/^[a-z][a-z0-9-]*$/.test(name)) return fail('name must be kebab-case, e.g. `date-picker`.');

  const out = arg(argv, 'dir', join('packages', name));
  if (existsSync(out)) return fail(`${out} already exists.`);
  if (!existsSync(TEMPLATES)) return fail('templates missing — run this from an installed knotui.');

  const pascal = name.replace(/(^|-)([a-z])/g, (_, __, ch) => ch.toUpperCase());
  const camel = pascal[0].toLowerCase() + pascal.slice(1);
  const tokens = { NAME: name, PASCAL: pascal, CAMEL: camel };

  copyTemplates(TEMPLATES, out, tokens);
  console.log(`\n  ${c.ok('created')} ${out}\n`);
  console.log('  ' + c.dim('src/types.ts        config, dimensions, state, api, slots'));
  console.log('  ' + c.dim(`src/use${pascal}.tsx${' '.repeat(Math.max(0, 8 - pascal.length))} behaviour + render()`));
  console.log('  ' + c.dim(`src/${pascal}View.tsx${' '.repeat(Math.max(0, 5 - pascal.length))} markup, slots`));
  console.log('  ' + c.dim(`src/${name}.css`));
  console.log('  ' + c.dim(`src/${name}.test.tsx   conformance suite, already wired`));
  console.log(`\n  Next: implement the WAI-ARIA pattern, then ${c.accent('npm test')}\n`);
}

function copyTemplates(from, to, tokens) {
  mkdirSync(to, { recursive: true });
  for (const entry of readdirSync(from)) {
    const src = join(from, entry);
    const name = applyTokens(entry, tokens).replace(/\.tmpl$/, '');
    const dest = join(to, name);
    if (statSync(src).isDirectory()) {
      copyTemplates(src, dest, tokens);
    } else {
      writeFileSync(dest, applyTokens(readFileSync(src, 'utf8'), tokens));
    }
  }
}

const applyTokens = (text, tokens) =>
  text.replace(/__(NAME|PASCAL|CAMEL)__/g, (_, key) => tokens[key]);

function list() {
  console.log(c.bold('\n  Available\n'));
  for (const x of REGISTRY.components) {
    console.log(`  ${c.accent(x.name.padEnd(14))}${x.description}`);
    console.log(`  ${''.padEnd(14)}${c.dim(`variants: ${x.variants.join(', ')} · hook: ${x.hook}()`)}`);
  }
  console.log(c.bold('\n  Planned\n'));
  console.log('  ' + c.dim(REGISTRY.planned.join(', ')) + '\n');
}

function help() {
  console.log(`
  ${c.bold('knotui')} ${c.dim('— configuration-driven React UI')}

  ${c.accent('init')}     [--preset violet] [--accent blue] [--radius md] [--yes]
  ${c.accent('add')}      <component…|all> [--dry-run]
  ${c.accent('theme')}    [--primary emerald] [--accent blue] [--neutral 264]
           [--success|--warning|--danger|--info <hue>]
           [--intensity 1.1] [--radius lg] [--check]
  ${c.accent('palette')}  [--check]                preview every built-in hue
  ${c.accent('new')}      <name> [--dir path]      scaffold a component package
  ${c.accent('list')}

  Hues: ${c.dim(Object.keys(HUES).join(', '))}
  Any 0–360 number works too: ${c.dim('--primary 274')}
`);
}

function fail(msg) {
  console.error(`  ${c.err('error')}   ${msg}`);
  process.exitCode = 1;
}

const [command, ...rest] = process.argv.slice(2);
switch (command) {
  case 'init': await init(rest); break;
  case 'add': add(rest); break;
  case 'theme': theme(rest); break;
  case 'palette': palette(rest); break;
  case 'new': scaffold(rest); break;
  case 'list': list(); break;
  case undefined:
  case 'help':
  case '--help':
  case '-h': help(); break;
  default: fail(`unknown command \`${command}\``), help();
}
