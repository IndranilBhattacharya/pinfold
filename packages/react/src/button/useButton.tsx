import * as React from 'react';
import { buttonRel, cn, dataAttr, dimensionVars, mergeProps, resolveNode, type PropsBag } from '@pinfold/core';
import { useEvent } from '../hooks';
import { usePinfold } from '../provider';
import { followLink } from '../link';
import { usePinfoldComponent } from '../component';
import { renderSlot, slotProps } from '../slots';
import type { ButtonApi, ButtonComponent, ButtonConfig, ButtonRadius, ButtonRootProps, ButtonSlot, ButtonState } from './types';

/** Radius presets scale the size's radius unit, as the theme presets do; `full` is a pill. */
const RADIUS_SCALE: Record<string, number> = { none: 0, sm: 0.6, md: 1, lg: 1.5 };
function radiusValue(r: ButtonRadius | undefined) {
  if (r === 'full') return 'var(--pinfold-radius-full)';
  if (typeof r === 'string' && Object.prototype.hasOwnProperty.call(RADIUS_SCALE, r)) return `calc(var(--pinfold-control-radius-unit) * ${RADIUS_SCALE[r]})`;
  return r;
}

const filled = (node: React.ReactNode) => node != null && node !== false && node !== '';
const isThenable = (v: unknown): v is PromiseLike<unknown> => !!v && typeof (v as PromiseLike<unknown>).then === 'function';

/**
 * The button, as a hook that hands back a component.
 *
 *   const Save = useButton({ label: 'Save', tone: 'success', onClick: save });
 *   return <Save />;
 *
 * The same value is the controller (`Save.loading`, `Save.setLoading(true)`, `Save.focus()`).
 * Precedence for every option: this config, then `defaults.button` in the global config, then
 * the provider (size, tone), then the library default.
 *
 * Disabled and loading use `aria-disabled` and swallow activation, so the button keeps its
 * place in the tab order. An `onClick` that returns a promise shows the loading state until
 * it settles.
 */
