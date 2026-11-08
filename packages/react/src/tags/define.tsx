import * as React from 'react';
import { mergeConfig } from '../preset';
import { Tags } from './client';
import type { TagsConfig, TagsTagProps } from './types';

/** Props of a preset: any part of the config, plus element attributes.  */
export type TagsPresetProps<P> = TagsTagProps;

/** What `defineTags` returns: a component with the preset baked in. */
export type DefinedTags<P extends Partial<TagsConfig> = Partial<TagsConfig>> = ((props: TagsPresetProps<P>) => React.ReactElement) & { config: P; displayName?: string };

/**
 * A reusable tags, defined once at module scope and used in one line, in loops and in Server
 * Components:
 *
 *   const Filters = defineTags({ variant: 'outline' });
 *
 * Props win over the preset, then `defaults.tags`, the provider and the library defaults.
 */
export function defineTags<P extends Partial<TagsConfig>>(preset: P = {} as P): DefinedTags<P> {
  const Defined = ((props: TagsPresetProps<P>) =>
    React.createElement(Tags, mergeConfig<TagsTagProps>(preset as unknown as Partial<TagsTagProps>, props as unknown as Partial<TagsTagProps>))) as DefinedTags<P>;
  Defined.config = preset;
  Defined.displayName = 'DefinedTags';
  return Defined;
}
