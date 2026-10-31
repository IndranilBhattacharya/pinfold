/**
 * Lumae — Tailwind CSS v3 preset.
 *
 *   // tailwind.config.js
 *   module.exports = { presets: [require('@lumae/css/tailwind')] };
 *
 * Every entry points at a `--lumae-*` custom property rather than a literal, so
 * `bg-primary-600` follows `npx lumae theme`, dark mode and any runtime
 * override automatically. One palette, two styling systems, no duplication.
 *
 * For Tailwind v4, import `@lumae/css/tailwind.css` instead.
 */

const ramp = (role) =>
  Object.fromEntries(
    [50, 100, 200, 300, 400, 500, 600, 700, 800, 900, 950].map((step) => [
      step,
      `var(--lumae-${role}-${step})`,
    ]),
  );

/** Status ramps ship five steps, not eleven. */
const statusRamp = (role) =>
  Object.fromEntries([100, 300, 500, 700, 900].map((s) => [s, `var(--lumae-${role}-${s})`]));

module.exports = {
  theme: {
    extend: {
      colors: {
        primary: ramp('primary'),
        neutral: ramp('neutral'),
        accent: {
          300: 'var(--lumae-accent-300)',
          400: 'var(--lumae-accent-400)',
          500: 'var(--lumae-accent-500)',
          600: 'var(--lumae-accent-600)',
          700: 'var(--lumae-accent-700)',
          DEFAULT: 'var(--lumae-color-accent)',
        },
        success: statusRamp('success'),
        warning: statusRamp('warning'),
        danger: statusRamp('danger'),
        info: statusRamp('info'),

        // Semantic aliases: `bg-surface`, `text-content-muted`, `border-line`.
        bg: { DEFAULT: 'var(--lumae-color-bg)', subtle: 'var(--lumae-color-bg-subtle)' },
        surface: {
          DEFAULT: 'var(--lumae-color-surface)',
          raised: 'var(--lumae-color-surface-raised)',
          sunken: 'var(--lumae-color-surface-sunken)',
          hover: 'var(--lumae-color-surface-hover)',
          active: 'var(--lumae-color-surface-active)',
          selected: 'var(--lumae-color-surface-selected)',
        },
        content: {
          DEFAULT: 'var(--lumae-color-text)',
          muted: 'var(--lumae-color-text-muted)',
          subtle: 'var(--lumae-color-text-subtle)',
          disabled: 'var(--lumae-color-text-disabled)',
        },
        line: {
          DEFAULT: 'var(--lumae-color-border)',
          strong: 'var(--lumae-color-border-strong)',
          accent: 'var(--lumae-color-border-accent)',
        },
      },

      borderRadius: {
        xs: 'var(--lumae-radius-xs)',
        sm: 'var(--lumae-radius-sm)',
        DEFAULT: 'var(--lumae-radius-md)',
        md: 'var(--lumae-radius-md)',
        lg: 'var(--lumae-radius-lg)',
        xl: 'var(--lumae-radius-xl)',
        '2xl': 'var(--lumae-radius-2xl)',
      },

      spacing: Object.fromEntries(
        [1, 2, 3, 4, 5, 6, 8, 10].map((n) => [n, `var(--lumae-space-${n})`]),
      ),

      fontFamily: {
        sans: 'var(--lumae-font-sans)',
        mono: 'var(--lumae-font-mono)',
      },

      fontSize: {
        xs: 'var(--lumae-text-xs)',
        sm: 'var(--lumae-text-sm)',
        base: 'var(--lumae-text-md)',
        lg: 'var(--lumae-text-lg)',
        xl: 'var(--lumae-text-xl)',
      },

      boxShadow: {
        xs: 'var(--lumae-shadow-xs)',
        sm: 'var(--lumae-shadow-sm)',
        DEFAULT: 'var(--lumae-shadow-sm)',
        md: 'var(--lumae-shadow-md)',
        lg: 'var(--lumae-shadow-lg)',
        xl: 'var(--lumae-shadow-xl)',
        highlight: 'var(--lumae-highlight)',
        focus: 'var(--lumae-focus-ring)',
      },

      transitionTimingFunction: {
        lumae: 'var(--lumae-ease)',
        'lumae-out': 'var(--lumae-ease-out)',
        'lumae-in-out': 'var(--lumae-ease-in-out)',
        'lumae-spring': 'var(--lumae-ease-spring)',
      },

      transitionDuration: {
        fast: 'var(--lumae-duration-fast)',
        DEFAULT: 'var(--lumae-duration-md)',
        slow: 'var(--lumae-duration-slow)',
      },

      zIndex: {
        dropdown: 'var(--lumae-z-dropdown)',
        sticky: 'var(--lumae-z-sticky)',
        overlay: 'var(--lumae-z-overlay)',
        modal: 'var(--lumae-z-modal)',
        toast: 'var(--lumae-z-toast)',
        tooltip: 'var(--lumae-z-tooltip)',
      },
    },
  },

  plugins: [
    /**
     * Variants for the `data-*` state Lumae components already expose, so a
     * Tailwind-styled accordion needs no class toggling of its own:
     *
     *   <Faq classNames={{ trigger: 'open:text-primary-600 disabled-row:opacity-50' }} />
     */
    function lumaeVariants({ addVariant }) {
      addVariant('open', '&[data-state="open"]');
      addVariant('closed', '&[data-state="closed"]');
      addVariant('selected', '&[data-state="selected"]');
      addVariant('disabled-row', '&[data-disabled]');
      addVariant('group-open', ':merge(.group)[data-state="open"] &');
      addVariant('lumae-dark', ':is([data-lumae-theme="dark"] &)');
    },
  ],
};
