import * as React from 'react';
import { mergeConfig } from '../preset';
import { ScrollArea } from './client';
import type { ScrollAreaConfig, ScrollAreaTagProps } from './types';

/** Props of a preset: any part of the config, plus element attributes. */
export type ScrollAreaPresetProps<P> = ScrollAreaTagProps;

/** What `defineScrollArea` returns: a component with the preset baked in. */
export type DefinedScrollArea<P extends Partial<ScrollAreaConfig> = Partial<ScrollAreaConfig>> = ((props: ScrollAreaPresetProps<P>) => React.ReactElement) & { config: P; displayName?: string };

/**
 * A reusable scroll area, defined once at module scope and used in one line, in loops and in
 * Server Components. Every use is its own instance: nothing is shared between them but the preset.
 *
 * Props win over the preset, then `defaults.scrollarea`, the provider and the library defaults.
 */
export function defineScrollArea<P extends Partial<ScrollAreaConfig>>(preset: P = {} as P): DefinedScrollArea<P> {
  const Defined = ((props: ScrollAreaPresetProps<P>) =>
    React.createElement(ScrollArea, mergeConfig<ScrollAreaTagProps>(preset as unknown as Partial<ScrollAreaTagProps>, props as unknown as Partial<ScrollAreaTagProps>))) as DefinedScrollArea<P>;
  Defined.config = preset;
  Defined.displayName = 'DefinedScrollArea';
  return Defined;
}
