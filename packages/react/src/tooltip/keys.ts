/** Every config key of the tooltip. Tag and preset props with these names are config; the rest go to the root
 * element. `config-keys.test.ts` keeps this equal to the meta. */
export const TOOLTIP_KEYS: ReadonlySet<string> = /* @__PURE__ */ new Set([
  'content',
  'trigger',
  'placement',
  'variant',
  'arrow',
  'offset',
  'delay',
  'closeDelay',
  'disabled',
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
