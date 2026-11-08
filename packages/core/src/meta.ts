/**
 * `@pinfold/core/meta`. A separate entry so apps never ship it: the React
 * adapter loads it only in development, and tooling (docs, CLI, schema,
 * llms.txt, playground) imports it directly.
 *
 * Component metadata: the single source of truth that docs, the playground,
 * the JSON schema, the registries, `llms.txt` and dev validation are all
 * generated from. Framework-free and JSON-safe.
 */

import { accordionMeta } from './accordion.meta';
import { buttonMeta } from './button.meta';
import { spinnerMeta } from './spinner.meta';
import { separatorMeta } from './separator.meta';
import { kbdMeta } from './kbd.meta';
import { skeletonMeta } from './skeleton.meta';
import { badgeMeta } from './badge.meta';
import { alertMeta } from './alert.meta';
import { avatarMeta } from './avatar.meta';
import { cardMeta } from './card.meta';
import { progressMeta } from './progress.meta';
import { colorpickerMeta } from './colorpicker.meta';
import { navmenuMeta } from './navmenu.meta';
import { sidebarMeta } from './sidebar.meta';
import { resizableMeta } from './resizable.meta';
import { carouselMeta } from './carousel.meta';
import { emptyMeta } from './empty.meta';
import { timelineMeta } from './timeline.meta';
import { ratingMeta } from './rating.meta';
import { tableMeta } from './table.meta';
import { datepickerMeta } from './datepicker.meta';
import { calendarMeta } from './calendar.meta';
import { commandMeta } from './command.meta';
import { tagsMeta } from './tags.meta';
import { comboboxMeta } from './combobox.meta';
import { selectMeta } from './select.meta';
import { stepperMeta } from './stepper.meta';
import { paginationMeta } from './pagination.meta';
import { breadcrumbMeta } from './breadcrumb.meta';
import { tabsMeta } from './tabs.meta';
import { otpMeta } from './otp.meta';
import { numberMeta } from './number.meta';
import { sliderMeta } from './slider.meta';
import { toolbarMeta } from './toolbar.meta';
import { toggleMeta } from './toggle.meta';
import { switchMeta } from './switch.meta';
import { radioMeta } from './radio.meta';
import { checkboxMeta } from './checkbox.meta';
import { inputMeta } from './input.meta';
import { toastMeta } from './toast.meta';
import { menuMeta } from './menu.meta';
import { dialogMeta } from './dialog.meta';
import { popoverMeta } from './popover.meta';
import { tooltipMeta } from './tooltip.meta';

export type PropType =
  | 'string'
  | 'number'
  | 'boolean'
  | 'enum'
  | 'string[]'
  | 'object'
  | 'array'
  | 'function'
  /** Anything renderable: a string, a number, an element, or a function of state. */
  | 'node'
  /** A length: a number (px) or a CSS string. */
  | 'length';

export type PropGroup = 'data' | 'behaviour' | 'appearance' | 'escape-hatch' | 'events';

export interface PropMeta {
  type: PropType;
  /** Allowed values for `enum` (and the named values of a `node | enum` mix). */
  values?: readonly (string | number)[];
  /** Also accepts a node, e.g. `indicator`: a glyph name or your own node. */
  orNode?: boolean;
  /** Also accepts a length, e.g. `radius`: a preset name or `20` / `'1.25rem'`. */
  orLength?: boolean;
  /** An `array` whose rows may also be strings (`items={['Board', 'List']}`); a `string[]` that also takes one string or `null`; a `string` that also takes `null` (none open). */
  orString?: boolean;
  default?: unknown;
  /** What an unset option resolves to when it has no fixed default (e.g. `theme radius`). */
  auto?: string;
  required?: boolean;
  description: string;
  group: PropGroup;
  /** Shown as a playground control (shape and behaviour only, never raw sizes). */
  control?: boolean;
  /** A control with no visual effect: it changes behaviour, so a playground groups it apart and says so. */
  silent?: boolean;
  /** `deprecated` props still work; `alias` names the replacement. */
  status?: 'stable' | 'deprecated';
  alias?: string;
  /** Keys of an `object` prop, for the schema and docs. */
  keys?: Record<string, PropMeta>;
  /** Item shape of an `array` prop. */
  items?: Record<string, PropMeta>;
}

