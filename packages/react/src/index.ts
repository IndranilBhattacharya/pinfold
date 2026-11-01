/**
 * @pinfold/react: the React adapter. Components live on subpaths so an unused
 * one costs nothing:
 *
 *   import { useAccordion } from '@pinfold/react/accordion';
 *
 * The root carries what is shared across components: the provider, and the
 * helpers for building your own Pinfold-style component.
 */
export { PinfoldProvider, usePinfold, type PinfoldProviderProps, type PinfoldContextValue } from './provider';
export { defineConfig, type PinfoldConfig, type PinfoldComponentDefaults } from './config';
export {
  useId,
  useEvent,
  useControllableState,
  useIsomorphicLayoutEffect,
  type ControllableStateOptions,
} from './hooks';
export { slotProps, renderSlot } from './slots';
export { createLazyComponent, type LazyOptions } from './lazy';
export { usePinfoldComponent, type PinfoldComponent } from './component';
export type { SlotOverrides, SlotRenderer, Slottable } from './types';
