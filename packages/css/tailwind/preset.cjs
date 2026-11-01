/**
 * Pinfold — Tailwind CSS v3 preset.
 *
 *   // tailwind.config.js
 *   module.exports = { presets: [require('@pinfold/css/tailwind')] };
 *
 * Every entry points at a `--pinfold-*` custom property rather than a literal, so
 * `bg-primary-600` follows `npx pinfold theme`, dark mode and any runtime
 * override automatically. One palette, two styling systems, no duplication.
 *
 * For Tailwind v4, import `@pinfold/css/tailwind.css` instead.
 */

const ramp = (role) =>
  Object.fromEntries(
    [50, 100, 200, 300, 400, 500, 600, 700, 800, 900, 950].map((step) => [
      step,
      `var(--pinfold-${role}-${step})`,
    ]),
  );

/** Status ramps ship five steps, not eleven. */
const statusRamp = (role) =>
  Object.fromEntries([100, 300, 500, 700, 900].map((s) => [s, `var(--pinfold-${role}-${s})`]));

module.exports = {
  theme: {
    extend: {
      colors: {
        primary: ramp('primary'),
        neutral: ramp('neutral'),
        accent: {
          300: 'var(--pinfold-accent-300)',
          400: 'var(--pinfold-accent-400)',
          500: 'var(--pinfold-accent-500)',
          600: 'var(--pinfold-accent-600)',
          700: 'var(--pinfold-accent-700)',
          DEFAULT: 'var(--pinfold-color-accent)',
        },
        success: statusRamp('success'),
        warning: statusRamp('warning'),
        danger: statusRamp('danger'),
        info: statusRamp('info'),

        // Semantic aliases: `bg-surface`, `text-content-muted`, `border-line`.
        bg: { DEFAULT: 'var(--pinfold-color-bg)', subtle: 'var(--pinfold-color-bg-subtle)' },
        surface: {
          DEFAULT: 'var(--pinfold-color-surface)',
          raised: 'var(--pinfold-color-surface-raised)',
          sunken: 'var(--pinfold-color-surface-sunken)',
          hover: 'var(--pinfold-color-surface-hover)',
          active: 'var(--pinfold-color-surface-active)',
          selected: 'var(--pinfold-color-surface-selected)',
        },
        content: {
          DEFAULT: 'var(--pinfold-color-text)',
          muted: 'var(--pinfold-color-text-muted)',
          subtle: 'var(--pinfold-color-text-subtle)',
          disabled: 'var(--pinfold-color-text-disabled)',
        },
        line: {
          DEFAULT: 'var(--pinfold-color-border)',
          strong: 'var(--pinfold-color-border-strong)',
          accent: 'var(--pinfold-color-border-accent)',
        },
      },

      borderRadius: {
        xs: 'var(--pinfold-radius-xs)',
        sm: 'var(--pinfold-radius-sm)',
        DEFAULT: 'var(--pinfold-radius-md)',
        md: 'var(--pinfold-radius-md)',
        lg: 'var(--pinfold-radius-lg)',
        xl: 'var(--pinfold-radius-xl)',
        '2xl': 'var(--pinfold-radius-2xl)',
      },

      spacing: Object.fromEntries(
        [1, 2, 3, 4, 5, 6, 8, 10].map((n) => [n, `var(--pinfold-space-${n})`]),
      ),

      fontFamily: {
        sans: 'var(--pinfold-font-sans)',
        mono: 'var(--pinfold-font-mono)',
      },

      fontSize: {
        xs: 'var(--pinfold-text-xs)',
        sm: 'var(--pinfold-text-sm)',
        base: 'var(--pinfold-text-md)',
        lg: 'var(--pinfold-text-lg)',
        xl: 'var(--pinfold-text-xl)',
      },

      boxShadow: {
        xs: 'var(--pinfold-shadow-xs)',
        sm: 'var(--pinfold-shadow-sm)',
        DEFAULT: 'var(--pinfold-shadow-sm)',
        md: 'var(--pinfold-shadow-md)',
        lg: 'var(--pinfold-shadow-lg)',
        xl: 'var(--pinfold-shadow-xl)',
        highlight: 'var(--pinfold-highlight)',
        focus: 'var(--pinfold-focus-ring)',
      },

      transitionTimingFunction: {
        pinfold: 'var(--pinfold-ease)',
        'pinfold-out': 'var(--pinfold-ease-out)',
        'pinfold-in-out': 'var(--pinfold-ease-in-out)',
        'pinfold-spring': 'var(--pinfold-ease-spring)',
      },

      transitionDuration: {
        fast: 'var(--pinfold-duration-fast)',
        DEFAULT: 'var(--pinfold-duration-md)',
        slow: 'var(--pinfold-duration-slow)',
      },

      zIndex: {
        dropdown: 'var(--pinfold-z-dropdown)',
        sticky: 'var(--pinfold-z-sticky)',
        overlay: 'var(--pinfold-z-overlay)',
        modal: 'var(--pinfold-z-modal)',
        toast: 'var(--pinfold-z-toast)',
        tooltip: 'var(--pinfold-z-tooltip)',
      },
    },
  },

  plugins: [
    /**
     * Variants for the `data-*` state Pinfold components already expose, so a
     * Tailwind-styled accordion needs no class toggling of its own:
     *
     *   <Faq classNames={{ trigger: 'open:text-primary-600 disabled-row:opacity-50' }} />
     */
    function pinfoldVariants({ addVariant }) {
      addVariant('open', '&[data-state="open"]');
      addVariant('closed', '&[data-state="closed"]');
      addVariant('selected', '&[data-state="selected"]');
      addVariant('disabled-row', '&[data-disabled]');
      addVariant('group-open', ':merge(.group)[data-state="open"] &');
      addVariant('pinfold-dark', ':is([data-pinfold-theme="dark"] &)');
    },
  ],
};
