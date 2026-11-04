import * as React from 'react';
import { cn, dataAttr, dimensionVars, mergeProps, warnOnce, type PropsBag } from '@pinfold/core';
import { useControllableState, useId } from '../hooks';
import { usePinfold } from '../provider';
import { usePinfoldComponent } from '../component';
import { mergeConfig } from '../preset';
import { renderSlot, slotProps } from '../slots';
import { isKeyboardFocus, renderTrigger, triggerElement, useFloating, useHoverIntent, useMounted, useOverlayLayer } from '../overlay';
import type { TooltipApi, TooltipComponent, TooltipConfig, TooltipRootProps, TooltipState } from './types';

const filled = (node: React.ReactNode) => node != null && node !== false && node !== '';

/**
 * A hint on hover or keyboard focus, as a hook that hands back a component.
 *
 *   const Share = useTooltip({ content: 'Copies the link', trigger: { label: 'Share' } });
 *   return <Share />;
 *
 * The same value is the controller (`Share.isOpen`, `.open()`, `.close()`, `.getTriggerProps()`).
 * Precedence: this config, then `defaults.tooltip`, then the library default.
 */
export function useTooltip(input: TooltipConfig): TooltipComponent {
  const ctx = usePinfold();
  const config = ctx.defaults.tooltip ? mergeConfig<TooltipConfig>(ctx.defaults.tooltip, input) : input;
  const id = useId();
  const mounted = useMounted();
  const anchor = React.useRef<Element | null>(null);
  const floating = React.useRef<HTMLDivElement | null>(null);
  const [isOpen, setOpen] = useControllableState<boolean>({ value: config.open, defaultValue: config.defaultOpen ?? false, onChange: config.onOpenChange });
  const hover = useHoverIntent(setOpen, config.delay ?? 400, config.closeDelay ?? 120);

  if (process.env.NODE_ENV !== 'production') {
    void import('@pinfold/core/meta').then(({ tooltipMeta, validateConfig }) => {
      for (const problem of validateConfig(tooltipMeta, input)) warnOnce(true, problem.message);
    });
  }

  const showing = isOpen && !config.disabled && filled(config.content);
  const state: TooltipState = { open: showing, variant: config.variant ?? 'inverse' };

  useFloating({ open: showing && mounted, anchor: () => anchor.current, floating, placement: config.placement ?? 'top', offset: config.offset ?? 8 });
  useOverlayLayer(
    showing,
    (node) => !!floating.current?.contains(node) || !!anchor.current?.contains(node),
    () => setOpen(false),
    () => setOpen(false),
  );

  const triggerProps = (props?: PropsBag): PropsBag =>
    mergeProps(
      {
        ...hover.triggerProps,
        onFocus: (e: React.FocusEvent<Element>) => {
          if (isKeyboardFocus(e.currentTarget)) hover.show(0);
        },
        onBlur: () => hover.hide(0),
        // Acting on the control answers the question the hint was for.
        onClick: () => hover.hide(0),
        'aria-describedby': showing ? id : undefined,
      },
      props,
    );
  const getTriggerProps = (props?: PropsBag): PropsBag =>
    mergeProps(
      {
        ref: (el: Element | null) => {
          anchor.current = el;
        },
      },
      triggerProps(props),
    );

  const getRootProps = (props?: PropsBag): PropsBag =>
    mergeProps(
      {
        ref: floating,
        id,
        role: 'tooltip',
        'data-placement': config.placement ?? 'top',
        'data-variant': state.variant,
        'data-arrow': dataAttr(config.arrow ?? true),
        'data-animate': dataAttr(!ctx.disableAnimation),
        'data-unstyled': dataAttr(config.unstyled),
        ...hover.floatingProps,
      },
      props,
    );

  const render = (rootProps?: TooltipRootProps): React.ReactElement => {
    const cls = (name: string) => (config.unstyled ? undefined : name);
    const vars = dimensionVars('tooltip', config.dimensions);
    const root = slotProps(
      config,
      'root',
      getRootProps(mergeProps({ className: config.unstyled ? config.className : cn('pinfold pinfold-tooltip', config.className), style: vars || config.style ? { ...vars, ...config.style } : undefined }, rootProps)),
    );
    const arrow = (config.arrow ?? true) ? renderSlot(config, 'arrow', slotProps(config, 'arrow', { className: cls('pinfold-tooltip__arrow'), 'aria-hidden': true }), state, null, (p) => <span {...p} />) : null;
    return (
      <>
        {renderTrigger(config.trigger, triggerProps(), (el) => {
          if (el) anchor.current = triggerElement(el);
        })}
        {showing && mounted
          ? renderSlot(config, 'root', root, state, <>{config.content}{arrow}</>, (p, c) => <div {...p}>{c}</div>)
          : null}
      </>
    );
  };

  const api: TooltipApi = { isOpen: showing, open: () => setOpen(true), close: () => setOpen(false), getTriggerProps, getRootProps, render };
  return usePinfoldComponent<TooltipApi, TooltipRootProps>('Tooltip', api, (props) => render(props));
}
