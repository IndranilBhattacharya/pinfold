/**
 * Pinfold palette engine.
 *
 * Deliberately React-free and dependency-free so the CLI, the build and the
 * runtime all share one implementation instead of three that drift. Imported
 * as `@pinfold/core/palette`.
 *
 * Colours are authored in OKLCH — perceptually uniform, so a single hue
 * rotation produces a ramp with even steps instead of the muddy middles you get
 * rotating HSL. Every value is also emitted as an sRGB hex fallback, gamut
 * mapped by reducing chroma, so browsers without OKLCH still get the right
 * colour rather than a broken one.
 */

/* ------------------------------------------------------------------ types */

export type Ramp = Record<RampStep, string>;
export type RampStep = 50 | 100 | 200 | 300 | 400 | 500 | 600 | 700 | 800 | 900 | 950;

export type PaletteRole = 'primary' | 'accent' | 'neutral' | 'success' | 'warning' | 'danger' | 'info';

export interface RoleConfig {
  /** OKLCH hue, 0–360. */
  hue: number;
  /** Chroma multiplier. 1 is the tuned default; 0 is grey. */
  intensity?: number;
  /** Shift every step lighter (+) or darker (−). Range roughly −0.05…0.05. */
  lightness?: number;
}

/** A hue angle, a built-in hue name, or a full role config. */
export type HueValue = number | HueName | (string & {}) | RoleConfig;

export interface PaletteConfig {
  primary: HueValue;
  accent?: HueValue;
  neutral?: HueValue;
  success?: HueValue;
  warning?: HueValue;
  danger?: HueValue;
  info?: HueValue;
  /** Global chroma multiplier applied on top of each role. Default 1. */
  intensity?: number;
  /** Corner radius preset written alongside the palette. */
  radius?: 'none' | 'sm' | 'md' | 'lg' | 'full';
}

export interface ContrastCheck {
  role: PaletteRole;
  step: RampStep;
  against: 'light-surface' | 'dark-surface';
  ratio: number;
  /** WCAG 2.2: 4.5 for body text, 3 for large text and UI boundaries. */
  passes: { text: boolean; largeText: boolean; ui: boolean };
}

export interface Theme {
  config: Required<Pick<PaletteConfig, 'primary'>> & PaletteConfig;
  ramps: Record<PaletteRole, Ramp>;
  /** Custom-property map, hex values — safe to spread into a `style` prop. */
  vars: Record<string, string>;
  /** Full stylesheet: hex first, OKLCH upgraded behind `@supports`. */
  css: string;
  contrast: ContrastCheck[];
}

/* ------------------------------------------------------------------ ramps */

/** Lightness/chroma curve, tuned once for perceptually even steps. */
const CURVE: Array<[RampStep, number, number]> = [
  [50, 0.977, 0.014],
  [100, 0.946, 0.033],
  [200, 0.902, 0.063],
  [300, 0.828, 0.111],
  [400, 0.714, 0.163],
  [500, 0.606, 0.201],
  [600, 0.541, 0.223],
  [700, 0.491, 0.216],
  [800, 0.432, 0.181],
  [900, 0.38, 0.146],
  [950, 0.283, 0.101],
];

/** Neutrals carry a whisper of the brand hue so greys never look dead. */
const NEUTRAL_CURVE: Array<[RampStep, number, number]> = [
  [50, 0.985, 0.002],
  [100, 0.967, 0.003],
  [200, 0.928, 0.006],
  [300, 0.872, 0.01],
  [400, 0.707, 0.015],
  [500, 0.551, 0.019],
  [600, 0.446, 0.021],
  [700, 0.373, 0.023],
  [800, 0.279, 0.023],
  [900, 0.21, 0.021],
  [950, 0.145, 0.017],
];

/** Named hues. Values are OKLCH hue angles, not HSL — they will not match Tailwind. */
export const HUES = {
  red: 27,
  rose: 15,
  pink: 350,
  fuchsia: 320,
  purple: 300,
  violet: 274,
  indigo: 268,
  blue: 245,
  sky: 225,
  cyan: 210,
  teal: 185,
  emerald: 158,
  green: 145,
  lime: 125,
  yellow: 100,
  amber: 78,
  orange: 55,
  brown: 40,
  slate: 264,
} as const;

export type HueName = keyof typeof HUES;

