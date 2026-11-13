/* Styles ship separately: import '@pinfold/css/core.css'; import '@pinfold/css/badge.css'.
   Server-safe barrel: `defineBadge` here, the client module re-exported. */

export { Badge, useBadge } from './client';
export { Badge as default } from './client';
export { defineBadge, type DefinedBadge, type BadgePresetProps } from './define';
export type { BadgeApi, BadgeComponent, BadgeConfig, BadgeRootProps, BadgeTagProps, BadgeSlot, BadgeState, BadgeVariant, BadgeRadius, BadgePlacement, BadgeAnchorShape, BadgeNode, BadgeDimensions } from './types';
