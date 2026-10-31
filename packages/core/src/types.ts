import type * as React from 'react';

/** Shared scale used by every Lumae component. */
export type LumaeSize = 'sm' | 'md' | 'lg';
export type LumaeRadius = 'none' | 'sm' | 'md' | 'lg' | 'full';
export type LumaeTone = 'neutral' | 'primary' | 'success' | 'warning' | 'danger' | 'info';
export type LumaeOrientation = 'horizontal' | 'vertical';
export type LumaeDir = 'ltr' | 'rtl';
export type LumaeTheme = 'light' | 'dark' | 'system';

/** Any DOM props bag a component hands back from a `getXProps()` call. */
export type PropsBag = Record<string, any>;

/**
 * Per-slot escape hatches. Every Lumae component exposes the same three, so
 * learning one component teaches all of them.
 *
 * - `classNames` — append a class to one slot.
 * - `slotProps`  — merge arbitrary DOM props into one slot (event handlers chain).
 * - `styles`     — inline style for one slot.
 * - `render`     — replace one slot's element entirely, keeping its behaviour props.
 */
export interface SlotOverrides<Slot extends string, State = unknown> {
  classNames?: Partial<Record<Slot, string>>;
  styles?: Partial<Record<Slot, React.CSSProperties>>;
  slotProps?: Partial<Record<Slot, PropsBag>>;
  render?: Partial<Record<Slot, SlotRenderer<State>>>;
}

/** A CSS length. Numbers are px, strings pass through (`'50%'`, `'12rem'`, `calc()`). */
export type Length = number | string;

export type SlotRenderer<State = unknown> = (args: {
  /** Behaviour props (ARIA, handlers, refs). Spread these or accessibility breaks. */
  props: PropsBag;
  /** Live component state for this slot. */
  state: State;
  children: React.ReactNode;
}) => React.ReactNode;
