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
export * from './kbd.logic';
export * from './separator.logic';
export * from './skeleton.logic';
export * from './badge.logic';
export * from './alert.logic';
export * from './avatar.logic';
export * from './card.logic';
export * from './progress.logic';
export * from './overlay.logic';
export * from './toast.logic';
export * from './forms.logic';
export * from './controls.logic';
export * from './nav.logic';
export * from './listbox.logic';
export * from './calendar.logic';
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
export const version = '0.17.0';
