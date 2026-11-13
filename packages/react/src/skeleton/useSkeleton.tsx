import * as React from 'react';
import {
  cn,
  dimensionVars,
  inactiveSkeletonOptions,
  mergeProps,
  normalizeSkeletonLayout,
  skeletonLineWidths,
  skeletonPreset,
  validateSkeletonLayout,
  warnOnce,
  type PropsBag,
  type SkeletonBone,
  type SkeletonNode,
} from '@pinfold/core';
import { usePinfold } from '../provider';
import { VISUALLY_HIDDEN } from '../a11y';
import { usePinfoldComponent } from '../component';
import { mergeConfig } from '../preset';
import { ITEM, renderSlot, slotProps } from '../slots';
import type { SkeletonApi, SkeletonComponent, SkeletonConfig, SkeletonRootProps, SkeletonShape, SkeletonState } from './types';

/** A single-shape config as one layout node, so `count` can repeat it. */
function nodeOf(config: SkeletonConfig): SkeletonNode {
  const variant = config.variant ?? 'text';
  const ratio = config.ratio;
  if (variant === 'text') return { text: Math.max(1, config.lines ?? 1), last: config.lastLine };
  return { [variant]: true, ratio } as unknown as SkeletonNode;
}

/**
 * A placeholder that swaps to the real content, as a hook that hands back a component.
 *
 *   const Bio = useSkeleton({ lines: 3, loading: !data, content: <p>{data?.bio}</p> });
 *   return <Bio />;
 *
 * A layout is one config, not several components: a preset, or any layout as data.
 *
 *   useSkeleton({ preset: 'list', rows: 5 });
 *   useSkeleton({ layout: [{ row: [{ circle: 40 }, { stack: [{ line: '60%' }, { line: '40%' }] }] }] });
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
    // Static mistakes only (loading flips at runtime, so it never warns).
    const inactive = inactiveSkeletonOptions({ variant: config.variant, items: config.items, layout: config.layout, preset: config.preset, ratio: config.ratio });
    for (const key in inactive) warnOnce((input as Record<string, unknown>)[key] !== undefined, `Skeleton: \`${key}\` has no visible effect here. ${inactive[key]}`);
    if (config.layout !== undefined) for (const problem of validateSkeletonLayout(config.layout)) warnOnce(true, `Skeleton: ${problem}`);
  }

  const loading = config.loading ?? true;
  const variant = config.variant ?? 'text';
  const state: SkeletonState = { variant, size: config.size ?? ctx.size, loading };
  const animation = config.animation ?? 'shimmer';
  const count = Math.max(1, Math.floor(config.count ?? 1));
  // Which form draws it: a layout (written, a preset, or copies), the earlier `items`, or one shape.
  const nodes: readonly SkeletonNode[] | null = config.layout
    ? config.layout
    : config.preset
      ? skeletonPreset(config.preset, { count: config.count, rows: config.rows ?? (config.preset === 'text' && config.lines && config.lines > 1 ? config.lines : undefined), columns: config.columns })
      : !Array.isArray(config.items) && count > 1
        ? [{ grid: Array.from({ length: count }, () => nodeOf(config)), columns: Math.max(1, Math.min(count, config.columns ?? 1)), gap: '1rem' }]
        : null;
  const laidOut = nodes !== null;
  const composed = !laidOut && Array.isArray(config.items);

  const getRootProps = (props?: PropsBag): PropsBag =>
    mergeProps(
      {
        'aria-busy': loading || undefined,
        'data-variant': composed || laidOut ? undefined : variant,
        'data-direction': composed ? config.direction ?? 'column' : undefined,
        'data-preset': config.layout ? undefined : config.preset,
        'data-layout': laidOut ? '' : undefined,
        'data-size': state.size,
        'data-animation': animation,
        'data-loading': loading ? '' : undefined,
        'data-ratio': !laidOut && !composed && config.ratio !== undefined && variant !== 'text' ? '' : undefined,
        // The shimmer is decoration: off with the provider's disableAnimation (and reduced motion, in CSS).
        'data-animate': loading && animation !== 'none' && !ctx.disableAnimation ? '' : undefined,
        'data-unstyled': config.unstyled ? '' : undefined,
      },
      props,
    );

  const render = (rootProps?: SkeletonRootProps): React.ReactElement => {
    const { children, ...attributes } = rootProps ?? {};
    const cls = (name: string) => (config.unstyled ? undefined : name);
    const vars = { ...dimensionVars('skeleton', config.dimensions), ...(config.ratio !== undefined ? { '--pinfold-skel-ratio': String(config.ratio) } : null) };
    const hasVars = Object.keys(vars).length > 0;
    const root = slotProps(
      config,
      'root',
      getRootProps(mergeProps({ className: config.unstyled ? config.className : cn('pinfold pinfold-skeleton', config.className), style: hasVars || config.style ? { ...vars, ...config.style } : undefined }, attributes as PropsBag)),
    );
    if (!loading) return renderSlot(config, 'root', root, state, config.content ?? children ?? null, (p, c) => <div {...p}>{c}</div>) as React.ReactElement;

    // Lines count across the whole layout, so `stagger` ripples through it.
    let index = 0;
    const line = (key: number, style?: React.CSSProperties) =>
      renderSlot(
        config,
        'line',
        slotProps(config, 'line', { className: cls('pinfold-skeleton__line'), 'aria-hidden': true, style: { ...style, '--pinfold-skel-i': index++ } as React.CSSProperties }),
        state,
        null,
        (p) => <span key={key} {...p} />,
      );
    const shape = (key: number, props: PropsBag, content: React.ReactNode) =>
      <React.Fragment key={key}>{renderSlot(config, 'shape', slotProps(config, 'shape', { className: cls('pinfold-skeleton__shape'), ...props }), state, content, (p, c) => <div {...p}>{c}</div>)}</React.Fragment>;

    // The earlier `items` form, unchanged.
    const lines = (one: SkeletonShape | SkeletonConfig): React.ReactNode => {
      const kind = one.variant ?? 'text';
      const widths = kind === 'text' ? skeletonLineWidths(one.lines ?? 1, (one as SkeletonConfig).lastLine) : ['100%'];
      return widths.map((width, i) => line(i, kind === 'text' ? { inlineSize: width } : undefined));
    };
    const item = (one: SkeletonShape, key: number): React.ReactNode =>
      shape(
        key,
        {
          'data-variant': one.items ? undefined : one.variant ?? 'text',
          'data-direction': one.items ? one.direction ?? 'column' : undefined,
          'data-size': one.size ?? state.size,
          style: dimensionVars('skeleton', one.dimensions),
          [ITEM]: one,
        },
        one.items ? one.items.map(item) : lines(one),
      );

    // The layout form: one wrapper per node, painted lines inside the leaves.
    const bone = (b: SkeletonBone, key: number): React.ReactNode => {
      const group = b.kind === 'row' || b.kind === 'stack' || b.kind === 'grid';
      const style: Record<string, string | number> = {};
      if (b.width) style['--pinfold-skel-w'] = b.width;
      if (b.height) style['--pinfold-skel-h'] = b.height;
      if (b.radius) style['--pinfold-skel-r'] = b.radius;
      if (b.gap) style['--pinfold-skel-g'] = b.gap;
      if (b.ratio) style['--pinfold-skel-ratio'] = b.ratio;
      if (b.columns) style['--pinfold-skel-cols'] = b.columns;
      const leaf = b.kind === 'line' || b.kind === 'text' ? 'text' : b.kind;
      const content = group ? b.children!.map(bone) : b.kind === 'space' ? null : b.lines ? b.lines.map((width, i) => line(i, { inlineSize: width })) : line(0);
      return shape(
        key,
        {
          'data-kind': b.kind,
          'data-variant': group || b.kind === 'space' ? undefined : leaf,
          'data-direction': group ? (b.kind === 'stack' ? 'column' : b.kind) : undefined,
          'data-align': b.align,
          'data-frame': b.frame ? '' : undefined,
          'data-grow': b.grow || b.flexible ? '' : undefined,
          'data-fixed': !b.grow && b.width && b.kind !== 'text' ? '' : undefined,
          'data-ratio': b.ratio ? '' : undefined,
          style: Object.keys(style).length ? (style as React.CSSProperties) : undefined,
          [ITEM]: b.source,
        },
        content,
      );
    };

    const body = laidOut ? normalizeSkeletonLayout(nodes).map(bone) : composed ? config.items!.map(item) : lines(config);
    const content = (
      <>
        {body}
        {/* One polite announcement for the whole region, never one per shape. */}
        {config.label ? (
          <span role="status" style={VISUALLY_HIDDEN}>
            {config.label}
          </span>
        ) : null}
      </>
    );
    return renderSlot(config, 'root', root, state, content, (p, c) => <div {...p}>{c}</div>) as React.ReactElement;
  };

  const api: SkeletonApi = { loading, getRootProps, render };
  return usePinfoldComponent<SkeletonApi, SkeletonRootProps>('Skeleton', api, (props) => render(props));
}
