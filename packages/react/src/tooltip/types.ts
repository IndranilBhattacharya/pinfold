import type * as React from 'react';
import type { Length, OverlayPlacement, PropsBag, RadiusOption } from '@pinfold/core';
import type { PinfoldComponent } from '../component';
import type { OverlayTrigger } from '../overlay';
import type { SlotOverrides } from '../types';

export type TooltipSlot = 'root' | 'arrow';
export type TooltipVariant = 'inverse' | 'surface';

/** Passed to slot `render` overrides. */
export interface TooltipState {
  open: boolean;
  variant: TooltipVariant;
}

export interface TooltipDimensions {
  maxWidth?: Length;
}

/**
 *   const Hint = defineTooltip({ placement: 'bottom' });
 *   <Hint content="Copies the link" trigger={{ label: 'Share' }} />
 */
export interface TooltipConfig extends SlotOverrides<TooltipSlot, TooltipState> {
  /** The hint. */
  content: React.ReactNode;
  /** A button config, or any element that passes props to its root. */
  trigger?: OverlayTrigger;
  /** @default 'top' */
  placement?: OverlayPlacement;
  /** @default 'inverse' */
  variant?: TooltipVariant;
  /** @default true */
  arrow?: boolean;
  /** @default 8 */
  offset?: number;
  /** @default 400 */
  delay?: number;
  /** @default 120 */
  closeDelay?: number;
  /** @default false */
  disabled?: boolean;
  open?: boolean;
  /** @default false */
  defaultOpen?: boolean;
  onOpenChange?: (open: boolean) => void;
  dimensions?: TooltipDimensions;
  /** Corner radius: a preset rescales every corner inside like the theme presets; a length (`12` is px) sets the frame. Default the theme radius. */
  radius?: RadiusOption;
  /** @default false */
  unstyled?: boolean;
  className?: string;
  style?: React.CSSProperties;
}

export type TooltipRootProps = Omit<React.HTMLAttributes<HTMLDivElement>, 'children' | 'content'> & { [key: `data-${string}`]: unknown };
export type TooltipTagProps = TooltipConfig & Omit<TooltipRootProps, keyof TooltipConfig>;

export interface TooltipApi {
  isOpen: boolean;
  open: () => void;
  close: () => void;
  /** Spread on your own element when `trigger` is unset. */
  getTriggerProps: (props?: PropsBag) => PropsBag;
  getRootProps: (props?: PropsBag) => PropsBag;
  render: (props?: TooltipRootProps) => React.ReactElement;
}
export type TooltipComponent = PinfoldComponent<TooltipApi, TooltipRootProps>;