/** Sensible defaults per role, so `{ primary: 'violet' }` is a complete config. */
const ROLE_DEFAULTS: Record<Exclude<PaletteRole, 'primary' | 'accent'>, RoleConfig> = {
  neutral: { hue: HUES.slate, intensity: 1 },
  success: { hue: HUES.emerald, intensity: 1 },
  warning: { hue: HUES.amber, intensity: 1 },
  danger: { hue: HUES.red, intensity: 1 },
  info: { hue: HUES.blue, intensity: 1 },
};

export function resolveHue(value: number | string | undefined, fallback: number): number {
  if (value == null) return fallback;
  if (typeof value === 'number') return ((value % 360) + 360) % 360;
  const named = (HUES as Record<string, number>)[value];
  if (named != null) return named;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? ((parsed % 360) + 360) % 360 : fallback;
}

function toRole(value: HueValue | undefined, fallback: RoleConfig): RoleConfig {
  if (value == null) return fallback;
  if (typeof value === 'number' || typeof value === 'string')
    return { ...fallback, hue: resolveHue(value, fallback.hue) };
  return { ...fallback, ...value, hue: resolveHue(value.hue, fallback.hue) };
}

/** Build one ramp. Returned values are OKLCH strings. */
export function buildRamp(role: RoleConfig, neutral = false, globalIntensity = 1): Ramp {
  const curve = neutral ? NEUTRAL_CURVE : CURVE;
  const intensity = (role.intensity ?? 1) * globalIntensity;
  const shift = role.lightness ?? 0;
  const out = {} as Ramp;
  for (const [step, l, c] of curve) {
    const L = clamp(l + shift, 0, 1);
    out[step] = `oklch(${round(L, 3)} ${round(c * intensity, 4)} ${round(role.hue, 2)})`;
  }
  return out;
}

/* ---------------------------------------------------- OKLCH → sRGB → hex */

/** OKLCH to sRGB hex, gamut mapped by reducing chroma until it fits. */
export function oklchToHex(L: number, C: number, H: number): string {
  let lo = 0;
  let hi = C;
  let rgb = oklchToRgb(L, C, H);
  if (!inGamut(rgb)) {
    // 16 bisection steps put the error well below one 8-bit level.
    for (let i = 0; i < 16; i++) {
      const mid = (lo + hi) / 2;
      const candidate = oklchToRgb(L, mid, H);
      if (inGamut(candidate)) lo = mid;
      else hi = mid;
    }
    rgb = oklchToRgb(L, lo, H);
  }
  return '#' + rgb.map((v) => channelToHex(v)).join('');
}

function oklchToRgb(L: number, C: number, H: number): [number, number, number] {
  const h = (H * Math.PI) / 180;
  const a = C * Math.cos(h);
  const b = C * Math.sin(h);

  const l_ = L + 0.3963377774 * a + 0.2158037573 * b;
  const m_ = L - 0.1055613458 * a - 0.0638541728 * b;
  const s_ = L - 0.0894841775 * a - 1.291485548 * b;

  const l = l_ * l_ * l_;
  const m = m_ * m_ * m_;
  const s = s_ * s_ * s_;

  return [
    4.0767416621 * l - 3.3077115913 * m + 0.2309699292 * s,
    -1.2684380046 * l + 2.6097574011 * m - 0.3413193965 * s,
    -0.0041960863 * l - 0.7034186147 * m + 1.707614701 * s,
  ];
}

const inGamut = (rgb: number[]) => rgb.every((v) => v >= -0.0001 && v <= 1.0001);

const gamma = (v: number) => (v <= 0.0031308 ? 12.92 * v : 1.055 * Math.pow(v, 1 / 2.4) - 0.055);

function channelToHex(linear: number): string {
  const v = Math.round(clamp(gamma(clamp(linear, 0, 1)), 0, 1) * 255);
  return v.toString(16).padStart(2, '0');
}

/* --------------------------------------------------------------- contrast */

