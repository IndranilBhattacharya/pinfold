import * as React from 'react';
import { alertRole, cn, dimensionVars, inactiveAlertOptions, mergeProps, warnOnce, type PropsBag } from '@pinfold/core';
import { usePinfold } from '../provider';
import { usePinfoldComponent } from '../component';
import { mergeConfig } from '../preset';
import { renderSlot, slotProps } from '../slots';
import { Button } from '../button/Button';
import { CLOSE_ICON, ToneIcon } from '../icons';
import type { ButtonConfig } from '../button/types';
import type { AlertApi, AlertComponent, AlertConfig, AlertRootProps, AlertSlot, AlertState } from './types';

const filled = (node: React.ReactNode) => node != null && node !== false && node !== '';

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
    // Defaults for the buttons: small, the first tinted in the alert tone, the rest quiet. Each action's own config wins.
    const button = (action: ButtonConfig, i: number) => <Button key={i} size="sm" tone={i === 0 ? state.tone : 'neutral'} variant={i === 0 ? 'soft' : 'ghost'} {...action} />;
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
          ? slot('dismiss', <Button label={config.dismissLabel ?? 'Dismiss'} icon={CLOSE_ICON} iconOnly variant="ghost" size="sm" tone="neutral" onClick={dismiss} />, {}, 'span')
          : null}
      </>
    );
    return renderSlot(config, 'root', root, state, content, (p, c) => <div {...p}>{c}</div>) as React.ReactElement;
  };

  const api: AlertApi = { dismissed, dismiss, show: () => setDismissed(false), getRootProps, render };
  return usePinfoldComponent<AlertApi, AlertRootProps>('Alert', api, (props) => render(props));
}
