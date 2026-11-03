import * as React from 'react';
import { badgeCount, cn, dimensionVars, inactiveBadgeOptions, mergeProps, warnOnce, type PropsBag } from '@pinfold/core';
import { usePinfold } from '../provider';
import { VISUALLY_HIDDEN } from '../a11y';
import { usePinfoldComponent } from '../component';
import { mergeConfig } from '../preset';
import { renderSlot, slotProps } from '../slots';
import type { BadgeApi, BadgeComponent, BadgeConfig, BadgeKind, BadgeRootProps, BadgeState } from './types';

const filled = (node: React.ReactNode) => node != null && node !== false && node !== '';

/**
 * A status label, a count or a dot, as a hook that hands back a component.
 *
 *   const Unread = useBadge({ count: 3, tone: 'danger', label: 'unread messages' });
 *   return <Unread />;          // shows "3", reads "3 unread messages"
 *
 * Precedence: this config, then `defaults.badge`, then the provider (size, tone), then the library default.
 */
export function useBadge(input: BadgeConfig = {}): BadgeComponent {
  const ctx = usePinfold();
  const config = ctx.defaults.badge ? mergeConfig<BadgeConfig>(ctx.defaults.badge, input) : input;
  const kind: BadgeKind = config.dot ? 'dot' : typeof config.count === 'number' ? 'count' : 'label';
  const hasLabel = filled(config.label);

  if (process.env.NODE_ENV !== 'production') {
    void import('@pinfold/core/meta').then(({ badgeMeta, validateConfig }) => {
      for (const problem of validateConfig(badgeMeta, input)) warnOnce(true, problem.message);
    });
    // Static mistakes only: a count arrives at runtime, so `max` without one never warns.
    if (kind === 'dot') {
      const inactive = inactiveBadgeOptions({ dot: true, count: 0 });
      for (const key of ['icon', 'radius']) warnOnce((input as Record<string, unknown>)[key] !== undefined, `Badge: \`${key}\` has no visible effect here. ${inactive[key]}`);
    }
    warnOnce(kind === 'dot' && !hasLabel, 'Badge: a dot without a `label` says nothing to screen readers. Give it one, e.g. `label: "Online"`.');
    warnOnce(kind === 'label' && !hasLabel && !filled(config.icon), 'Badge: nothing to show. Give it a `label`, a `count` or `dot: true`.');
  }

  const text = kind === 'count' ? badgeCount(config.count as number, config.max, config.showZero) : null;
  const state: BadgeState = {
    kind,
    variant: config.variant ?? 'solid',
    size: config.size ?? ctx.size,
    tone: config.tone ?? ctx.tone,
    visible: kind !== 'count' || text != null,
  };

  const getRootProps = (props?: PropsBag): PropsBag =>
    mergeProps(
      {
        // A hidden count is neither seen nor read.
        hidden: state.visible ? undefined : true,
        'data-kind': kind,
        'data-variant': state.variant,
        'data-size': state.size,
        'data-tone': state.tone,
        'data-radius': kind === 'dot' ? undefined : config.radius ?? 'full',
        'data-placement': config.placement ?? 'inline',
        'data-unstyled': config.unstyled ? '' : undefined,
      },
      props,
    );

  const render = (rootProps?: BadgeRootProps): React.ReactElement => {
    const cls = (name: string) => (config.unstyled ? undefined : name);
    const vars = dimensionVars('badge', config.dimensions);
    const root = slotProps(
      config,
      'root',
      getRootProps(mergeProps({ className: config.unstyled ? config.className : cn('pinfold pinfold-badge', config.className), style: vars || config.style ? { ...vars, ...config.style } : undefined }, rootProps)),
    );
    // With a count or a dot, the label is what the number or the dot means: read, not shown.
    const spoken = hasLabel && kind !== 'label' ? <span style={VISUALLY_HIDDEN}>{kind === 'count' ? ' ' : null}{config.label}</span> : null;
    const content =
      kind === 'dot' ? (
        spoken
      ) : (
        <>
          {filled(config.icon)
            ? renderSlot(config, 'icon', slotProps(config, 'icon', { className: cls('pinfold-badge__icon'), 'aria-hidden': true }), state, config.icon, (p, c) => <span {...p}>{c}</span>)
            : null}
          {renderSlot(config, 'label', slotProps(config, 'label', { className: cls('pinfold-badge__label') }), state, kind === 'count' ? text : config.label, (p, c) => <span {...p}>{c}</span>)}
          {spoken}
        </>
      );
    return renderSlot(config, 'root', root, state, content, (p, c) => <span {...p}>{c}</span>) as React.ReactElement;
  };

  const api: BadgeApi = { getRootProps, render };
  return usePinfoldComponent<BadgeApi, BadgeRootProps>('Badge', api, (props) => render(props));
}
