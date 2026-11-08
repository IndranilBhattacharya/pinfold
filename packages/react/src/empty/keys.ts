/** Every config key of the empty state. Tag and preset props with these names are config; the rest go to the root
 * element. `config-keys.test.ts` keeps this equal to the meta. */
export const EMPTY_KEYS: ReadonlySet<string> = /* @__PURE__ */ new Set([
  'title',
  'description',
  'media',
  'actions',
  'headingLevel',
  'variant',
  'size',
  'tone',
  'unstyled',
  'className',
  'style',
  'classNames',
  'styles',
  'slotProps',
  'render',
]);
