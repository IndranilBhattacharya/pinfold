// @vitest-environment node
import { describe, expect, it } from 'vitest';
import { formatColor, hsvToRgba, parseColor, rgbToHsv } from './color.logic';

describe('colour', () => {
  it('parses hex, rgb, hsl and oklch, old and new syntax; rejects the rest', () => {
    expect(formatColor(parseColor('#36c')!)).toBe('#3366cc');
    expect(formatColor(parseColor('3366CC80')!)).toBe('#3366cc80');
    expect(formatColor(parseColor('rgb(51, 102, 204)')!)).toBe('#3366cc');
    expect(formatColor(parseColor('rgb(51 102 204 / 50%)')!)).toBe('#3366cc80');
    expect(formatColor(parseColor('hsl(220 60% 50%)')!)).toBe('#3366cc');
    expect(formatColor(parseColor('hsla(220, 60%, 50%, 0.5)')!)).toBe('#3366cc80');
    expect(formatColor(parseColor('oklch(62.8% 0.2577 29.23)')!)).toBe('#ff0000');
    for (const bad of ['', 'blue', '#12', 'rgb(1, 2)', 'hsl(a b c)', null, undefined]) expect(parseColor(bad as string)).toBeNull();
  });

  it('formats in every format; alpha only below 1', () => {
    const c = parseColor('#3366cc')!;
    expect(formatColor(c, 'rgb')).toBe('rgb(51 102 204)');
    expect(formatColor(c, 'hsl')).toBe('hsl(220 60% 50%)');
    expect(formatColor({ ...c, a: 0.5 }, 'rgb')).toBe('rgb(51 102 204 / 0.5)');
    expect(formatColor(parseColor('#ff0000')!, 'oklch')).toBe('oklch(62.8% 0.258 29.2)');
    expect(formatColor(parseColor('#808080')!, 'oklch')).toMatch(/^oklch\([\d.]+% 0 0\)$/);
  });

  it('HSV round-trips every hex (sampled)', () => {
    for (let i = 0; i < 4096; i += 37) {
      const hex = '#' + [i >> 8, (i >> 4) & 15, i & 15].map((n) => (n * 17).toString(16).padStart(2, '0')).join('');
      expect(formatColor(hsvToRgba(rgbToHsv(parseColor(hex)!)))).toBe(hex);
    }
  });
});
