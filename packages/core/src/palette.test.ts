import { describe, expect, it } from 'vitest';
import { contrastRatio, createTheme, luminance, oklchToHex, resolveHue } from './palette';

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
