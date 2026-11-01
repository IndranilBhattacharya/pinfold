/**
 * Every command describes its changes as a plan first. The plan is what the
 * safety rules hang on: nothing is written until it is printed (and, when
 * interactive, confirmed); `--dry-run` stops after printing; existing files are
 * only ever merged into, never replaced; and a plan whose files already say the
 * right thing is empty, which is what makes every command idempotent.
 */
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';

export class Plan {
  constructor(cwd) {
    this.cwd = cwd;
    /** path -> { before: string | null, after: string } */
    this.changes = new Map();
    this.notes = [];
  }

  /** Current content: planned, else on disk, else null. */
  read(path) {
    if (this.changes.has(path)) return this.changes.get(path).after;
    const file = join(this.cwd, path);
    return existsSync(file) ? readFileSync(file, 'utf8') : null;
  }

  /** Merge into a file (or create it). Records nothing when the result is unchanged. */
  update(path, transform) {
    const current = this.read(path);
    const next = transform(current ?? '');
    if (next === current) return false;
    const before = this.changes.has(path) ? this.changes.get(path).before : current;
    if (next === before) this.changes.delete(path);
    else this.changes.set(path, { before, after: next });
    return true;
  }

  /** Create a file the developer will own. An existing file is never overwritten. */
  create(path, content) {
    const current = this.read(path);
    if (current === null) return this.update(path, () => content);
    if (current !== content) this.notes.push(`kept ${path} (exists; yours to edit)`);
    return false;
  }

  /** Write a file Pinfold owns and regenerates (the theme CSS). */
  generate(path, content) {
    return this.update(path, () => content);
  }

  note(message) {
    this.notes.push(message);
  }

  get empty() {
    return this.changes.size === 0;
  }

  /** A compact diff: new files by line count, edited files by their added and removed lines. */
  describe(color) {
    const out = [];
    for (const [path, { before, after }] of this.changes) {
      if (before === null) {
        out.push(`  ${color.ok('create')}  ${path} ${color.dim(`(${after.split('\n').length} lines)`)}`);
        continue;
      }
      out.push(`  ${color.warn('update')}  ${path}`);
      const was = before.split('\n');
      const now = after.split('\n');
      for (const line of now) if (!was.includes(line)) out.push(color.ok(`          + ${line}`));
      for (const line of was) if (!now.includes(line)) out.push(color.err(`          - ${line}`));
    }
    for (const note of this.notes) out.push(color.dim(`  ${note}`));
    return out.join('\n');
  }

  apply() {
    for (const [path, { after }] of this.changes) {
      const file = join(this.cwd, path);
      mkdirSync(dirname(file), { recursive: true });
      writeFileSync(file, after);
    }
  }
}

/* --------------------------------------------------------- source edits */

/** Quote style of the file's existing imports, so inserted lines match. */
const quoteOf = (src) => (/^import\s.*"/m.test(src) && !/^import\s.*'/m.test(src) ? '"' : "'");

/**
 * Add side-effect imports (`import 'x';`) that are missing, in the given
 * order, after the file's last top-level import (after any directive).
 */
export function addImports(src, specs) {
  const q = quoteOf(src);
  const missing = specs.filter((s) => !new RegExp(`['"]${escape(s)}['"]`).test(src));
  if (!missing.length) return src;
  // A CommonJS entry gets require() calls, after its last top-level require.
  if (/\brequire\(/.test(src) && !/^import\s/m.test(src)) {
    const lines = src.split('\n');
    let at = -1;
    lines.forEach((line, i) => {
      if (/^(const|let|var)\s.*=\s*require\(|^require\(/.test(line.trim())) at = i;
    });
    lines.splice(at + 1, 0, missing.map((s) => `require(${q}${s}${q});`).join('\n'));
    return lines.join('\n');
  }
  const block = missing.map((s) => `import ${q}${s}${q};`).join('\n');
  return insertAfterImports(src, block);
}

/** Add a named import line unless the binding is already imported from that module. */
export function addNamedImport(src, name, from, isDefault = false) {
  if (new RegExp(`import[^;]*\\b${name}\\b[^;]*from\\s*['"]${escape(from)}['"]`).test(src)) return src;
  const q = quoteOf(src);
  return insertAfterImports(src, `import ${isDefault ? name : `{ ${name} }`} from ${q}${from}${q};`);
}

function insertAfterImports(src, block) {
  const lines = src.split('\n');
  let at = -1;
  let inImport = false;
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();
    if (inImport) {
      if (/from\s*['"].*['"];?$|^['"].*['"];?$/.test(line)) {
        inImport = false;
        at = i;
      }
      continue;
    }
    if (/^import\s/.test(line)) {
      at = i;
      if (!/['"];?$/.test(line)) inImport = true;
    } else if (/^['"]use (client|server)['"];?$/.test(line) && at === -1) {
      at = i;
    } else if (line && !line.startsWith('//') && !line.startsWith('/*') && !line.startsWith('*') && at !== -1) {
      break;
    }
  }
  lines.splice(at + 1, 0, block);
  return lines.join('\n');
}

/** Tailwind v4: `@import "<spec>";` after the stylesheet's last @import. */
export function addCssImport(css, spec) {
  if (css.includes(spec)) return css;
  const lines = css.split('\n');
  let at = -1;
  lines.forEach((line, i) => {
    if (/^@import\s/.test(line.trim())) at = i;
  });
  lines.splice(at + 1, 0, `@import "${spec}";`);
  return lines.join('\n');
}

/** Tailwind v3: add the preset to `presets`, without reformatting the rest. */
export function addTailwindPreset(src) {
  if (src.includes('@pinfold/css/tailwind')) return src;
  const esm = /export\s+default/.test(src);
  const ref = esm ? 'pinfoldPreset' : "require('@pinfold/css/tailwind')";
  let out = src;
  if (/presets\s*:\s*\[/.test(out)) out = out.replace(/presets\s*:\s*\[/, (m) => `${m}${ref}, `);
  else if (/(module\.exports\s*=\s*\{|export\s+default\s*\{|defineConfig\(\s*\{)/.test(out))
    out = out.replace(/(module\.exports\s*=\s*\{|export\s+default\s*\{|defineConfig\(\s*\{)/, (m) => `${m}\n  presets: [${ref}],`);
  else return src;
  return esm ? addNamedImport(out, 'pinfoldPreset', '@pinfold/css/tailwind', true) : out;
}

const escape = (s) => s.replace(/[.*+?^${}()|[\]\\/]/g, '\\$&');
