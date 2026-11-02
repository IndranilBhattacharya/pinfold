/** Every config key of the spinner. Tag and preset props with these names are config; the rest go to the root
 * element. `config-keys.test.ts` keeps this equal to the meta. */
export const SPINNER_KEYS: ReadonlySet<string> = /* @__PURE__ */ new Set([
  'size',
  'tone',
  'label',
  'dimensions',
  'unstyled',
  'className',
  'style',
  'classNames',
  'styles',
  'slotProps',
  'render',
]);
