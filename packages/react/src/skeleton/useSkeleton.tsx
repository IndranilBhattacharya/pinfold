import * as React from 'react';
import { cn, dimensionVars, inactiveSkeletonOptions, mergeProps, skeletonLineWidths, warnOnce, type PropsBag } from '@pinfold/core';
import { usePinfold } from '../provider';
import { usePinfoldComponent } from '../component';
import { mergeConfig } from '../preset';
import { renderSlot, slotProps } from '../slots';
import type { SkeletonApi, SkeletonComponent, SkeletonConfig, SkeletonRootProps, SkeletonState } from './types';

/** Visually hidden but read. Inline, so it holds in unstyled mode too. */
const SPOKEN: React.CSSProperties = { position: 'absolute', width: 1, height: 1, padding: 0, margin: -1, overflow: 'hidden', clip: 'rect(0 0 0 0)', whiteSpace: 'nowrap', border: 0 };

/**
 * A placeholder that swaps to the real content, as a hook that hands back a component.
 *
 *   const Bio = useSkeleton({ lines: 3, loading: !data, content: <p>{data?.bio}</p> });
 *   return <Bio />;
 *
 * Precedence: this config, then `defaults.skeleton`, then the provider (size), then the library default.
 */
export function useSkeleton(input: SkeletonConfig = {}): SkeletonComponent {
  const ctx = usePinfold();
  const config = ctx.defaults.skeleton ? mergeConfig<SkeletonConfig>(ctx.defaults.skeleton, input) : input;

  if (process.env.NODE_ENV !== 'production') {
    void import('@pinfold/core/meta').then(({ skeletonMeta, validateConfig }) => {
      for (const problem of validateConfig(skeletonMeta, input)) warnOnce(true, problem.message);
    });
    // Static mistakes only: `lines` on a non-text shape (loading flips at runtime, so it never warns).
    const inactive = inactiveSkeletonOptions({ variant: config.variant });
    for (const key in inactive) warnOnce((input as Record<string, unknown>)[key] !== undefined, `Skeleton: \`${key}\` has no visible effect here. ${inactive[key]}`);
  }

  const loading = config.loading ?? true;
  const variant = config.variant ?? 'text';
  const state: SkeletonState = { variant, size: config.size ?? ctx.size, loading };
  const animation = config.animation ?? 'pulse';

  const getRootProps = (props?: PropsBag): PropsBag =>
    mergeProps(
      {
        'aria-busy': loading || undefined,
        'data-variant': variant,
        'data-size': state.size,
        'data-animation': animation,
        'data-loading': loading ? '' : undefined,
        // The shimmer is decoration: off with the provider's disableAnimation (and reduced motion, in CSS).
        'data-animate': loading && animation !== 'none' && !ctx.disableAnimation ? '' : undefined,
        'data-unstyled': config.unstyled ? '' : undefined,
      },
      props,
    );

  const render = (rootProps?: SkeletonRootProps): React.ReactElement => {
    const cls = (name: string) => (config.unstyled ? undefined : name);
    const vars = dimensionVars('skeleton', config.dimensions);
    const root = slotProps(
      config,
      'root',
      getRootProps(mergeProps({ className: config.unstyled ? config.className : cn('pinfold pinfold-skeleton', config.className), style: vars || config.style ? { ...vars, ...config.style } : undefined }, rootProps)),
    );
    let content: React.ReactNode;
    if (!loading) {
      content = config.content ?? null;
    } else {
      const widths = variant === 'text' ? skeletonLineWidths(config.lines ?? 1) : ['100%'];
      content = (
        <>
          {widths.map((width, i) => (
            <React.Fragment key={i}>
              {renderSlot(config, 'line', slotProps(config, 'line', { className: cls('pinfold-skeleton__line'), 'aria-hidden': true, style: variant === 'text' ? { inlineSize: width } : undefined }), state, null, (p) => <span {...p} />)}
            </React.Fragment>
          ))}
          {config.label ? <span style={SPOKEN}>{config.label}</span> : null}
        </>
      );
    }
    return renderSlot(config, 'root', root, state, content, (p, c) => <div {...p}>{c}</div>) as React.ReactElement;
  };

  const api: SkeletonApi = { loading, getRootProps, render };
  return usePinfoldComponent<SkeletonApi, SkeletonRootProps>('Skeleton', api, (props) => render(props));
}
