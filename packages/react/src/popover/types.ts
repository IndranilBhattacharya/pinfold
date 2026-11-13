import type * as React from 'react';
import type { Length, OverlayPlacement, PropsBag, RadiusOption } from '@pinfold/core';
import type { PinfoldComponent } from '../component';
import type { OverlayTrigger } from '../overlay';
import type { SlotOverrides } from '../types';
import type { ButtonConfig } from '../button/types';

export type PopoverSlot = 'root' | 'header' | 'title' | 'description' | 'content' | 'footer' | 'actions' | 'close' | 'arrow';
export type PopoverOpenOn = 'click' | 'hover' | 'focus' | 'manual';
export type PopoverSize = 'sm' | 'md' | 'lg' | 'auto';
/** Why the popover opened or closed. */
export type PopoverChangeReason = 'trigger' | 'hover' | 'focus' | 'escape' | 'outside' | 'scroll' | 'blur' | 'action' | 'closeButton' | 'api';

/** Passed to slot `render` overrides. */
export interface PopoverState {
  open: boolean;
  openOn: PopoverOpenOn;
  size: PopoverSize;
}

/** What a function in `content`, `header` or `footer` receives. */
export interface PopoverRenderContext {
  /** Close the popover (reason `action`). */
  close: () => void;
  isOpen: boolean;
}
/** A node, or a function of `{ close, isOpen }`. */
export type PopoverNode = React.ReactNode | ((context: PopoverRenderContext) => React.ReactNode);

export interface PopoverDimensions {
  width?: Length;
  /** Widest it grows (`size: 'auto'`). */
  maxWidth?: Length;
  /** Tallest it grows; the content scrolls inside. */
  maxHeight?: Length;
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
  /** Anything. A function receives `{ close, isOpen }`. On the tag, `children` work too. */
  content?: PopoverNode;
  /** Your own header content, under the title (or the whole header without one). */
  header?: PopoverNode;
  /** Your own footer content, before the actions (or the whole footer without them). */
  footer?: PopoverNode;
  /** Buttons at the bottom. Each closes the popover unless its `onClick` returns `false`. */
  actions?: readonly ButtonConfig[];
  /** A button config, or any element that passes props to its root. */
  trigger?: OverlayTrigger;
  /** @default 'click' */
  openOn?: PopoverOpenOn;
  /** Keep Tab inside the panel until it closes. @default false */
  modal?: boolean;
  /** @default 'bottom' */
  placement?: OverlayPlacement;
  /** @default false */
  arrow?: boolean;
  /** @default 8 */
  offset?: number;
  /** As wide as the trigger. @default false */
  matchTriggerWidth?: boolean;
  /** Width and padding preset; `auto` fits the content. @default 'md' */
  size?: PopoverSize;
  /** A close button in the corner. @default false */
  closeButton?: boolean;
  /** @default 'Close' */
  closeLabel?: string;
  /** @default 200 */
  delay?: number;
  /** @default 200 */
  closeDelay?: number;
  /** @default true */
  closeOnOutsidePress?: boolean;
  /** @deprecated Use `closeOnOutsidePress`. */
  closeOnOutside?: boolean;
  /** @default true */
  closeOnEscape?: boolean;
  /** Scrolling the page (not the panel) closes it. @default false */
  closeOnScroll?: boolean;
  open?: boolean;
  /** @default false */
  defaultOpen?: boolean;
  /** The next state, and why. */
  onOpenChange?: (open: boolean, reason: PopoverChangeReason) => void;
  /** It asked to open. */
  onOpen?: () => void;
  /** It asked to close, and why. */
  onClose?: (reason: PopoverChangeReason) => void;
  dimensions?: PopoverDimensions;
  /** Corner radius: a preset rescales every corner inside like the theme presets; a length (`12` is px) sets the frame. Default the theme radius. */
  radius?: RadiusOption;
  /** @default false */
  unstyled?: boolean;
  className?: string;
  style?: React.CSSProperties;
}

export type PopoverRootProps = Omit<React.HTMLAttributes<HTMLDivElement>, 'children' | 'content' | 'title'> & { [key: `data-${string}`]: unknown };
/** The tag also takes `children`, as an alias of `content`. */
export type PopoverTagProps = PopoverConfig & Omit<PopoverRootProps, keyof PopoverConfig> & { children?: React.ReactNode };

export interface PopoverApi {
  isOpen: boolean;
  open: () => void;
  close: () => void;
  toggle: () => void;
  /** Spread on your own element when `trigger` is unset. */
  getTriggerProps: (props?: PropsBag) => PropsBag;
  getRootProps: (props?: PropsBag) => PropsBag;
  render: (props?: PopoverRootProps & { children?: React.ReactNode }) => React.ReactElement;
}
export type PopoverComponent = PinfoldComponent<PopoverApi, PopoverRootProps>;