export interface ComponentMeta {
  name: string;
  displayName: string;
  description: string;
  /** WAI-ARIA APG pattern URL. */
  pattern: string;
  /** npm import path of the React hook. */
  importPath: string;
  slots: readonly string[];
  props: Record<string, PropMeta>;
  keyboard: ReadonlyArray<{ keys: string; action: string }>;
  aria: readonly string[];
  dataAttributes: ReadonlyArray<{ name: string; on: string; values: string }>;
  /** Public CSS custom properties (set through `dimensions` or by hand). */
  cssVariables: readonly string[];
  /** Short usage examples: `[title, code]`. */
  examples: ReadonlyArray<{ title: string; code: string }>;
  /** The name in code (`useNumberField`, `defineNumberField`) when it is not the first word of `displayName`. */
  pascal?: string;
  /** Other components it renders inside itself (buttons in an alert): their stylesheets are needed too. */
  requires?: readonly string[];
}

/** One dev-time problem with a config object. */
export interface ConfigProblem {
  path: string;
  message: string;
}

/**
 * Check a config object against its meta: missing required keys, unknown
 * keys, wrong types and invalid enum values. Used in development only, so
 * plain-JS projects get the same safety net TypeScript gives.
 */
export function validateConfig(meta: ComponentMeta, config: unknown): ConfigProblem[] {
  const problems: ConfigProblem[] = [];
  if (!isObject(config)) {
    problems.push({ path: '', message: `${meta.displayName}: config must be an object.` });
    return problems;
  }
  checkShape(meta.displayName, meta.props, config, '', problems);
  return problems;
}

function checkShape(
  name: string,
  shape: Record<string, PropMeta>,
  value: Record<string, unknown>,
  prefix: string,
  problems: ConfigProblem[],
  /** Rows may carry extra data (`category`, `slug`), so there only likely typos are reported. */
  strict = true,
): void {
  for (const key in shape) {
    if (shape[key].required && value[key] === undefined) {
      problems.push({ path: prefix + key, message: `${name}: \`${prefix + key}\` is required.` });
    }
  }
  for (const key in value) {
    const path = prefix + key;
    const prop = shape[key];
    if (!prop) {
      const hint = closest(key, Object.keys(shape));
      if (!strict && !hint) continue;
      problems.push({
        path,
        message: `${name}: unknown option \`${path}\`.` + (hint ? ` Did you mean \`${prefix + hint}\`?` : ''),
      });
      continue;
    }
    const v = value[key];
    if (v === undefined) continue;
    const problem = checkType(prop, v);
    if (problem) {
      problems.push({ path, message: `${name}: \`${path}\` ${problem}` });
      continue;
    }
    if (prop.type === 'array' && prop.items && Array.isArray(v)) {
      v.forEach((entry, i) => {
        if (isObject(entry)) checkShape(name, prop.items!, entry, `${path}[${i}].`, problems, false);
        else if (!(prop.orString && typeof entry === 'string')) problems.push({ path: `${path}[${i}]`, message: `${name}: \`${path}[${i}]\` must be ${prop.orString ? 'an object or a string' : 'an object'}.` });
      });
    }
    if (prop.type === 'object' && prop.keys && isObject(v)) checkShape(name, prop.keys, v, `${path}.`, problems);
  }
}

