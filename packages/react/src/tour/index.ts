/* Styles ship separately: import '@pinfold/css/core.css'; import '@pinfold/css/tour.css'.
   Server-safe barrel: `defineTour` here, the client module re-exported. */

export { Tour, useTour } from './client';
export { Tour as default } from './client';
export { defineTour, type DefinedTour, type TourPresetProps } from './define';
export type { TourApi, TourComponent, TourConfig, TourRootProps, TourTagProps, TourSlot, TourState, TourStep, TourTarget, TourDotContext, TourLabels, TourDimensions } from './types';
