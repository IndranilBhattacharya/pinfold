import * as React from 'react';
import { badgeCount, badgeDotOnly, cn, dimensionVars, inactiveBadgeOptions, mergeProps, warnOnce, type PropsBag } from '@pinfold/core';
import { usePinfold } from '../provider';
import { VISUALLY_HIDDEN } from '../a11y';
import { usePinfoldComponent } from '../component';
import { mergeConfig } from '../preset';
import { renderSlot, slotProps } from '../slots';
import type { BadgeApi, BadgeComponent, BadgeConfig, BadgeRootProps, BadgeSlot, BadgeState } from './types';

const filled = (node: React.ReactNode) => node != null && node !== false && node !== '';

/**
 * A status label, a count, a dot, or a mix of them, as a hook that hands back a component.
 *
 *   const Inbox = useBadge({ label: 'Inbox', count: 3, srLabel: 'unread messages' });
 *   return <Inbox />;          // Inbox 3, read "Inbox 3 unread messages"
 *
 * Precedence: this config, then `defaults.badge`, then the provider (size, tone), then the library default.
 */
export function useBadge(input: BadgeConfig = {}): BadgeComponent {
  const ctx = usePinfold();
  const config = ctx.defaults.badge ? mergeConfig<BadgeConfig>(ctx.defaults.badge, input) : input;
  const hasLabel = filled(config.label);
  const dotOnly = badgeDotOnly(config);
  const anchored = filled(config.anchor);

  if (process.env.NODE_ENV !== 'production') {
    void import('@pinfold/core/meta').then(({ badgeMeta, validateConfig }) => {
      for (const problem of validateConfig(badgeMeta, input)) warnOnce(true, problem.message);
    });
    // Static mistakes only: a count arrives at runtime, so `max` without one never warns.
    const inactive = inactiveBadgeOptions({ ...config, count: 0 });
    for (const key in inactive) warnOnce((input as Record<string, unknown>)[key] !== undefined, `Badge: \`${key}\` has no visible effect here. ${inactive[key]}`);
    warnOnce(dotOnly && !config.srLabel, 'Badge: a dot on its own says nothing to screen readers. Give it an `srLabel`, e.g. "Online".');
    warnOnce(!config.dot && !hasLabel && !filled(config.icon) && typeof config.count !== 'number', 'Badge: nothing to show. Give it a `label`, a `count` or `dot: true`.');
  }

  const text = typeof config.count === 'number' ? badgeCount(config.count, config.max, config.showZero) : null;
  const state: BadgeState = {
    variant: config.variant ?? 'soft',
    size: config.size ?? ctx.size,
    tone: config.tone ?? ctx.tone,
    dotOnly,
    visible: !!config.dot || hasLabel || filled(config.icon) || text != null,
  };

  const getRootProps = (props?: PropsBag): PropsBag =>
    mergeProps(
      {
        // Nothing to show is neither seen nor read.
        hidden: state.visible ? undefined : true,
        'data-variant': state.variant,
        'data-size': state.size,
        'data-tone': state.tone,
        'data-radius': dotOnly ? undefined : config.radius ?? 'full',
        'data-dot-only': dotOnly ? '' : undefined,
        'data-count-only': text != null && !hasLabel && !filled(config.icon) && !config.dot ? '' : undefined,
        'data-placement': anchored ? config.placement ?? 'top-end' : undefined,
        'data-anchor-shape': anchored ? config.anchorShape ?? 'rect' : undefined,
        'data-unstyled': config.unstyled ? '' : undefined,
      },
      props,
    );

  const render = (rootProps?: BadgeRootProps): React.ReactElement => {
    const slot = (name: BadgeSlot, content: React.ReactNode, base: PropsBag = {}) =>
      renderSlot(config, name, slotProps(config, name, { className: config.unstyled ? undefined : `pinfold-badge__${name}`, ...base }), state, content, (p, c) => <span {...p}>{c}</span>);
    const vars = dimensionVars('badge', config.dimensions);
    const root = slotProps(
      config,
      'root',
      getRootProps(mergeProps({ className: config.unstyled ? config.className : cn('pinfold pinfold-badge', config.className), style: vars || config.style ? { ...vars, ...config.style } : undefined }, rootProps)),
    );
    const content = (
      <>
        {config.dot && !dotOnly ? slot('dot', null, { 'aria-hidden': true }) : null}
        {filled(config.icon) ? slot('icon', config.icon, { 'aria-hidden': true }) : null}
        {hasLabel ? slot('label', config.label) : null}
        {text != null ? slot('count', text) : null}
        {config.srLabel ? <span style={VISUALLY_HIDDEN}>{` ${config.srLabel}`}</span> : null}
      </>
    );
    const badge = renderSlot(config, 'root', root, state, content, (p, c) => <span {...p}>{c}</span>) as React.ReactElement;
    if (!anchored) return badge;
    // A zero-size box on the anchor's corner, the badge centred on it: any width sits right, in any direction.
    const corner = (
      <span className={config.unstyled ? undefined : 'pinfold-badge__corner'} data-placement={config.placement ?? 'top-end'} data-anchor-shape={config.anchorShape ?? 'rect'}>
        {badge}
      </span>
    );
    return slot('anchor', <>{config.anchor}{corner}</>) as React.ReactElement;
  };

  const api: BadgeApi = { getRootProps, render };
  return usePinfoldComponent<BadgeApi, BadgeRootProps>('Badge', api, (props) => render(props));
}
