/** Every config key of the toolbar. Tag and preset props with these names are config; the rest go to the root
 * element. `config-keys.test.ts` keeps this equal to the meta. */
export const TOOLBAR_KEYS: ReadonlySet<string> = /* @__PURE__ */ new Set([
  'label',
  'items',
  'attached',
  'orientation',
  'variant',
  'size',
  'tone',
  'disabled',
  'dimensions',
  'unstyled',
  'className',
  'style',
  'classNames',
  'styles',
  'slotProps',
  'render',
]);
