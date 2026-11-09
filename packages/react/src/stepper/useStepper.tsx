import * as React from 'react';
import { cn, dataAttr, inactiveStepperOptions, mergeProps, stepStatus, warnOnce, type PropsBag, type StepStatus, radiusProps } from '@pinfold/core';
import { useControllableState, useId } from '../hooks';
import { usePinfold } from '../provider';
import { usePinfoldComponent } from '../component';
import { mergeConfig } from '../preset';
import { ITEM, renderSlot, slotProps } from '../slots';
import { VISUALLY_HIDDEN } from '../a11y';
import { ALERT_ICON, CHECK_ICON } from '../nav-icons';
import { Button } from '../button/Button';
import type { StepperApi, StepperComponent, StepperConfig, StepperItem, StepperRootProps, StepperSlot, StepperState } from './types';

const SPOKEN: Record<StepStatus, string> = { complete: 'done', current: 'current', upcoming: 'not started', error: 'error' };
const thenable = (v: unknown): v is PromiseLike<unknown> => !!v && typeof (v as PromiseLike<unknown>).then === 'function';

/**
 * Progress through the steps of a task, with each step's content and the Back / Next actions, as a
 * hook that hands back a component and its controller.
 *
 *   const Checkout = useStepper({ items: [{ label: 'Cart', content: <Cart /> }, { label: 'Payment', content: <Pay /> }] });
 *   return <Checkout />;
 *
 * Precedence: this config, then `defaults.stepper`, then the provider (size, tone), then the library default.
 */
