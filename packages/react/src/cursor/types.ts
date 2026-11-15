import type * as React from 'react';
import type { PinfoldSize, PinfoldTone, PropsBag } from '@pinfold/core';
import type { PinfoldComponent } from '../component';
import type { NoInfer, SlotOverrides } from '../types';

export type CursorSlot = 'root' | 'area' | 'dot' | 'follower' | 'trail' | 'label';
export type CursorVariant = 'dot-ring' | 'dot' | 'ring' | 'blob' | 'spotlight' | 'crosshair' | 'arrow';
export type CursorBuiltInState = 'default' | 'pointer' | 'text' | 'hidden';
/** What the pointer is over: plain content, something pressable, text, somewhere it hides, or a name from `data-cursor`. */
export type CursorPointerState = CursorBuiltInState | (string & {});

/** Style options for a specific cursor state. */
export interface CursorStateStyle {
  /** Text or element beside the pointer; element's attribute label overrides this. */
  label?: React.ReactNode | ((context: { element: Element }) => React.ReactNode);
  /** Your own pointer in place of the dot for this state. */
  shape?: React.ReactNode;
  /** Pointer variant for this state. */
  variant?: CursorVariant;
  /** Scale multiplier for the pointer and follower (e.g. 1.5, 2). */
  scale?: number;
  /** Color tone for this state. */
  tone?: PinfoldTone;
  /** Blend mode for this state. */
  blend?: 'normal' | 'difference';
  /** Hide native cursor for this state; overrides config.hideNative. */
  hideNative?: boolean;
  /** Class name added to the cursor root while this state is active. */
  className?: string;
}

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
export interface CursorConfig<S extends string = string> extends SlotOverrides<CursorSlot, CursorState> {
  /** The area the cursor belongs to. Without it the cursor covers the whole page. On the tag, `children` work too. */
  content?: React.ReactNode;
  /** @default 'dot-ring' */
  variant?: CursorVariant;
  /** Your own pointer in place of the dot. */
  shape?: React.ReactNode;
  /** Text beside the pointer; an element's `data-cursor-label` replaces it while pointed at. */
  label?: React.ReactNode;
  /** The attribute name on elements that triggers cursor states. @default 'data-cursor' */
  attribute?: string;
  /** Styles per state (label, shape, variant, scale, tone, blend, hideNative, className). */
  states?: { readonly [K in S | CursorBuiltInState]?: CursorStateStyle };
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
  onStateChange?: (state: NoInfer<S> | CursorBuiltInState, element: Element | null) => void;
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
export type CursorTagProps<S extends string = string> = CursorConfig<S> & Omit<CursorRootProps, keyof CursorConfig<S> | 'children'> & { children?: React.ReactNode };

export interface CursorApi<S extends string = string> {
  visible: boolean;
  state: S | CursorBuiltInState;
  pressed: boolean;
  /** Where the pointer is, in viewport px; `null` before it has moved. */
  getPosition: () => { x: number; y: number } | null;
  getRootProps: (props?: PropsBag) => PropsBag;
  render: (props?: CursorRootProps & { children?: React.ReactNode }) => React.ReactElement;
}
export type CursorComponent<S extends string = string> = PinfoldComponent<CursorApi<S>, CursorRootProps & { children?: React.ReactNode }>;
