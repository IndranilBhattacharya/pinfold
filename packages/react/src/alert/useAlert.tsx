import * as React from 'react';
import { alertRole, cn, dimensionVars, inactiveAlertOptions, mergeProps, resolveNode, warnOnce, type PropsBag } from '@pinfold/core';
import { usePinfold } from '../provider';
import { usePinfoldComponent } from '../component';
import { mergeConfig } from '../preset';
import { renderSlot, slotProps } from '../slots';
import { Button } from '../button/Button';
import { CLOSE_ICON, ToneIcon } from '../icons';
import type { ButtonConfig } from '../button/types';
import type { AlertApi, AlertComponent, AlertConfig, AlertRootProps, AlertSlot, AlertState } from './types';

const filled = (node: unknown) => node != null && node !== false && node !== '';
/** How long the exit takes before a dismissed alert is `hidden` (the CSS animation uses the same). */
const EXIT_MS = 200;

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
  const [gone, setGone] = React.useState(false);

  if (process.env.NODE_ENV !== 'production') {
    void import('@pinfold/core/meta').then(({ alertMeta, validateConfig }) => {
      for (const problem of validateConfig(alertMeta, input)) warnOnce(true, problem.message);
    });
    const inactive = inactiveAlertOptions(config);
    for (const key in inactive) warnOnce((input as Record<string, unknown>)[key] !== undefined, `Alert: \`${key}\` has no visible effect here. ${inactive[key]}`);
    warnOnce(!filled(config.title) && !filled(config.description), 'Alert: nothing to say. Give it a `title` or a `description`.');
  }

  const state: AlertState = { tone: config.tone ?? 'info', variant: config.variant ?? 'soft', dismissed };
  const instant = ctx.disableAnimation || !!config.unstyled;

  // The exit plays, then the alert is hidden.
  React.useEffect(() => {
    if (!dismissed || gone || instant) return;
    const timer = setTimeout(() => setGone(true), EXIT_MS);
    return () => clearTimeout(timer);
  }, [dismissed, gone, instant]);
  const closed = dismissed && (gone || instant);

  const dismiss = () => {
    if (dismissed) return;
    setDismissed(true);
    config.onDismiss?.();
  };
  const show = () => {
    setDismissed(false);
    setGone(false);
  };

  const iconPlacement = config.iconPlacement ?? 'start';
  const actionsPlacement = config.actionsPlacement ?? 'below';
  const getRootProps = (props?: PropsBag): PropsBag =>
    mergeProps(
      {
        role: alertRole(config.live),
        hidden: closed ? true : undefined,
        'data-tone': state.tone,
        'data-variant': state.variant,
        'data-density': config.density ?? 'comfortable',
        'data-icon-placement': iconPlacement,
        'data-icon-align': config.iconAlign ?? 'title',
        'data-icon-variant': config.iconVariant ?? 'tile',
        'data-actions-placement': actionsPlacement,
        'data-state': closed ? 'closed' : dismissed ? 'closing' : 'open',
        'data-animate': ctx.disableAnimation ? undefined : '',
        'data-unstyled': config.unstyled ? '' : undefined,
      },
      props,
    );

  const render = (rootProps?: AlertRootProps): React.ReactElement => {
    const cls = (name: string) => (config.unstyled ? undefined : name);
    const slot = (name: AlertSlot, content: React.ReactNode, base: PropsBag = {}, tag = 'div') =>
      renderSlot(config, name, slotProps(config, name, { className: cls(`pinfold-alert__${name}`), ...base }), state, content, (p, c) => React.createElement(tag, p, c));
    const vars = dimensionVars('alert', config.dimensions);
    const root = slotProps(
      config,
      'root',
      getRootProps(mergeProps({ className: config.unstyled ? config.className : cn('pinfold pinfold-alert', config.className), style: vars || config.style ? { ...vars, ...config.style } : undefined }, rootProps)),
    );
    // The icon: yours, then yours for this tone, then the tone icon.
    const own = config.icon === undefined ? config.icons?.[state.tone] : config.icon;
    const icon = own === undefined ? <ToneIcon tone={state.tone} /> : (resolveNode(own, state) as React.ReactNode);
    const title = resolveNode(config.title, state) as React.ReactNode;
    const description = resolveNode(config.description, state) as React.ReactNode;
    const actions = config.actions ?? [];
    // Defaults for the buttons: small, the first tinted in the alert tone, the rest quiet; on a
    // solid alert, solid neutral buttons, opaque so they read on any tone. Each action's own config wins.
    const solid = state.variant === 'solid';
    const button = (action: ButtonConfig, i: number) => (
      <Button key={i} size="sm" tone={solid || i > 0 ? 'neutral' : state.tone} variant={solid ? 'solid' : i === 0 ? 'soft' : 'ghost'} {...action} />
    );
    const actionsNode = actions.length ? slot('actions', actions.map(button)) : null;
    const content = closed ? null : (
      <>
        {filled(icon) ? slot('icon', icon, { 'aria-hidden': true }, 'span') : null}
        {slot(
          'content',
          <>
            {filled(title) ? slot('title', title) : null}
            {filled(description) ? slot('description', description) : null}
            {actionsPlacement === 'below' ? actionsNode : null}
          </>,
        )}
        {actionsPlacement === 'end' ? actionsNode : null}
        {config.dismissible
          ? slot('dismiss', CLOSE_ICON, { type: 'button', 'aria-label': config.dismissLabel ?? 'Dismiss', title: config.dismissLabel ?? 'Dismiss', onClick: dismiss }, 'button')
          : null}
      </>
    );
    return renderSlot(config, 'root', root, state, content, (p, c) => <div {...p}>{c}</div>) as React.ReactElement;
  };

  const api: AlertApi = { dismissed, dismiss, show, getRootProps, render };
  return usePinfoldComponent<AlertApi, AlertRootProps>('Alert', api, (props) => render(props));
}
