import type * as React from 'react';
import type { Length, PinfoldSize, PinfoldTone, PropsBag, RadiusOption } from '@pinfold/core';
import type { PinfoldComponent } from '../component';
import type { ChoiceRow, FieldConfig } from '../field';
import type { SlotOverrides } from '../types';

export type CheckboxSlot = 'root' | 'label' | 'items' | 'item' | 'input' | 'box' | 'itemLabel' | 'itemDescription' | 'description' | 'error';
export type CheckboxVariant = 'plain' | 'card';

/** One row of a group. */
export interface CheckboxItem extends ChoiceRow {
  /** The form value of this row. */
  value: string;
}

/** Passed to slot `render` overrides. */
export interface CheckboxState {
  size: PinfoldSize;
  tone: PinfoldTone;
  invalid: boolean;
  group: boolean;
}

export interface CheckboxDimensions {
  size?: Length;
  gap?: Length;
}

/**
 *   const Terms = defineCheckbox({ required: true });
 *   <Terms label="I accept the terms" name="terms" />
 *
 *   const Topics = defineCheckbox({ variant: 'card' });
 *   <Topics label="Topics" name="topics" items={[{ value: 'news', label: 'News' }]} />
 */
export interface CheckboxConfig extends FieldConfig, SlotOverrides<CheckboxSlot, CheckboxState> {
  /** Controlled state. */
  checked?: boolean;
  /** @default false */
  defaultChecked?: boolean;
  /** @default false */
  indeterminate?: boolean;
  /**
   * What the form submits when checked.
   * @default 'on'
   */
  formValue?: string;
  /** One checkbox: `boolean`. A group: the checked values. */
  onChange?: (value: any, event: React.ChangeEvent<HTMLInputElement>) => void;
  /** A group: one row each. `label` then names the group. */
  items?: readonly CheckboxItem[];
  /** Group: the checked values, controlled. */
  value?: readonly string[];
  /** Group: the checked values when uncontrolled. */
  defaultValue?: readonly string[];
  /** @default 'vertical' */
  orientation?: 'vertical' | 'horizontal';
  /** @default 'plain' */
  variant?: CheckboxVariant;
  /**
   * How the mark arrives: `draw` traces the tick, `pop` springs it in. Reduced motion and the
   * provider's `disableAnimation` turn it off.
   * @default 'draw'
   */
  animation?: 'draw' | 'pop' | 'none';
  /** Corner radius: a preset rescales every corner inside like the theme presets; a length (`12` is px) sets the frame. Default the theme radius. */
  radius?: RadiusOption;
  /** @default 'md' */
  size?: PinfoldSize;
  /** @default 'primary' */
  tone?: PinfoldTone;
  dimensions?: CheckboxDimensions;
  /** @default false */
  unstyled?: boolean;
  className?: string;
  style?: React.CSSProperties;
}

export type CheckboxRootProps = Omit<React.HTMLAttributes<HTMLElement>, 'children' | 'onChange' | 'defaultValue' | 'defaultChecked' | 'id'> & { [key: `data-${string}`]: unknown };
export type CheckboxTagProps = CheckboxConfig & Omit<CheckboxRootProps, keyof CheckboxConfig>;

export interface CheckboxApi {
  /** Focus the checkbox, or a group's first row. */
  focus: () => void;
  getRootProps: (props?: PropsBag) => PropsBag;
  render: (props?: CheckboxRootProps) => React.ReactElement;
}
export type CheckboxComponent = PinfoldComponent<CheckboxApi, CheckboxRootProps>;
