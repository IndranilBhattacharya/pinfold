/* Styles ship separately: import '@pinfold/css/core.css'; import '@pinfold/css/card.css'.
   Server-safe barrel: `defineCard` here, the client module re-exported. */

export { Card, useCard } from './client';
export { Card as default } from './client';
export { defineCard, type DefinedCard, type CardPresetProps } from './define';
export type { CardApi, CardComponent, CardConfig, CardRootProps, CardTagProps, CardSlot, CardState, CardVariant, CardPadding, CardOrientation, CardImage, CardDimensions } from './types';
