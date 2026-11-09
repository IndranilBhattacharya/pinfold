import * as React from 'react';
import { cn, dataAttr, dimensionVars, inactivePopoverOptions, mergeProps, warnOnce, type PropsBag, radiusProps } from '@pinfold/core';
import { useControllableState, useId, useIsomorphicLayoutEffect } from '../hooks';
import { usePinfold } from '../provider';
import { usePinfoldComponent } from '../component';
import { mergeConfig } from '../preset';
import { renderSlot, slotProps } from '../slots';
import { Button } from '../button/Button';
import type { ButtonConfig } from '../button/types';
import { closingAction, isKeyboardFocus, renderTrigger, restoreFocus, triggerElement, useFloating, useHoverIntent, useMounted, useOverlayLayer } from '../overlay';
import type { PopoverApi, PopoverComponent, PopoverConfig, PopoverRootProps, PopoverSlot, PopoverState } from './types';

const filled = (node: React.ReactNode) => node != null && node !== false && node !== '';

/**
 * A floating panel anchored to a trigger, as a hook that hands back a component.
 *
 *   const Share = usePopover({ title: 'Share', content: <CopyLink />, trigger: { label: 'Share' } });
 *   return <Share />;
 *
 * The same value is the controller (`Share.isOpen`, `.open()`, `.close()`, `.toggle()`).
 * Precedence: this config, then `defaults.popover`, then the library default.
 */
export function usePopover(input: PopoverConfig = {}): PopoverComponent {
  const ctx = usePinfold();
  const config = ctx.defaults.popover ? mergeConfig<PopoverConfig>(ctx.defaults.popover, input) : input;
  const id = useId();
  const mounted = useMounted();
  const anchor = React.useRef<Element | null>(null);
  const floating = React.useRef<HTMLDivElement | null>(null);
  const [isOpen, setOpen] = useControllableState<boolean>({ value: config.open, defaultValue: config.defaultOpen ?? false, onChange: config.onOpenChange });
  const openOn = config.openOn ?? 'click';
  const hover = useHoverIntent(setOpen, config.delay ?? 200, config.closeDelay ?? 200);

  if (process.env.NODE_ENV !== 'production') {
    void import('@pinfold/core/meta').then(({ popoverMeta, validateConfig }) => {
      for (const problem of validateConfig(popoverMeta, input)) warnOnce(true, problem.message);
      const inactive = inactivePopoverOptions(config);
      for (const key in inactive) warnOnce((input as Record<string, unknown>)[key] !== undefined, `Popover: \`${key}\` has no visible effect here. ${inactive[key]}`);
    });
    warnOnce(!filled(config.title), 'Popover: without a `title` the panel has no accessible name. Give it one, or pass `aria-label` on the root.');
  }

  const showing = isOpen && mounted;
  const state: PopoverState = { open: showing, openOn };

  useFloating({ open: showing, anchor: () => anchor.current, floating, placement: config.placement ?? 'bottom', offset: config.offset ?? 8 });
  const close = () => setOpen(false);
  useOverlayLayer(
    showing,
    (node) => !!floating.current?.contains(node) || !!anchor.current?.contains(node),
    () => {
      if (config.closeOnEscape ?? true) close();
    },
    () => {
      if (config.closeOnOutside ?? true) close();
    },
  );

  // Clicking moves focus in and closing brings it back. An overlay open from the first render
  // never takes focus, and a hover card never touches it.
  const wasOpen = React.useRef(showing);
  useIsomorphicLayoutEffect(() => {
    if (wasOpen.current === showing) return;
    wasOpen.current = showing;
    if (openOn !== 'click') return;
    if (showing) floating.current?.focus();
    else restoreFocus(anchor.current, floating.current);
  }, [showing, openOn]);

  const triggerProps = (props?: PropsBag): PropsBag =>
    mergeProps(
      {
        'aria-haspopup': 'dialog',
        'aria-expanded': showing,
        'aria-controls': showing ? id : undefined,
        ...(openOn === 'click'
          ? { onClick: () => setOpen(!isOpen) }
          : {
              ...hover.triggerProps,
              onFocus: (e: React.FocusEvent<Element>) => {
                if (isKeyboardFocus(e.currentTarget)) hover.show(0);
              },
              onBlur: () => hover.hide(),
            }),
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

  const labelId = `${id}-title`;
  const descriptionId = `${id}-description`;
  const getRootProps = (props?: PropsBag): PropsBag =>
    mergeProps(
      {
        ...radiusProps(config.radius),
        ref: floating,
        id,
        role: 'dialog',
        tabIndex: -1,
        'aria-labelledby': filled(config.title) ? labelId : undefined,
        'aria-describedby': filled(config.description) ? descriptionId : undefined,
        'data-placement': config.placement ?? 'bottom',
        'data-open-on': openOn,
        'data-animate': dataAttr(!ctx.disableAnimation),
        'data-unstyled': dataAttr(config.unstyled),
        ...(openOn === 'hover'
          ? {
              ...hover.floatingProps,
              onFocus: hover.clear,
              onBlur: (e: React.FocusEvent<HTMLElement>) => {
                if (!e.currentTarget.contains(e.relatedTarget as Node | null)) hover.hide();
              },
            }
          : null),
      },
      props,
    );

  const render = (rootProps?: PopoverRootProps): React.ReactElement => {
    const cls = (name: string) => (config.unstyled ? undefined : name);
    const slot = (name: PopoverSlot, content: React.ReactNode, tag: string, base: PropsBag = {}) =>
      renderSlot(config, name, slotProps(config, name, { className: cls(`pinfold-popover__${name}`), ...base }), state, content, (p, c) => React.createElement(tag, p, c));
    const vars = dimensionVars('popover', config.dimensions);
    const root = slotProps(
      config,
      'root',
      getRootProps(mergeProps({ className: config.unstyled ? config.className : cn('pinfold pinfold-popover', config.className), style: vars || config.style ? { ...vars, ...config.style } : undefined }, rootProps)),
    );
    const actions = config.actions ?? [];
    const button = (action: ButtonConfig, i: number) => <Button key={i} size="sm" variant={i === 0 ? 'solid' : 'ghost'} {...closingAction(action, close)} />;
    const content = (
      <>
        {filled(config.title) ? slot('title', config.title, 'div', { id: labelId }) : null}
        {filled(config.description) ? slot('description', config.description, 'div', { id: descriptionId }) : null}
        {filled(config.content) ? slot('content', config.content, 'div') : null}
        {actions.length ? slot('actions', actions.map(button), 'div') : null}
        {config.arrow ? slot('arrow', null, 'span', { 'aria-hidden': true }) : null}
      </>
    );
    return (
      <>
        {renderTrigger(config.trigger, triggerProps(), (el) => {
          if (el) anchor.current = triggerElement(el);
        })}
        {showing ? renderSlot(config, 'root', root, state, content, (p, c) => <div {...p}>{c}</div>) : null}
      </>
    );
  };

  const api: PopoverApi = { isOpen: showing, open: () => setOpen(true), close, toggle: () => setOpen(!isOpen), getTriggerProps, getRootProps, render };
  return usePinfoldComponent<PopoverApi, PopoverRootProps>('Popover', api, (props) => render(props));
}
