/**
 * @pinfold/core: framework-free building blocks. Nothing here imports React or
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
export * from './accordion.logic';
export * from './button.logic';
export { __DEV__, warnOnce, resetWarnings } from './dev';
export type {
  PinfoldSize,
  PinfoldRadius,
  PinfoldTone,
  PinfoldOrientation,
  PinfoldDir,
  PinfoldTheme,
  PinfoldLazy,
  PinfoldStylePack,
  PropsBag,
  Length,
  Ref,
} from './types';

/** Package version. Set with `npm run version:set -- x.y.z` (versions.test.ts keeps every copy in sync). */
export const version = '0.3.0';
