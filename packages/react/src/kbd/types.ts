import type * as React from 'react';
import type { KbdDisplay, KbdOs, Length, PinfoldSize, PropsBag } from '@pinfold/core';
import type { PinfoldComponent } from '../component';
import type { SlotOverrides } from '../types';

export type KbdSlot = 'root' | 'key' | 'separator';
export type KbdVariant = 'outline' | 'solid' | 'ghost';

/** Passed to slot `render` overrides. */
export interface KbdState {
  variant: KbdVariant;
  size: PinfoldSize;
  /** The platform the keys are shown for (`other` on the server and the first client render). */
  os: KbdOs;
  symbols: boolean;
}

export interface KbdDimensions {
  height?: Length;
  paddingX?: Length;
  gap?: Length;
  fontSize?: Length;
}

/**
 *   const Shortcut = defineKbd({ size: 'sm' });
 *   <Shortcut keys={['mod', 'k']} />     // ⌘K on a Mac, Ctrl + K elsewhere
 */
export interface KbdConfig extends SlotOverrides<KbdSlot, KbdState> {
  /** The keys, e.g. `['mod', 'shift', 'p']`. `mod` is Command on Apple platforms, Ctrl elsewhere. */
  keys: readonly string[];
  /** @default 'outline' */
  variant?: KbdVariant;
  /** @default 'md' */
  size?: PinfoldSize;
  /**
   * `auto`: symbols on Apple platforms, words elsewhere.
   * @default 'auto'
   */
  display?: KbdDisplay;
  /**
   * Between keys in text display.
   * @default '+'
   */
  separator?: string;
  dimensions?: KbdDimensions;
  /** @default false */
  unstyled?: boolean;
  className?: string;
  style?: React.CSSProperties;
}

export type KbdRootProps = Omit<React.HTMLAttributes<HTMLElement>, 'children'> & { [key: `data-${string}`]: unknown };
export type KbdTagProps = KbdConfig & Omit<KbdRootProps, keyof KbdConfig>;

export interface KbdApi {
  getRootProps: (props?: PropsBag) => PropsBag;
  render: (props?: KbdRootProps) => React.ReactElement;
}
export type KbdComponent = PinfoldComponent<KbdApi, KbdRootProps>;
