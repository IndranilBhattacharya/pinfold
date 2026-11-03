import * as React from 'react';
import { mergeConfig } from '../preset';
import { Skeleton } from './client';
import type { SkeletonConfig, SkeletonRootProps, SkeletonTagProps } from './types';

/** Props of a preset: any part of the config, plus element attributes.  */
export type SkeletonPresetProps<P> = SkeletonTagProps;

/** What `defineSkeleton` returns: a component with the preset baked in. */
export type DefinedSkeleton<P extends Partial<SkeletonConfig> = Partial<SkeletonConfig>> = ((props: SkeletonPresetProps<P>) => React.ReactElement) & { config: P; displayName?: string };

/**
 * A reusable skeleton, defined once at module scope and used in one line, in loops and in Server
 * Components:
 *
 *   const Paragraph = defineSkeleton({ lines: 3 });  // <Paragraph loading={!data} content={<p>{data.bio}</p>} />
 *
 * Props win over the preset, then `defaults.skeleton`, the provider and the library defaults.
 */
export function defineSkeleton<P extends Partial<SkeletonConfig>>(preset: P = {} as P): DefinedSkeleton<P> {
  const Defined = ((props: SkeletonPresetProps<P>) =>
    React.createElement(Skeleton, mergeConfig<SkeletonTagProps>(preset as unknown as Partial<SkeletonTagProps>, props as unknown as Partial<SkeletonTagProps>))) as DefinedSkeleton<P>;
  Defined.config = preset;
  Defined.displayName = 'DefinedSkeleton';
  return Defined;
}
