/** Every config key of the avatar. Tag and preset props with these names are config; the rest go to the root
 * element. `config-keys.test.ts` keeps this equal to the meta. */
export const AVATAR_KEYS: ReadonlySet<string> = /* @__PURE__ */ new Set([
  'name',
  'src',
  'alt',
  'initials',
  'status',
  'items',
  'max',
  'label',
  'size',
  'shape',
  'tone',
  'dimensions',
  'unstyled',
  'className',
  'style',
  'classNames',
  'styles',
  'slotProps',
  'render',
]);
