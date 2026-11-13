import * as React from 'react';
import {
  badgeArcOffset,
  badgeClickable,
  badgeCorner,
  badgeCount,
  badgeDotOnly,
  buttonRel,
  cn,
  dataAttr,
  dimensionVars,
  inactiveBadgeOptions,
  mergeProps,
  resolveNode,
  warnOnce,
  type PropsBag,
} from '@pinfold/core';
import { usePinfold } from '../provider';
import { VISUALLY_HIDDEN } from '../a11y';
import { usePinfoldComponent } from '../component';
import { useEvent, useId, useIsomorphicLayoutEffect } from '../hooks';
import { followLink } from '../link';
import { mergeConfig } from '../preset';
import { renderSlot, slotProps } from '../slots';
import { CLOSE_ICON } from '../icons';
import type { BadgeApi, BadgeComponent, BadgeConfig, BadgeRootProps, BadgeSlot, BadgeState } from './types';

const filled = (node: unknown) => node != null && node !== false && node !== '';
/** How long the exit takes before a dismissed badge leaves the layout (the CSS uses the same). */
const EXIT_MS = 200;

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
  const id = useId();
  const [dismissed, setDismissed] = React.useState(false);
  const [gone, setGone] = React.useState(false);
  const anchorRef = React.useRef<HTMLElement | null>(null);
  const cornerRef = React.useRef<HTMLElement | null>(null);

  const dotOnly = badgeDotOnly(config);
  const anchored = filled(config.anchor);
  const clickable = badgeClickable(config);
  const placement = config.placement ?? 'top-end';
  const shape = config.anchorShape ?? 'auto';
  const variant = config.variant ?? 'soft';
  const text = typeof config.count === 'number' ? badgeCount(config.count, config.max, config.showZero) : null;

  if (process.env.NODE_ENV !== 'production') {
    void import('@pinfold/core/meta').then(({ badgeMeta, validateConfig }) => {
      for (const problem of validateConfig(badgeMeta, input)) warnOnce(true, problem.message);
    });
    // Static mistakes only: a count arrives at runtime, so `max` without one never warns.
    const inactive = inactiveBadgeOptions({ ...config, count: 0 });
    for (const key in inactive) warnOnce((input as Record<string, unknown>)[key] !== undefined, `Badge: \`${key}\` has no visible effect here. ${inactive[key]}`);
    warnOnce(dotOnly && !config.srLabel, 'Badge: a dot on its own says nothing to screen readers. Give it an `srLabel`, e.g. "Online".');
    warnOnce(
      !config.dot && variant !== 'dot' && !filled(config.label) && !filled(config.icon) && !filled(config.avatar) && typeof config.count !== 'number',
      'Badge: nothing to show. Give it a `label`, a `count` or `dot: true`.',
    );
  }

  const base = {
    variant,
    size: config.size ?? ctx.size,
    tone: config.tone ?? ctx.tone,
    dotOnly,
    clickable,
    dismissed,
    count: typeof config.count === 'number' ? config.count : undefined,
  };
  const pre = { ...base, visible: true, invisible: false } as BadgeState;
  const label = resolveNode(config.label, pre) as React.ReactNode;
  const icon = resolveNode(config.icon, pre) as React.ReactNode;
  const endIcon = resolveNode(config.endIcon, pre) as React.ReactNode;
  const hasLabel = filled(label);
  const visible = !!config.dot || variant === 'dot' || hasLabel || filled(icon) || filled(config.avatar) || text != null;
  // A pinned badge with nothing to show fades away (a count dropping to zero); in the text flow it leaves.
  const invisible = !!config.invisible || dismissed || (anchored && !visible);
  const state: BadgeState = { ...base, visible, invisible };
  const showDot = (!!config.dot || variant === 'dot') && !dotOnly;

  // The exit plays, then a dismissed badge leaves the layout.
  React.useEffect(() => {
    if (!dismissed || gone) return;
    if (ctx.disableAnimation || config.unstyled) {
      setGone(true);
      return;
    }
    const timer = setTimeout(() => setGone(true), EXIT_MS);
    return () => clearTimeout(timer);
  }, [dismissed, gone, ctx.disableAnimation, config.unstyled]);

  // `auto`: the badge's centre goes where the anchor's corner curve crosses its diagonal.
  const measure = useEvent(() => {
    const corner = cornerRef.current;
    const wrap = anchorRef.current;
    if (!corner) return;
    const el = wrap?.firstElementChild as HTMLElement | null | undefined;
    if (shape !== 'auto' || !wrap || !el || el === corner || typeof getComputedStyle !== 'function') {
      corner.style.removeProperty('--pinfold-bdg-off-x');
      corner.style.removeProperty('--pinfold-bdg-off-y');
      return;
    }
    const cs = getComputedStyle(el);
    const box = el.getBoundingClientRect();
    const width = el.offsetWidth || box.width;
    const height = el.offsetHeight || box.height;
    const rtl = getComputedStyle(wrap).direction === 'rtl';
    const { x, y } = badgeArcOffset(
      { 'top-left': cs.borderTopLeftRadius, 'top-right': cs.borderTopRightRadius, 'bottom-right': cs.borderBottomRightRadius, 'bottom-left': cs.borderBottomLeftRadius },
      width,
      height,
      badgeCorner(placement, rtl),
    );
    corner.style.setProperty('--pinfold-bdg-off-x', `${Math.round(x * 100) / 100}px`);
    corner.style.setProperty('--pinfold-bdg-off-y', `${Math.round(y * 100) / 100}px`);
  });
  // Every render: the anchor or its radius may have changed. One style read, no layout thrash.
  useIsomorphicLayoutEffect(() => {
    if (anchored) measure();
  });
  // A size change rescales a percentage or a pill radius.
  useIsomorphicLayoutEffect(() => {
    const wrap = anchorRef.current;
    if (!anchored || shape !== 'auto' || !wrap || typeof ResizeObserver !== 'function') return;
    const observer = new ResizeObserver(() => measure());
    observer.observe(wrap);
    return () => observer.disconnect();
  }, [anchored, shape, measure]);

  const dismiss = (event?: React.MouseEvent<HTMLButtonElement>) => {
    setDismissed(true);
    if (event) config.onDismiss?.(event);
  };
  const show = () => {
    setDismissed(false);
    setGone(false);
  };

  const interactive = clickable || !!config.dismissible;
  const getRootProps = (props?: PropsBag): PropsBag =>
    mergeProps(
      {
        // Nothing to show is neither seen nor read; a finished dismiss leaves the layout.
        hidden: (!visible && !anchored) || gone ? true : undefined,
        'aria-hidden': invisible ? true : undefined,
        'data-variant': state.variant,
        'data-size': state.size,
        'data-tone': state.tone,
        'data-radius': dotOnly ? undefined : config.radius ?? 'full',
        'data-dot-only': dataAttr(dotOnly),
        'data-count-only': dataAttr(text != null && !hasLabel && !filled(icon) && !filled(endIcon) && !filled(config.avatar) && !showDot && !config.dismissible),
        'data-invisible': dataAttr(invisible),
        'data-pulse': config.pulse ? (showDot || dotOnly ? 'dot' : 'badge') : undefined,
        'data-interactive': dataAttr(interactive),
        'data-placement': anchored ? placement : undefined,
        'data-anchor-shape': anchored ? shape : undefined,
        'data-animate': dataAttr(!ctx.disableAnimation),
        'data-unstyled': dataAttr(config.unstyled),
      },
      props,
    );

  const render = (rootProps?: BadgeRootProps): React.ReactElement => {
    const cls = (name: string) => (config.unstyled ? undefined : name);
    const slot = (name: BadgeSlot, content: React.ReactNode, own: PropsBag = {}, tag = 'span') =>
      renderSlot(config, name, slotProps(config, name, { className: cls(`pinfold-badge__${name}`), ...own }), state, content, (p, c) => React.createElement(tag, p, c));
    const vars = dimensionVars('badge', config.dimensions);
    const root = slotProps(
      config,
      'root',
      getRootProps(mergeProps({ className: config.unstyled ? config.className : cn('pinfold pinfold-badge', config.className), style: vars || config.style ? { ...vars, ...config.style } : undefined }, rootProps)),
    );
    const countText = text != null && config.formatCount ? config.formatCount(Math.max(0, Math.floor(config.count as number))) : text;
    const labelId = `${id}-label`;
    const body = (
      <>
        {filled(config.avatar) ? slot('avatar', config.avatar, { 'aria-hidden': true }) : null}
        {showDot ? slot('dot', null, { 'aria-hidden': true }) : null}
        {filled(icon) ? slot('icon', icon, { 'aria-hidden': true }) : null}
        {hasLabel ? slot('label', label, config.dismissible ? { id: labelId } : {}) : null}
        {/* A space for assistive tech ("Inbox 3"); flex layout drops it visually. */}
        {hasLabel && text != null ? ' ' : null}
        {text != null ? slot('count', countText) : null}
        {filled(endIcon) ? slot('endIcon', endIcon, { 'aria-hidden': true }) : null}
        {config.srLabel ? ' ' : null}
        {config.srLabel ? <span style={VISUALLY_HIDDEN}>{config.srLabel}</span> : null}
      </>
    );
    const out = invisible ? -1 : undefined;
    const action = clickable
      ? slot(
          'action',
          body,
          config.href
            ? {
                href: config.href,
                target: config.target,
                rel: buttonRel(config.target, config.rel),
                tabIndex: out,
                onClick: (event: React.MouseEvent<HTMLElement>) => {
                  config.onClick?.(event);
                  followLink(event, config.href, ctx.navigate, config.target);
                },
              }
            : { type: 'button', tabIndex: out, onClick: (event: React.MouseEvent<HTMLElement>) => config.onClick?.(event) },
          config.href ? 'a' : 'button',
        )
      : body;
    const dismissButton = config.dismissible
      ? slot(
          'dismiss',
          CLOSE_ICON,
          {
            type: 'button',
            id: `${id}-dismiss`,
            'aria-label': config.dismissLabel ?? 'Remove',
            // Read with the label: "Remove Design".
            'aria-labelledby': hasLabel ? `${id}-dismiss ${labelId}` : undefined,
            tabIndex: out,
            onClick: (event: React.MouseEvent<HTMLButtonElement>) => dismiss(event),
          },
          'button',
        )
      : null;
    const badge = renderSlot(config, 'root', root, state, <>{action}{dismissButton}</>, (p, c) => <span {...p}>{c}</span>) as React.ReactElement;
    if (!anchored) return badge;
    // A zero-size box on the anchor's edge, the badge centred on it: any width sits right, in any direction.
    const corner = slot('corner', badge, { ref: cornerRef, 'data-placement': placement, 'data-anchor-shape': shape, style: vars });
    return slot('anchor', <>{config.anchor}{corner}</>, { ref: anchorRef }) as React.ReactElement;
  };

  const api: BadgeApi = { dismissed, dismiss: () => dismiss(), show, getRootProps, render };
  return usePinfoldComponent<BadgeApi, BadgeRootProps>('Badge', api, (props) => render(props));
}
