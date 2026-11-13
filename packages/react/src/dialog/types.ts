import type * as React from 'react';
import type { Length, PropsBag, RadiusOption } from '@pinfold/core';
import type { PinfoldComponent } from '../component';
import type { OverlayTrigger } from '../overlay';
import type { SlotOverrides } from '../types';
import type { ButtonConfig } from '../button/types';

export type DialogSlot = 'root' | 'panel' | 'header' | 'title' | 'description' | 'content' | 'footer' | 'actions' | 'close';
export type DialogPlacement = 'center' | 'top' | 'bottom' | 'start' | 'end';
export type DialogSize = 'sm' | 'md' | 'lg' | 'xl' | 'full';
export type DialogScrollBehavior = 'inside' | 'outside';
export type DialogBackdrop = 'dim' | 'blur' | 'none';
/** Why the dialog opened or closed. `form`: a `<form method="dialog">` inside closed it. */
export type DialogChangeReason = 'trigger' | 'escape' | 'outside' | 'closeButton' | 'action' | 'form' | 'api';

/** What a function in `content`, `header` or `footer` receives. */
export interface DialogRenderContext {
  /** Close the dialog (reason `action`). */
  close: () => void;
  isOpen: boolean;
}
/** A node, or a function of `{ close, isOpen }`. */
export type DialogNode = React.ReactNode | ((context: DialogRenderContext) => React.ReactNode);

/** Passed to slot `render` overrides. */
export interface DialogState {
  open: boolean;
  placement: DialogPlacement;
  size: DialogSize;
  scrollBehavior: DialogScrollBehavior;
}

export interface DialogDimensions {
  width?: Length;
  height?: Length;
  /** Tallest the panel grows before its content scrolls. */
  maxHeight?: Length;
  padding?: Length;
  radius?: Length;
}

/**
 *   const Confirm = defineDialog({ role: 'alertdialog', size: 'sm' });
 *   <Confirm title="Delete?" trigger={{ label: 'Delete' }} actions={[{ label: 'Cancel' }, { label: 'Delete', onClick: remove }]} />
 */
export interface DialogConfig extends SlotOverrides<DialogSlot, DialogState> {
  /** The heading, and the accessible name. */
  title?: React.ReactNode;
  description?: React.ReactNode;
  /** Anything. A function receives `{ close, isOpen }`. On the tag, `children` work too. */
  content?: DialogNode;
  /** Your own header content, under the title (or the whole header without one). */
  header?: DialogNode;
  /** Your own footer content, before the actions (or the whole footer without them). */
  footer?: DialogNode;
  /**
   * Buttons at the bottom; the last is solid. Each closes the dialog unless its `onClick`
   * returns `false`; a promise closes when it resolves.
   */
  actions?: readonly ButtonConfig[];
  /** A button config, or any element that passes props to its root. */
  trigger?: OverlayTrigger;
  /** @default 'dialog' */
  role?: 'dialog' | 'alertdialog';
  /** @default 'center' */
  placement?: DialogPlacement;
  /** @default 'md' */
  size?: DialogSize;
  /** `inside`: the content scrolls between a fixed header and footer; `outside`: the backdrop scrolls. @default 'inside' */
  scrollBehavior?: DialogScrollBehavior;
  /** @default 'dim' */
  backdrop?: DialogBackdrop;
  /** @default true */
  modal?: boolean;
  /** `false`: no close button, Escape and outside presses do nothing. @default true */
  dismissible?: boolean;
  /** On, off for an alert dialog. */
  closeButton?: boolean;
  /** @default 'Close' */
  closeLabel?: string;
  /** A press on the backdrop closes it. On, off for an alert dialog. */
  closeOnOutsidePress?: boolean;
  /** @deprecated Use `closeOnOutsidePress`. */
  closeOnOutside?: boolean;
  /** @default true */
  closeOnEscape?: boolean;
  /** Where focus goes on open: `'panel'`, a CSS selector inside the dialog, or a ref. Unset: `[data-autofocus]`, else the first control. */
  initialFocus?: string | React.RefObject<HTMLElement | null>;
  open?: boolean;
  /** @default false */
  defaultOpen?: boolean;
  /** The next state, and why. */
  onOpenChange?: (open: boolean, reason: DialogChangeReason) => void;
  /** It asked to open. */
  onOpen?: () => void;
  /** It asked to close, and why. */
  onClose?: (reason: DialogChangeReason) => void;
  dimensions?: DialogDimensions;
  /** Corner radius: a preset rescales every corner inside like the theme presets; a length (`12` is px) sets the frame. `dimensions.radius` still wins. Default the theme radius. */
  radius?: RadiusOption;
  /** @default false */
  unstyled?: boolean;
  className?: string;
  style?: React.CSSProperties;
}

export type DialogRootProps = Omit<React.DialogHTMLAttributes<HTMLDialogElement>, 'children' | 'content' | 'title' | 'open' | 'role'> & { [key: `data-${string}`]: unknown };
/** The tag also takes `children`, as an alias of `content`. */
export type DialogTagProps = DialogConfig & Omit<DialogRootProps, keyof DialogConfig> & { children?: React.ReactNode };

export interface DialogApi {
  isOpen: boolean;
  open: () => void;
  close: () => void;
  /** Spread on your own element when `trigger` is unset. */
  getTriggerProps: (props?: PropsBag) => PropsBag;
  getRootProps: (props?: PropsBag) => PropsBag;
  render: (props?: DialogRootProps & { children?: React.ReactNode }) => React.ReactElement;
}
export type DialogComponent = PinfoldComponent<DialogApi, DialogRootProps>;
