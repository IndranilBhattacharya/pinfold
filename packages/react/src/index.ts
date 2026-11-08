/**
 * @pinfold/react: the React adapter. Components live on subpaths so an unused
 * one costs nothing:
 *
 *   import { useAccordion } from '@pinfold/react/accordion';
 *
 * The root carries what is shared across components: the provider, the global
 * config, and the helpers for building your own Pinfold-style component.
 * This barrel is server-safe (no 'use client'), so `defineConfig` can run in a
 * Server Component or a config file; the client parts come from './client'.
 */
export {
  PinfoldProvider,
  usePinfold,
  useId,
  useEvent,
  useControllableState,
  useIsomorphicLayoutEffect,
  slotProps,
  renderSlot,
  createLazyComponent,
  usePinfoldComponent,
} from './client';
export type {
  PinfoldProviderProps,
  PinfoldContextValue,
  ControllableStateOptions,
  LazyOptions,
  PinfoldComponent,
  SlotOverrides,
  SlotRenderer,
  Slottable,
  PinfoldNavigate,
} from './client';
export { defineConfig, type PinfoldConfig, type PinfoldComponentDefaults } from './config';
