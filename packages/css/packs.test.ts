// @vitest-environment node
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';
import { contrastRatio, createTheme, oklchToHex } from '@pinfold/core/palette';

/**
 * Style packs only re-point tokens, so contrast is checked on what they
 * change: surfaces (glass is translucent, so it is blended over hostile
 * backdrops) and borders that carry meaning (brutalist). Text roles
 * come from the default palette, in light and dark mode.
 */
const css = readFileSync(resolve(import.meta.dirname, 'src/packs.css'), 'utf8');
const theme = createTheme({ primary: 274 });
const n = theme.vars;

const mode = {
  light: { text: n['--pinfold-neutral-900'], muted: n['--pinfold-neutral-600'], bg: n['--pinfold-neutral-50'], surface: '#ffffff' },
  dark: { text: n['--pinfold-neutral-100'], muted: n['--pinfold-neutral-400'], bg: n['--pinfold-neutral-950'], surface: oklchToHex(0.196, 0.02, 274) },
};

/** sRGB alpha blend of `top` at `alpha` over `bottom`: what a translucent surface shows. */
function blend(top: string, alpha: number, bottom: string): string {
  const rgb = (h: string) => [1, 3, 5].map((i) => parseInt(h.slice(i, i + 2), 16));
  const [a, b] = [rgb(top), rgb(bottom)];
  return '#' + a.map((v, i) => Math.round(v * alpha + b[i] * (1 - alpha)).toString(16).padStart(2, '0')).join('');
}

const packs = ['glass', 'material', 'noise', 'brutalist'];

describe('style packs', () => {
  it('defines every pack as a token recipe', () => {
    for (const pack of packs) expect(css).toContain(`[data-pinfold-style='${pack}']`);
  });

  it('honours reduced transparency, high contrast and forced colours', () => {
    expect(css).toMatch(/prefers-reduced-transparency: reduce\)[\s\S]*glass[\s\S]*--pinfold-backdrop: none/);
    expect(css).toMatch(/prefers-contrast: more\)[\s\S]*--pinfold-texture: none/);
    expect(css).toMatch(/forced-colors: active\)[\s\S]*--pinfold-backdrop: none/);
  });

  // A custom property inherits its *computed* value, so tokens built from other tokens must be
  // redeclared wherever their inputs change, or nested sections keep the :root result.
  it('recomputes radii wherever the radius scale can change', () => {
    const tokens = readFileSync(resolve(import.meta.dirname, 'src/tokens.css'), 'utf8');
    expect(tokens).toMatch(/:root,\s*\[data-pinfold-radius\],\s*\[data-pinfold-style\] \{\s*--pinfold-radius-xs: calc/);
  });

  it('gives a nested light section every property the dark palette flips, plus the derived ones', () => {
    const tokens = readFileSync(resolve(import.meta.dirname, 'src/tokens.css'), 'utf8');
    const body = (sel: string) => tokens.slice(tokens.indexOf(sel), tokens.indexOf('\n  }', tokens.indexOf(sel)));
    const names = (sel: string) => [...body(sel).matchAll(/(--pinfold-[\w-]+):/g)].map((m) => m[1]).sort();
    expect(names('[data-pinfold-theme="light"] {')).toEqual(names('[data-pinfold-theme="dark"] {'));
    expect(names('[data-pinfold-theme="light"] {')).toContain('--pinfold-color-surface-hover');
    expect(names('[data-pinfold-theme="light"] {')).toContain('--pinfold-focus-ring');
  });

  it('follows the palette: every colour is mixed from palette tokens (white highlights aside)', () => {
    expect(css).not.toMatch(/#[0-9a-f]{3,8}\b|rgba?\(|hsla?\(/i);
    for (const [, args] of css.matchAll(/oklch\(([^)]*)\)/g)) expect(args).toBe('1 0 0');
    expect(css).toMatch(/\[data-pinfold-style='glass'\][^}]*var\(--pinfold-color-accent\)/);
    expect(css).toMatch(/\[data-pinfold-style='material'\][^}]*var\(--pinfold-color-accent\)/);
    expect(css).toMatch(/\[data-pinfold-style='brutalist'\][^}]*var\(--pinfold-color-accent\)/);
  });

  it('never re-colours text, so text contrast is the palette contrast', () => {
    expect(css).not.toMatch(/--pinfold-color-text[\w-]*:/);
  });

  for (const [name, m] of Object.entries(mode)) {
    it(`keeps body text at AA on glass over any backdrop (${name})`, () => {
      // Every translucent glass surface (opacity read from the CSS) over white, black and the brand colour.
      const glass = css.slice(css.indexOf("[data-pinfold-style='glass']"), css.indexOf('material'));
      const alphas = [...glass.matchAll(/var\(--pinfold-color-bg\)\) (\d+)%/g)].map((x) => Number(x[1]) / 100);
      expect(alphas.length).toBeGreaterThan(0);
      for (const alpha of alphas) {
        for (const backdrop of ['#ffffff', '#000000', n['--pinfold-primary-500']]) {
          // The pane is tinted with the brand colour (up to 10%) before it turns translucent.
          const surface = blend(blend(n['--pinfold-primary-500'], 0.1, m.bg), alpha, backdrop);
          expect(contrastRatio(m.text, surface), `${alpha} glass over ${backdrop}`).toBeGreaterThanOrEqual(4.5);
        }
      }
      expect(contrastRatio(m.muted, m.surface)).toBeGreaterThanOrEqual(4.5);
    });

    it(`keeps meaningful borders at 3:1 (${name})`, () => {
      // brutalist draws borders in the text colour.
      expect(contrastRatio(m.text, m.surface)).toBeGreaterThanOrEqual(3);
    });
  }
});
