import * as React from 'react';
import { cn, dataAttr, dimensionVars, inactiveSliderOptions, mergeProps, SLIDER_MAX_STEP_DOTS, sliderNextStop, sliderPercent, sliderValues, warnOnce, type PropsBag, radiusProps } from '@pinfold/core';
import { useControllableState } from '../hooks';
import { usePinfold } from '../provider';
import { usePinfoldComponent } from '../component';
import { mergeConfig } from '../preset';
import { renderSlot, slotProps } from '../slots';
import { VISUALLY_HIDDEN } from '../a11y';
import { filled, hiddenStyle, renderFieldMessages, useField, validationAttrs } from '../field';
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
  const latest = React.useRef<number[]>([]);
  const field = useField(config, { value: () => latest.current, control: () => field.root.current?.querySelector<HTMLInputElement>('input[type="range"]') });
  const min = config.min ?? 0;
  const max = config.max ?? 100;
  const step = config.step && config.step > 0 ? config.step : 1;
  const gap = config.minGap ?? 0;
  // Snapping to marks: the marks are the only stops.
  const stops = config.snapToMarks && config.marks?.length ? config.marks.map((m) => m.value) : undefined;
  const initial = React.useRef<number[] | null>(null);
  if (!initial.current) initial.current = sliderValues(config.defaultValue ?? [min], min, max, step, gap, stops);
  const [raw, setRaw] = useControllableState<readonly number[]>({ value: config.value, defaultValue: initial.current });
  const values = sliderValues(raw.length ? raw.slice(0, 2) : [min], min, max, step, gap, stops);
  const range = values.length === 2;
  latest.current = values;
  // The values last handed to `onValueCommit`: a release without a change commits nothing.
  const committed = React.useRef(values);

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

  const state: SliderState = { size: config.size ?? ctx.size, tone: config.tone ?? ctx.tone, values, range, variant: config.variant ?? 'line', invalid: field.invalid, disabled: !!config.disabled, status: field.status, validating: field.validating };
  const format = (v: number) => (config.formatValue ? config.formatValue(v) : String(v));
  const fraction = (v: number) => sliderPercent(v, min, max) / 100;

  const onInput = (index: number) => (event: React.ChangeEvent<HTMLInputElement>) => {
    let v = Number(event.target.value);
    // The thumbs never cross, and keep the gap.
    if (range) v = index === 0 ? Math.min(v, values[1] - gap) : Math.max(v, values[0] + gap);
    const next = values.slice();
    next[index] = v;
    const clean = sliderValues(next, min, max, step, 0, stops);
    latest.current = clean;
    setRaw(clean);
    field.revalidate(event.target);
    config.onChange?.(clean, event);
  };
  const end = () => {
    const now = latest.current;
    if (now.length === committed.current.length && now.every((v, i) => v === committed.current[i])) return;
    committed.current = now;
    config.onChangeEnd?.(now);
    config.onValueCommit?.(now);
  };
  // Snapping to marks, the input takes any value (marks need not sit on a step), so the arrow keys
  // are ours: they set the next mark the native way, and the input event above does the rest.
  const onKeyDown = (event: React.KeyboardEvent<HTMLInputElement>) => {
    if (!stops) return;
    const input = event.currentTarget;
    const rtl = getComputedStyle(input).direction === 'rtl';
    const current = Number(input.value);
    const key = event.key;
    let next: number | undefined;
    if (key === 'ArrowUp' || key === 'PageUp' || key === (rtl ? 'ArrowLeft' : 'ArrowRight')) next = sliderNextStop(current, 1, stops);
    else if (key === 'ArrowDown' || key === 'PageDown' || key === (rtl ? 'ArrowRight' : 'ArrowLeft')) next = sliderNextStop(current, -1, stops);
    else if (key === 'Home') next = Math.min(...stops);
    else if (key === 'End') next = Math.max(...stops);
    if (next === undefined) return;
    event.preventDefault();
    if (next === current) return;
    Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value')!.set!.call(input, String(next));
    input.dispatchEvent(new Event('input', { bubbles: true }));
  };
  const variant = config.variant ?? 'line';
  const steps = (max - min) / step;
  const stepDots = config.showSteps && !stops && steps > 0 && steps <= SLIDER_MAX_STEP_DOTS ? steps : 0;

  const getRootProps = (props?: PropsBag): PropsBag =>
    mergeProps(
      {
        ...radiusProps(config.radius),
        ref: field.root,
        role: range ? 'group' : undefined,
        'aria-labelledby': range ? `${field.base}-label` : undefined,
        'data-size': state.size,
        'data-tone': state.tone,
        'data-range': dataAttr(range),
        'data-variant': variant,
        'data-orientation': config.orientation ?? 'horizontal',
        'data-show-value': config.showValue ?? 'label',
        'data-mark-labels': dataAttr(config.marks?.some((m) => filled(m.label))),
        'data-invalid': dataAttr(field.invalid),
        'data-disabled': dataAttr(config.disabled),
        ...validationAttrs(field),
        'data-animate': dataAttr(!ctx.disableAnimation),
        'data-unstyled': dataAttr(config.unstyled),
      },
      props,
    );

  const render = (rootProps?: SliderRootProps): React.ReactElement => {
    const shared: Partial<Record<SliderSlot, string>> = { label: 'pinfold-field__label', description: 'pinfold-field__description', error: 'pinfold-field__error', statusIcon: 'pinfold-field__icon', validating: 'pinfold-field__validating' };
    const slot = (name: SliderSlot, content: React.ReactNode, tag: string, base: PropsBag = {}) =>
      renderSlot(config, name, slotProps(config, name, { className: config.unstyled ? undefined : cn(`pinfold-slider__${name}`, shared[name]), ...base }), state, content, (p, c) => React.createElement(tag, p, c));
    const vars: Record<string, string> = {
      ...(dimensionVars('slider', config.dimensions) as Record<string, string> | undefined),
      '--pinfold-sld-a': String(range ? fraction(values[0]) : 0),
      '--pinfold-sld-b': String(fraction(values[range ? 1 : 0])),
      ...(stepDots ? { '--pinfold-sld-n': String(stepDots) } : null),
    };
    const root = slotProps(
      config,
      'root',
      getRootProps(mergeProps({ className: config.unstyled ? config.className : cn('pinfold pinfold-slider pinfold-field', config.className), style: { ...vars, ...config.style } }, rootProps)),
    );
    const showValue = config.showValue ?? 'label';
    const text = values.map(format).join(' – ');
    const names = config.thumbLabels ?? ['Minimum', 'Maximum'];
    // Icons either side of the track sit in a row with it; without them there is no extra element.
    const ends = filled(config.startContent) || filled(config.endContent);
    const withEnds = (control: React.ReactNode) =>
      ends ? (
        <div className={config.unstyled ? undefined : 'pinfold-slider__body'}>
          {filled(config.startContent) ? slot('startContent', config.startContent, 'span', { 'aria-hidden': true }) : null}
          {control}
          {filled(config.endContent) ? slot('endContent', config.endContent, 'span', { 'aria-hidden': true }) : null}
        </div>
      ) : (
        control
      );
    const content = (
      <>
        {filled(config.label) || showValue === 'label' ? (
          <div className={config.unstyled ? undefined : 'pinfold-slider__header'}>
            {slot('label', config.label, 'span', { id: `${field.base}-label`, ...hiddenStyle(config.hideLabel) })}
            {showValue === 'label' ? slot('value', text, 'span', { 'aria-hidden': true }) : null}
          </div>
        ) : null}
        {withEnds(
          slot(
          'control',
          <>
            {slot('track', slot('range', null, 'span'), 'span', { 'aria-hidden': true })}
            {stepDots ? slot('steps', null, 'span', { 'aria-hidden': true }) : null}
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
                  step: stops ? 'any' : step,
                  value: v,
                  disabled: config.disabled || undefined,
                  'aria-labelledby': range ? `${field.base}-label ${field.base}-thumb-${i}` : `${field.base}-label`,
                  'aria-valuetext': config.formatValue ? format(v) : undefined,
                  'aria-describedby': field.describedBy,
                  'aria-invalid': field.invalid || undefined,
                  'data-index': i,
                  'aria-orientation': config.orientation === 'vertical' ? 'vertical' : undefined,
                  'aria-busy': field.validating || undefined,
                  onChange: onInput(i),
                  onPointerUp: end,
                  onKeyUp: end,
                  onFocus: config.onFocus,
                  onBlur: (event: React.FocusEvent<HTMLInputElement>) => {
                    end();
                    if (!field.root.current?.contains(event.relatedTarget as Node | null)) field.onBlur(event.currentTarget);
                    config.onBlur?.(event);
                  },
                  onKeyDown: (event: React.KeyboardEvent<HTMLInputElement>) => {
                    config.onKeyDown?.(event);
                    if (stops && !event.defaultPrevented) onKeyDown(event);
                  },
                })}
                {slot(
                  'thumb',
                  <>
                    {typeof config.thumbContent === 'function' ? config.thumbContent({ ...state, value: v, index: i }) : config.thumbContent}
                    {showValue === 'tooltip' ? slot('value', format(v), 'span', { 'aria-hidden': true }) : null}
                  </>,
                  'span',
                  { 'aria-hidden': true, 'data-index': i, 'data-custom': dataAttr(config.thumbContent !== undefined), style: { '--pinfold-sld-at': String(fraction(v)) } },
                )}
                {range ? (
                  <span id={`${field.base}-thumb-${i}`} style={VISUALLY_HIDDEN}>
                    {names[i]}
                  </span>
                ) : null}
              </React.Fragment>
            ))}
          </>,
          'div',
          ),
        )}
        {renderFieldMessages(field, config.description, (n, c, t, b) => slot(n as SliderSlot, c, t, b))}
      </>
    );
    return renderSlot(config, 'root', root, state, content, (p, c) => <div {...p}>{c}</div>) as React.ReactElement;
  };

  const api: SliderApi = {
    values,
    setValues: (next) => setRaw(sliderValues(next, min, max, step, gap, stops)),
    ...field.api,
    focus: () => field.root.current?.querySelector<HTMLInputElement>('input[type="range"]')?.focus(),
    getRootProps,
    render,
  };
  return usePinfoldComponent<SliderApi, SliderRootProps>('Slider', api, (props) => render(props));
}