/** WCAG 2.2 relative luminance of a hex colour. */
export function luminance(hex: string): number {
  const [r, g, b] = hexToRgb(hex).map((v) => {
    const c = v / 255;
    return c <= 0.04045 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
  });
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

/** WCAG 2.2 contrast ratio, 1–21. */
export function contrastRatio(a: string, b: string): number {
  const la = luminance(a);
  const lb = luminance(b);
  return (Math.max(la, lb) + 0.05) / (Math.min(la, lb) + 0.05);
}

function hexToRgb(hex: string): [number, number, number] {
  const h = hex.replace('#', '');
  const full = h.length === 3 ? h.split('').map((c) => c + c).join('') : h;
  return [
    parseInt(full.slice(0, 2), 16),
    parseInt(full.slice(2, 4), 16),
    parseInt(full.slice(4, 6), 16),
  ];
}

/* ------------------------------------------------------------------ theme */

const LIGHT_SURFACE = '#ffffff';
const DARK_SURFACE = '#111318';

/**
 * Turn a palette config into ramps, custom properties, a stylesheet and a
 * contrast report. Pure — safe in Node, the browser, or a build step.
 */
export function createTheme(config: PaletteConfig): Theme {
  const globalIntensity = config.intensity ?? 1;
  const primary = toRole(config.primary, { hue: HUES.violet, intensity: 1 });
  const accent = toRole(config.accent, primary);
  const neutral = toRole(config.neutral, { ...ROLE_DEFAULTS.neutral, hue: primary.hue });

  const roles: Record<PaletteRole, { role: RoleConfig; neutral: boolean }> = {
    primary: { role: primary, neutral: false },
    accent: { role: accent, neutral: false },
    neutral: { role: neutral, neutral: true },
    success: { role: toRole(config.success, ROLE_DEFAULTS.success), neutral: false },
    warning: { role: toRole(config.warning, ROLE_DEFAULTS.warning), neutral: false },
    danger: { role: toRole(config.danger, ROLE_DEFAULTS.danger), neutral: false },
    info: { role: toRole(config.info, ROLE_DEFAULTS.info), neutral: false },
  };

  const ramps = {} as Record<PaletteRole, Ramp>;
  const vars: Record<string, string> = {};
  const oklchVars: Record<string, string> = {};
  const contrast: ContrastCheck[] = [];

  for (const name of Object.keys(roles) as PaletteRole[]) {
    const { role, neutral: isNeutral } = roles[name];
    ramps[name] = buildRamp(role, isNeutral, globalIntensity);

    const curve = isNeutral ? NEUTRAL_CURVE : CURVE;
    const intensity = (role.intensity ?? 1) * globalIntensity;
    for (const [step, l, c] of curve) {
      const L = clamp(l + (role.lightness ?? 0), 0, 1);
      const hex = oklchToHex(L, c * intensity, role.hue);
      vars[`--pinfold-${name}-${step}`] = hex;
      oklchVars[`--pinfold-${name}-${step}`] = ramps[name][step];

      if (step === 500 || step === 600 || step === 400) {
        contrast.push(check(name, step, hex, LIGHT_SURFACE, 'light-surface'));
        contrast.push(check(name, step, hex, DARK_SURFACE, 'dark-surface'));
      }
    }
  }

  if (config.radius) {
    const scale = { none: 0, sm: 0.6, md: 1, lg: 1.5, full: 2.4 }[config.radius];
    vars['--pinfold-radius-scale'] = String(scale);
    oklchVars['--pinfold-radius-scale'] = String(scale);
  }

  return { config, ramps, vars, contrast, css: toCss(vars, oklchVars) };
}

function check(
  role: PaletteRole,
  step: RampStep,
  hex: string,
  surface: string,
  against: ContrastCheck['against'],
): ContrastCheck {
  const ratio = Math.round(contrastRatio(hex, surface) * 100) / 100;
  return {
    role,
    step,
    against,
    ratio,
    passes: { text: ratio >= 4.5, largeText: ratio >= 3, ui: ratio >= 3 },
  };
}

function toCss(hex: Record<string, string>, oklch: Record<string, string>): string {
  const block = (map: Record<string, string>, indent: string) =>
    Object.entries(map)
      .map(([k, v]) => `${indent}${k}: ${v};`)
      .join('\n');

  return [
    '/* Generated by @pinfold/core createTheme(). Safe to edit; regenerating overwrites it.',
    '   Import AFTER @pinfold/css/core.css so these win.',
    '   sRGB hex first for reach, OKLCH behind @supports for fidelity. */',
    ':root {',
    block(hex, '  '),
    '}',
    '',
    '@supports (color: oklch(0.5 0.1 250)) {',
    '  :root {',
    block(oklch, '    '),
    '  }',
    '}',
    '',
  ].join('\n');
}

const clamp = (v: number, lo: number, hi: number) => (v < lo ? lo : v > hi ? hi : v);
const round = (v: number, p: number) => Math.round(v * 10 ** p) / 10 ** p;
