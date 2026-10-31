/**
 * @lumae/react: the React adapter. Components live on subpaths so an unused
 * one costs nothing:
 *
 *   import { useAccordion } from '@lumae/react/accordion';
 *
 * The root carries what is shared across components: the provider, and the
 * helpers for building your own Lumae-style component.
 */
export { LumaeProvider, useLumae, type LumaeProviderProps, type LumaeContextValue } from './provider';
export {
  useId,
  useEvent,
  useControllableState,
  useIsomorphicLayoutEffect,
  type ControllableStateOptions,
} from './hooks';
export { slotProps, renderSlot } from './slots';
export { createLazyComponent, type LazyOptions } from './lazy';
export { useLumaeComponent, type LumaeComponent } from './component';
export type { SlotOverrides, SlotRenderer, Slottable } from './types';
