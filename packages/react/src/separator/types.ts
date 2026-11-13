import type * as React from 'react';
import type { Length, PropsBag } from '@pinfold/core';
import type { PinfoldComponent } from '../component';
import type { SlotOverrides } from '../types';

export type SeparatorSlot = 'root' | 'line' | 'label';
export type SeparatorOrientation = 'horizontal' | 'vertical';
export type SeparatorVariant = 'solid' | 'dashed' | 'dotted' | 'gradient';
export type SeparatorContrast = 'subtle' | 'normal' | 'strong';
export type SeparatorThickness = 'thin' | 'medium' | 'thick';
export type SeparatorSpacing = 'none' | 'sm' | 'md' | 'lg';

/** Passed to slot `render` overrides. */
export interface SeparatorState {
  orientation: SeparatorOrientation;
  variant: SeparatorVariant;
  contrast: SeparatorContrast;
  thickness: SeparatorThickness;
  labelled: boolean;
}

export interface SeparatorDimensions {
  thickness?: Length;
  spacing?: Length;
  length?: Length;
}

/**
 *   const Or = defineSeparator({ label: 'or', spacing: 'lg' });
 *   <Or />
 */
export interface SeparatorConfig extends SlotOverrides<SeparatorSlot, SeparatorState> {
  /** Text in the line, e.g. "or", or any node. Horizontal and vertical. */
  label?: React.ReactNode;
  /** @default 'horizontal' */
  orientation?: SeparatorOrientation;
  /**
   * Line style. `gradient` fades out towards the ends (and away from a label).
   * @default 'solid'
   */
  variant?: SeparatorVariant;
  /**
   * How much the line and its label stand out.
   * @default 'normal'
   */
  contrast?: SeparatorContrast;
  /**
   * Line weight: the theme border width, twice it, or four times it. `dimensions.thickness` sets an exact one.
   * @default 'thin'
   */
  thickness?: SeparatorThickness;
  /** @default 'center' */
  labelPosition?: 'start' | 'center' | 'end';
  /** @default 'none' */
  spacing?: SeparatorSpacing;
  /**
   * Hidden from assistive tech. `false` makes it a `role="separator"`.
   * @default true
   */
  decorative?: boolean;
  dimensions?: SeparatorDimensions;
  /** @default false */
  unstyled?: boolean;
  className?: string;
  style?: React.CSSProperties;
}

export type SeparatorRootProps = Omit<React.HTMLAttributes<HTMLDivElement>, 'children'> & { [key: `data-${string}`]: unknown };
export type SeparatorTagProps = SeparatorConfig & Omit<SeparatorRootProps, keyof SeparatorConfig>;

export interface SeparatorApi {
  getRootProps: (props?: PropsBag) => PropsBag;
  render: (props?: SeparatorRootProps) => React.ReactElement;
}
export type SeparatorComponent = PinfoldComponent<SeparatorApi, SeparatorRootProps>;
