/** Every config key of the toast region. Tag and preset props with these names are config; the rest go to the root
 * element. `config-keys.test.ts` keeps this equal to the meta. */
export const TOAST_KEYS: ReadonlySet<string> = /* @__PURE__ */ new Set([
  'placement',
  'duration',
  'max',
  'stack',
  'visible',
  'label',
  'dismissLabel',
  'swipe',
  'store',
  'dimensions',
  'radius',
  'unstyled',
  'className',
  'style',
  'classNames',
  'styles',
  'slotProps',
  'render',
]);
