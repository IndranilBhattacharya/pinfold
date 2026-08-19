/**
 * Knot UI — Tailwind CSS v3 preset.
 *
 *   // tailwind.config.js
 *   module.exports = { presets: [require('@knotui/tailwind')] };
 *
 * Every entry points at a `--knot-*` custom property rather than a literal, so
 * `bg-primary-600` follows `npx knotui theme`, dark mode and any runtime
 * override automatically. One palette, two styling systems, no duplication.
 *
 * For Tailwind v4, import `@knotui/tailwind/theme.css` instead.
 */

const ramp = (role) =>
  Object.fromEntries(
    [50, 100, 200, 300, 400, 500, 600, 700, 800, 900, 950].map((step) => [
      step,
      `var(--knot-${role}-${step})`,
    ]),
  );

/** Status ramps ship five steps, not eleven. */
const statusRamp = (role) =>
  Object.fromEntries([100, 300, 500, 700, 900].map((s) => [s, `var(--knot-${role}-${s})`]));

module.exports = {
  theme: {
    extend: {
      colors: {
        primary: ramp('primary'),
        neutral: ramp('neutral'),
        accent: {
          300: 'var(--knot-accent-300)',
          400: 'var(--knot-accent-400)',
          500: 'var(--knot-accent-500)',
          600: 'var(--knot-accent-600)',
          700: 'var(--knot-accent-700)',
          DEFAULT: 'var(--knot-color-accent)',
        },
        success: statusRamp('success'),
        warning: statusRamp('warning'),
        danger: statusRamp('danger'),
        info: statusRamp('info'),

        // Semantic aliases: `bg-surface`, `text-content-muted`, `border-line`.
        bg: { DEFAULT: 'var(--knot-color-bg)', subtle: 'var(--knot-color-bg-subtle)' },
        surface: {
          DEFAULT: 'var(--knot-color-surface)',
          raised: 'var(--knot-color-surface-raised)',
          sunken: 'var(--knot-color-surface-sunken)',
          hover: 'var(--knot-color-surface-hover)',
          active: 'var(--knot-color-surface-active)',
          selected: 'var(--knot-color-surface-selected)',
        },
        content: {
          DEFAULT: 'var(--knot-color-text)',
          muted: 'var(--knot-color-text-muted)',
          subtle: 'var(--knot-color-text-subtle)',
          disabled: 'var(--knot-color-text-disabled)',
        },
        line: {
          DEFAULT: 'var(--knot-color-border)',
          strong: 'var(--knot-color-border-strong)',
          accent: 'var(--knot-color-border-accent)',
        },
      },

      borderRadius: {
        xs: 'var(--knot-radius-xs)',
        sm: 'var(--knot-radius-sm)',
        DEFAULT: 'var(--knot-radius-md)',
        md: 'var(--knot-radius-md)',
        lg: 'var(--knot-radius-lg)',
        xl: 'var(--knot-radius-xl)',
        '2xl': 'var(--knot-radius-2xl)',
      },

      spacing: Object.fromEntries(
        [1, 2, 3, 4, 5, 6, 8, 10].map((n) => [n, `var(--knot-space-${n})`]),
      ),

      fontFamily: {
        sans: 'var(--knot-font-sans)',
        mono: 'var(--knot-font-mono)',
      },

      fontSize: {
        xs: 'var(--knot-text-xs)',
        sm: 'var(--knot-text-sm)',
        base: 'var(--knot-text-md)',
        lg: 'var(--knot-text-lg)',
        xl: 'var(--knot-text-xl)',
      },

      boxShadow: {
        xs: 'var(--knot-shadow-xs)',
        sm: 'var(--knot-shadow-sm)',
        DEFAULT: 'var(--knot-shadow-sm)',
        md: 'var(--knot-shadow-md)',
        lg: 'var(--knot-shadow-lg)',
        xl: 'var(--knot-shadow-xl)',
        highlight: 'var(--knot-highlight)',
        focus: 'var(--knot-focus-ring)',
      },

      transitionTimingFunction: {
        knot: 'var(--knot-ease)',
        'knot-out': 'var(--knot-ease-out)',
        'knot-in-out': 'var(--knot-ease-in-out)',
        'knot-spring': 'var(--knot-ease-spring)',
      },

      transitionDuration: {
        fast: 'var(--knot-duration-fast)',
        DEFAULT: 'var(--knot-duration-md)',
        slow: 'var(--knot-duration-slow)',
      },

      zIndex: {
        dropdown: 'var(--knot-z-dropdown)',
        sticky: 'var(--knot-z-sticky)',
        overlay: 'var(--knot-z-overlay)',
        modal: 'var(--knot-z-modal)',
        toast: 'var(--knot-z-toast)',
        tooltip: 'var(--knot-z-tooltip)',
      },
    },
  },

  plugins: [
    /**
     * Variants for the `data-*` state Knot components already expose, so a
     * Tailwind-styled accordion needs no class toggling of its own:
     *
     *   <Faq classNames={{ trigger: 'open:text-primary-600 disabled-row:opacity-50' }} />
     */
    function knotVariants({ addVariant }) {
      addVariant('open', '&[data-state="open"]');
      addVariant('closed', '&[data-state="closed"]');
      addVariant('selected', '&[data-state="selected"]');
      addVariant('disabled-row', '&[data-disabled]');
      addVariant('group-open', ':merge(.group)[data-state="open"] &');
      addVariant('knot-dark', ':is([data-knot-theme="dark"] &)');
    },
  ],
};
