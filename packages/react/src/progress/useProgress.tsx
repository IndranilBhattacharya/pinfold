import * as React from 'react';
import {
  cn,
  dataAttr,
  dimensionVars,
  inactiveProgressOptions,
  mergeProps,
  progressPercent,
  progressSegmentCount,
  progressSegmentFills,
  progressToneAt,
  progressValuePosition,
  progressValueText,
  radiusProps,
  warnOnce,
  type PropsBag,
} from '@pinfold/core';
import { usePinfold } from '../provider';
import { useEvent, useId } from '../hooks';
import { VISUALLY_HIDDEN } from '../a11y';
import { usePinfoldComponent } from '../component';
import { mergeConfig } from '../preset';
import { ITEM, renderSlot, slotProps } from '../slots';
import type { ProgressApi, ProgressComponent, ProgressConfig, ProgressContent, ProgressRootProps, ProgressSegmentItem, ProgressSlot, ProgressState } from './types';

const filled = (node: React.ReactNode) => node != null && node !== false && node !== '';
const resolve = (content: ProgressContent, state: ProgressState): React.ReactNode => (typeof content === 'function' ? content(state) : content);

/** Ring geometry in viewBox units: a full circle (36 × 36) or the upper half of one (36 × 20). */
const RING = { cx: 18, cy: 18, r: 15.5 };
const GAUGE = 'M 2.5 18 A 15.5 15.5 0 0 1 33.5 18';

/**
 * A progress bar, ring, gauge or meter, as a hook that hands back a component.
 *
 *   const Upload = useProgress({ label: 'Uploading report.pdf', value: progress, onComplete: done });
 *   return <Upload />;
 *
 * Precedence: this config, then `defaults.progress`, then the provider (size, tone), then the library
 * default. `tones` picks the tone by value on top of that.
 */
