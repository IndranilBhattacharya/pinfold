import * as React from 'react';
import { cn, dataAttr, dimensionVars, inactiveSliderOptions, mergeProps, sliderPercent, sliderValues, warnOnce, type PropsBag } from '@pinfold/core';
import { useControllableState } from '../hooks';
import { usePinfold } from '../provider';
import { usePinfoldComponent } from '../component';
import { mergeConfig } from '../preset';
import { renderSlot, slotProps } from '../slots';
import { VISUALLY_HIDDEN } from '../a11y';
import { filled, hiddenStyle, useField } from '../field';
import type { SliderApi, SliderComponent, SliderConfig, SliderRootProps, SliderSlot, SliderState } from './types';

/**
 * A number, or a range with two thumbs, picked along a track, as a hook that hands back a component.
 * Each thumb is a native range input, so keyboard, touch, forms and assistive tech are the browser's.
 *
 *   const Volume = useSlider({ label: 'Volume', defaultValue: [60] });
 *   return <Volume />;
 *
 * Precedence: this config, then `defaults.slider`, then the provider (size, tone), then the library default.
 */
export function useSlider(input: SliderConfig): SliderComponent {
  const ctx = usePinfold();
  const config = ctx.defaults.slider ? mergeConfig<SliderConfig>(ctx.defaults.slider, input) : input;
  const field = useField(config);
  const min = config.min ?? 0;
  const max = config.max ?? 100;
  const step = config.step && config.step > 0 ? config.step : 1;
  const gap = config.minGap ?? 0;
  const initial = React.useRef<number[] | null>(null);
  if (!initial.current) initial.current = sliderValues(config.defaultValue ?? [min], min, max, step, gap);
  const [raw, setRaw] = useControllableState<readonly number[]>({ value: config.value, defaultValue: initial.current });
  const values = sliderValues(raw.length ? raw.slice(0, 2) : [min], min, max, step, gap);
  const range = values.length === 2;
  const latest = React.useRef(values);
  latest.current = values;

  if (process.env.NODE_ENV !== 'production') {
    void import('@pinfold/core/meta').then(({ sliderMeta, validateConfig }) => {
      for (const problem of validateConfig(sliderMeta, input)) warnOnce(true, problem.message);
      const inactive = inactiveSliderOptions(config);
      for (const key in inactive) warnOnce((input as unknown as Record<string, unknown>)[key] !== undefined, `Slider: \`${key}\` has no visible effect here. ${inactive[key]}`);
    });
    warnOnce(!filled(config.label), 'Slider: give it a `label` (`hideLabel` keeps it for screen readers only).');
  }

  // A form reset puts the native inputs back; the state follows.
  React.useEffect(() => {
    const form = field.root.current?.closest('form');
    if (!form) return;
    const onReset = () => setRaw(initial.current!);
    form.addEventListener('reset', onReset);
    return () => form.removeEventListener('reset', onReset);
  }, []);

  const state: SliderState = { size: config.size ?? ctx.size, tone: config.tone ?? ctx.tone, values, range, invalid: field.invalid };
  const format = (v: number) => (config.formatValue ? config.formatValue(v) : String(v));
  const fraction = (v: number) => sliderPercent(v, min, max) / 100;

  const onInput = (index: number) => (event: React.ChangeEvent<HTMLInputElement>) => {
    let v = Number(event.target.value);
    // The thumbs never cross, and keep the gap.
    if (range) v = index === 0 ? Math.min(v, values[1] - gap) : Math.max(v, values[0] + gap);
    const next = values.slice();
    next[index] = v;
    const clean = sliderValues(next, min, max, step, 0);
    setRaw(clean);
    config.onChange?.(clean, event);
  };
  const end = () => config.onChangeEnd?.(latest.current);

  const getRootProps = (props?: PropsBag): PropsBag =>
    mergeProps(
      {
        ref: field.root,
        role: range ? 'group' : undefined,
        'aria-labelledby': range ? `${field.base}-label` : undefined,
        'data-size': state.size,
        'data-tone': state.tone,
        'data-range': dataAttr(range),
        'data-show-value': config.showValue ?? 'label',
        'data-mark-labels': dataAttr(config.marks?.some((m) => filled(m.label))),
        'data-invalid': dataAttr(field.invalid),
        'data-disabled': dataAttr(config.disabled),
        'data-animate': dataAttr(!ctx.disableAnimation),
        'data-unstyled': dataAttr(config.unstyled),
      },
      props,
    );

  const render = (rootProps?: SliderRootProps): React.ReactElement => {
    const shared: Partial<Record<SliderSlot, string>> = { label: 'pinfold-field__label', description: 'pinfold-field__description', error: 'pinfold-field__error' };
    const slot = (name: SliderSlot, content: React.ReactNode, tag: string, base: PropsBag = {}) =>
      renderSlot(config, name, slotProps(config, name, { className: config.unstyled ? undefined : cn(`pinfold-slider__${name}`, shared[name]), ...base }), state, content, (p, c) => React.createElement(tag, p, c));
    const vars: Record<string, string> = {
      ...(dimensionVars('slider', config.dimensions) as Record<string, string> | undefined),
      '--pinfold-sld-a': String(range ? fraction(values[0]) : 0),
      '--pinfold-sld-b': String(fraction(values[range ? 1 : 0])),
    };
    const root = slotProps(
      config,
      'root',
      getRootProps(mergeProps({ className: config.unstyled ? config.className : cn('pinfold pinfold-slider pinfold-field', config.className), style: { ...vars, ...config.style } }, rootProps)),
    );
    const showValue = config.showValue ?? 'label';
    const text = values.map(format).join(' – ');
    const names = config.thumbLabels ?? ['Minimum', 'Maximum'];
    const content = (
      <>
        {filled(config.label) || showValue === 'label' ? (
          <div className={config.unstyled ? undefined : 'pinfold-slider__header'}>
            {slot('label', config.label, 'span', { id: `${field.base}-label`, ...hiddenStyle(config.hideLabel) })}
            {showValue === 'label' ? slot('value', text, 'span', { 'aria-hidden': true }) : null}
          </div>
        ) : null}
        {slot(
          'control',
          <>
            {slot('track', slot('range', null, 'span'), 'span', { 'aria-hidden': true })}
            {config.marks?.length
              ? slot(
                  'marks',
                  config.marks.map((mark) => {
                    const at = fraction(mark.value);
                    const inside = range ? mark.value >= values[0] && mark.value <= values[1] : mark.value <= values[0];
                    return (
                      <React.Fragment key={mark.value}>
                        {slot('mark', mark.label ?? null, 'span', { style: { '--pinfold-sld-at': String(at) }, 'data-in': dataAttr(inside) })}
                      </React.Fragment>
                    );
                  }),
                  'span',
                  { 'aria-hidden': true },
                )
              : null}
            {values.map((v, i) => (
              <React.Fragment key={i}>
                {slot('input', null, 'input', {
                  type: 'range',
                  id: i === 0 ? field.controlId : `${field.controlId}-${i}`,
                  name: config.name,
                  min,
                  max,
                  step,
                  value: v,
                  disabled: config.disabled || undefined,
                  'aria-labelledby': range ? `${field.base}-label ${field.base}-thumb-${i}` : `${field.base}-label`,
                  'aria-valuetext': config.formatValue ? format(v) : undefined,
                  'aria-describedby': field.describedBy,
                  'aria-invalid': field.invalid || undefined,
                  'data-index': i,
                  onChange: onInput(i),
                  onPointerUp: end,
                  onKeyUp: end,
                })}
                {slot('thumb', showValue === 'tooltip' ? slot('value', format(v), 'span', { 'aria-hidden': true }) : null, 'span', { 'aria-hidden': true, style: { '--pinfold-sld-at': String(fraction(v)) } })}
                {range ? (
                  <span id={`${field.base}-thumb-${i}`} style={VISUALLY_HIDDEN}>
                    {names[i]}
                  </span>
                ) : null}
              </React.Fragment>
            ))}
          </>,
          'div',
        )}
        {filled(config.description) ? slot('description', config.description, 'div', { id: field.descriptionId }) : null}
        {filled(field.message) ? slot('error', field.message, 'div', { id: field.errorId }) : null}
      </>
    );
    return renderSlot(config, 'root', root, state, content, (p, c) => <div {...p}>{c}</div>) as React.ReactElement;
  };

  const api: SliderApi = {
    values,
    setValues: (next) => setRaw(sliderValues(next, min, max, step, gap)),
    focus: () => field.root.current?.querySelector<HTMLInputElement>('input[type="range"]')?.focus(),
    getRootProps,
    render,
  };
  return usePinfoldComponent<SliderApi, SliderRootProps>('Slider', api, (props) => render(props));
}
