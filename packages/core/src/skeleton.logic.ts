/** Skeleton rules, framework-free: the layout grammar, the presets and what has no effect. */

type Len = number | string;

/** Modifiers any layout node may carry. Lengths: numbers are px, strings pass through. */
export interface SkeletonNodeOptions {
  /** Width of the shape (a `line`/`text` line, a block, a pill), or of a group. */
  width?: Len;
  /** Height of a block, pill or line; a text line's height. */
  height?: Len;
  /** Aspect ratio of a `rect`, `square` or `circle`: `16 / 9` as `'16/9'` or `1.78`. Replaces the height. */
  ratio?: number | string;
  /** Corner radius. */
  radius?: Len;
  /** Space between the children of a group, or between text lines. */
  gap?: Len;
  /** Cross-axis alignment of a group's children. */
  align?: 'start' | 'center' | 'end' | 'stretch';
  /** Draw the group as a card: a border, a radius and padding. */
  frame?: boolean;
  /** Repeat this node, e.g. `{ row: [...], repeat: 5 }` for five list rows. */
  repeat?: number;
  /** Width of the last line of a `text` node. */
  last?: Len;
  /** Columns of a `grid`. */
  columns?: number;
  /** Take the free room in a row (shapes with a set width keep it otherwise). */
  grow?: boolean;
}

export type SkeletonPresetName = 'text' | 'avatar-text' | 'card' | 'list' | 'table' | 'form' | 'sidebar' | 'tabs' | 'article' | 'dashboard' | 'profile';

/** Counts a preset takes; each has its own default. */
export interface SkeletonPresetOptions {
  /** Copies of the whole preset, laid out in `columns` (except `table` and `dashboard`, whose columns are their own). */
  count?: number;
  /** Rows inside it: text lines, list items, table rows, form fields, sidebar entries, tabs. */
  rows?: number;
  /** Columns: table columns, dashboard tiles, or a grid of copies. */
  columns?: number;
}

/**
 * One node of a skeleton layout, as plain JSON. Exactly one shape key, plus any options:
 *
 *   { line: '60%' }  { text: 3 }  { circle: 40 }  { square: true }  { rect: 160 }  { pill: '6rem' }
 *   { row: [...] }  { stack: [...] }  { grid: [...], columns: 3 }  { space: true }  { preset: 'card' }
 *
 * `true` takes the size preset's default.
 */
export type SkeletonNode = SkeletonNodeOptions &
  (
    | { line: true | Len }
    | { text: true | number }
    | { circle: true | Len }
    | { square: true | Len }
    | { rect: true | Len }
    | { pill: true | Len }
    | { row: readonly SkeletonNode[] }
    | { stack: readonly SkeletonNode[] }
    | { grid: readonly SkeletonNode[] }
    | { space: true | Len }
    | ({ preset: SkeletonPresetName } & SkeletonPresetOptions)
  );

export type SkeletonBoneKind = 'line' | 'text' | 'circle' | 'square' | 'rect' | 'pill' | 'row' | 'stack' | 'grid' | 'space';

/** A layout node after normalising: one `kind`, CSS-ready strings, children expanded. */
export interface SkeletonBone {
  kind: SkeletonBoneKind;
  /** Line widths of a `line` or `text` node. */
  lines?: string[];
  width?: string;
  height?: string;
  ratio?: string;
  radius?: string;
  gap?: string;
  align?: string;
  columns?: number;
  frame?: boolean;
  grow?: boolean;
  /** A `space` without a length: it takes the free room. */
  flexible?: boolean;
  children?: SkeletonBone[];
  /** The node as written. */
  source: SkeletonNode;
}

export const SKELETON_SHAPES: readonly SkeletonBoneKind[] = ['line', 'text', 'circle', 'square', 'rect', 'pill', 'row', 'stack', 'grid', 'space'];
export const SKELETON_PRESETS: readonly SkeletonPresetName[] = ['text', 'avatar-text', 'card', 'list', 'table', 'form', 'sidebar', 'tabs', 'article', 'dashboard', 'profile'];
const OPTION_KEYS = ['width', 'height', 'ratio', 'radius', 'gap', 'align', 'frame', 'repeat', 'last', 'columns', 'grow', 'count', 'rows'];
const GROUPS = ['row', 'stack', 'grid'];
const MAX_REPEAT = 200;

