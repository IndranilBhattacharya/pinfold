import * as React from 'react';
import { mergeConfig } from '../preset';
import { Tooltip } from './client';
import type { TooltipConfig, TooltipTagProps } from './types';

/** Props of a preset: any part of the config, plus element attributes.  */
export type TooltipPresetProps<P> = TooltipTagProps;

/** What `defineTooltip` returns: a component with the preset baked in. */
export type DefinedTooltip<P extends Partial<TooltipConfig> = Partial<TooltipConfig>> = ((props: TooltipPresetProps<P>) => React.ReactElement) & { config: P; displayName?: string };

/**
 * A reusable tooltip, defined once at module scope and used in one line, in loops and in Server
 * Components:
 *
 *   const Hint = defineTooltip({ placement: 'bottom' });
 *
 * Props win over the preset, then `defaults.tooltip`, the provider and the library defaults.
 */
export function defineTooltip<P extends Partial<TooltipConfig>>(preset: P = {} as P): DefinedTooltip<P> {
  const Defined = ((props: TooltipPresetProps<P>) =>
    React.createElement(Tooltip, mergeConfig<TooltipTagProps>(preset as unknown as Partial<TooltipTagProps>, props as unknown as Partial<TooltipTagProps>))) as DefinedTooltip<P>;
  Defined.config = preset;
  Defined.displayName = 'DefinedTooltip';
  return Defined;
}
