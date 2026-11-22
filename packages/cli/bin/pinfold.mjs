#!/usr/bin/env node
/**
 * Pinfold CLI (docs/CLI.md).
 *
 *   npx pinfold init                      interactive setup: language, folder, components, theme, entry, Tailwind
 *                                         (--yes: no components unless --components a,b|all; --dir <folder>)
 *   npx pinfold add button table | all    <folder>/<name> plus the CSS it needs (--dir <folder> for this run)
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
const TEMPLATES = join(HERE, '..', 'templates');
const PKG = JSON.parse(readFileSync(join(HERE, '..', 'package.json'), 'utf8'));
const VERSION = PKG.version;

const tty = process.stdout.isTTY && !process.env.NO_COLOR;
const paint = (code) => (s) => (tty ? `\x1b[${code}m${s}\x1b[0m` : String(s));
const color = {
  dim: paint(2),
  bold: paint(1),
  accent: paint('38;5;141'),
  brand1: paint('38;2;196;181;253'), // #c4b5fd
  brand2: paint('38;2;167;139;250'), // #a78bfa
  brand3: paint('38;2;139;92;246'),  // #8b5cf6
  brand4: paint('38;2;124;58;237'),  // #7c3aed
  brand5: paint('38;2;99;102;241'),   // #6366f1
  ok: paint(32),
  warn: paint(33),
  err: paint(31),
};
const swatch = (hex) => {
  const [r, g, b] = [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16));
  return tty ? `\x1b[48;2;${r};${g};${b}m  \x1b[0m` : '██';
};

const ASCII_LOGO = [
  '        ##%###########        ',
  '     %#####************##     ',
  '   ###*****************+**#   ',
  ' **#*****#######*++++++++++++ ',
  ' *******#%@@@@@@@@@%++++++==+ ',
  '**++++++*%@@%***%@@@#=======++',
  '*+++++++*%@@#=--=@@@%+=======*',
  '*++++===*%@@@@@@@@@%*======--+',
  '*=======+%@@@@@@@%++---------+',
  '++======+%@@@%%%*-----------+=',
  ' +======+%@@@%*-------------= ',
  ' =====--=***+-------------=-- ',
  '   ++=-------------------++   ',
  '     ++==------------==++     ',
  '        =++========++=        ',
];

const BG_GRADIENT = [
  [196, 181, 253], // #c4b5fd
  [180, 160, 252],
  [167, 139, 250], // #a78bfa
  [152, 115, 248],
  [139, 92, 246],  // #8b5cf6
  [124, 58, 237],  // #7c3aed
  [115, 65, 238],
  [105, 75, 240],
  [99, 102, 241],  // #6366f1
  [88, 90, 235],
  [79, 70, 229],   // #4f46e5
  [70, 60, 210],
  [67, 56, 202],   // #4338ca
  [60, 50, 180],
  [55, 48, 163],   // #3730a3
];

const whiteP = (s) => (tty ? `\x1b[1;38;2;255;255;255m${s}\x1b[0m` : s);
const foldLilac = (s) => (tty ? `\x1b[1;38;2;221;214;254m${s}\x1b[0m` : s);
const innerLoop = (s) => (tty ? `\x1b[38;2;109;40;217m${s}\x1b[0m` : s);

function colorizeLogoLine(line, lineIndex) {
  if (!tty) return line;
  const [br, bg, bb] = BG_GRADIENT[lineIndex] || [124, 58, 237];
  const bgPaint = (s) => `\x1b[38;2;${br};${bg};${bb}m${s}\x1b[0m`;
  let res = '';
  for (let i = 0; i < line.length; i++) {
    const ch = line[i];
    if (ch === ' ') res += ' ';
    else if (ch === '@') res += whiteP('@');
    else if (lineIndex >= 9 && lineIndex <= 11 && (ch === '%' || ch === '*')) res += foldLilac(ch);
    else if ((lineIndex === 5 || lineIndex === 6) && (ch === '*' || ch === '-' || ch === '=' || ch === '#') && i > 12 && i < 20) res += innerLoop(ch);
    else res += bgPaint(ch);
  }
  return res;
}

function banner() {
  const side = [
    '',
    `  ${color.bold('P I N F O L D')}  ${color.brand3('v' + VERSION)}`,
    `  ${color.dim('Configure once. Ship everywhere.')}`,
    `  ${color.dim('https://pinfold.indranildev.in')}`,
    '',
    `  ${color.dim('The typed React component library')}`,
    `  ${color.dim('driven by a single config object.')}`,
    '',
    `  ${color.dim('• Fully accessible (WCAG 2.2 AA)')}`,
    `  ${color.dim('• Zero runtime dependencies')}`,
    `  ${color.dim('• 51 accessible components')}`,
    `  ${color.dim('• Baseline 2023 CSS styling')}`,
    '',
    '',
    '',
  ];
  return '\n' + ASCII_LOGO.map((line, idx) => '  ' + colorizeLogoLine(line, idx) + (side[idx] || '')).join('\n') + '\n';
}

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
  if (flags.ts) flags.language = 'ts';
  if (flags.js) flags.language = 'js';
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
  p.intro(`${color.brand3('Pinfold')} ${color.dim(`v${VERSION}`)} ${color.dim('— Configure once. Ship everywhere.')}`);
  p.log.info(`Detected environment: ${describeProject(project)}`);
  const cancelled = (v) => {
    if (p.isCancel(v)) {
      p.cancel('Operation cancelled.');
      process.exit(0);
    }
    return v;
  };
  const language = cancelled(
    await p.select({
      message: 'Project language',
      initialValue: flags.language ?? (flags.ts ? 'ts' : flags.js ? 'js' : project.language),
      options: [
        { value: 'ts', label: 'TypeScript', hint: 'recommended (.tsx)' },
        { value: 'js', label: 'JavaScript', hint: 'standard ESM (.jsx)' },
      ],
    }),
  );
  const dir = cancelled(
    await p.text({
      message: 'Components directory',
      initialValue: project.componentsDir,
      placeholder: 'e.g. src/components/ui',
    }),
  );
  const components = cancelled(
    await p.multiselect({
      message: 'Components to install now (Space to select, A for all, Enter to skip)',
      initialValues: [],
      required: false,
      options: REGISTRY.components.map((c) => ({ value: c.name, label: c.name, hint: c.description })),
    }),
  );
  const primary = cancelled(
    await p.text({
      message: `Brand primary color (#7c3aed, rgb(), oklch(), hue name: ${Object.keys(HUES).join(', ')}, or 0-360)`,
      initialValue: String(flags.primary ?? 'violet'),
      placeholder: 'violet, #7c3aed, etc.',
    }),
  );
  const style = cancelled(
    await p.select({
      message: 'Style pack (visual surface styling)',
      initialValue: 'default',
      options: [
        { value: 'default', label: 'default', hint: 'clean modern solid' },
        { value: 'glass', label: 'glass', hint: 'frosted translucent surfaces with blur' },
        { value: 'material', label: 'material', hint: 'subtle elevation with layered depth' },
        { value: 'noise', label: 'noise', hint: 'textured tactile finish' },
        { value: 'brutalist', label: 'brutalist', hint: 'high-contrast bold borders' },
      ],
    }),
  );
  const radius = cancelled(
    await p.select({
      message: 'Corner radius',
      initialValue: 'md',
      options: RADII.map((v) => ({ value: v, label: v })),
    }),
  );
  const mode = cancelled(
    await p.select({
      message: 'Color scheme',
      initialValue: 'system',
      options: [
        { value: 'system', label: 'system', hint: 'follows system OS preference' },
        { value: 'dark', label: 'dark', hint: 'always dark theme' },
        { value: 'light', label: 'light', hint: 'always light theme' },
      ],
    }),
  );
  const entryFile = cancelled(
    await p.text({
      message: 'Application entry file (for stylesheet imports)',
      initialValue: project.entryFile ?? '',
      placeholder: 'e.g. src/main.tsx or app/layout.tsx',
    }),
  );

  const preview = createTheme({ primary: Number.isFinite(Number(primary)) ? Number(primary) : primary });
  const accent = preview.contrast.find((r) => r.role === 'primary' && r.step === 600 && r.against === 'light-surface');
  p.log.info(`Palette preview: ${[100, 300, 500, 700, 900].map((s) => swatch(preview.vars[`--pinfold-primary-${s}`])).join('')}  contrast ${accent.ratio}:1 (WCAG AA)`);
  p.outro('Configuration ready. Reviewing planned changes...');
  return { language, dir: dir && dir !== project.componentsDir ? dir : null, components, entryFile: entryFile || null, theme: { primary, style, radius, mode } };
}

/* --------------------------------------------------- palette, list, new */

