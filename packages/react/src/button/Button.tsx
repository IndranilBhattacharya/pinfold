import * as React from 'react';
import { buttonRel, cn, dataAttr, dimensionVars, warnOnce, __DEV__, type PropsBag } from '@pinfold/core';
import { renderSlot, slotProps } from '../slots';
import type { ButtonProps, ButtonRadius, ButtonSlot, ButtonState } from './types';

/** Radius presets scale the size's radius unit, as the theme presets do; `full` is a pill. */
const RADIUS_SCALE: Record<string, number> = { none: 0, sm: 0.6, md: 1, lg: 1.5 };
function radiusValue(r: ButtonRadius | undefined) {
  if (r === 'full') return 'var(--pinfold-radius-full)';
  if (typeof r === 'string' && Object.prototype.hasOwnProperty.call(RADIUS_SCALE, r)) {
    return `calc(var(--pinfold-control-radius-unit) * ${RADIUS_SCALE[r]})`;
  }
  return r;
}

const filled = (node: React.ReactNode) => node != null && node !== false && node !== '';

/**
 * An action, or a link that looks like one.
 *
 *   <Button onClick={save}>Save</Button>
 *   <Button tone="danger" variant="soft" loading={busy}>Delete</Button>
 *
 * A stateless atom (D-23): no hooks, so it renders in Server Components with no
 * client JavaScript. Unset `size` and `tone` follow the nearest provider through
 * CSS. Disabled and loading use `aria-disabled` and swallow activation, so the
 * button keeps its place in the tab order.
 */
export const Button = React.forwardRef<HTMLButtonElement | HTMLAnchorElement, ButtonProps>(function Button(props, ref) {
  const {
    children,
    variant = 'solid',
    size,
    tone,
    radius,
    icon,
    endIcon,
    loading = false,
    loadingText,
    disabled = false,
    fullWidth = false,
    href,
    type = 'button',
    dimensions,
    unstyled = false,
    className,
    style,
    classNames,
    styles,
    slotProps: slotOverrides,
    render,
    target,
    rel,
    onClick,
    ...rest
  } = props;
  const overrides = { classNames, styles, slotProps: slotOverrides, render };
  const hasLabel = filled(children);
  const iconOnly = !hasLabel && filled(icon);
  const blocked = disabled || loading;
  const isLink = href !== undefined;
  const state: ButtonState = { variant, disabled, loading, iconOnly };

  if (__DEV__) {
    warnOnce(
      iconOnly && !rest['aria-label'] && !rest['aria-labelledby'],
      'Button: an icon-only button needs `aria-label` (or `aria-labelledby`), or screen readers announce it as just "button".',
    );
    warnOnce(isLink && props.type !== undefined, 'Button: `type` has no effect: `href` renders an `<a>`, which has no type.');
    warnOnce(variant === 'link' && radius !== undefined, 'Button: `radius` has no effect: the `link` variant has no surface to round.');
  }

  const cls = (name: string) => (unstyled ? undefined : name);
  const vars = dimensionVars('button', { ...dimensions, radius: dimensions?.radius ?? radiusValue(radius) });

  const root: PropsBag = {
    ...rest,
    ref,
    className: unstyled ? className : cn('pinfold pinfold-button', className),
    style: vars || style ? { ...vars, ...style } : undefined,
    'data-variant': variant,
    'data-size': size,
    'data-tone': tone,
    'data-disabled': dataAttr(disabled),
    'data-loading': dataAttr(loading),
    'data-icon-only': dataAttr(iconOnly),
    'data-full-width': dataAttr(fullWidth),
    'data-unstyled': dataAttr(unstyled),
    'aria-disabled': blocked ? true : rest['aria-disabled'],
    'aria-busy': loading || undefined,
    'aria-label': loading && loadingText ? loadingText : rest['aria-label'],
    onClick: (event: React.MouseEvent<HTMLButtonElement>) => {
      // Swallowing the click also cancels a submit (and Enter's implicit submit) while blocked.
      if (blocked) {
        event.preventDefault();
        return;
      }
      onClick?.(event);
    },
  };
  if (isLink) {
    // A blocked link loses its href, so it cannot navigate, and keeps focus through tabIndex.
    Object.assign(root, blocked ? { role: 'link', tabIndex: rest.tabIndex ?? 0 } : { href, target, rel: buttonRel(target, rel) });
  } else {
    root.type = type;
  }

  const slot = (name: ButtonSlot, node: React.ReactNode, base: PropsBag) =>
    renderSlot(overrides, name, slotProps(overrides, name, base), state, node, (p, c) => <span {...p}>{c}</span>);

  const content = (
    <>
      {filled(icon) ? slot('icon', icon, { className: cls('pinfold-button__icon'), 'aria-hidden': true }) : null}
      {hasLabel ? slot('label', children, { className: cls('pinfold-button__label') }) : null}
      {filled(endIcon) ? slot('endIcon', endIcon, { className: cls('pinfold-button__endIcon'), 'aria-hidden': true }) : null}
      {loading ? slot('spinner', null, { className: cls('pinfold-button__spinner'), 'aria-hidden': true, 'data-motion': 'essential' }) : null}
    </>
  );

  return renderSlot(overrides, 'root', slotProps(overrides, 'root', root), state, content, (p, c) =>
    isLink ? <a {...p}>{c}</a> : <button {...p}>{c}</button>,
  ) as React.ReactElement;
});
