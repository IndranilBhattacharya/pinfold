/** Every config key of the kbd. Tag and preset props with these names are config; the rest go to the root
 * element. `config-keys.test.ts` keeps this equal to the meta. */
export const KBD_KEYS: ReadonlySet<string> = /* @__PURE__ */ new Set([
  'keys',
  'variant',
  'radius',
  'size',
  'display',
  'separator',
  'dimensions',
  'unstyled',
  'className',
  'style',
  'classNames',
  'styles',
  'slotProps',
  'render',
]);
