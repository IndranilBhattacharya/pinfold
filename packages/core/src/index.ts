/**
 * @lumae/core: framework-free building blocks. Nothing here imports React or
 * any other UI framework (enforced by `framework-isolation.test.ts`), so a
 * future adapter reuses exactly the same rules.
 */
export {
  cn,
  dataAttr,
  ariaAttr,
  composeRefs,
  mergeProps,
  resolveNode,
  type Slottable,
} from './utils';
export { variants, type VariantProps } from './variants';
export { nextIndexFromKey, type ListNavOptions } from './navigation';
export { dimensionVars } from './dimensions';
export { __DEV__, warnOnce, resetWarnings } from './dev';
export type {
  LumaeSize,
  LumaeRadius,
  LumaeTone,
  LumaeOrientation,
  LumaeDir,
  LumaeTheme,
  PropsBag,
  Length,
  Ref,
} from './types';

/** Package version, injected at publish time by the release script. */
export const version = '0.1.0';
