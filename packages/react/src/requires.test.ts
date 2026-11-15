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
    // Fields drawn inside other components (subcontrols.tsx) load on first use, so they are dynamic
    // imports there: SubSelect is a Select; SubInput is an Input, a NumberField or a DatePicker by its
    // type, so a component lists the ones its fields use (at least one). CheckMark draws the checkbox
    // and radio boxes.
    const sub = readFileSync(resolve(src, 'subcontrols.tsx'), 'utf8');
    const lazyFields = new Set([...sub.matchAll(/import\('\.\/(\w+)\//g)].map((m) => m[1]));
    expect([...lazyFields].sort()).toEqual(['datepicker', 'input', 'number', 'select']);
    const INPUTS = ['datepicker', 'input', 'number'];
    const fields = (code: string, declared: readonly string[]) => {
      const out = [...(code.includes('SubSelect') ? ['select'] : []), ...(code.includes('CheckMark') ? ['checkbox', 'radio'] : [])];
      if (/\b(SubInput|PausedInput)\b/.test(code)) {
        const kinds = declared.filter((n) => INPUTS.includes(n));
        expect(kinds.length, 'a field kind for SubInput').toBeGreaterThan(0);
        out.push(...kinds);
      }
      return out;
    };
    for (const meta of componentMetas) {
      const dir = resolve(src, meta.name);
      const code = readdirSync(dir)
        .filter((f) => /^use.*\.tsx$/.test(f))
        .map((f) => readFileSync(resolve(dir, f), 'utf8'))
        .join('\n');
      // Fields can sit in any of the component's view files (a table's filter parts).
      const views = readdirSync(dir)
        .filter((f) => /\.tsx$/.test(f) && !/\.test\./.test(f))
        .map((f) => readFileSync(resolve(dir, f), 'utf8'))
        .join('\n');
      const used = [...imported(code, '\\.\\./'), ...(code.includes('renderTrigger') ? overlay : []), ...fields(views, meta.requires ?? [])].filter((n) => n !== meta.name && names.has(n));
      expect([...new Set(used)].sort(), meta.name).toEqual([...(meta.requires ?? [])].sort());
    }
  });
});
