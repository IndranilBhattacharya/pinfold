import { cn } from '@pinfold/core';

/**
 * Presets: `define<Name>(preset)` returns a component whose props are any part of the config
 * (plus element attributes). These helpers keep the merge identical for every component.
 *
 * Precedence, highest first: use-site props, the preset, `defaults.<name>` (applied by the
 * hook), the provider, the library default.
 */

/** Per-slot and nested objects merge one level deep instead of replacing each other. */
const NESTED = ['classNames', 'styles', 'slotProps', 'render', 'dimensions', 'overflow'] as const;

/** Merge use-site config over a preset. Undefined use-site values never erase the preset. */
export function mergeConfig<T extends object>(preset: Partial<T>, own: Partial<T>): T {
  const out: Record<string, unknown> = { ...preset };
  for (const key in own) {
    const value = own[key];
    if (value !== undefined) out[key] = value;
  }
  const p = preset as Record<string, any>;
  const o = own as Record<string, any>;
  for (const key of NESTED) {
    if (isObject(p[key]) && isObject(o[key])) out[key] = { ...p[key], ...o[key] };
  }
  if (p.className && o.className) out.className = cn(p.className, o.className);
  if (isObject(p.style) && isObject(o.style)) out.style = { ...p.style, ...o.style };
  return out as T;
}

/** Split tag props into the component's config (known keys) and attributes for the root element. */
export function splitProps<T extends object>(props: Record<string, unknown>, keys: ReadonlySet<string>): [T, Record<string, unknown>] {
  const config: Record<string, unknown> = {};
  const rest: Record<string, unknown> = {};
  for (const key in props) {
    if (keys.has(key)) config[key] = props[key];
    else rest[key] = props[key];
  }
  return [config as T, rest];
}

function isObject(v: unknown): v is Record<string, unknown> {
  return typeof v === 'object' && v !== null && !Array.isArray(v);
}
