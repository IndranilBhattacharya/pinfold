import type * as React from 'react';

/** Shared scale used by every Knot component. */
export type KnotSize = 'sm' | 'md' | 'lg';
export type KnotRadius = 'none' | 'sm' | 'md' | 'lg' | 'full';
export type KnotTone = 'neutral' | 'primary' | 'success' | 'warning' | 'danger' | 'info';
export type KnotOrientation = 'horizontal' | 'vertical';
export type KnotDir = 'ltr' | 'rtl';
export type KnotTheme = 'light' | 'dark' | 'system';

/** Any DOM props bag a component hands back from a `getXProps()` call. */
export type PropsBag = Record<string, any>;

/**
 * Per-slot escape hatches. Every Knot component exposes the same three, so
 * learning one component teaches all of them.
 *
 * - `classNames` — append a class to one slot.
 * - `slotProps`  — merge arbitrary DOM props into one slot (event handlers chain).
 * - `render`     — replace one slot's element entirely, keeping its behaviour props.
 */
export interface SlotOverrides<Slot extends string, State = unknown> {
  classNames?: Partial<Record<Slot, string>>;
  slotProps?: Partial<Record<Slot, PropsBag>>;
  render?: Partial<Record<Slot, SlotRenderer<State>>>;
}

export type SlotRenderer<State = unknown> = (args: {
  /** Behaviour props (ARIA, handlers, refs). Spread these or accessibility breaks. */
  props: PropsBag;
  /** Live component state for this slot. */
  state: State;
  children: React.ReactNode;
}) => React.ReactNode;
