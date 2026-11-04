/* Styles ship separately: import '@pinfold/css/core.css'; import '@pinfold/css/popover.css'.
   Server-safe barrel: `definePopover` here, the client module re-exported. */

export { Popover, usePopover } from './client';
export { Popover as default } from './client';
export { definePopover, type DefinedPopover, type PopoverPresetProps } from './define';
export type { PopoverApi, PopoverComponent, PopoverConfig, PopoverRootProps, PopoverTagProps, PopoverSlot, PopoverState, PopoverOpenOn, PopoverDimensions } from './types';
