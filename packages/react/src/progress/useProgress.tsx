import * as React from 'react';
import { cn, dataAttr, dimensionVars, inactiveProgressOptions, mergeProps, progressPercent, progressValueText, warnOnce, type PropsBag } from '@pinfold/core';
import { usePinfold } from '../provider';
import { useId } from '../hooks';
import { VISUALLY_HIDDEN } from '../a11y';
import { usePinfoldComponent } from '../component';
import { mergeConfig } from '../preset';
import { renderSlot, slotProps } from '../slots';
import type { ProgressApi, ProgressComponent, ProgressConfig, ProgressRootProps, ProgressSlot, ProgressState } from './types';

const filled = (node: React.ReactNode) => node != null && node !== false && node !== '';

/**
 * A progress bar, ring or meter, as a hook that hands back a component.
 *
 *   const Upload = useProgress({ label: 'Uploading report.pdf', value: progress, showValue: true });
 *   return <Upload />;
 *
 * Precedence: this config, then `defaults.progress`, then the provider (size, tone), then the library default.
 */
export function useProgress(input: ProgressConfig = {}): ProgressComponent {
  const ctx = usePinfold();
  const config = ctx.defaults.progress ? mergeConfig<ProgressConfig>(ctx.defaults.progress, input) : input;
  const labelId = useId();

  if (process.env.NODE_ENV !== 'production') {
    void import('@pinfold/core/meta').then(({ progressMeta, validateConfig }) => {
      for (const problem of validateConfig(progressMeta, input)) warnOnce(true, problem.message);
    });
    warnOnce(!filled(config.label), 'Progress: give it a `label` (use `hideLabel` to keep it for screen readers only), or it has no name.');
  }

  const kind = config.kind ?? 'progress';
  const min = config.min ?? 0;
  const max = config.max ?? 100;
  // A meter always measures something: no value reads as the minimum, never as busy.
  const value = kind === 'meter' && typeof config.value !== 'number' ? min : config.value;
  const percent = progressPercent(value, min, max);
  const state: ProgressState = { kind, shape: config.shape ?? 'bar', size: config.size ?? ctx.size, tone: config.tone ?? ctx.tone, percent };
  const text = percent === null ? undefined : config.formatValue ? config.formatValue(value as number, { min, max, percent }) : progressValueText(percent);
  const labelled = filled(config.label);

  const getRootProps = (props?: PropsBag): PropsBag =>
    mergeProps(
      {
        role: kind === 'meter' ? 'meter' : 'progressbar',
        'aria-labelledby': labelled ? labelId : undefined,
        'aria-valuemin': min,
        'aria-valuemax': max,
        'aria-valuenow': percent === null ? undefined : value,
        'aria-valuetext': text,
        'data-kind': kind,
        'data-shape': state.shape,
        'data-size': state.size,
        'data-tone': state.tone,
        'data-indeterminate': dataAttr(percent === null),
        'data-animate': dataAttr(!ctx.disableAnimation),
        'data-unstyled': dataAttr(config.unstyled),
      },
      props,
    );

  const render = (rootProps?: ProgressRootProps): React.ReactElement => {
    const cls = (name: string) => (config.unstyled ? undefined : name);
    const slot = (name: ProgressSlot, content: React.ReactNode, tag: string, base: PropsBag = {}) =>
      renderSlot(config, name, slotProps(config, name, { className: cls(`pinfold-progress__${name}`), ...base }), state, content, (p, c) => React.createElement(tag, p, c));
    const vars = dimensionVars('progress', config.dimensions);
    const root = slotProps(
      config,
      'root',
      getRootProps(mergeProps({ className: config.unstyled ? config.className : cn('pinfold pinfold-progress', config.className), style: vars || config.style ? { ...vars, ...config.style } : undefined }, rootProps)),
    );
    const label = labelled ? slot('label', config.label, 'span', { id: labelId, style: config.hideLabel ? VISUALLY_HIDDEN : undefined }) : null;
    // The value text is already the accessible `aria-valuetext`: shown, not read twice.
    const shown = config.showValue !== false && text !== undefined ? slot('value', text, 'span', { 'aria-hidden': true }) : null;
    const fill = percent ?? 0;
    const track =
      state.shape === 'circle' ? (
        <svg className={cls('pinfold-progress__ring')} viewBox="0 0 36 36" aria-hidden="true" focusable="false">
          {slot('track', null, 'circle', { cx: 18, cy: 18, r: 15.5, pathLength: 100 })}
          {slot('indicator', null, 'circle', { cx: 18, cy: 18, r: 15.5, pathLength: 100, strokeDasharray: 100, strokeDashoffset: percent === null ? 70 : 100 - fill })}
        </svg>
      ) : (
        slot('track', slot('indicator', null, 'span', { style: percent === null ? undefined : { inlineSize: `${fill}%` } }), 'span', { 'aria-hidden': true })
      );
    const content =
      state.shape === 'circle' ? (
        <>
          <span className={cls('pinfold-progress__figure')}>
            {track}
            {shown}
          </span>
          {label}
        </>
      ) : (
        <>
          {label || shown ? (
            <span className={cls('pinfold-progress__header')}>
              {label}
              {shown}
            </span>
          ) : null}
          {track}
        </>
      );
    return renderSlot(config, 'root', root, state, content, (p, c) => <div {...p}>{c}</div>) as React.ReactElement;
  };

  const api: ProgressApi = { getRootProps, render };
  return usePinfoldComponent<ProgressApi, ProgressRootProps>('Progress', api, (props) => render(props));
}