const len = (v: unknown): string | undefined => (typeof v === 'number' ? `${v}px` : typeof v === 'string' && v !== '' ? v : undefined);
const ratio = (v: unknown): string | undefined => (typeof v === 'number' ? String(v) : typeof v === 'string' && v !== '' ? v : undefined);
const isObject = (v: unknown): v is Record<string, unknown> => typeof v === 'object' && v !== null && !Array.isArray(v);
const whole = (v: unknown, fallback: number, max = MAX_REPEAT) => (typeof v === 'number' && Number.isFinite(v) ? Math.min(max, Math.max(0, Math.floor(v))) : fallback);

/** Width of each placeholder line: full lines, a shorter last one, like real text. */
export function skeletonLineWidths(lines: number, last: Len = '62%'): string[] {
  const n = Math.max(1, Math.floor(lines));
  const end = len(last) ?? '62%';
  return Array.from({ length: n }, (_, i) => (n > 1 && i === n - 1 ? end : '100%'));
}

/** Problems with a layout, as messages: an unknown key, no shape or two, a wrong value. Empty when it is valid. */
export function validateSkeletonLayout(layout: unknown): string[] {
  const problems: string[] = [];
  walk(layout, 'layout', problems);
  return problems;
}

/** A layout as bones ready to draw: repeats and presets expanded, lengths as CSS. Invalid nodes are skipped. */
export function normalizeSkeletonLayout(layout: unknown): SkeletonBone[] {
  return walk(layout, 'layout', []);
}

function walk(nodes: unknown, path: string, problems: string[]): SkeletonBone[] {
  if (!Array.isArray(nodes)) {
    problems.push(`\`${path}\` must be an array of nodes.`);
    return [];
  }
  const out: SkeletonBone[] = [];
  nodes.forEach((node, i) => {
    const at = `${path}[${i}]`;
    if (!isObject(node)) {
      problems.push(`\`${at}\` must be an object such as { line: '60%' }.`);
      return;
    }
    const shapes = Object.keys(node).filter((k) => (SKELETON_SHAPES as readonly string[]).indexOf(k) !== -1 || k === 'preset');
    for (const key of Object.keys(node)) {
      if (shapes.indexOf(key) === -1 && OPTION_KEYS.indexOf(key) === -1) problems.push(`\`${at}.${key}\` is not a layout key. Shapes: ${SKELETON_SHAPES.join(', ')}, preset.`);
    }
    if (shapes.length !== 1) {
      problems.push(shapes.length ? `\`${at}\` has two shapes (${shapes.join(', ')}); give it one.` : `\`${at}\` has no shape: use one of ${SKELETON_SHAPES.join(', ')} or preset.`);
      return;
    }
    const repeat = node.repeat === undefined ? 1 : whole(node.repeat, 1);
    if (node.repeat !== undefined && typeof node.repeat !== 'number') problems.push(`\`${at}.repeat\` must be a number.`);
    const bones = one(node as unknown as SkeletonNode, shapes[0], at, problems);
    for (let r = 0; r < repeat; r++) out.push(...bones);
  });
  return out;
}

function one(node: SkeletonNode, key: string, at: string, problems: string[]): SkeletonBone[] {
  const n = node as unknown as SkeletonNodeOptions & Record<string, unknown>;
  const raw = n[key];
  if (key === 'preset') {
    if ((SKELETON_PRESETS as readonly string[]).indexOf(raw as string) === -1) {
      problems.push(`\`${at}.preset\` must be one of ${SKELETON_PRESETS.join(', ')}.`);
      return [];
    }
    return walk(skeletonPreset(raw as SkeletonPresetName, { count: n.count as number, rows: n.rows as number, columns: n.columns }), `${at}(${raw})`, problems);
  }
  const bone: SkeletonBone = { kind: key as SkeletonBoneKind, source: node };
  const set = (name: 'width' | 'height' | 'radius' | 'gap', v: unknown) => {
    if (v === undefined) return;
    const css = len(v);
    if (css === undefined) problems.push(`\`${at}.${name}\` must be a number (px) or a CSS length.`);
    else bone[name] = css;
  };
  set('width', n.width);
  set('height', n.height);
  set('radius', n.radius);
  set('gap', n.gap);
  if (n.ratio !== undefined) bone.ratio = ratio(n.ratio);
  if (n.align !== undefined) bone.align = n.align;
  if (n.frame) bone.frame = true;
  if (n.grow) bone.grow = true;
  const sizeArg = raw === true ? undefined : raw;
  if (GROUPS.indexOf(key) !== -1) {
    bone.children = walk(raw, `${at}.${key}`, problems);
    if (key === 'grid') bone.columns = whole(n.columns, 2, 12) || 1;
    return [bone];
  }
  if (raw !== true && typeof raw !== 'number' && typeof raw !== 'string') {
    problems.push(`\`${at}.${key}\` must be true, a number or a string.`);
    return [];
  }
  switch (key) {
    case 'line':
      bone.lines = [len(sizeArg) ?? '100%'];
      break;
    case 'text':
      if (sizeArg !== undefined && typeof sizeArg !== 'number') problems.push(`\`${at}.text\` is a number of lines.`);
      bone.lines = skeletonLineWidths(typeof sizeArg === 'number' ? sizeArg : 3, n.last ?? '62%');
      break;
    case 'circle':
    case 'square':
      if (sizeArg !== undefined) bone.width = len(sizeArg);
      break;
    case 'rect':
      if (sizeArg !== undefined) bone.height = len(sizeArg);
      break;
    case 'pill':
      if (sizeArg !== undefined) bone.width = len(sizeArg);
      break;
    case 'space':
      if (sizeArg === undefined) bone.flexible = true;
      else bone.width = len(sizeArg);
      break;
  }
  return [bone];
}

