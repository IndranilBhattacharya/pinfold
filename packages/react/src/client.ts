/**
 * The client half of @pinfold/react. The build prefixes it with 'use client';
 * the root barrel (index.ts) re-exports it next to the server-safe helpers.
 */
export { PinfoldProvider, usePinfold, type PinfoldProviderProps, type PinfoldContextValue } from './provider';
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
export type { PinfoldNavigate } from './link';
export type { AccordionOptions } from './accordion/types';
