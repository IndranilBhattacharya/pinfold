import * as React from 'react';
import { mergeConfig } from '../preset';
import { Popover } from './client';
import type { PopoverConfig, PopoverTagProps } from './types';

/** Props of a preset: any part of the config, plus element attributes.  */
export type PopoverPresetProps<P> = PopoverTagProps;

/** What `definePopover` returns: a component with the preset baked in. */
export type DefinedPopover<P extends Partial<PopoverConfig> = Partial<PopoverConfig>> = ((props: PopoverPresetProps<P>) => React.ReactElement) & { config: P; displayName?: string };

/**
 * A reusable popover, defined once at module scope and used in one line, in loops and in Server
 * Components:
 *
 *   const Details = definePopover({ placement: 'bottom-start' });
 *
 * Props win over the preset, then `defaults.popover`, the provider and the library defaults.
 */
export function definePopover<P extends Partial<PopoverConfig>>(preset: P = {} as P): DefinedPopover<P> {
  const Defined = ((props: PopoverPresetProps<P>) =>
    React.createElement(Popover, mergeConfig<PopoverTagProps>(preset as unknown as Partial<PopoverTagProps>, props as unknown as Partial<PopoverTagProps>))) as DefinedPopover<P>;
  Defined.config = preset;
  Defined.displayName = 'DefinedPopover';
  return Defined;
}