const range = (n: number) => Array.from({ length: n }, (_, i) => i);
/** Line widths that look like varied real content, deterministic (server and client agree). */
const varied = (i: number, widths = ['72%', '55%', '84%', '64%', '46%', '78%']) => widths[i % widths.length];

/**
 * A ready-made layout, as layout nodes you can also embed (`{ preset: 'card' }`) or extend.
 * `rows` and `columns` tune what is inside; `count` repeats the whole.
 */
export function skeletonPreset(name: SkeletonPresetName, options: SkeletonPresetOptions = {}): SkeletonNode[] {
  const rows = (fallback: number) => Math.max(1, whole(options.rows, fallback, 100));
  const cols = (fallback: number) => Math.max(1, whole(options.columns, fallback, 12));
  const avatarText = (i = 0): SkeletonNode => ({ row: [{ circle: true }, { stack: [{ line: varied(i + 3, ['38%', '30%', '44%', '35%']) }, { line: varied(i, ['72%', '64%', '80%', '58%']) }], gap: '0.5rem' }], gap: '0.875rem' });
  let unit: SkeletonNode[];
  switch (name) {
    case 'text':
      unit = [{ text: rows(3) }];
      break;
    case 'avatar-text':
      unit = [avatarText()];
      break;
    case 'card':
      unit = [
        {
          stack: [
            { rect: true, ratio: '16/9' },
            { stack: [{ line: '58%', height: '1.125rem' }, { text: 2, last: '75%' }], gap: '0.625rem' },
            { row: [{ pill: '5.5rem' }, { space: true }, { circle: '1.75rem' }, { circle: '1.75rem' }], gap: '0.5rem' },
          ],
          frame: true,
          gap: '1rem',
        },
      ];
      break;
    case 'list':
      unit = [{ stack: range(rows(4)).map((i) => ({ row: [...(avatarText(i) as { row: SkeletonNode[] }).row, { pill: '3.5rem', height: '1.5rem' }], gap: '0.875rem' })), gap: '1.125rem' }];
      break;
    case 'table': {
      const c = cols(4);
      const cells = (i: number, header: boolean): SkeletonNode => ({ grid: range(c).map((j) => ({ line: header ? '45%' : varied(i + j) })), columns: c, gap: '1.5rem' });
      unit = [{ stack: [cells(0, true), ...range(rows(5)).map((i) => cells(i, false))], frame: true, gap: '1.125rem' }];
      break;
    }
    case 'form':
      unit = [
        {
          stack: [
            ...range(rows(3)).map((i): SkeletonNode => ({ stack: [{ line: varied(i, ['28%', '36%', '22%', '32%']), height: '0.75rem' }, { rect: '2.5rem' }], gap: '0.5rem' })),
            { row: [{ space: true }, { pill: '6rem' }, { pill: '7rem' }], gap: '0.75rem' },
          ],
          gap: '1.25rem',
        },
      ];
      break;
    case 'sidebar':
      unit = [
        {
          stack: [
            { row: [{ square: '2rem' }, { line: '55%' }], gap: '0.75rem' },
            { space: '0.25rem' },
            ...range(rows(6)).map((i): SkeletonNode => ({ row: [{ square: '1.125rem', radius: '0.3rem' }, { line: varied(i, ['62%', '48%', '70%', '54%', '40%', '66%']), height: '0.75rem' }], gap: '0.75rem' })),
            { space: '0.5rem' },
            { line: '35%', height: '0.625rem' },
            { row: [{ square: '1.125rem', radius: '0.3rem' }, { line: '50%', height: '0.75rem' }], gap: '0.75rem', repeat: 2 },
          ],
          width: '15rem',
          gap: '1rem',
        },
      ];
      break;
    case 'tabs':
      unit = [
        {
          stack: [
            { row: range(rows(4)).map((i): SkeletonNode => ({ line: true, width: varied(i, ['4rem', '5.5rem', '4.5rem', '5rem']) })), gap: '1.25rem' },
            { rect: '1px', radius: '0' },
            { text: 3 },
          ],
          gap: '1rem',
        },
      ];
      break;
    case 'article':
      unit = [
        {
          stack: [
            { line: '72%', height: '1.75rem' },
            { row: [{ circle: '2rem' }, { line: '28%' }], gap: '0.75rem' },
            { rect: true, ratio: '21/9' },
            { text: rows(4) },
            { text: 3, last: '45%' },
          ],
          gap: '1.25rem',
        },
      ];
      break;
    case 'dashboard': {
      const c = cols(4);
      unit = [
        {
          row: [
            { preset: 'sidebar', rows: 5 },
            {
              stack: [
                { row: [{ line: '32%', height: '1.5rem' }, { space: true }, { pill: '6.5rem' }], gap: '0.75rem' },
                { grid: range(c).map((i): SkeletonNode => ({ stack: [{ line: varied(i, ['45%', '55%', '40%', '50%']), height: '0.75rem' }, { line: '62%', height: '1.5rem' }], frame: true, gap: '0.75rem' })), columns: c, gap: '1rem' },
                { rect: '12rem', radius: '0.75rem' },
                { preset: 'table', rows: rows(4), columns: 4 },
              ],
              gap: '1.25rem',
              grow: true,
            },
          ],
          align: 'start',
          gap: '2rem',
        },
      ];
      break;
    }
    case 'profile':
      unit = [
        {
          stack: [
            { circle: '5rem' },
            { line: '38%', height: '1.25rem' },
            { line: '26%' },
            { row: [{ pill: '5rem' }, { pill: '5rem' }, { pill: '5rem' }], gap: '0.75rem' },
            { text: rows(3) },
          ],
          align: 'center',
          gap: '0.875rem',
        },
      ];
      break;
  }
  const count = Math.max(1, whole(options.count, 1, 100));
  if (count === 1) return unit;
  const own = name === 'table' || name === 'dashboard';
  return [{ grid: range(count).map((): SkeletonNode => ({ stack: unit })), columns: own ? 1 : Math.min(count, cols(1)), gap: '1.5rem' }];
}