export function useProgress(input: ProgressConfig = {}): ProgressComponent {
  const ctx = usePinfold();
  const config = ctx.defaults.progress ? mergeConfig<ProgressConfig>(ctx.defaults.progress, input) : input;
  const labelId = useId();
  const descriptionId = useId();

  if (process.env.NODE_ENV !== 'production') {
    void import('@pinfold/core/meta').then(({ progressMeta, validateConfig }) => {
      for (const problem of validateConfig(progressMeta, input)) warnOnce(true, problem.message);
      // Static mistakes only: the value comes and goes at runtime, so it is taken as present.
      const inactive = inactiveProgressOptions({ ...config, value: 0 });
      for (const key in inactive) warnOnce((input as Record<string, unknown>)[key] !== undefined, `Progress: \`${key}\` has no visible effect here. ${inactive[key]}`);
    });
  }

  const kind = config.kind ?? 'progress';
  const min = config.min ?? 0;
  const max = config.max ?? 100;
  // A meter always measures something: no value reads as the minimum, never as busy.
  const value = kind === 'meter' && typeof config.value !== 'number' ? min : config.value;
  const percent = progressPercent(value, min, max);
  const shape = config.shape ?? 'bar';
  const variant = config.variant ?? 'solid';
  const ring = shape !== 'bar';
  const segmented = variant === 'segmented';
  const bufferPercent = kind !== 'meter' && percent !== null && !segmented ? progressPercent(config.buffer, min, max) : null;
  const text = percent === null ? undefined : config.formatValue ? config.formatValue(value as number, { min, max, percent }) : progressValueText(percent);
  const state: ProgressState = {
    kind,
    shape,
    variant,
    size: config.size ?? ctx.size,
    tone: (percent === null ? undefined : progressToneAt(value, config.tones)) ?? config.tone ?? ctx.tone,
    percent,
    value,
    min,
    max,
    bufferPercent,
    text,
    indeterminate: percent === null,
    complete: percent === 100,
    valuePosition: progressValuePosition(config.valuePosition, shape, variant),
  };

  // `onComplete`: once per arrival at max from below (an indeterminate start counts as below).
  const previous = React.useRef<number | null | undefined>(undefined);
  const complete = useEvent(() => config.onComplete?.());
  React.useEffect(() => {
    const was = previous.current;
    previous.current = percent;
    if (kind !== 'meter' && percent === 100 && was !== undefined && was !== 100) complete();
  }, [percent, kind, complete]);

  const label = resolve(config.label, state);
  const description = resolve(config.description, state);
  const labelled = filled(label);
  const described = filled(description);
  if (process.env.NODE_ENV !== 'production') warnOnce(!labelled, 'Progress: give it a `label` (use `hideLabel` to keep it for screen readers only), or it has no name.');

  const getRootProps = (props?: PropsBag): PropsBag =>
    mergeProps(
      {
        ...radiusProps(config.radius),
        role: kind === 'meter' ? 'meter' : 'progressbar',
        'aria-labelledby': labelled ? labelId : undefined,
        'aria-describedby': described ? descriptionId : undefined,
        'aria-valuemin': min,
        'aria-valuemax': max,
        'aria-valuenow': percent === null ? undefined : value,
        'aria-valuetext': text,
        'data-kind': kind,
        'data-shape': shape,
        'data-variant': variant,
        'data-size': state.size,
        'data-tone': state.tone,
        'data-value-position': state.valuePosition,
        'data-indeterminate': dataAttr(percent === null),
        'data-complete': dataAttr(state.complete),
        'data-animate': dataAttr(!ctx.disableAnimation),
        'data-unstyled': dataAttr(config.unstyled),
      },
      props,
    );

  const render = (rootProps?: ProgressRootProps): React.ReactElement => {
    const cls = (name: string) => (config.unstyled ? undefined : name);
    const slot = (name: ProgressSlot, content: React.ReactNode, tag: string, base: PropsBag = {}) =>
      renderSlot(config, name, slotProps(config, name, { className: cls(`pinfold-progress__${name}`), ...base }), state, content, (p, c) => React.createElement(tag, p, c));
    const wrap = (name: string, content: React.ReactNode) => <span className={cls(`pinfold-progress__${name}`)}>{content}</span>;
    const fill = percent ?? 0;
    const vars = { ...dimensionVars('progress', config.dimensions), '--pinfold-prg-value': `${fill}%` } as React.CSSProperties;
    const root = slotProps(
      config,
      'root',
      getRootProps(mergeProps({ className: config.unstyled ? config.className : cn('pinfold pinfold-progress', config.className), style: { ...vars, ...config.style } }, rootProps)),
    );

    const labelEl = labelled ? slot('label', label, 'span', { id: labelId, style: config.hideLabel ? VISUALLY_HIDDEN : undefined }) : null;
    const descriptionEl = described ? slot('description', description, 'span', { id: descriptionId }) : null;
    // The value text is already the accessible `aria-valuetext`: shown, not read twice.
    const shownValue = config.showValue !== false && text !== undefined ? (config.valueLabel !== undefined ? resolve(config.valueLabel, state) : text) : null;
    const valueAt = (where: ProgressState['valuePosition'], base: PropsBag = {}) =>
      filled(shownValue) && state.valuePosition === where ? slot('value', shownValue, 'span', { 'aria-hidden': true, ...base }) : null;
    const startContent = resolve(config.startContent, state);
    const endContent = resolve(config.endContent, state);
    const start = filled(startContent) ? slot('start', startContent, 'span') : null;
    const end = filled(endContent) ? slot('end', endContent, 'span') : null;
    const count = progressSegmentCount(config.segments);
    const fills = segmented ? progressSegmentFills(fill, count) : [];
    const segmentItem = (index: number): ProgressSegmentItem => ({ index, fill: fills[index] });

    if (ring) {
      const circle = shape === 'circle';
      const tag = circle ? 'circle' : 'path';
      const geometry = circle ? RING : { d: GAUGE };
      const arc = (name: ProgressSlot, extra: PropsBag) => slot(name, null, tag, { ...geometry, pathLength: 100, ...extra });
      let arcs: React.ReactNode;
      if (segmented) {
        const gap = circle ? 2 : 3;
        const span = 100 / count;
        const length = Math.max(0.5, span - gap);
        arcs = fills.map((segmentFill, i) => (
          <React.Fragment key={i}>
            {arc('segment', { strokeDasharray: `${length} 100`, strokeDashoffset: -(i * span + (circle ? 0 : gap / 2)), [ITEM]: segmentItem(i) })}
            {arc('indicator', {
              strokeDasharray: `${percent === null ? length : (length * segmentFill) / 100} 100`,
              strokeDashoffset: -(i * span + (circle ? 0 : gap / 2)),
              style: { '--pinfold-prg-i': i } as React.CSSProperties,
              [ITEM]: segmentItem(i),
            })}
          </React.Fragment>
        ));
      } else {
        arcs = (
          <>
            {arc('track', {})}
            {bufferPercent !== null ? arc('buffer', { strokeDasharray: 100, strokeDashoffset: 100 - bufferPercent }) : null}
            {arc('indicator', { strokeDasharray: 100, strokeDashoffset: percent === null ? 70 : 100 - fill })}
          </>
        );
      }
      const figure = (
        <span className={cls('pinfold-progress__figure')}>
          <svg className={cls('pinfold-progress__ring')} viewBox={circle ? '0 0 36 36' : '0 0 36 20'} aria-hidden="true" focusable="false">
            {arcs}
          </svg>
          {valueAt('inside')}
        </span>
      );
      const outside = valueAt('top') ?? valueAt('end') ?? valueAt('bottom');
      const caption = labelEl || outside || descriptionEl ? wrap('caption', <>{labelEl}{outside}{descriptionEl}</>) : null;
      return renderSlot(config, 'root', root, state, <>{start}{figure}{caption}{end}</>, (p, c) => <div {...p}>{c}</div>) as React.ReactElement;
    }

    const track = segmented
      ? slot(
          'track',
          fills.map((segmentFill, i) => (
            <React.Fragment key={i}>
              {slot(
                'segment',
                slot('indicator', null, 'span', { style: { inlineSize: percent === null ? undefined : `${segmentFill}%` }, [ITEM]: segmentItem(i) }),
                'span',
                { style: { '--pinfold-prg-i': i } as React.CSSProperties, [ITEM]: segmentItem(i) },
              )}
            </React.Fragment>
          )),
          'span',
          { 'aria-hidden': true },
        )
      : slot(
          'track',
          <>
            {bufferPercent !== null ? slot('buffer', null, 'span', { style: { inlineSize: `${bufferPercent}%` } }) : null}
            {slot('indicator', null, 'span', { style: percent === null ? undefined : { inlineSize: `${fill}%` } })}
            {/* Inside: written on the fill once it is wide enough, just past it before. */}
            {valueAt('inside', { 'data-fit': fill >= 14 ? 'fill' : 'track' })}
          </>,
          'span',
          { 'aria-hidden': true },
        );
    const top = valueAt('top');
    const bottom = valueAt('bottom');
    const atEnd = valueAt('end');
    const content = (
      <>
        {labelEl || top ? wrap('header', <>{labelEl}{top}</>) : null}
        {start || end || atEnd ? wrap('body', <>{start}{track}{atEnd}{end}</>) : track}
        {descriptionEl || bottom ? wrap('footer', <>{descriptionEl}{bottom}</>) : null}
      </>
    );
    return renderSlot(config, 'root', root, state, content, (p, c) => <div {...p}>{c}</div>) as React.ReactElement;
  };

  const api: ProgressApi = { state, getRootProps, render };
  return usePinfoldComponent<ProgressApi, ProgressRootProps>('Progress', api, (props) => render(props));
}
