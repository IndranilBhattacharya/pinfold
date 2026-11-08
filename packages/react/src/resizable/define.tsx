import * as React from 'react';
import { mergeConfig } from '../preset';
import { Resizable } from './client';
import type { ResizableConfig, ResizableTagProps } from './types';

/** Props of a preset: any part of the config, plus element attributes.  */
export type ResizablePresetProps<P> = ResizableTagProps;

/** What `defineResizable` returns: a component with the preset baked in. */
export type DefinedResizable<P extends Partial<ResizableConfig> = Partial<ResizableConfig>> = ((props: ResizablePresetProps<P>) => React.ReactElement) & { config: P; displayName?: string };

/**
 * A reusable resizable, defined once at module scope and used in one line, in loops and in Server
 * Components:
 *
 *   const Workspace = defineResizable({ handle: 'grip' });
 *
 * Props win over the preset, then `defaults.resizable`, the provider and the library defaults.
 */
export function defineResizable<P extends Partial<ResizableConfig>>(preset: P = {} as P): DefinedResizable<P> {
  const Defined = ((props: ResizablePresetProps<P>) =>
    React.createElement(Resizable, mergeConfig<ResizableTagProps>(preset as unknown as Partial<ResizableTagProps>, props as unknown as Partial<ResizableTagProps>))) as DefinedResizable<P>;
  Defined.config = preset;
  Defined.displayName = 'DefinedResizable';
  return Defined;
}
