import type * as React from 'react';
import type { Length, PinfoldSize, PinfoldTone, PropsBag, RadiusOption } from '@pinfold/core';
import type { PinfoldComponent } from '../component';
import type { SlotOverrides } from '../types';
import type { ButtonConfig, ButtonVariant } from '../button/types';

export type ToolbarSlot = 'root' | 'item' | 'separator' | 'custom';
export type ToolbarVariant = Exclude<ButtonVariant, 'link' | 'elevated'>;

/** One button: any button config, plus the value it stands for when the toolbar keeps a selection. */
export interface ToolbarButtonItem extends ButtonConfig {
  /** With `selection`: the value this button stands for. Default its position, as a string. */
  value?: string;
}

/** A divider between groups of buttons: `{ type: 'separator' }`. */
export interface ToolbarSeparatorItem {
  type: 'separator';
}

/**
 * Anything else in the row: a select, a search field, a menu, a label. A node renders as is (not
 * a toolbar stop). A function gets the roving-focus props for your control, so the arrow keys
 * reach it: `content: ({ props }) => <select {...props}>…</select>`.
 */
export interface ToolbarCustomItem {
  content: React.ReactNode | ((args: { props: PropsBag; state: ToolbarState }) => React.ReactNode);
}

/** A button (any button config), a separator, or custom content. */
export type ToolbarItem = ToolbarButtonItem | ToolbarSeparatorItem | ToolbarCustomItem;

/** Passed to slot `render` overrides. */
export interface ToolbarState {
  attached: boolean;
  orientation: 'horizontal' | 'vertical';
  size: PinfoldSize;
  /** The pressed values. */
  value: string[];
  overflow: 'wrap' | 'scroll';
}

export interface ToolbarDimensions {
  gap?: Length;
}

/**
 *   const Pager = defineToolbar();
 *   <Pager label="Pages" items={[{ label: 'Previous', onClick: prev }, { label: 'Next', onClick: next }]} />
 */
export interface ToolbarConfig extends SlotOverrides<ToolbarSlot, ToolbarState> {
  /** The accessible name, e.g. "Text formatting". */
  label: string;
  /**
   * One button each (each one's own settings win over the toolbar's), a `{ type: 'separator' }`
   * between groups, or `{ content }` for anything else.
   */
  items: readonly ToolbarItem[];
  /**
   * Buttons that stay pressed: `single` (one at a time, like text alignment) or `multiple` (like bold
   * and italic). `none`: every button is an action.
   * @default 'none'
   */
  selection?: 'none' | 'single' | 'multiple';
  /** With `selection`: the pressed values, controlled. */
  value?: readonly string[];
  /** With `selection`: the pressed values when uncontrolled. */
  defaultValue?: readonly string[];
  /** With `selection`: `(values, event)` when a button is pressed or released. */
  onChange?: (values: string[], event: React.MouseEvent<HTMLElement>) => void;
  /** @default true */
  attached?: boolean;
  /** @default 'horizontal' */
  orientation?: 'horizontal' | 'vertical';
  /**
   * More buttons than room: `wrap` onto more lines (an attached group stays on one line and its
   * labels shrink), or `scroll` along one line with fading edges where buttons are hidden.
   * @default 'wrap'
   */
  overflow?: 'wrap' | 'scroll';
  /** @default 'ghost' */
  variant?: ToolbarVariant;
  /** Corner radius: a preset rescales every corner inside like the theme presets; a length (`12` is px) sets the frame. Default the theme radius. */
  radius?: RadiusOption;
  /** @default 'md' */
  size?: PinfoldSize;
  /** @default 'neutral' */
  tone?: PinfoldTone;
  /**
   * With `selection`: the tone of a pressed button that does not set its own.
   * @default 'primary'
   */
  selectedTone?: PinfoldTone;
  /** @default false */
  disabled?: boolean;
  dimensions?: ToolbarDimensions;
  /** @default false */
  unstyled?: boolean;
  className?: string;
  style?: React.CSSProperties;
}

export type ToolbarRootProps = Omit<React.HTMLAttributes<HTMLDivElement>, 'children' | 'onChange' | 'defaultValue'> & { [key: `data-${string}`]: unknown };
export type ToolbarTagProps = ToolbarConfig & Omit<ToolbarRootProps, keyof ToolbarConfig>;

export interface ToolbarApi {
  /** Focus the toolbar's tab stop. */
  focus: () => void;
  getRootProps: (props?: PropsBag) => PropsBag;
  render: (props?: ToolbarRootProps) => React.ReactElement;
}
export type ToolbarComponent = PinfoldComponent<ToolbarApi, ToolbarRootProps>;
