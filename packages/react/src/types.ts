import type * as React from 'react';
import type { PropsBag, Slottable as CoreSlottable } from '@pinfold/core';

/** A config field that is a node, or a function of live state returning one. */
export type Slottable<State, T = React.ReactNode> = CoreSlottable<State, T>;

/**
 * Per-slot escape hatches. Every Pinfold component exposes the same four, so
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

export type SlotRenderer<State = unknown> = (args: {
  /** Behaviour props (ARIA, handlers, refs). Spread these or accessibility breaks. */
  props: PropsBag;
  /** Live component state for this slot. */
  state: State;
  children: React.ReactNode;
}) => React.ReactNode;
