// @vitest-environment node
import { readdirSync, readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';
import { componentMetas } from '@pinfold/core/meta';

/**
 * A component that renders another inside itself (a button in an alert) needs that one's
 * stylesheet too. `meta.requires` says so, and the playground's code reads it; this keeps it equal
 * to what the source actually imports.
 */
describe('meta.requires', () => {
  it('lists every component a hook renders inside itself', () => {
    const src = resolve(import.meta.dirname);
    const names = new Set(componentMetas.map((m) => m.name));
    const imported = (code: string, prefix: string) => [...code.matchAll(new RegExp(`from '${prefix}(\\w+)/\\w+'`, 'g'))].map((m) => m[1]);
    // Overlays draw their trigger button in the shared overlay.tsx.
    const overlay = imported(readFileSync(resolve(src, 'overlay.tsx'), 'utf8'), '\\./');
    for (const meta of componentMetas) {
      const dir = resolve(src, meta.name);
      const code = readdirSync(dir)
        .filter((f) => /^use.*\.tsx$/.test(f))
        .map((f) => readFileSync(resolve(dir, f), 'utf8'))
        .join('\n');
      const used = [...imported(code, '\\.\\./'), ...(code.includes('renderTrigger') ? overlay : [])].filter((n) => n !== meta.name && names.has(n));
      expect([...new Set(used)].sort(), meta.name).toEqual([...(meta.requires ?? [])].sort());
    }
  });
});
