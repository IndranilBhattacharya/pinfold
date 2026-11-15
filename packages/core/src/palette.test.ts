import { describe, expect, it } from 'vitest';
import { contrastRatio, createTheme, luminance, oklchToHex, resolveHue, roleFromColor } from './palette';
import { parseColor } from './color.logic';

describe('palette engine', () => {
  it('converts OKLCH to sRGB hex', () => {
    // Pure white and pure black are the two fixed points of the transform.
    expect(oklchToHex(1, 0, 0)).toBe('#ffffff');
    expect(oklchToHex(0, 0, 0)).toBe('#000000');
    expect(oklchToHex(0.606, 0.201, 274)).toMatch(/^#[0-9a-f]{6}$/);
  });

  it('gamut maps out-of-range chroma instead of clipping to garbage', () => {
    // Chroma 0.4 at this lightness is far outside sRGB; the result must still
    // be a valid, saturated colour rather than a clamped mess.
    const mapped = oklchToHex(0.6, 0.4, 145);
    const sane = oklchToHex(0.6, 0.15, 145);
    expect(mapped).toMatch(/^#[0-9a-f]{6}$/);
    expect(Math.abs(luminance(mapped) - luminance(sane))).toBeLessThan(0.35);
  });

  it('computes WCAG contrast', () => {
    expect(Math.round(contrastRatio('#000000', '#ffffff'))).toBe(21);
    expect(Math.round(contrastRatio('#ffffff', '#ffffff'))).toBe(1);
  });

  it('resolves named and numeric hues', () => {
    expect(resolveHue('emerald', 0)).toBe(158);
    expect(resolveHue(400, 0)).toBe(40);
    expect(resolveHue(undefined, 274)).toBe(274);
  });

  it('builds a full theme with hex vars, OKLCH css and a contrast report', () => {
    const theme = createTheme({ primary: 'emerald', radius: 'lg' });

    expect(theme.vars['--pinfold-primary-500']).toMatch(/^#[0-9a-f]{6}$/);
    expect(theme.vars['--pinfold-radius-scale']).toBe('1.5');
    expect(theme.css).toContain('@supports (color: oklch(');
    expect(theme.css).toContain('--pinfold-neutral-950');
    expect(theme.contrast.length).toBeGreaterThan(0);
    expect(theme.contrast.every((c) => c.ratio >= 1 && c.ratio <= 21)).toBe(true);
  });

  it('derives neutrals from the brand hue unless told otherwise', () => {
    const tinted = createTheme({ primary: 'rose' });
    const explicit = createTheme({ primary: 'rose', neutral: { hue: 264 } });
    expect(tinted.ramps.neutral[500]).not.toBe(explicit.ramps.neutral[500]);
  });
});

describe('toDTCG', () => {
  it('exports every ramp step as a DTCG colour token', async () => {
    const { createTheme, toDTCG } = await import('./palette');
    const tokens = toDTCG(createTheme({ primary: 'emerald', radius: 'lg' })) as any;
    const token = tokens.pinfold.color.primary['500'];
    expect(token.$type).toBe('color');
    expect(token.$value.colorSpace).toBe('srgb');
    expect(token.$value.hex).toMatch(/^#[0-9a-f]{6}$/);
    expect(token.$value.components).toHaveLength(3);
    expect(Object.keys(tokens.pinfold.color)).toEqual(['primary', 'accent', 'neutral', 'success', 'warning', 'danger', 'info']);
    expect(tokens.pinfold.radius.scale.$value).toBe(1.5);
  });
});

describe('palette: your own colours', () => {
  const channelGap = (a: string, b: string) => {
    const x = parseColor(a)!, y = parseColor(b)!;
    return Math.max(Math.abs(x.r - y.r), Math.abs(x.g - y.g), Math.abs(x.b - y.b)) * 255;
  };

  it('a role takes any CSS colour; the nearest step is that colour, the rest follow the curve', () => {
    for (const color of ['#4f46e5', 'rgb(234 88 12)', 'hsl(160 84% 39%)', 'oklch(0.62 0.19 300)']) {
      const theme = createTheme({ primary: color });
      const anchor = theme.anchors.primary!;
      expect(anchor).toBeDefined();
      // Exact, unless it is the solid fill and had to move for its text (then the anchor says so).
      if (anchor.step !== 600 && anchor.step !== 400) expect(channelGap(anchor.color, color)).toBeLessThanOrEqual(2);
      expect(theme.vars[`--pinfold-primary-${anchor.step}`]).toBe(anchor.color);
      // Steps still run light to dark.
      const L = [50, 300, 600, 950].map((s) => luminance(theme.vars[`--pinfold-primary-${s}`]));
      expect(L).toEqual([...L].sort((a, b) => b - a));
    }
    // Hue names and numbers still work; a word that is neither falls back.
    expect(createTheme({ primary: 'emerald' }).anchors).toEqual({});
    expect(createTheme({ primary: 145 }).vars['--pinfold-primary-500']).toBe(createTheme({ primary: '145' }).vars['--pinfold-primary-500']);
    expect(roleFromColor('not a colour')).toBeNull();
    expect(roleFromColor('#808080')!.role.intensity).toBeLessThan(0.01);
  });

  it('text on solid fills: black or white, whichever reads, for yellow, near black, near white, grey and neon green', () => {
    for (const color of ['#facc15', '#111111', '#f5f5f5', '#808080', '#39ff14']) {
      const theme = createTheme({ primary: color });
      for (const [fill, on] of [['600', 'light'], ['400', 'dark']] as const) {
        const bg = theme.vars[`--pinfold-primary-${fill}`];
        const text = theme.vars[`--pinfold-accent-on-${on}`];
        const other = text === '#ffffff' ? theme.vars['--pinfold-neutral-950'] : '#ffffff';
        // The better of the two, at 5:1 or more: a fill where neither reaches it moves until one does.
        expect(contrastRatio(bg, text)).toBeGreaterThanOrEqual(contrastRatio(bg, other));
        expect(contrastRatio(bg, text)).toBeGreaterThanOrEqual(5);
      }
    }
    // A yellow brand fills its light-mode buttons with a dark yellow: white was fixed before; now the pick is measured.
    const yellow = createTheme({ primary: '#facc15' });
    expect(yellow.vars['--pinfold-accent-on-dark']).toBe(yellow.vars['--pinfold-neutral-950']);
  });

  it('status roles reach components: only the ones you set, with their own light and dark colour and text', () => {
    const plain = createTheme({ primary: 'violet' });
    expect(plain.vars['--pinfold-success-light']).toBeUndefined();
    const theme = createTheme({ primary: 'violet', success: '#16a34a', warning: '#facc15' });
    expect(theme.vars['--pinfold-success-light']).toBe(theme.vars['--pinfold-success-600']);
    expect(theme.vars['--pinfold-success-dark']).toBe(theme.vars['--pinfold-success-300']);
    for (const role of ['success', 'warning'])
      for (const mode of ['light', 'dark'])
        expect(contrastRatio(theme.vars[`--pinfold-${role}-${mode}`], theme.vars[`--pinfold-${role}-on-${mode}`])).toBeGreaterThanOrEqual(5);
    // A grey brand keeps the tuned neutral hue.
    expect(createTheme({ primary: '#808080' }).vars['--pinfold-neutral-500']).toBe(createTheme({ primary: 'violet', neutral: 'slate' }).vars['--pinfold-neutral-500']);
    expect(theme.vars['--pinfold-danger-light']).toBeUndefined();
    expect(theme.vars['--pinfold-warning-on-dark']).toBe(theme.vars['--pinfold-neutral-950']);
    expect(theme.css).toContain('--pinfold-success-light:');
  });

  it('tokens.css reads those values in both modes and keeps its tuned defaults without them', async () => {
    const { readFileSync } = await import('node:fs');
    const { join } = await import('node:path');
    const css = readFileSync(join(__dirname, '../../css/src/tokens.css'), 'utf8');
    for (const role of ['success', 'warning', 'danger', 'info']) {
      expect(css.split(`--pinfold-color-${role}: var(--pinfold-${role}-light, oklch(`).length - 1).toBe(2);
      expect(css.split(`--pinfold-color-${role}: var(--pinfold-${role}-dark, oklch(`).length - 1).toBe(2);
      expect(css).toContain(`--pinfold-tone-on: var(--pinfold-${role}-on, var(--pinfold-color-status-contrast));`);
    }
    expect(css.split('var(--pinfold-accent-on-light, oklch(1 0 0))').length - 1).toBe(2);
    expect(css.split('var(--pinfold-accent-on-dark, var(--pinfold-neutral-950))').length - 1).toBe(2);
  });
});
