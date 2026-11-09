import type * as React from 'react';
import { cn, mergeProps, type PropsBag } from '@pinfold/core';
import type { SlotOverrides } from './types';

/**
 * Fold a slot's `classNames`, `styles` and `slotProps` overrides into the
 * behaviour props a component generated. Handlers chain, classes concatenate,
 * styles merge.
 */
export function slotProps<Slot extends string, State, Item = any>(
  overrides: SlotOverrides<Slot, State, Item> | undefined,
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
 * The repeating item (row, option, tab, day…) a slot belongs to. A view puts it in the slot's props
 * under this key; `renderSlot` hands it to a `render` override as `item`. React never sees it:
 * element creation and the DOM skip symbol keys.
 */
export const ITEM: unique symbol = Symbol('pinfold.item');

/**
 * Render a slot, letting the consumer swap the element while keeping every
 * accessibility prop. `defaultRender` is used when no override exists.
 */
export function renderSlot<Slot extends string, State, Item = any>(
  overrides: SlotOverrides<Slot, State, Item> | undefined,
  slot: Slot,
  props: PropsBag,
  state: State,
  children: React.ReactNode,
  defaultRender: (props: PropsBag, children: React.ReactNode) => React.ReactNode,
): React.ReactNode {
  const custom = overrides?.render?.[slot];
  if (custom) {
    const { [ITEM]: item, ...rest } = props as PropsBag & { [ITEM]?: unknown };
    return custom({ props: rest, state, children, item: item as Item });
  }
  return defaultRender(props, children);
}
