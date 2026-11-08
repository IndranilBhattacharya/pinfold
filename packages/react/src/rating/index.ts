/* Styles ship separately: import '@pinfold/css/core.css'; import '@pinfold/css/rating.css'.
   Server-safe barrel: `defineRating` here, the client module re-exported. */

export { Rating, useRating } from './client';
export { Rating as default } from './client';
export { defineRating, type DefinedRating, type RatingPresetProps } from './define';
export type { RatingApi, RatingComponent, RatingConfig, RatingRootProps, RatingTagProps, RatingSlot, RatingState } from './types';
