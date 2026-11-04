/** Every config key of the menu. Tag and preset props with these names are config; the rest go to the root
 * element. `config-keys.test.ts` keeps this equal to the meta. */
export const MENU_KEYS: ReadonlySet<string> = /* @__PURE__ */ new Set([
  'items',
  'trigger',
  'mode',
  'label',
  'placement',
  'size',
  'offset',
  'loop',
  'open',
  'defaultOpen',
  'onOpenChange',
  'dimensions',
  'unstyled',
  'className',
  'style',
  'classNames',
  'styles',
  'slotProps',
  'render',
]);
