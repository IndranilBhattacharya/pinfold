import * as React from 'react';
import { cn, dataAttr, dimensionVars, inactivePopoverOptions, mergeProps, resolveNode, warnOnce, watchScrollEdges, type PropsBag, radiusProps } from '@pinfold/core';
import { useControllableState, useId, useIsomorphicLayoutEffect } from '../hooks';
import { usePinfold } from '../provider';
import { usePinfoldComponent } from '../component';
import { mergeConfig } from '../preset';
import { renderSlot, slotProps } from '../slots';
import { Button } from '../button/Button';
import type { ButtonConfig } from '../button/types';
import { CLOSE_ICON } from '../icons';
import { closingAction, isKeyboardFocus, renderTrigger, restoreFocus, triggerElement, useFloating, useHoverIntent, useMounted, useOverlayLayer, usePresence } from '../overlay';
import type { PopoverApi, PopoverChangeReason, PopoverComponent, PopoverConfig, PopoverRenderContext, PopoverRootProps, PopoverSlot, PopoverState } from './types';

const filled = (node: React.ReactNode) => node != null && node !== false && node !== '';
const TABBABLE = 'a[href], button, input, select, textarea, summary, [tabindex], [contenteditable="true"]';

/** The elements Tab stops on inside `root`, in order. */
function tabbables(root: HTMLElement): HTMLElement[] {
  return Array.from(root.querySelectorAll<HTMLElement>(TABBABLE)).filter((el) => {
    if (el.tabIndex < 0 || el.hasAttribute('disabled') || el.closest('[hidden], [inert]')) return false;
    return !(el instanceof HTMLInputElement && el.type === 'hidden');
  });
}

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
  const body = React.useRef<HTMLDivElement | null>(null);
  // Why the state is about to change: read by `onOpenChange`, which the state hook calls synchronously.
  const reason = React.useRef<PopoverChangeReason>('api');
  const [isOpen, setOpenState] = useControllableState<boolean>({
    value: config.open,
    defaultValue: config.defaultOpen ?? false,
    onChange: (open) => config.onOpenChange?.(open, reason.current),
  });
  const current = React.useRef(isOpen);
  current.current = isOpen;
  const setOpen = (next: boolean, why: PopoverChangeReason) => {
    if (next === current.current) return;
    current.current = next;
    reason.current = why;
    setOpenState(next);
    if (next) config.onOpen?.();
    else config.onClose?.(why);
  };
  const openOn = config.openOn ?? 'click';
  const modal = !!config.modal && openOn !== 'hover' && openOn !== 'focus';
  const size = config.size ?? 'md';
  const hover = useHoverIntent((open) => setOpen(open, 'hover'), config.delay ?? 200, config.closeDelay ?? 200);

  if (process.env.NODE_ENV !== 'production') {
    void import('@pinfold/core/meta').then(({ popoverMeta, validateConfig }) => {
      for (const problem of validateConfig(popoverMeta, input)) warnOnce(true, problem.message);
      const inactive = inactivePopoverOptions(config);
      for (const key in inactive) warnOnce((input as Record<string, unknown>)[key] !== undefined, `Popover: \`${key}\` has no visible effect here. ${inactive[key]}`);
    });
    warnOnce(input.closeOnOutside !== undefined, 'Popover: `closeOnOutside` is deprecated; use `closeOnOutsidePress`.');
  }

  const showing = isOpen && mounted;
  // Still on screen while the exit animation runs.
  const present = usePresence(showing, floating);
  const state: PopoverState = { open: showing, openOn, size };
  const close = (why: PopoverChangeReason = 'api') => setOpen(false, why);
  const renderContext: PopoverRenderContext = { close: () => close('action'), isOpen: showing };

  useFloating({ open: present, anchor: () => anchor.current, floating, placement: config.placement ?? 'bottom', offset: config.offset ?? 8, matchWidth: !!config.matchTriggerWidth });
  const inside = (node: Node | null) => !!node && (!!floating.current?.contains(node) || !!anchor.current?.contains(node));
  useOverlayLayer(
    showing,
    (node) => inside(node),
    () => {
      if (config.closeOnEscape ?? true) close('escape');
    },
    () => {
      if (config.closeOnOutsidePress ?? config.closeOnOutside ?? true) close('outside');
    },
  );

  // Scrolling the page closes it on request; scrolling inside the panel never does.
  const closeOnScroll = !!config.closeOnScroll && showing;
  React.useEffect(() => {
    if (!closeOnScroll) return;
    const onScroll = (event: Event) => {
      if (event.target instanceof Node && floating.current?.contains(event.target)) return;
      setOpen(false, 'scroll');
    };
    window.addEventListener('scroll', onScroll, true);
    return () => window.removeEventListener('scroll', onScroll, true);
  }, [closeOnScroll]);

  // The content scrolls inside: say which edges hide more, for the fades.
  useIsomorphicLayoutEffect(() => {
    const el = body.current;
    if (!present || !el || !floating.current) return;
    return watchScrollEdges(el, { target: floating.current });
  }, [present]);

  // Clicking moves focus in and closing brings it back. An overlay open from the first render
  // never takes focus, and a hover or focus popover never touches it.
  const takesFocus = openOn === 'click' || modal;
  const wasOpen = React.useRef(showing);
  useIsomorphicLayoutEffect(() => {
    if (wasOpen.current === showing) return;
    wasOpen.current = showing;
    if (!takesFocus) return;
    if (showing) {
      const panel = floating.current;
      const first = modal && panel ? panel.querySelector<HTMLElement>('[data-autofocus]') ?? tabbables(panel)[0] : null;
      (first ?? panel)?.focus({ preventScroll: true });
    } else restoreFocus(anchor.current, floating.current);
  }, [showing, takesFocus]);

  const blurClose = (event: React.FocusEvent<Element>) => {
    if (!inside(event.relatedTarget as Node | null)) close('blur');
  };
  const triggerHandlers = (): PropsBag => {
    if (openOn === 'click') return { onClick: () => setOpen(!current.current, 'trigger') };
    if (openOn === 'focus') return { onFocus: () => setOpen(true, 'focus'), onBlur: blurClose };
    if (openOn === 'hover')
      return {
        ...hover.triggerProps,
        onFocus: (e: React.FocusEvent<Element>) => {
          if (isKeyboardFocus(e.currentTarget)) hover.show(0);
        },
        onBlur: () => hover.hide(),
      };
    return {};
  };
  const triggerProps = (props?: PropsBag): PropsBag =>
    mergeProps({ 'aria-haspopup': 'dialog', 'aria-expanded': showing, 'aria-controls': showing ? id : undefined, ...triggerHandlers() }, props);
  const getTriggerProps = (props?: PropsBag): PropsBag =>
    mergeProps(
      {
        ref: (el: Element | null) => {
          anchor.current = el;
        },
      },
      triggerProps(props),
    );

  // A modal popover keeps Tab inside: from the last stop to the first, and back.
  const trapTab = (event: React.KeyboardEvent<HTMLElement>) => {
    if (!modal || event.key !== 'Tab' || event.defaultPrevented) return;
    const panel = event.currentTarget;
    const stops = tabbables(panel);
    event.preventDefault();
    if (!stops.length) {
      panel.focus();
      return;
    }
    const at = stops.indexOf(document.activeElement as HTMLElement);
    const next = event.shiftKey ? (at <= 0 ? stops.length - 1 : at - 1) : at === -1 || at === stops.length - 1 ? 0 : at + 1;
    stops[next].focus();
  };

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
        'aria-modal': modal || undefined,
        'aria-labelledby': filled(config.title) ? labelId : undefined,
        'aria-describedby': filled(config.description) ? descriptionId : undefined,
        'aria-hidden': showing ? undefined : true,
        'data-state': showing ? 'open' : 'closed',
        'data-placement': config.placement ?? 'bottom',
        'data-open-on': openOn,
        'data-size': size,
        'data-modal': dataAttr(modal),
        'data-arrow': dataAttr(config.arrow),
        'data-close-button': dataAttr(config.closeButton),
        'data-match-trigger-width': dataAttr(config.matchTriggerWidth),
        'data-animate': dataAttr(!ctx.disableAnimation),
        'data-unstyled': dataAttr(config.unstyled),
        onKeyDown: trapTab,
        ...(openOn === 'hover'
          ? {
              ...hover.floatingProps,
              onFocus: hover.clear,
              onBlur: (e: React.FocusEvent<HTMLElement>) => {
                if (!e.currentTarget.contains(e.relatedTarget as Node | null)) hover.hide();
              },
            }
          : openOn === 'focus'
            ? { onBlur: blurClose }
            : null),
      },
      props,
    );

  const render = (rootProps?: PopoverRootProps & { children?: React.ReactNode }): React.ReactElement => {
    const { children, ...rest } = rootProps ?? {};
    if (process.env.NODE_ENV !== 'production') {
      const named = filled(config.title) || !!(rest as PropsBag)['aria-label'] || !!(rest as PropsBag)['aria-labelledby'] || !!config.slotProps?.root?.['aria-label'];
      warnOnce(!named, 'Popover: without a `title` the panel has no accessible name. Give it one, or pass `aria-label`.');
    }
    const cls = (name: string) => (config.unstyled ? undefined : name);
    const slot = (name: PopoverSlot, content: React.ReactNode, tag: string, base: PropsBag = {}) =>
      renderSlot(config, name, slotProps(config, name, { className: cls(`pinfold-popover__${name}`), ...base }), state, content, (p, c) => React.createElement(tag, p, c));
    const vars = dimensionVars('popover', config.dimensions);
    const root = slotProps(
      config,
      'root',
      getRootProps(mergeProps({ className: config.unstyled ? config.className : cn('pinfold pinfold-popover', config.className), style: vars || config.style ? { ...vars, ...config.style } : undefined }, rest as PropsBag)),
    );
    const actions = config.actions ?? [];
    const button = (action: ButtonConfig, i: number) => <Button key={i} size="sm" variant={i === 0 ? 'solid' : 'ghost'} {...closingAction(action, () => close('action'))} />;
    const header = resolveNode(config.header, renderContext);
    const footer = resolveNode(config.footer, renderContext);
    const main = resolveNode(config.content ?? children, renderContext);
    const hasHeader = filled(config.title) || filled(config.description) || filled(header);
    const hasFooter = filled(footer) || actions.length > 0;
    const content = (
      <>
        {hasHeader
          ? slot(
              'header',
              <>
                {filled(config.title) ? slot('title', config.title, 'div', { id: labelId }) : null}
                {filled(config.description) ? slot('description', config.description, 'div', { id: descriptionId }) : null}
                {header}
              </>,
              'div',
            )
          : null}
        {filled(main) ? slot('content', main, 'div', { ref: body }) : null}
        {hasFooter
          ? slot(
              'footer',
              <>
                {footer}
                {actions.length ? slot('actions', actions.map(button), 'div') : null}
              </>,
              'div',
            )
          : null}
        {config.closeButton ? slot('close', <Button label={config.closeLabel ?? 'Close'} icon={CLOSE_ICON} iconOnly variant="ghost" tone="neutral" size="sm" onClick={() => close('closeButton')} />, 'span') : null}
        {config.arrow ? slot('arrow', null, 'span', { 'aria-hidden': true }) : null}
      </>
    );
    return (
      <>
        {renderTrigger(config.trigger, triggerProps(), (el) => {
          if (el) anchor.current = triggerElement(el);
        })}
        {present ? renderSlot(config, 'root', root, state, content, (p, c) => <div {...p}>{c}</div>) : null}
      </>
    );
  };

  const api: PopoverApi = {
    isOpen: showing,
    open: () => setOpen(true, 'api'),
    close: () => close('api'),
    toggle: () => setOpen(!current.current, 'api'),
    getTriggerProps,
    getRootProps,
    render,
  };
  return usePinfoldComponent<PopoverApi, PopoverRootProps>('Popover', api, (props) => render(props));
}
