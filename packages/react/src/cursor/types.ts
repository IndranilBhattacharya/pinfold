import type * as React from 'react';
import type { PinfoldSize, PinfoldTone, PropsBag } from '@pinfold/core';
import type { PinfoldComponent } from '../component';
import type { SlotOverrides } from '../types';

export type CursorSlot = 'root' | 'area' | 'dot' | 'follower' | 'trail' | 'label';
export type CursorVariant = 'dot-ring' | 'dot' | 'ring' | 'blob' | 'spotlight' | 'crosshair' | 'arrow';
/** What the pointer is over: plain content, something pressable, text, somewhere it hides, or a name from `data-cursor`. */
export type CursorPointerState = 'default' | 'pointer' | 'text' | 'hidden' | (string & {});

/** Passed to slot `render` overrides. */
export interface CursorState {
  variant: CursorVariant;
  size: PinfoldSize;
  tone: PinfoldTone;
  /** The pointer is inside the area. */
  visible: boolean;
  state: CursorPointerState;
  pressed: boolean;
}

/**
 *   const Pointer = defineCursor({ variant: 'dot-ring' });
 *   <Pointer />                                   // the whole page
 *   <Pointer variant="blob"><Gallery /></Pointer>  // one area
 */
export interface CursorConfig extends SlotOverrides<CursorSlot, CursorState> {
  /** The area the cursor belongs to. Without it the cursor covers the whole page. On the tag, `children` work too. */
  content?: React.ReactNode;
  /** @default 'dot-ring' */
  variant?: CursorVariant;
  /** Your own pointer in place of the dot. */
  shape?: React.ReactNode;
  /** Text beside the pointer; an element's `data-cursor-label` replaces it while pointed at. */
  label?: React.ReactNode;
  /** How far the follower lags, 0 (glued) to 0.95 (very loose). @default 0.8 */
  smoothing?: number;
  /** Dots that follow in a fading line, 0 to 12. @default 0 */
  trail?: number;
  /** `difference` inverts what is under the pointer. @default 'normal' */
  blend?: 'normal' | 'difference';
  /** Hide the system cursor inside the area (never over text fields). Default on, off for the spotlight. */
  hideNative?: boolean;
  /** A CSS selector for what counts as pressable. Default links, buttons and anything focusable. */
  interactive?: string;
  /** @default false */
  disabled?: boolean;
  onStateChange?: (state: CursorPointerState, element: Element | null) => void;
  onVisibleChange?: (visible: boolean) => void;
  /** @default 'md' */
  size?: PinfoldSize;
  /** @default 'primary' */
  tone?: PinfoldTone;
  /** @default false */
  unstyled?: boolean;
  className?: string;
  style?: React.CSSProperties;
}

export type CursorRootProps = React.HTMLAttributes<HTMLDivElement> & { [key: `data-${string}`]: unknown };
export type CursorTagProps = CursorConfig & Omit<CursorRootProps, keyof CursorConfig | 'children'> & { children?: React.ReactNode };

export interface CursorApi {
  visible: boolean;
  state: CursorPointerState;
  pressed: boolean;
  /** Where the pointer is, in viewport px; `null` before it has moved. */
  getPosition: () => { x: number; y: number } | null;
  getRootProps: (props?: PropsBag) => PropsBag;
  render: (props?: CursorRootProps & { children?: React.ReactNode }) => React.ReactElement;
}
export type CursorComponent = PinfoldComponent<CursorApi, CursorRootProps & { children?: React.ReactNode }>;
