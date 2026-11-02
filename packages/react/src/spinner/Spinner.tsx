import * as React from 'react';
import { cn, dataAttr, dimensionVars, type PropsBag } from '@pinfold/core';
import { renderSlot, slotProps } from '../slots';
import type { SpinnerProps, SpinnerState } from './types';

/**
 * An indeterminate loading indicator.
 *
 *   <Spinner />                 // role="status", announced as "Loading"
 *   <Spinner label="" />        // decorative, next to visible text
 *
 * A stateless atom: server-safe, no client JavaScript of its own.
 */
export const Spinner = React.forwardRef<HTMLSpanElement, SpinnerProps>(function Spinner(props, ref) {
  const { size, tone, label = 'Loading', dimensions, unstyled = false, className, style, classNames, styles, slotProps: slotOverrides, render, ...rest } = props;
  const overrides = { classNames, styles, slotProps: slotOverrides, render };
  const decorative = label === '';
  const state: SpinnerState = { decorative };
  const vars = dimensionVars('spinner', dimensions);

  const root: PropsBag = {
    ...rest,
    ref,
    role: decorative ? undefined : 'status',
    'aria-label': decorative ? undefined : label,
    'aria-hidden': decorative || undefined,
    className: unstyled ? className : cn('pinfold pinfold-spinner', className),
    style: vars || style ? { ...vars, ...style } : undefined,
    'data-size': size,
    'data-tone': tone,
    // Opts out of the reset's reduced-motion kill: it slows down instead of freezing.
    'data-motion': 'essential',
    'data-unstyled': dataAttr(unstyled),
  };

  return renderSlot(overrides, 'root', slotProps(overrides, 'root', root), state, null, (p) => <span {...p} />) as React.ReactElement;
});