export interface SkeletonAppearanceInput {
  variant?: string;
  loading?: boolean;
  items?: unknown;
  layout?: unknown;
  preset?: string;
  ratio?: unknown;
}

/** Options with no visible effect in the current config. */
export function inactiveSkeletonOptions(config: SkeletonAppearanceInput): Record<string, string> {
  const out: Record<string, string> = {};
  const layout = Array.isArray(config.layout);
  if (layout || config.preset) {
    const why = layout ? 'a `layout` sets it per node.' : 'the preset sets it.';
    out.variant = why;
    out.lines = why;
    out.lastLine = why;
    out.ratio = why;
    out.items = layout ? 'a `layout` replaces `items`.' : 'a preset replaces `items`.';
    out.direction = 'only used with `items`.';
    if (layout) out.preset = 'a `layout` replaces the preset (embed one as `{ preset }` instead).';
    if (layout) {
      out.rows = 'only used with `preset`.';
      out.columns = 'only used with `preset`.';
    }
  } else if (Array.isArray(config.items)) {
    out.variant = 'a layout sets it per item.';
    out.lines = 'a layout sets it per item.';
    out.lastLine = 'a layout sets it per item.';
    out.rows = 'only used with `preset`.';
    out.columns = 'only used with `preset`.';
  } else {
    out.direction = 'only used with `items`.';
    const variant = config.variant ?? 'text';
    if (variant !== 'text') {
      out.lines = 'only text skeletons have lines.';
      out.lastLine = 'only text skeletons have lines.';
    } else if (config.ratio !== undefined) out.ratio = 'text lines have no aspect ratio.';
    out.rows = 'only used with `preset`.';
    out.columns = 'only used with `preset`.';
  }
  if (config.loading === false) {
    out.animation = 'the content is shown, not the placeholder.';
    out.lines = 'the content is shown, not the placeholder.';
  }
  return out;
}