export function useStepper(input: StepperConfig): StepperComponent {
  const ctx = usePinfold();
  const config = ctx.defaults.stepper ? mergeConfig<StepperConfig>(ctx.defaults.stepper, input) : input;
  const base = useId();
  const items: StepperItem[] = (config.items ?? []).map((item) => (typeof item === 'string' ? { label: item } : item));
  const clamp = (n: number) => Math.min(Math.max(0, Math.round(n) || 0), items.length);
  const [raw, setRaw] = useControllableState<number>({ value: config.value, defaultValue: config.defaultValue ?? 0 });
  const value = clamp(raw);
  const panel = React.useRef<HTMLDivElement | null>(null);
  // After Back or Next, focus moves to the new step's panel, so reading starts there.
  const moved = React.useRef(false);
  // Set by the first change: the panel animates in after that, never on page load.
  const [changed, setChanged] = React.useState(false);

  if (process.env.NODE_ENV !== 'production') {
    void import('@pinfold/core/meta').then(({ stepperMeta, validateConfig }) => {
      for (const problem of validateConfig(stepperMeta, input)) warnOnce(true, problem.message);
      const inactive = inactiveStepperOptions(config);
      for (const key in inactive) warnOnce((input as unknown as Record<string, unknown>)[key] !== undefined, `Stepper: \`${key}\` has no visible effect here. ${inactive[key]}`);
    });
  }

  React.useEffect(() => {
    if (!moved.current) return;
    moved.current = false;
    panel.current?.focus({ preventScroll: true });
  });

  const variant = config.variant ?? 'circle';
  const orientation = variant === 'bar' ? 'horizontal' : config.orientation ?? 'horizontal';
  const labelPlacement = variant === 'bar' ? 'bottom' : orientation === 'vertical' ? 'end' : config.labelPlacement ?? 'bottom';
  const state: StepperState = { variant, orientation, labelPlacement, size: config.size ?? ctx.size, tone: config.tone ?? ctx.tone, value };
  const labels = config.labels ?? {};
  const panels = items.some((item) => item.content !== undefined);
  const complete = value >= items.length;
  const last = value === items.length - 1;

  const move = (step: number, event?: React.SyntheticEvent, focus = false) => {
    const next = clamp(step);
    if (next === value) return;
    moved.current = focus;
    setChanged(true);
    setRaw(next);
    if (event) config.onChange?.(next, event);
  };
  // Next: ask `onNext`, then (on the last step) `onComplete`, then move. A promise keeps the button
  // loading until it settles; `false` stays.
  const advance = (event: React.MouseEvent): void | Promise<void> => {
    const go = (): void | Promise<void> => {
      const done = last ? config.onComplete?.() : undefined;
      if (thenable(done)) return Promise.resolve(done).then(() => move(value + 1, event, true));
      move(value + 1, event, true);
    };
    const ok = config.onNext?.(value);
    if (thenable(ok)) return Promise.resolve(ok).then((result) => (result === false ? undefined : go()));
    if (ok === false) return;
    return go();
  };

  const getRootProps = (props?: PropsBag): PropsBag =>
    mergeProps(
      {
        ...radiusProps(config.radius),
        'data-variant': variant,
        'data-orientation': orientation,
        'data-label-placement': labelPlacement,
        'data-size': state.size,
        'data-tone': state.tone,
        'data-animate': dataAttr(!ctx.disableAnimation),
        'data-changed': dataAttr(changed),
        'data-unstyled': dataAttr(config.unstyled),
        style: { '--pinfold-stp-n': String(Math.max(1, items.length)) },
      },
      props,
    );

  const render = (rootProps?: StepperRootProps): React.ReactElement => {
    const slot = (name: StepperSlot, content: React.ReactNode, tag: string, own: PropsBag = {}) =>
      renderSlot(config, name, slotProps(config, name, { className: config.unstyled ? undefined : `pinfold-stepper__${name}`, ...own }), state, content, (p, c) => React.createElement(tag, p, c));
    const root = slotProps(config, 'root', getRootProps(mergeProps({ className: config.unstyled ? config.className : cn('pinfold pinfold-stepper', config.className), style: config.style }, rootProps)));

    const actions = () =>
      config.showActions === false || complete
        ? null
        : slot(
            'actions',
            <>
              <Button label={labels.back ?? 'Back'} variant="ghost" tone="neutral" size={state.size} disabled={value === 0} onClick={(event) => move(value - 1, event, true)} />
              <Button label={last ? labels.finish ?? 'Finish' : labels.next ?? 'Next'} tone={state.tone} size={state.size} onClick={advance} />
            </>,
            'div',
          );
    const content = (current: number) => {
      const body = current >= items.length ? config.doneContent : items[current]?.content;
      return slot(
        'panel',
        body,
        'div',
        {
          key: current,
          ref: panel,
          role: 'group',
          tabIndex: -1,
          'aria-labelledby': current < items.length ? `${base}-label-${current}` : undefined,
          'aria-label': current >= items.length ? labels.status?.complete ?? 'Done' : undefined,
        },
      );
    };
    // Vertical: the content opens under the current step. Horizontal: under the whole row.
    const inline = panels && orientation === 'vertical';

    const steps = items.map((item, i) => {
      const status: StepStatus = item.error ? 'error' : stepStatus(i, value);
      const mark =
        variant === 'circle' ? (status === 'error' ? ALERT_ICON : status === 'complete' ? CHECK_ICON : item.icon ?? i + 1) : variant === 'dot' && status === 'error' ? ALERT_ICON : null;
      const inner = (
        <>
          {slot('indicator', mark, 'span', { 'aria-hidden': true })}
          {slot(
            'text',
            <>
              {slot('label', item.label, 'span', { id: `${base}-label-${i}` })}
              {item.description != null || item.optional ? (
                slot('description', <>{item.description}{item.optional ? <em className={config.unstyled ? undefined : 'pinfold-stepper__optional'}>{labels.optional ?? 'Optional'}</em> : null}</>, 'span')
              ) : null}
              <span style={VISUALLY_HIDDEN}>{`, ${labels.status?.[status] ?? SPOKEN[status]}`}</span>
            </>,
            'span',
          )}
        </>
      );
      // Linear: only steps already done go back, so the order of the task holds. Otherwise any step.
      const clickable = !!config.onChange && !item.disabled && i !== value && (config.linear === false || i < value);
      return (
        <React.Fragment key={i}>
          {slot(
            'step',
            <>
              {clickable ? slot('button', inner, 'button', { type: 'button', onClick: (event: React.MouseEvent) => move(i, event) }) : inner}
              {i < items.length - 1 ? slot('connector', null, 'span', { 'aria-hidden': true }) : null}
              {inline && i === value ? (
                <div className={config.unstyled ? undefined : 'pinfold-stepper__body'}>
                  {content(i)}
                  {actions()}
                </div>
              ) : null}
            </>,
            'li',
            { [ITEM]: { ...item, index: i, status }, 'data-status': status, 'data-disabled': dataAttr(item.disabled), 'aria-current': i === value ? 'step' : undefined },
          )}
        </React.Fragment>
      );
    });
    const body = (
      <>
        {slot('list', steps, 'ol', { 'aria-label': config.label ?? 'Progress' })}
        {panels && !inline && (items[value]?.content !== undefined || (complete && config.doneContent !== undefined)) ? content(value) : null}
        {panels && !inline ? actions() : null}
        {inline && complete && config.doneContent !== undefined ? content(value) : null}
      </>
    );
    return renderSlot(config, 'root', root, state, body, (p, c) => <div {...p}>{c}</div>) as React.ReactElement;
  };

  const api: StepperApi = {
    value,
    isFirst: value === 0,
    isLast: last,
    isComplete: complete,
    setValue: (n) => setRaw(clamp(n)),
    next: () => setRaw(clamp(value + 1)),
    previous: () => setRaw(clamp(value - 1)),
    reset: () => setRaw(clamp(config.defaultValue ?? 0)),
    getRootProps,
    render,
  };
  return usePinfoldComponent<StepperApi, StepperRootProps>('Stepper', api, (props) => render(props));
}
