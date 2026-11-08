/* Colour parsing, conversion and formatting for the colour picker. Channels are 0–1, hue 0–360.
   sRGB is the working space (what a screen shows and what hex holds); OKLCH comes in and goes out
   through the palette engine's matrices. */

import { oklchToRgb } from './oklab';

export interface Rgba {
  r: number;
  g: number;
  b: number;
  a: number;
}
export interface Hsva {
  h: number;
  s: number;
  v: number;
  a: number;
}
export type ColorFormat = 'hex' | 'rgb' | 'hsl' | 'oklch';

const clamp01 = (n: number) => (n < 0 ? 0 : n > 1 ? 1 : n);
const round = (n: number, places = 0) => Math.round(n * 10 ** places) / 10 ** places;
const toLinear = (c: number) => (c <= 0.04045 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4);
const toGamma = (c: number) => (c <= 0.0031308 ? 12.92 * c : 1.055 * c ** (1 / 2.4) - 0.055);

/** A number, a percentage (of `scale`), or NaN. */
function num(token: string | undefined, scale = 1): number {
  if (token === undefined) return NaN;
  const t = token.trim();
  if (t.endsWith('%')) return (parseFloat(t) / 100) * scale;
  if (t.endsWith('deg')) return parseFloat(t);
  return /^-?[\d.]+(e-?\d+)?$/i.test(t) ? parseFloat(t) : NaN;
}

/** Any of `#rgb`, `#rgba`, `#rrggbb`, `#rrggbbaa`, `rgb()`, `hsl()` or `oklch()` (old and new syntax); null otherwise. */
export function parseColor(input: string | null | undefined): Rgba | null {
  if (typeof input !== 'string') return null;
  const s = input.trim().toLowerCase();
  const hex = /^#?([0-9a-f]{3,4}|[0-9a-f]{6}|[0-9a-f]{8})$/.exec(s);
  if (hex) {
    let h = hex[1];
    if (h.length <= 4) h = h.split('').map((c) => c + c).join('');
    const n = (i: number) => parseInt(h.slice(i, i + 2), 16) / 255;
    return { r: n(0), g: n(2), b: n(4), a: h.length === 8 ? round(n(6), 3) : 1 };
  }
  const fn = /^(rgba?|hsla?|oklch)\((.*)\)$/.exec(s);
  if (!fn) return null;
  const parts = fn[2].split(/[\s,/]+/).filter(Boolean);
  if (parts.length < 3 || parts.length > 4) return null;
  const alpha = parts[3] === undefined ? 1 : num(parts[3]);
  let rgb: [number, number, number];
  if (fn[1].startsWith('rgb')) {
    rgb = [num(parts[0], 255) / 255, num(parts[1], 255) / 255, num(parts[2], 255) / 255];
  } else if (fn[1].startsWith('hsl')) {
    const h = num(parts[0]);
    const sat = num(parts[1], 1);
    const l = num(parts[2], 1);
    const v = l + sat * Math.min(l, 1 - l);
    rgb = hsvToRgb({ h, s: v === 0 ? 0 : 2 * (1 - l / v), v, a: 1 });
  } else {
    rgb = oklchToRgb(num(parts[0], 1), num(parts[1], 0.4), num(parts[2])).map((c) => toGamma(clamp01(c))) as [number, number, number];
  }
  if ([...rgb, alpha].some((n) => !Number.isFinite(n))) return null;
  return { r: clamp01(rgb[0]), g: clamp01(rgb[1]), b: clamp01(rgb[2]), a: clamp01(alpha) };
}

export function rgbToHsv({ r, g, b, a }: Rgba): Hsva {
  const max = Math.max(r, g, b);
  const d = max - Math.min(r, g, b);
  let h = 0;
  if (d) h = max === r ? ((g - b) / d) % 6 : max === g ? (b - r) / d + 2 : (r - g) / d + 4;
  return { h: (h * 60 + 360) % 360, s: max ? d / max : 0, v: max, a };
}

export function hsvToRgb({ h, s, v }: Hsva): [number, number, number] {
  const f = (n: number) => {
    const k = (n + h / 60) % 6;
    return v - v * s * Math.max(0, Math.min(k, 4 - k, 1));
  };
  return [f(5), f(3), f(1)];
}

/** A colour as text in the given format; alpha is written only when below 1. */
export function formatColor(c: Rgba, format: ColorFormat = 'hex'): string {
  const a = round(c.a, 2);
  const byte = (n: number) => Math.round(clamp01(n) * 255);
  if (format === 'rgb') return `rgb(${byte(c.r)} ${byte(c.g)} ${byte(c.b)}${a < 1 ? ` / ${a}` : ''})`;
  if (format === 'hsl') {
    const { h, s, v } = rgbToHsv(c);
    const l = v * (1 - s / 2);
    const sl = l === 0 || l === 1 ? 0 : (v - l) / Math.min(l, 1 - l);
    return `hsl(${round(h)} ${round(sl * 100)}% ${round(l * 100)}%${a < 1 ? ` / ${a}` : ''})`;
  }
  if (format === 'oklch') {
    const [r, g, b] = [c.r, c.g, c.b].map(toLinear);
    const l = Math.cbrt(0.4122214708 * r + 0.5363325363 * g + 0.0514459929 * b);
    const m = Math.cbrt(0.2119034982 * r + 0.6806995451 * g + 0.1073969566 * b);
    const s = Math.cbrt(0.0883024619 * r + 0.2817188376 * g + 0.6299787005 * b);
    const L = 0.2104542553 * l + 0.793617785 * m - 0.0040720468 * s;
    const A = 1.9779984951 * l - 2.428592205 * m + 0.4505937099 * s;
    const B = 0.0259040371 * l + 0.7827717662 * m - 0.808675766 * s;
    const C = Math.hypot(A, B);
    // A grey has no hue: write 0 rather than noise.
    const H = C < 0.0005 ? 0 : (Math.atan2(B, A) * 180) / Math.PI;
    return `oklch(${round(L * 100, 1)}% ${round(C, 3)} ${round((H + 360) % 360, 1)}${a < 1 ? ` / ${a}` : ''})`;
  }
  const hex = '#' + [c.r, c.g, c.b].map((n) => byte(n).toString(16).padStart(2, '0')).join('');
  return a < 1 ? hex + byte(a).toString(16).padStart(2, '0') : hex;
}

export const hsvToRgba = (c: Hsva): Rgba => {
  const [r, g, b] = hsvToRgb(c);
  return { r, g, b, a: c.a };
};

/** Every option shows: the format is the text field's and the value's. */
export function inactiveColorPickerOptions(_config: object): Record<string, string> {
  return {};
}
