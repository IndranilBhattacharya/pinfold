/** Every config key of the separator. Tag and preset props with these names are config; the rest go to the root
 * element. `config-keys.test.ts` keeps this equal to the meta. */
export const SEPARATOR_KEYS: ReadonlySet<string> = /* @__PURE__ */ new Set([
  'label',
  'orientation',
  'variant',
  'labelPosition',
  'spacing',
  'decorative',
  'dimensions',
  'unstyled',
  'className',
  'style',
  'classNames',
  'styles',
  'slotProps',
  'render',
]);
