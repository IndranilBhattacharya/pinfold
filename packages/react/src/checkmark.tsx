import * as React from 'react';
import { cn, type PinfoldSize, type PinfoldTone } from '@pinfold/core';

const CHECK = (
  <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round" focusable="false">
    <path className="pinfold-checkbox__check" d="M3.5 8.5l3 3 6-7" pathLength={1} />
    <path className="pinfold-checkbox__dash" d="M4 8h8" pathLength={1} />
  </svg>
);

/**
 * A native checkbox (or radio) drawn as Pinfold's: the input stays (forms, keyboard, `indeterminate`),
 * the box and the mark are the Checkbox's (or Radio's) own. Light enough for every row of a grid.
 */
export const CheckMark = React.forwardRef<HTMLInputElement, Omit<React.InputHTMLAttributes<HTMLInputElement>, 'size' | 'type'> & { type?: 'checkbox' | 'radio'; size?: PinfoldSize; tone?: PinfoldTone }>(function CheckMark(
  { type = 'checkbox', size = 'sm', tone, className, ...input },
  ref,
) {
  const kind = type === 'radio' ? 'radio' : 'checkbox';
  return (
    <span className={cn(`pinfold-${kind} pinfold-checkmark`, className)} data-size={size} data-tone={tone} data-animate={kind === 'radio' ? 'spring' : 'draw'}>
      <span className="pinfold-choice__control">
        <input ref={ref} type={kind} className={`pinfold-choice__input pinfold-${kind}__input`} {...input} />
        <span className={`pinfold-choice__box pinfold-${kind}__box`} aria-hidden="true">
          {kind === 'checkbox' ? CHECK : null}
        </span>
      </span>
    </span>
  );
});
