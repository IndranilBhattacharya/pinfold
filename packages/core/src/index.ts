export {
  cn,
  dataAttr,
  ariaAttr,
  composeRefs,
  mergeProps,
  resolveNode,
  type Slottable,
} from './utils';
export {
  useId,
  useEvent,
  useControllableState,
  useIsomorphicLayoutEffect,
  type ControllableStateOptions,
} from './hooks';
export { variants, type VariantProps } from './variants';
export { nextIndexFromKey, type ListNavOptions } from './navigation';
export { slotProps, renderSlot } from './slots';
export { dimensionVars } from './dimensions';
export { __DEV__, warnOnce, resetWarnings } from './dev';
export { KnotProvider, useKnot, type KnotProviderProps, type KnotContextValue } from './provider';
export { createLazyComponent, type LazyOptions } from './lazy';
export { useKnotComponent, useStableParts, type KnotComponent } from './component';
export type {
  KnotSize,
  KnotRadius,
  KnotTone,
  KnotOrientation,
  KnotDir,
  KnotTheme,
  PropsBag,
  Length,
  SlotOverrides,
  SlotRenderer,
} from './types';

/** Package version, injected at publish time by the release script. */
export const version = '0.1.0';
