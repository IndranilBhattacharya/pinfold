import type * as React from 'react';
import { cn, mergeProps } from './utils';
import type { PropsBag, SlotOverrides } from './types';

/**
 * Fold a slot's `classNames`, `styles` and `slotProps` overrides into the
 * behaviour props a component generated. Handlers chain, classes concatenate,
 * styles merge.
 */
export function slotProps<Slot extends string, State>(
  overrides: SlotOverrides<Slot, State> | undefined,
  slot: Slot,
  base: PropsBag,
): PropsBag {
  if (!overrides) return base;
  const extraClass = overrides.classNames?.[slot];
  const extraStyle = overrides.styles?.[slot];
  let next = base;
  if (extraClass) next = { ...next, className: cn(next.className, extraClass) };
  if (extraStyle) next = { ...next, style: { ...next.style, ...extraStyle } };
  return mergeProps(next, overrides.slotProps?.[slot]);
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