function palette() {
  console.log(banner());
  console.log(color.bold('  Built-in Color Hues\n'));
  console.log(`  ${color.dim('Name'.padEnd(12))}${color.dim('100 ─── Color Ramp ─── 900'.padEnd(28))}${color.dim('Angle')}`);
  console.log(`  ${color.dim('─'.repeat(48))}`);
  for (const name of Object.keys(HUES)) {
    const t = createTheme({ primary: name });
    const bar = [100, 200, 300, 400, 500, 600, 700, 800, 900].map((s) => swatch(t.vars[`--pinfold-primary-${s}`])).join('');
    console.log(`  ${color.bold(name.padEnd(12))}${bar}  ${color.dim(String(HUES[name]).padStart(3) + '°')}`);
  }
  console.log(color.dim('\n  Usage: npx pinfold theme --primary <name> --accent <name> --radius lg\n'));
}

function list() {
  console.log(banner());
  console.log(color.bold(`  Available Components (${REGISTRY.components.length})\n`));
  for (const x of REGISTRY.components) {
    const meta = [
      x.variants?.length ? `variants: ${x.variants.join(', ')}` : '',
      x.hook ? `hook: ${x.hook}()` : '',
    ].filter(Boolean).join(' · ');
    console.log(`  ${color.brand3(x.name.padEnd(16))} ${x.description}`);
    if (meta) console.log(`  ${''.padEnd(16)} ${color.dim(meta)}`);
  }
  console.log(color.bold(`\n  Planned Roadmap (${REGISTRY.planned.length})\n`));
  console.log('  ' + color.dim(REGISTRY.planned.join(', ')) + '\n');
  console.log(`  ${color.dim('Quick install:')} ${color.brand3('npx pinfold add <component-name>')}\n`);
}