export function useButton(input: ButtonConfig): ButtonComponent {
  const ctx = usePinfold();
  const config = (ctx.defaults.button ? { ...ctx.defaults.button, ...defined(input) } : input) as ButtonConfig;

  if (process.env.NODE_ENV !== 'production') {
    void import('./validate').then((m) => m.validateButton(input, config));
  }

  const [busy, setBusy] = React.useState(false);
  const mounted = React.useRef(true);
  React.useEffect(() => {
    mounted.current = true;
    return () => {
      mounted.current = false;
    };
  }, []);
  const node = React.useRef<HTMLElement | null>(null);

  const loading = config.loading ?? busy;
  const disabled = config.disabled ?? false;
  const blocked = disabled || loading;
  const state: ButtonState = {
    variant: config.variant ?? 'solid',
    size: config.size ?? ctx.size,
    tone: config.tone ?? ctx.tone,
    disabled,
    loading,
    iconOnly: config.iconOnly ?? false,
    shape: config.shape ?? 'default',
  };
  // `pill` and `circle` round fully; a `dimensions.radius` length still wins.
  const round = state.shape === 'pill' || state.shape === 'circle';

  const onClick = useEvent((event: React.MouseEvent<HTMLElement>) => {
    // Swallowing the click also cancels a submit (and Enter's implicit submit) while blocked.
    if (blocked) {
      event.preventDefault();
      return;
    }
    const result = config.onClick?.(event);
    if (config.href !== undefined) {
      const own = config.onNavigate;
      followLink(event, config.href, own ? (href) => own(href, event) : ctx.navigate, config.target);
    }
    if (isThenable(result) && config.loading === undefined) {
      setBusy(true);
      const done = () => {
        if (mounted.current) setBusy(false);
      };
      result.then(done, done);
    }
  });

  const getRootProps = (props?: PropsBag): PropsBag => {
    const isLink = config.href !== undefined;
    const label = resolveNode(config.label, state);
    const name = typeof label === 'string' ? label : undefined;
    const own: PropsBag = {
      ref: (el: HTMLElement | null) => {
        node.current = el;
      },
      'data-variant': state.variant,
      'data-size': state.size,
      'data-tone': state.tone,
      'data-disabled': dataAttr(disabled),
      'data-loading': dataAttr(loading),
      'data-icon-only': dataAttr(state.iconOnly),
      'data-shape': state.shape,
      'data-full-width': dataAttr(config.fullWidth),
      'data-unstyled': dataAttr(config.unstyled),
      // Hover fades and the press nudge; the provider's `disableAnimation` (tests, low-power) turns them off.
      'data-animate': dataAttr(!ctx.disableAnimation),
      'aria-disabled': blocked ? true : undefined,
      'aria-busy': loading || undefined,
      // Icon-only: the label names the button and doubles as the native tooltip.
      'aria-label': state.iconOnly ? name : undefined,
      title: state.iconOnly ? name : undefined,
      onClick,
    };
    if (isLink) {
      // A blocked link loses its href, so it cannot navigate, and keeps focus through tabIndex.
      Object.assign(own, blocked ? { role: 'link', tabIndex: 0 } : { href: config.href, target: config.target, rel: buttonRel(config.target, config.rel) });
    } else {
      own.type = config.type ?? 'button';
    }
    // Handlers chain, classes join, refs compose.
    return mergeProps(own, props);
  };

  const render = (rootProps?: ButtonRootProps): React.ReactElement => {
    const overrides = config;
    const cls = (name: string) => (config.unstyled ? undefined : name);
    const slot = (name: ButtonSlot, content: React.ReactNode, base: PropsBag) =>
      renderSlot(overrides, name, slotProps(overrides, name, base), state, content, (p, c) => <span {...p}>{c}</span>);

    const icon = resolveNode(config.icon, state) as React.ReactNode;
    const endIcon = resolveNode(config.endIcon, state) as React.ReactNode;
    const startContent = resolveNode(config.startContent, state) as React.ReactNode;
    const endContent = resolveNode(config.endContent, state) as React.ReactNode;
    const text = loading && config.loadingText ? config.loadingText : (resolveNode(config.label, state) as React.ReactNode);
    const vars = dimensionVars('button', { ...config.dimensions, radius: config.dimensions?.radius ?? (round ? 'var(--pinfold-radius-full)' : radiusValue(config.radius)) });

    const root = slotProps(
      overrides,
      'root',
      getRootProps(
        mergeProps(
          {
            className: config.unstyled ? config.className : cn('pinfold pinfold-button', config.className),
            style: vars || config.style ? { ...vars, ...config.style } : undefined,
          },
          rootProps,
        ),
      ),
    );

    // Loading: the spinner takes the icon's place, so the label stays readable and the width barely moves.
    const content = (
      <>
        {loading
          ? slot('spinner', null, { className: cls('pinfold-button__spinner'), 'aria-hidden': true, 'data-motion': 'essential' })
          : filled(icon)
            ? slot('icon', icon, { className: cls('pinfold-button__icon'), 'aria-hidden': true })
            : null}
        {filled(startContent) ? slot('startContent', startContent, { className: cls('pinfold-button__startContent') }) : null}
        {state.iconOnly ? null : slot('label', text, { className: cls('pinfold-button__label') })}
        {!state.iconOnly && filled(endContent) ? slot('endContent', endContent, { className: cls('pinfold-button__endContent') }) : null}
        {!state.iconOnly && filled(endIcon) ? slot('endIcon', endIcon, { className: cls('pinfold-button__endIcon'), 'aria-hidden': true }) : null}
      </>
    );

    return renderSlot(overrides, 'root', root, state, content, (p, c) =>
      config.href !== undefined ? <a {...p}>{c}</a> : <button {...p}>{c}</button>,
    ) as React.ReactElement;
  };

  const api: ButtonApi = {
    loading,
    setLoading: setBusy,
    focus: () => node.current?.focus(),
    click: () => node.current?.click(),
    getRootProps,
    render,
  };

  return usePinfoldComponent<ButtonApi, ButtonRootProps>('Button', api, (props) => render(props));
}

function defined<T extends object>(obj: T): Partial<T> {
  const out: Partial<T> = {};
  for (const k in obj) if (obj[k] !== undefined) out[k] = obj[k];
  return out;
}