function checkType(prop: PropMeta, v: unknown): string | null {
  const list = (prop.values ?? []).map((x) => JSON.stringify(x)).join(' | ');
  switch (prop.type) {
    case 'string':
      if (prop.orString && v === null) return null;
      return typeof v === 'string' ? null : `must be a string${prop.orString ? ' or null' : ''}, got ${describe(v)}.`;
    case 'number':
      return typeof v === 'number' ? null : `must be a number, got ${describe(v)}.`;
    case 'boolean':
      return typeof v === 'boolean' ? null : `must be true or false, got ${describe(v)}.`;
    case 'function':
      return typeof v === 'function' ? null : `must be a function, got ${describe(v)}.`;
    case 'length':
      return typeof v === 'number' || typeof v === 'string' ? null : `must be a number (px) or a CSS length string.`;
    case 'string[]':
      // `orString`: one value or none (`null`) as well, e.g. a select's value with and without `multiple`.
      if (prop.orString && (typeof v === 'string' || v === null)) return null;
      return Array.isArray(v) && v.every((x) => typeof x === 'string') ? null : `must be an array of strings${prop.orString ? ', a string or null' : ''}.`;
    case 'array':
      return Array.isArray(v) ? null : `must be an array, got ${describe(v)}.`;
    case 'object':
      // `null` is "none" for any object (a table's sort, a range). `orString`: also a string or strings.
      if (v === null) return null;
      if (prop.orString && (typeof v === 'string' || (Array.isArray(v) && v.every((x) => typeof x === 'string')))) return null;
      return isObject(v) ? null : `must be an object, got ${describe(v)}.`;
    case 'enum':
      if (prop.values!.indexOf(v as string) !== -1) return null;
      if (prop.orNode && typeof v !== 'string') return null;
      // A length is a number or a string with a digit or a function (`var()`, `calc()`); a bare word is a typo.
      if (prop.orLength && (typeof v === 'number' || (typeof v === 'string' && /\d|\(/.test(v)))) return null;
      return `must be one of ${list}${prop.orLength ? ' or a length' : ''}, got ${JSON.stringify(v)}.`;
    case 'node':
      return null;
  }
}

function describe(v: unknown): string {
  if (v === null) return 'null';
  if (Array.isArray(v)) return 'an array';
  return typeof v === 'object' ? 'an object' : `${typeof v} ${JSON.stringify(v)}`;
}

function isObject(v: unknown): v is Record<string, unknown> {
  return typeof v === 'object' && v !== null && !Array.isArray(v);
}

/** Nearest key by edit distance, for "did you mean" hints. */
function closest(key: string, keys: string[]): string | undefined {
  let best: string | undefined;
  let bestScore = 3;
  for (const k of keys) {
    const d = distance(key.toLowerCase(), k.toLowerCase());
    if (d < bestScore) {
      bestScore = d;
      best = k;
    }
  }
  return best;
}

function distance(a: string, b: string): number {
  const row = Array.from({ length: b.length + 1 }, (_, i) => i);
  for (let i = 1; i <= a.length; i++) {
    let prev = row[0];
    row[0] = i;
    for (let j = 1; j <= b.length; j++) {
      const tmp = row[j];
      row[j] = Math.min(row[j] + 1, row[j - 1] + 1, prev + (a[i - 1] === b[j - 1] ? 0 : 1));
      prev = tmp;
    }
  }
  return row[b.length];
}

/** JSON Schema (draft 2020-12) for a component's config, generated from its meta. */
export function toJsonSchema(meta: ComponentMeta): Record<string, unknown> {
  const shape = (props: Record<string, PropMeta>) => {
    const properties: Record<string, unknown> = {};
    const required: string[] = [];
    for (const key in props) {
      properties[key] = propSchema(props[key]);
      if (props[key].required) required.push(key);
    }
    return { type: 'object', properties, ...(required.length ? { required } : {}), additionalProperties: false };
  };
  const propSchema = (p: PropMeta): Record<string, unknown> => {
    const base: Record<string, unknown> = { description: p.description };
    if (p.default !== undefined) base.default = p.default;
    if (p.status === 'deprecated') base.deprecated = true;
    switch (p.type) {
      case 'string':
        return { ...base, type: p.orString ? ['string', 'null'] : 'string' };
      case 'number':
      case 'boolean':
        return { ...base, type: p.type };
      case 'length':
        return { ...base, type: ['number', 'string'] };
      case 'string[]':
        if (p.orString) return { ...base, anyOf: [{ type: 'array', items: { type: 'string' } }, { type: ['string', 'null'] }] };
        return { ...base, type: 'array', items: { type: 'string' } };
      case 'enum':
        if (p.orLength) return { ...base, anyOf: [{ enum: p.values }, { type: ['number', 'string'] }] };
        return p.orNode ? { ...base, anyOf: [{ enum: p.values }, {}] } : { ...base, enum: p.values };
      case 'array':
        // Rows may carry extra data, so they stay open.
        if (p.items && p.orString) return { ...base, type: 'array', items: { anyOf: [{ ...shape(p.items), additionalProperties: true }, { type: 'string' }] } };
        return { ...base, type: 'array', items: p.items ? { ...shape(p.items), additionalProperties: true } : {} };
      case 'object':
        if (p.orString) return { ...base, anyOf: [{ type: 'object' }, { type: ['string', 'null'] }, { type: 'array', items: { type: 'string' } }] };
        return p.keys ? { ...base, ...shape(p.keys) } : { ...base, type: 'object' };
      // Functions and nodes cannot be expressed in JSON; JSON config simply omits them.
      case 'function':
      case 'node':
        return base;
    }
  };
  return {
    $schema: 'https://json-schema.org/draft/2020-12/schema',
    $id: `https://pinfold.indranildev.in/schema/${meta.name}.json`,
    title: `${meta.displayName}Config`,
    description: meta.description,
    ...shape(meta.props),
  };
}

/** Human- and model-readable reference for one component: usage, every option, keyboard, ARIA. */
export function metaToMarkdown(meta: ComponentMeta): string {
  const cell = (s: unknown) => String(s ?? '').replace(/\|/g, '\\|').replace(/\n/g, ' ');
  const type = (p: PropMeta) =>
    p.type === 'enum' ? p.values!.map((v) => JSON.stringify(v)).join(' \\| ') + (p.orNode ? ' \\| node' : '') + (p.orLength ? ' \\| length' : '') : p.type;
  const table = (props: Record<string, PropMeta>) =>
    [
      '| Option | Type | Default | Description |',
      '|---|---|---|---|',
      ...Object.entries(props).map(
        ([k, p]) =>
          `| \`${k}\`${p.required ? ' (required)' : ''}${p.status === 'deprecated' ? ' (deprecated)' : ''} | ${type(p)} | ${
            p.default === undefined ? (p.auto ? `auto: ${p.auto}` : '') : `\`${JSON.stringify(p.default)}\``
          } | ${cell(p.description)} |`,
      ),
    ].join('\n');
  const rows = meta.props.items?.items;
  return [
    `# ${meta.displayName}`,
    '',
    meta.description,
    '',
    `Import: \`${meta.importPath}\` · Pattern: ${meta.pattern}`,
    '',
    ...meta.examples.flatMap((e) => [`## ${e.title}`, '', '```tsx', e.code, '```', '']),
    '## Options',
    '',
    `Required: ${Object.entries(meta.props).filter(([, p]) => p.required).map(([k]) => '`' + k + '`').join(', ') || 'nothing'}. Precedence for every other option: the component config, then \`defaults.${meta.name}\` in \`defineConfig()\`, then the provider (size, tone, dir), then the library default.`,
    '',
    table(meta.props),
    '',
    ...(rows ? ['## Row options (`items[]`)', '', table(rows), ''] : []),
    `## Slots`,
    '',
    meta.slots.map((s) => `\`${s}\``).join(', '),
    '',
    '## Keyboard',
    '',
    ...meta.keyboard.map((k) => `- **${k.keys}**: ${k.action}`),
    '',
    '## Accessibility',
    '',
    ...meta.aria.map((a) => `- ${a}`),
    '',
    '## Data attributes',
    '',
    ...meta.dataAttributes.map((d) => `- \`${d.name}\` on ${d.on}: ${d.values}`),
    '',
  ].join('\n');
}

/** Every component's meta. Tooling iterates this. */
export const componentMetas: readonly ComponentMeta[] = [accordionMeta, buttonMeta, spinnerMeta, separatorMeta, kbdMeta, skeletonMeta, badgeMeta, alertMeta, avatarMeta, cardMeta, progressMeta, tooltipMeta, popoverMeta, dialogMeta, menuMeta, toastMeta, inputMeta, checkboxMeta, radioMeta, switchMeta, toggleMeta, toolbarMeta, sliderMeta, numberMeta, otpMeta, tabsMeta, breadcrumbMeta, paginationMeta, stepperMeta, selectMeta, comboboxMeta, tagsMeta, commandMeta, calendarMeta, datepickerMeta, tableMeta, ratingMeta, timelineMeta, emptyMeta, carouselMeta, resizableMeta, sidebarMeta, navmenuMeta, colorpickerMeta];
export { accordionMeta, buttonMeta, spinnerMeta, separatorMeta, kbdMeta, skeletonMeta, badgeMeta, alertMeta, avatarMeta, cardMeta, progressMeta, tooltipMeta, popoverMeta, dialogMeta, menuMeta, toastMeta, inputMeta, checkboxMeta, radioMeta, switchMeta, toggleMeta, toolbarMeta, sliderMeta, numberMeta, otpMeta, tabsMeta, breadcrumbMeta, paginationMeta, stepperMeta, selectMeta, comboboxMeta, tagsMeta, commandMeta, calendarMeta, datepickerMeta, tableMeta, ratingMeta, timelineMeta, emptyMeta, carouselMeta, resizableMeta, sidebarMeta, navmenuMeta, colorpickerMeta };
