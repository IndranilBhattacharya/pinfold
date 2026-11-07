import * as React from 'react';
import { cn, dimensionVars, inactiveSkeletonOptions, mergeProps, skeletonLineWidths, warnOnce, type PropsBag } from '@pinfold/core';
import { usePinfold } from '../provider';
import { VISUALLY_HIDDEN } from '../a11y';
import { usePinfoldComponent } from '../component';
import { mergeConfig } from '../preset';
import { renderSlot, slotProps } from '../slots';
import type { SkeletonApi, SkeletonComponent, SkeletonConfig, SkeletonRootProps, SkeletonShape, SkeletonState } from './types';

/**
 * A placeholder that swaps to the real content, as a hook that hands back a component.
 *
 *   const Bio = useSkeleton({ lines: 3, loading: !data, content: <p>{data?.bio}</p> });
 *   return <Bio />;
 *
 * A layout is one config, not several components:
 *
 *   useSkeleton({ direction: 'row', items: [{ variant: 'circle' }, { lines: 2 }] });
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
    const inactive = inactiveSkeletonOptions({ variant: config.variant, items: config.items });
    for (const key in inactive) warnOnce((input as Record<string, unknown>)[key] !== undefined, `Skeleton: \`${key}\` has no visible effect here. ${inactive[key]}`);
  }

  const loading = config.loading ?? true;
  const variant = config.variant ?? 'text';
  const state: SkeletonState = { variant, size: config.size ?? ctx.size, loading };
  const animation = config.animation ?? 'shimmer';
  const composed = Array.isArray(config.items);

  const getRootProps = (props?: PropsBag): PropsBag =>
    mergeProps(
      {
        'aria-busy': loading || undefined,
        'data-variant': composed ? undefined : variant,
        'data-direction': composed ? config.direction ?? 'column' : undefined,
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
    if (!loading) return renderSlot(config, 'root', root, state, config.content ?? null, (p, c) => <div {...p}>{c}</div>) as React.ReactElement;

    // Lines count across the whole layout, so `stagger` ripples through it.
    let line = 0;
    const lines = (shape: SkeletonShape): React.ReactNode => {
      const shapeVariant = shape.variant ?? 'text';
      const widths = shapeVariant === 'text' ? skeletonLineWidths(shape.lines ?? 1) : ['100%'];
      return widths.map((width, i) => {
        const style = { ...(shapeVariant === 'text' ? { inlineSize: width } : null), '--pinfold-skel-i': line++ } as React.CSSProperties;
        return <React.Fragment key={i}>{renderSlot(config, 'line', slotProps(config, 'line', { className: cls('pinfold-skeleton__line'), 'aria-hidden': true, style }), state, null, (p) => <span {...p} />)}</React.Fragment>;
      });
    };
    const shapeOf = (shape: SkeletonShape, key: number): React.ReactNode => (
      <div
        key={key}
        className={cls('pinfold-skeleton__shape')}
        data-variant={shape.items ? undefined : shape.variant ?? 'text'}
        data-direction={shape.items ? shape.direction ?? 'column' : undefined}
        data-size={shape.size ?? state.size}
        style={dimensionVars('skeleton', shape.dimensions)}
      >
        {shape.items ? shape.items.map(shapeOf) : lines(shape)}
      </div>
    );
    const content = (
      <>
        {composed ? config.items!.map(shapeOf) : lines(config)}
        {config.label ? <span style={VISUALLY_HIDDEN}>{config.label}</span> : null}
      </>
    );
    return renderSlot(config, 'root', root, state, content, (p, c) => <div {...p}>{c}</div>) as React.ReactElement;
  };

  const api: SkeletonApi = { loading, getRootProps, render };
  return usePinfoldComponent<SkeletonApi, SkeletonRootProps>('Skeleton', api, (props) => render(props));
}
