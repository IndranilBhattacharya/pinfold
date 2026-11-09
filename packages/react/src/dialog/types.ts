import type * as React from 'react';
import type { Length, PropsBag, RadiusOption } from '@pinfold/core';
import type { PinfoldComponent } from '../component';
import type { OverlayTrigger } from '../overlay';
import type { SlotOverrides } from '../types';
import type { ButtonConfig } from '../button/types';

export type DialogSlot = 'root' | 'panel' | 'title' | 'description' | 'content' | 'actions' | 'close';
export type DialogPlacement = 'center' | 'top' | 'bottom' | 'start' | 'end';
export type DialogSize = 'sm' | 'md' | 'lg' | 'xl' | 'full';

/** Passed to slot `render` overrides. */
export interface DialogState {
  open: boolean;
  placement: DialogPlacement;
  size: DialogSize;
}

export interface DialogDimensions {
  width?: Length;
  height?: Length;
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
  content?: React.ReactNode;
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
  /** @default true */
  modal?: boolean;
  /** On, off for an alert dialog. */
  closeButton?: boolean;
  /** @default 'Close' */
  closeLabel?: string;
  /** On, off for an alert dialog. */
  closeOnOutside?: boolean;
  /** @default true */
  closeOnEscape?: boolean;
  open?: boolean;
  /** @default false */
  defaultOpen?: boolean;
  onOpenChange?: (open: boolean) => void;
  dimensions?: DialogDimensions;
  /** Corner radius: a preset rescales every corner inside like the theme presets; a length (`12` is px) sets the frame. `dimensions.radius` still wins. Default the theme radius. */
  radius?: RadiusOption;
  /** @default false */
  unstyled?: boolean;
  className?: string;
  style?: React.CSSProperties;
}

export type DialogRootProps = Omit<React.DialogHTMLAttributes<HTMLDialogElement>, 'children' | 'content' | 'title' | 'open' | 'role'> & { [key: `data-${string}`]: unknown };
export type DialogTagProps = DialogConfig & Omit<DialogRootProps, keyof DialogConfig>;

export interface DialogApi {
  isOpen: boolean;
  open: () => void;
  close: () => void;
  /** Spread on your own element when `trigger` is unset. */
  getTriggerProps: (props?: PropsBag) => PropsBag;
  getRootProps: (props?: PropsBag) => PropsBag;
  render: (props?: DialogRootProps) => React.ReactElement;
}
export type DialogComponent = PinfoldComponent<DialogApi, DialogRootProps>;