/**
 * Scaffold a component inside the Pinfold monorepo (contributors only): the React adapter, the stylesheet and
 * the subpath export, already shaped for the conformance suite.
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
  const set = join(TEMPLATES, 'component');
  copy(join(set, 'react'), reactDir);
  writeFileSync(cssFile, apply(readFileSync(join(set, 'css', '__NAME__.css.tmpl'), 'utf8')));

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
  console.log(banner());
  console.log(`  ${color.bold('Usage:')}
    $ ${color.accent('npx pinfold')} ${color.dim('<command> [options]')}

  ${color.bold('Commands:')}
    ${color.accent('init')}      Initialize Pinfold in your project (framework, theme, config)
    ${color.accent('add')}       Add components with their stylesheets to your project
    ${color.accent('theme')}     Customize color palette, style pack, and design tokens
    ${color.accent('doctor')}    Diagnose setup, React version, CSS imports, and provider
    ${color.accent('palette')}   Preview built-in color ramps and WCAG contrast ratios
    ${color.accent('list')}      Show available and planned components in the registry
    ${color.accent('new')}       Scaffold a new component (repository contributors)

  ${color.bold('Examples:')}
    $ ${color.dim('npx pinfold init')}
    $ ${color.dim('npx pinfold add button table')}
    $ ${color.dim('npx pinfold theme --primary violet --style glass')}
    $ ${color.dim('npx pinfold doctor')}

  ${color.bold('Flags & Options:')}
    ${color.dim('--ts, --js')}        Target TypeScript (.tsx) or JavaScript (.jsx)
    ${color.dim('--dir <folder>')}    Components directory (default: src/components/ui)
    ${color.dim('--yes')}             Accept all detected defaults without prompting
    ${color.dim('--dry-run')}         Preview planned changes without writing to disk
    ${color.dim('--no-install')}      Skip automatic package installation

  ${color.bold('Built-in Hues:')}
    ${color.dim(Object.keys(HUES).join(', '))}${color.dim(' (or any 0-360 angle)')}

  ${color.bold('Documentation:')}
    ${color.dim('https://pinfold.indranildev.in')}
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
