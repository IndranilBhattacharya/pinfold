import * as React from 'react';
import { alertRole, cn, dimensionVars, inactiveAlertOptions, mergeProps, warnOnce, type PropsBag } from '@pinfold/core';
import { usePinfold } from '../provider';
import { usePinfoldComponent } from '../component';
import { mergeConfig } from '../preset';
import { renderSlot, slotProps } from '../slots';
import { Button } from '../button/Button';
import type { ButtonConfig } from '../button/types';
import type { AlertApi, AlertComponent, AlertConfig, AlertRootProps, AlertSlot, AlertState, AlertTone } from './types';

const filled = (node: React.ReactNode) => node != null && node !== false && node !== '';

/** Tone icons: 24-unit strokes in currentColor, so they follow the tone and forced colours. */
const PATHS: Record<AlertTone, string> = {
  info: 'M12 16v-5M12 8h.01',
  neutral: 'M12 16v-5M12 8h.01',
  primary: 'M12 16v-5M12 8h.01',
  success: 'M8 12.5l2.5 2.5L16 9.5',
  warning: 'M12 9v4M12 16.5h.01',
  danger: 'M12 8v5M12 16h.01',
};
function ToneIcon({ tone }: { tone: AlertTone }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" focusable="false">
      {tone === 'warning' ? <path d="M10.3 3.9 2.4 17.6A2 2 0 0 0 4.1 20.6h15.8a2 2 0 0 0 1.7-3L13.7 3.9a2 2 0 0 0-3.4 0z" /> : <circle cx="12" cy="12" r="9" />}
      <path d={PATHS[tone]} />
    </svg>
  );
}
const CLOSE = (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" focusable="false">
    <path d="M6 6l12 12M18 6 6 18" />
  </svg>
);

/**
 * A message box, as a hook that hands back a component.
 *
 *   const Problem = useAlert({ tone: 'danger', title: 'Payment failed', actions: [{ label: 'Retry', onClick: retry }] });
 *   return <Problem />;
 *
 * The same value is the controller (`Problem.dismissed`, `.dismiss()`, `.show()`).
 * Precedence: this config, then `defaults.alert`, then the library default. An alert never
 * takes the provider tone: its colour is its meaning.
 */
export function useAlert(input: AlertConfig = {}): AlertComponent {
  const ctx = usePinfold();
  const config = ctx.defaults.alert ? mergeConfig<AlertConfig>(ctx.defaults.alert, input) : input;
  const [dismissed, setDismissed] = React.useState(false);

  if (process.env.NODE_ENV !== 'production') {
    void import('@pinfold/core/meta').then(({ alertMeta, validateConfig }) => {
      for (const problem of validateConfig(alertMeta, input)) warnOnce(true, problem.message);
    });
    const inactive = inactiveAlertOptions(config);
    for (const key in inactive) warnOnce((input as Record<string, unknown>)[key] !== undefined, `Alert: \`${key}\` has no visible effect here. ${inactive[key]}`);
    warnOnce(!filled(config.title) && !filled(config.description), 'Alert: nothing to say. Give it a `title` or a `description`.');
  }

  const state: AlertState = { tone: config.tone ?? 'info', variant: config.variant ?? 'soft', dismissed };
  const dismiss = () => {
    setDismissed(true);
    config.onDismiss?.();
  };

  const getRootProps = (props?: PropsBag): PropsBag =>
    mergeProps(
      {
        role: alertRole(config.live),
        hidden: dismissed ? true : undefined,
        'data-tone': state.tone,
        'data-variant': state.variant,
        'data-unstyled': config.unstyled ? '' : undefined,
      },
      props,
    );

  const render = (rootProps?: AlertRootProps): React.ReactElement => {
    const cls = (name: string) => (config.unstyled ? undefined : name);
    const slot = (name: AlertSlot, content: React.ReactNode, base: PropsBag = {}, tag: 'div' | 'span' = 'div') =>
      renderSlot(config, name, slotProps(config, name, { className: cls(`pinfold-alert__${name}`), ...base }), state, content, (p, c) => React.createElement(tag, p, c));
    const vars = dimensionVars('alert', config.dimensions);
    const root = slotProps(
      config,
      'root',
      getRootProps(mergeProps({ className: config.unstyled ? config.className : cn('pinfold pinfold-alert', config.className), style: vars || config.style ? { ...vars, ...config.style } : undefined }, rootProps)),
    );
    const icon = config.icon === undefined ? <ToneIcon tone={state.tone} /> : config.icon;
    const actions = config.actions ?? [];
    // Defaults for the buttons: small, in the alert tone, the first solid. Each action's own config wins.
    const button = (action: ButtonConfig, i: number) => <Button key={i} size="sm" tone={state.tone} variant={i === 0 ? 'solid' : 'ghost'} {...action} />;
    const content = dismissed ? null : (
      <>
        {filled(icon) ? slot('icon', icon, { 'aria-hidden': true }, 'span') : null}
        {slot(
          'content',
          <>
            {filled(config.title) ? slot('title', config.title) : null}
            {filled(config.description) ? slot('description', config.description) : null}
            {actions.length ? slot('actions', actions.map(button)) : null}
          </>,
        )}
        {config.dismissible
          ? slot('dismiss', <Button label={config.dismissLabel ?? 'Dismiss'} icon={CLOSE} iconOnly variant="ghost" size="sm" tone={state.tone} onClick={dismiss} />, {}, 'span')
          : null}
      </>
    );
    return renderSlot(config, 'root', root, state, content, (p, c) => <div {...p}>{c}</div>) as React.ReactElement;
  };

  const api: AlertApi = { dismissed, dismiss, show: () => setDismissed(false), getRootProps, render };
  return usePinfoldComponent<AlertApi, AlertRootProps>('Alert', api, (props) => render(props));
}
