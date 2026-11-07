import type * as React from 'react';
import type { Length, PinfoldSize, PinfoldTone, PropsBag } from '@pinfold/core';
import type { PinfoldComponent } from '../component';
import type { SlotOverrides } from '../types';
import type { ButtonConfig, ButtonVariant } from '../button/types';

export type ToolbarSlot = 'root' | 'item';
export type ToolbarVariant = Exclude<ButtonVariant, 'link'>;

/** Passed to slot `render` overrides. */
export interface ToolbarState {
  attached: boolean;
  orientation: 'horizontal' | 'vertical';
  size: PinfoldSize;
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
  /** One button each. Each one's own settings win over the toolbar's. */
  items: readonly ButtonConfig[];
  /** @default true */
  attached?: boolean;
  /** @default 'horizontal' */
  orientation?: 'horizontal' | 'vertical';
  /** @default 'outline' */
  variant?: ToolbarVariant;
  /** @default 'md' */
  size?: PinfoldSize;
  /** @default 'neutral' */
  tone?: PinfoldTone;
  /** @default false */
  disabled?: boolean;
  dimensions?: ToolbarDimensions;
  /** @default false */
  unstyled?: boolean;
  className?: string;
  style?: React.CSSProperties;
}

export type ToolbarRootProps = Omit<React.HTMLAttributes<HTMLDivElement>, 'children'> & { [key: `data-${string}`]: unknown };
export type ToolbarTagProps = ToolbarConfig & Omit<ToolbarRootProps, keyof ToolbarConfig>;

export interface ToolbarApi {
  /** Focus the toolbar's tab stop. */
  focus: () => void;
  getRootProps: (props?: PropsBag) => PropsBag;
  render: (props?: ToolbarRootProps) => React.ReactElement;
}
export type ToolbarComponent = PinfoldComponent<ToolbarApi, ToolbarRootProps>;
