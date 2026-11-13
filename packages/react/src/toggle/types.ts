import type * as React from 'react';
import type { Length, PinfoldSize, PinfoldTone, PropsBag, RadiusOption } from '@pinfold/core';
import type { PinfoldComponent } from '../component';
import type { SlotOverrides } from '../types';

export type ToggleSlot = 'root' | 'label' | 'items' | 'item' | 'indicator' | 'icon' | 'text';
export type ToggleVariant = 'segmented' | 'solid' | 'soft' | 'outline' | 'ghost';

/** One button of a group. */
export interface ToggleItem {
  /** The value this button stands for. */
  value: string;
  /** The text, and the name when `iconOnly`. */
  label: React.ReactNode;
  icon?: React.ReactNode;
  /** @default false */
  iconOnly?: boolean;
  /** @default false */
  disabled?: boolean;
}

/** Passed to slot `render` overrides. */
export interface ToggleState {
  variant: ToggleVariant;
  size: PinfoldSize;
  tone: PinfoldTone;
  group: boolean;
  /** The selected values; one toggle: `['on']` while pressed. */
  value: string[];
}

export interface ToggleDimensions {
  height?: Length;
  paddingX?: Length;
}

/**
 *   const View = defineToggle({ fullWidth: true });
 *   <View label="View" defaultValue={['list']} items={[{ value: 'list', label: 'List' }, { value: 'board', label: 'Board' }]} />
 *
 *   const Pin = defineToggle({ variant: 'outline' });
 *   <Pin label="Pin" onChange={setPinned} />
 */
/** One button of the group as you wrote it, its position and whether it is on. `render` overrides of the repeating parts get it as `item`. */
export type ToggleItemContext = ToggleItem & { index: number; selected: boolean };

export interface ToggleConfig extends SlotOverrides<ToggleSlot, ToggleState, ToggleItemContext> {
  /** One toggle: its text and name. A group: the group name. */
  label: React.ReactNode;
  /**
   * A group: keep its name for screen readers only.
   * @default true
   */
  hideLabel?: boolean;
  /** One toggle: controlled state. */
  pressed?: boolean;
  /** @default false */
  defaultPressed?: boolean;
  /** One toggle: an icon before the text. */
  icon?: React.ReactNode;
  /** @default false */
  iconOnly?: boolean;
  /** A group: one button each. */
  items?: readonly ToggleItem[];
  /** @default 'single' */
  selection?: 'single' | 'multiple';
  /** A group: the selected values, controlled. */
  value?: readonly string[];
  /** A group: the selected values when uncontrolled. */
  defaultValue?: readonly string[];
  /** @default false */
  allowEmpty?: boolean;
  /**
   * One toggle: `(pressed, event)`. A group: `(values, event)`. A method signature on purpose: a
   * handler typed for its mode, `(values: string[]) => …`, is accepted.
   */
  onChange?(value: boolean | string[], event: React.MouseEvent | React.KeyboardEvent): void;
  /** Submit the selection with a form. */
  name?: string;
  /** @default false */
  disabled?: boolean;
  /** @default 'horizontal' */
  orientation?: 'horizontal' | 'vertical';
  /** @default false */
  fullWidth?: boolean;
  /** @default 'segmented' */
  variant?: ToggleVariant;
  /** Corner radius: a preset rescales every corner inside like the theme presets; a length (`12` is px) sets the frame. Default the theme radius. */
  radius?: RadiusOption;
  /** @default 'md' */
  size?: PinfoldSize;
  /** @default 'primary' */
  tone?: PinfoldTone;
  dimensions?: ToggleDimensions;
  /** @default false */
  unstyled?: boolean;
  className?: string;
  style?: React.CSSProperties;
}

export type ToggleRootProps = Omit<React.HTMLAttributes<HTMLElement>, 'children' | 'onChange' | 'defaultValue'> & { [key: `data-${string}`]: unknown };
export type ToggleTagProps = ToggleConfig & Omit<ToggleRootProps, keyof ToggleConfig>;

export interface ToggleApi {
  /** The selected values; one toggle: `['on']` while pressed. */
  value: string[];
  /** Set the selection (one toggle: `['on']` or `[]`). */
  setValue: (value: string[]) => void;
  focus: () => void;
  getRootProps: (props?: PropsBag) => PropsBag;
  render: (props?: ToggleRootProps) => React.ReactElement;
}
export type ToggleComponent = PinfoldComponent<ToggleApi, ToggleRootProps>;
