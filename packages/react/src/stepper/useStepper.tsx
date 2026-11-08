import * as React from 'react';
import { cn, dataAttr, inactiveStepperOptions, mergeProps, stepStatus, warnOnce, type PropsBag } from '@pinfold/core';
import { useControllableState } from '../hooks';
import { usePinfold } from '../provider';
import { usePinfoldComponent } from '../component';
import { mergeConfig } from '../preset';
import { renderSlot, slotProps } from '../slots';
import { VISUALLY_HIDDEN } from '../a11y';
import { CHECK_ICON } from '../nav-icons';
import type { StepperApi, StepperComponent, StepperConfig, StepperRootProps, StepperSlot, StepperState } from './types';

const SPOKEN = { complete: 'done', current: 'current', upcoming: 'not started' } as const;

/**
 * Progress through the steps of a task, as a hook that hands back a component.
 *
 *   const Checkout = useStepper({ value: step, onChange: setStep, items: [{ label: 'Cart' }, { label: 'Payment' }] });
 *   return <Checkout />;
 *
 * Precedence: this config, then `defaults.stepper`, then the provider (size, tone), then the library default.
 */
export function useStepper(input: StepperConfig): StepperComponent {
  const ctx = usePinfold();
  const config = ctx.defaults.stepper ? mergeConfig<StepperConfig>(ctx.defaults.stepper, input) : input;
  const items = config.items ?? [];
  const clamp = (n: number) => Math.min(Math.max(0, Math.round(n)), items.length);
  const [raw, setRaw] = useControllableState<number>({ value: config.value, defaultValue: config.defaultValue ?? 0 });
  const value = clamp(raw);

  if (process.env.NODE_ENV !== 'production') {
    void import('@pinfold/core/meta').then(({ stepperMeta, validateConfig }) => {
      for (const problem of validateConfig(stepperMeta, input)) warnOnce(true, problem.message);
      const inactive = inactiveStepperOptions(config);
      for (const key in inactive) warnOnce((input as unknown as Record<string, unknown>)[key] !== undefined, `Stepper: \`${key}\` has no visible effect here. ${inactive[key]}`);
    });
  }

  const variant = config.variant ?? 'circle';
  const orientation = variant === 'bar' ? 'horizontal' : config.orientation ?? 'horizontal';
  const state: StepperState = { variant, orientation, size: config.size ?? ctx.size, tone: config.tone ?? ctx.tone, value };

  const getRootProps = (props?: PropsBag): PropsBag =>
    mergeProps(
      {
        'aria-label': config.label ?? 'Progress',
        'data-variant': variant,
        'data-orientation': orientation,
        'data-size': state.size,
        'data-tone': state.tone,
        'data-animate': dataAttr(!ctx.disableAnimation),
        'data-unstyled': dataAttr(config.unstyled),
        style: { '--pinfold-stp-n': String(Math.max(1, items.length)) },
      },
      props,
    );

  const render = (rootProps?: StepperRootProps): React.ReactElement => {
    const slot = (name: StepperSlot, content: React.ReactNode, tag: string, own: PropsBag = {}) =>
      renderSlot(config, name, slotProps(config, name, { className: config.unstyled ? undefined : `pinfold-stepper__${name}`, ...own }), state, content, (p, c) => React.createElement(tag, p, c));
    const root = slotProps(config, 'root', getRootProps(mergeProps({ className: config.unstyled ? config.className : cn('pinfold pinfold-stepper', config.className), style: config.style }, rootProps)));
    const steps = items.map((item, i) => {
      const status = stepStatus(i, value);
      const mark = variant === 'circle' ? (status === 'complete' ? CHECK_ICON : item.icon ?? i + 1) : null;
      const inner = (
        <>
          {slot('indicator', mark, 'span', { 'aria-hidden': true })}
          {slot(
            'text',
            <>
              {slot('label', item.label, 'span')}
              {item.description != null ? slot('description', item.description, 'span') : null}
              <span style={VISUALLY_HIDDEN}>{`, ${SPOKEN[status]}`}</span>
            </>,
            'span',
          )}
        </>
      );
      // Only steps already done go back: the order of the task holds.
      const back = !!config.onChange && status === 'complete';
      return (
        <React.Fragment key={i}>
          {slot(
            'step',
            <>
              {back
                ? slot('button', inner, 'button', {
                    type: 'button',
                    onClick: (event: React.MouseEvent) => {
                      setRaw(i);
                      config.onChange!(i, event);
                    },
                  })
                : inner}
              {i < items.length - 1 ? slot('connector', null, 'span', { 'aria-hidden': true }) : null}
            </>,
            'li',
            { 'data-status': status, 'aria-current': status === 'current' ? 'step' : undefined },
          )}
        </React.Fragment>
      );
    });
    return renderSlot(config, 'root', root, state, steps, (p, c) => <ol {...p}>{c}</ol>) as React.ReactElement;
  };

  const api: StepperApi = {
    value,
    setValue: (n) => setRaw(clamp(n)),
    next: () => setRaw(clamp(value + 1)),
    previous: () => setRaw(clamp(value - 1)),
    getRootProps,
    render,
  };
  return usePinfoldComponent<StepperApi, StepperRootProps>('Stepper', api, (props) => render(props));
}
