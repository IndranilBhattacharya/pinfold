/** Every config key of the resizable group. Tag and preset props with these names are config; the rest go to the root
 * element. `config-keys.test.ts` keeps this equal to the meta. */
export const RESIZABLE_KEYS: ReadonlySet<string> = /* @__PURE__ */ new Set([
  'label',
  'panels',
  'orientation',
  'sizes',
  'onResize',
  'autoSaveId',
  'handle',
  'step',
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
