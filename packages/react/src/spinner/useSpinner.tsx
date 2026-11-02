import * as React from 'react';
import { cn, dataAttr, dimensionVars, mergeProps, warnOnce, type PropsBag } from '@pinfold/core';
import { usePinfold } from '../provider';
import { usePinfoldComponent } from '../component';
import { renderSlot, slotProps } from '../slots';
import type { SpinnerApi, SpinnerComponent, SpinnerConfig, SpinnerRootProps, SpinnerState } from './types';

/**
 * An indeterminate loading indicator, as a hook that hands back a component.
 *
 *   const Loading = useSpinner({ label: 'Loading invoices' });
 *   return <Loading />;          // role="status", announced once
 *
 * Precedence: this config, then `defaults.spinner`, then the provider (size, tone), then the
 * library default. `tone: 'current'` follows the surrounding text colour.
 */
export function useSpinner(input: SpinnerConfig = {}): SpinnerComponent {
  const ctx = usePinfold();
  const config: SpinnerConfig = ctx.defaults.spinner ? { ...ctx.defaults.spinner, ...defined(input) } : input;

  if (process.env.NODE_ENV !== 'production') {
    void import('@pinfold/core/meta').then(({ spinnerMeta, validateConfig }) => {
      for (const problem of validateConfig(spinnerMeta, input)) warnOnce(true, problem.message);
    });
  }

  const label = config.label ?? 'Loading';
  const state: SpinnerState = { size: config.size ?? ctx.size, tone: config.tone ?? ctx.tone, decorative: label === '' };

  const getRootProps = (props?: PropsBag): PropsBag =>
    mergeProps(
      {
        role: state.decorative ? undefined : 'status',
        'aria-label': state.decorative ? undefined : label,
        'aria-hidden': state.decorative || undefined,
        'data-size': state.size,
        'data-tone': state.tone,
        // Opts out of the reset's reduced-motion kill: it slows down instead of freezing.
        'data-motion': 'essential',
        'data-unstyled': dataAttr(config.unstyled),
      },
      props,
    );

  const render = (rootProps?: SpinnerRootProps): React.ReactElement => {
    const vars = dimensionVars('spinner', config.dimensions);
    const root = slotProps(
      config,
      'root',
      getRootProps(
        mergeProps(
          {
            className: config.unstyled ? config.className : cn('pinfold pinfold-spinner', config.className),
            style: vars || config.style ? { ...vars, ...config.style } : undefined,
          },
          rootProps,
        ),
      ),
    );
    return renderSlot(config, 'root', root, state, null, (p) => <span {...p} />) as React.ReactElement;
  };

  const api: SpinnerApi = { getRootProps, render };
  return usePinfoldComponent<SpinnerApi, SpinnerRootProps>('Spinner', api, (props) => render(props));
}

function defined<T extends object>(obj: T): Partial<T> {
  const out: Partial<T> = {};
  for (const k in obj) if (obj[k] !== undefined) out[k] = obj[k];
  return out;
}
