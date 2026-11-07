/* Styles ship separately: import '@pinfold/css/core.css'; import '@pinfold/css/skeleton.css'.
   Server-safe barrel: `defineSkeleton` here, the client module re-exported. */

export { Skeleton, useSkeleton } from './client';
export { Skeleton as default } from './client';
export { defineSkeleton, type DefinedSkeleton, type SkeletonPresetProps } from './define';
export type { SkeletonApi, SkeletonComponent, SkeletonConfig, SkeletonShape, SkeletonDirection, SkeletonRootProps, SkeletonTagProps, SkeletonSlot, SkeletonState, SkeletonVariant, SkeletonAnimation, SkeletonDimensions } from './types';
