import type * as React from 'react';
import type { Length, OverlayPlacement, PropsBag, RadiusOption } from '@pinfold/core';
import type { PinfoldComponent } from '../component';
import type { OverlayTrigger } from '../overlay';
import type { SlotOverrides } from '../types';
import type { ButtonConfig } from '../button/types';

export type PopoverSlot = 'root' | 'title' | 'description' | 'content' | 'actions' | 'arrow';
export type PopoverOpenOn = 'click' | 'hover';

/** Passed to slot `render` overrides. */
export interface PopoverState {
  open: boolean;
  openOn: PopoverOpenOn;
}

export interface PopoverDimensions {
  width?: Length;
  padding?: Length;
}

/**
 *   const Details = definePopover({ placement: 'bottom-start' });
 *   <Details title="Share" content={<CopyLink />} trigger={{ label: 'Share' }} />
 */
export interface PopoverConfig extends SlotOverrides<PopoverSlot, PopoverState> {
  /** The heading, and the accessible name of the panel. */
  title?: React.ReactNode;
  description?: React.ReactNode;
  content?: React.ReactNode;
  /** Buttons at the bottom. Each closes the popover unless its `onClick` returns `false`. */
  actions?: readonly ButtonConfig[];
  /** A button config, or any element that passes props to its root. */
  trigger?: OverlayTrigger;
  /** @default 'click' */
  openOn?: PopoverOpenOn;
  /** @default 'bottom' */
  placement?: OverlayPlacement;
  /** @default false */
  arrow?: boolean;
  /** @default 8 */
  offset?: number;
  /** @default 200 */
  delay?: number;
  /** @default 200 */
  closeDelay?: number;
  /** @default true */
  closeOnOutside?: boolean;
  /** @default true */
  closeOnEscape?: boolean;
  open?: boolean;
  /** @default false */
  defaultOpen?: boolean;
  onOpenChange?: (open: boolean) => void;
  dimensions?: PopoverDimensions;
  /** Corner radius: a preset rescales every corner inside like the theme presets; a length (`12` is px) sets the frame. Default the theme radius. */
  radius?: RadiusOption;
  /** @default false */
  unstyled?: boolean;
  className?: string;
  style?: React.CSSProperties;
}

export type PopoverRootProps = Omit<React.HTMLAttributes<HTMLDivElement>, 'children' | 'content' | 'title'> & { [key: `data-${string}`]: unknown };
export type PopoverTagProps = PopoverConfig & Omit<PopoverRootProps, keyof PopoverConfig>;

export interface PopoverApi {
  isOpen: boolean;
  open: () => void;
  close: () => void;
  toggle: () => void;
  /** Spread on your own element when `trigger` is unset. */
  getTriggerProps: (props?: PropsBag) => PropsBag;
  getRootProps: (props?: PropsBag) => PropsBag;
  render: (props?: PopoverRootProps) => React.ReactElement;
}
export type PopoverComponent = PinfoldComponent<PopoverApi, PopoverRootProps>;
