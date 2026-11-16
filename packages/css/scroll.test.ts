// @vitest-environment node
import { readdirSync, readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

/**
 * A both-axes `overscroll-behavior: contain` on a scroll box makes the page stop scrolling whenever the pointer or a
 * finger is over it, even when the box has nothing to scroll (measured in Chromium). That is right for an overlay
 * (a menu, a dialog, a toast: the page behind must stay put) and wrong for anything that sits in the page, like a
 * table, a list, a scroll area or a panel. In-page boxes use the axis forms (`-x`, `-inline`) or nothing.
 */
const dir = resolve(import.meta.dirname, 'src');

/** Selectors whose box is an overlay or a modal panel, where trapping is the point. */
const OVERLAYS = [
  // App shell with scroll="content": the regions are the scrolling surfaces and the page does not scroll.
  /\.pinfold-appshell\[data-scroll='content'\]/,
  /dialog/,
  /popover/,
  /\.pinfold-menu/,
  /\.pinfold-toast/,
  /select__popup|__popup/,
  /\.pinfold-navbar__panel/,
  /\.pinfold-appshell\[data-drawer\] > \.pinfold-appshell__sidebar/,
  /\.pinfold-table__menuValues/,
];

function bothAxes(file: string): string[] {
  const out: string[] = [];
  const css = readFileSync(resolve(dir, file), 'utf8').replace(/\/\*[\s\S]*?\*\//g, '');
  // Each rule: selector { declarations }. Nested @media/@layer blocks are flattened by taking innermost braces.
  for (const m of css.matchAll(/([^{}]+)\{([^{}]*)\}/g)) {
    if (!/overscroll-behavior\s*:\s*contain/.test(m[2])) continue;
    out.push(m[1].trim().replace(/\s+/g, ' '));
  }
  return out;
}

describe('scroll containment', () => {
  it('only overlays trap scrolling in both directions', () => {
    const offenders: string[] = [];
    for (const file of readdirSync(dir).filter((f) => f.endsWith('.css'))) {
      for (const selector of bothAxes(file)) {
        const parts = selector.split(',').map((s) => s.trim());
        // A rule is fine only when every selector it names is an overlay (or the file is one).
        const fileIsOverlay = /^(dialog|menu|popover|toast|select)\.css$/.test(file);
        if (!fileIsOverlay && !parts.every((p) => OVERLAYS.some((re) => re.test(p)))) offenders.push(`${file}: ${selector}`);
      }
    }
    expect(offenders).toEqual([]);
  });

  it('the table, the command list, the scroll area and the accordion let the page scroll', () => {
    const read = (f: string) => readFileSync(resolve(dir, f), 'utf8').replace(/\/\*[\s\S]*?\*\//g, '');
    expect(read('table.css')).toMatch(/\.pinfold-table__scroll \{[^}]*overscroll-behavior-x: contain/);
    expect(read('table.css')).not.toMatch(/\.pinfold-table__scroll \{[^}]*overscroll-behavior: contain/);
    // Inline, the command list hands scrolling to the page; in a dialog it keeps it.
    expect(read('command.css')).toMatch(/dialog\.pinfold-command \.pinfold-command__list \{ overscroll-behavior: contain; \}/);
    expect(read('scrollarea.css')).not.toMatch(/overscroll-behavior: contain/);
    expect(read('accordion.css')).not.toMatch(/overscroll-behavior: contain/);
  });
});
