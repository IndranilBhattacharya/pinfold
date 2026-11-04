/* Styles ship separately: import '@pinfold/css/core.css'; import '@pinfold/css/tooltip.css'.
   Server-safe barrel: `defineTooltip` here, the client module re-exported. */

export { Tooltip, useTooltip } from './client';
export { Tooltip as default } from './client';
export { defineTooltip, type DefinedTooltip, type TooltipPresetProps } from './define';
export type { TooltipApi, TooltipComponent, TooltipConfig, TooltipRootProps, TooltipTagProps, TooltipSlot, TooltipState, TooltipVariant, TooltipDimensions } from './types';
