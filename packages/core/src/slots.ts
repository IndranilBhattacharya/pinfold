import type * as React from 'react';
import { cn, mergeProps } from './utils';
import type { PropsBag, SlotOverrides } from './types';

/**
 * Fold a slot's `classNames` and `slotProps` overrides into the behaviour
 * props a component generated. Handlers chain, classes concatenate.
 */
export function slotProps<Slot extends string, State>(
  overrides: SlotOverrides<Slot, State> | undefined,
  slot: Slot,
  base: PropsBag,
): PropsBag {
  if (!overrides) return base;
  const extraClass = overrides.classNames?.[slot];
  const withClass = extraClass ? { ...base, className: cn(base.className, extraClass) } : base;
  return mergeProps(withClass, overrides.slotProps?.[slot]);
}

/**
 * Render a slot, letting the consumer swap the element while keeping every
 * accessibility prop. `defaultRender` is used when no override exists.
 */
export function renderSlot<Slot extends string, State>(
  overrides: SlotOverrides<Slot, State> | undefined,
  slot: Slot,
  props: PropsBag,
  state: State,
  children: React.ReactNode,
  defaultRender: (props: PropsBag, children: React.ReactNode) => React.ReactNode,
): React.ReactNode {
  const custom = overrides?.render?.[slot];
  if (custom) return custom({ props, state, children });
  return defaultRender(props, children);
}
