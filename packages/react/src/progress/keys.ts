/** Every config key of the progress. Tag and preset props with these names are config; the rest go to the root
 * element. `config-keys.test.ts` keeps this equal to the meta. */
export const PROGRESS_KEYS: ReadonlySet<string> = /* @__PURE__ */ new Set([
  'value',
  'min',
  'max',
  'label',
  'hideLabel',
  'showValue',
  'formatValue',
  'kind',
  'shape',
  'radius',
  'size',
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
