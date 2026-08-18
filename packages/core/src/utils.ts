import type * as React from 'react';
import type { PropsBag } from './types';

/** Join truthy class names. Deliberately tiny — no `clsx` dependency. */
export function cn(...parts: Array<string | false | null | undefined>): string {
  let out = '';
  for (let i = 0; i < parts.length; i++) {
    const p = parts[i];
    if (p) out = out ? out + ' ' + p : p;
  }
  return out;
}

/** `data-*` attributes render when true and vanish when false. */
export function dataAttr(condition: unknown): '' | undefined {
  return condition ? '' : undefined;
}

/** `aria-*` attributes want the literal strings. */
export function ariaAttr(condition: unknown): 'true' | undefined {
  return condition ? 'true' : undefined;
}

export function composeRefs<T>(...refs: Array<React.Ref<T> | undefined>) {
  return (node: T | null) => {
    for (let i = 0; i < refs.length; i++) {
      const ref = refs[i];
      if (typeof ref === 'function') ref(node);
      else if (ref) (ref as React.MutableRefObject<T | null>).current = node;
    }
  };
}

const isHandler = (key: string) =>
  key.length > 2 && key.charCodeAt(0) === 111 /* o */ && key.charCodeAt(1) === 110 /* n */;

/**
 * Merge a user props bag over ours: event handlers chain (ours first, then
 * theirs, unless ours called `preventDefault`), `className` concatenates,
 * `style` shallow-merges, everything else overrides.
 */
export function mergeProps(base: PropsBag, overrides?: PropsBag): PropsBag {
  if (!overrides) return base;
  const out: PropsBag = { ...base };

  for (const key in overrides) {
    const ours = base[key];
    const theirs = overrides[key];

    if (isHandler(key) && typeof ours === 'function' && typeof theirs === 'function') {
      out[key] = (...args: any[]) => {
        ours(...args);
        const ev = args[0];
        if (ev && ev.defaultPrevented) return;
        theirs(...args);
      };
    } else if (key === 'className') {
      out[key] = cn(ours, theirs);
    } else if (key === 'style') {
      out[key] = { ...(ours as object), ...(theirs as object) };
    } else if (key === 'ref') {
      out[key] = composeRefs(ours, theirs);
    } else {
      out[key] = theirs;
    }
  }
  return out;
}
