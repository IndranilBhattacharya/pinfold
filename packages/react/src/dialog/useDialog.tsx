import * as React from 'react';
import { cn, dataAttr, dimensionVars, inactiveDialogOptions, mergeProps, resolveNode, warnOnce, watchScrollEdges, type PropsBag, radiusProps } from '@pinfold/core';
import { useControllableState, useId, useIsomorphicLayoutEffect } from '../hooks';
import { usePinfold } from '../provider';
import { usePinfoldComponent } from '../component';
import { mergeConfig } from '../preset';
import { renderSlot, slotProps } from '../slots';
import { Button } from '../button/Button';
import type { ButtonConfig } from '../button/types';
import { CLOSE_ICON } from '../icons';
import { closingAction, renderTrigger, useOverlayLayer, usePresence } from '../overlay';
import type { DialogApi, DialogChangeReason, DialogComponent, DialogConfig, DialogRenderContext, DialogRootProps, DialogSlot, DialogState } from './types';

const filled = (node: React.ReactNode) => node != null && node !== false && node !== '';

/** Page scroll is locked while any modal is open, keeping the page from shifting sideways. */
let locks = 0;
let restoreScroll = () => {};
function lockScroll(): () => void {
  if (locks++ === 0) {
    const html = document.documentElement;
    const { overflow } = html.style;
    const padding = document.body.style.paddingInlineEnd;
    const scrollbar = window.innerWidth - html.clientWidth;
    html.style.overflow = 'hidden';
    if (scrollbar > 0) document.body.style.paddingInlineEnd = `${scrollbar}px`;
    restoreScroll = () => {
      html.style.overflow = overflow;
      document.body.style.paddingInlineEnd = padding;
    };
  }
  return () => {
    if (--locks === 0) restoreScroll();
  };
}

/**
 * A native dialog from one config, as a hook that hands back a component.
 *
 *   const Confirm = useDialog({ title: 'Delete?', role: 'alertdialog', trigger: { label: 'Delete' }, actions: [{ label: 'Cancel' }, { label: 'Delete', onClick: remove }] });
 *   return <Confirm />;
 *
 * The same value is the controller (`Confirm.isOpen`, `.open()`, `.close()`).
 * Precedence: this config, then `defaults.dialog`, then the library default.
 */
export function useDialog(input: DialogConfig = {}): DialogComponent {
  const ctx = usePinfold();
  const config = ctx.defaults.dialog ? mergeConfig<DialogConfig>(ctx.defaults.dialog, input) : input;
  const id = useId();
  const node = React.useRef<HTMLDialogElement | null>(null);
  const panel = React.useRef<HTMLDivElement | null>(null);
  const body = React.useRef<HTMLDivElement | null>(null);
  // Why the state is about to change: read by `onOpenChange`, which the state hook calls synchronously.
  const reason = React.useRef<DialogChangeReason>('api');
  const [isOpen, setOpenState] = useControllableState<boolean>({
    value: config.open,
    defaultValue: config.defaultOpen ?? false,
    onChange: (open) => config.onOpenChange?.(open, reason.current),
  });
  const current = React.useRef(isOpen);
  current.current = isOpen;
  const setOpen = (next: boolean, why: DialogChangeReason) => {
    if (next === current.current) return;
    current.current = next;
    reason.current = why;
    setOpenState(next);
    if (next) config.onOpen?.();
    else config.onClose?.(why);
  };

  if (process.env.NODE_ENV !== 'production') {
    void import('@pinfold/core/meta').then(({ dialogMeta, validateConfig }) => {
      for (const problem of validateConfig(dialogMeta, input)) warnOnce(true, problem.message);
      const inactive = inactiveDialogOptions(config);
      for (const key in inactive) warnOnce((input as Record<string, unknown>)[key] !== undefined, `Dialog: \`${key}\` has no visible effect here. ${inactive[key]}`);
    });
    warnOnce(input.closeOnOutside !== undefined, 'Dialog: `closeOnOutside` is deprecated; use `closeOnOutsidePress`.');
  }

  const alert = config.role === 'alertdialog';
  const modal = config.modal ?? true;
  const dismissible = config.dismissible ?? true;
  const closeButton = dismissible && (config.closeButton ?? !alert);
  const closeOnEscape = dismissible && (config.closeOnEscape ?? true);
  const closeOnOutsidePress = dismissible && (config.closeOnOutsidePress ?? config.closeOnOutside ?? !alert);
  const placement = config.placement ?? 'center';
  const scrollBehavior = placement === 'center' ? config.scrollBehavior ?? 'inside' : 'inside';
  const state: DialogState = { open: isOpen, placement, size: config.size ?? 'md', scrollBehavior };
  const close = (why: DialogChangeReason = 'api') => setOpen(false, why);
  const renderContext: DialogRenderContext = { close: () => close('action'), isOpen };
  // Still open while the exit animation runs; the browser closes it (and returns focus) after.
  const present = usePresence(isOpen, panel);

  // The browser owns the rest: top layer, inert page, focus move and return.
  useIsomorphicLayoutEffect(() => {
    const el = node.current;
    if (!el || !present) return;
    if (!el.hasAttribute('open')) {
      const show = modal ? el.showModal : el.show;
      if (typeof show === 'function') show.call(el);
      else el.setAttribute('open', '');
    }
    const p = panel.current;
    // A panel that scrolls with the page starts at its top, on the panel, unless told otherwise.
    const target = config.initialFocus ?? (scrollBehavior === 'outside' && !p?.querySelector('[data-autofocus]') ? 'panel' : undefined);
    if (p) {
      const chosen =
        target === 'panel'
          ? p
          : typeof target === 'string'
            ? p.querySelector<HTMLElement>(target)
            : target && typeof target === 'object'
              ? target.current
              : p.querySelector<HTMLElement>('[data-autofocus]');
      chosen?.focus({ preventScroll: true });
      if (target === 'panel') el.scrollTop = 0;
      // The browser starts on the first focusable thing; when that is the scrolling body itself, start on the
      // panel instead: reading begins at the title, Tab still reaches the body, and no ring is drawn around the text.
      const active = document.activeElement as HTMLElement | null;
      if (!chosen && active && p.contains(active) && active.hasAttribute('data-scroll-body')) {
        p.setAttribute('tabindex', '-1');
        p.focus({ preventScroll: true });
      }
    }
    const unlock = modal ? lockScroll() : null;
    return () => {
      unlock?.();
      if (typeof el.close === 'function') el.close();
      else el.removeAttribute('open');
    };
  }, [present, modal]);

  // The content scrolls between the header and the footer: say which edges hide more.
  useIsomorphicLayoutEffect(() => {
    const el = body.current;
    if (!present || !el || !panel.current || scrollBehavior !== 'inside') return;
    return watchScrollEdges(el, { target: panel.current });
  }, [present, scrollBehavior]);

  useOverlayLayer(
    isOpen,
    (target) => !modal || !!panel.current?.contains(target),
    () => {
      if (closeOnEscape) close('escape');
    },
    () => {
      if (closeOnOutsidePress) close('outside');
    },
  );

  const getTriggerProps = (props?: PropsBag): PropsBag =>
    mergeProps({ 'aria-haspopup': 'dialog', 'aria-expanded': isOpen, onClick: () => setOpen(true, 'trigger') }, props);

  const titleId = `${id}-title`;
  const descriptionId = `${id}-description`;
  const getRootProps = (props?: PropsBag): PropsBag =>
    mergeProps(
      {
        ...radiusProps(config.radius),
        ref: node,
        role: alert ? 'alertdialog' : undefined,
        'aria-labelledby': filled(config.title) ? titleId : undefined,
        'aria-describedby': filled(config.description) ? descriptionId : undefined,
        'data-placement': state.placement,
        'data-size': state.size,
        'data-scroll-behavior': scrollBehavior,
        'data-backdrop': config.backdrop ?? 'dim',
        'data-state': isOpen ? 'open' : 'closed',
        'data-modal': dataAttr(modal),
        'data-animate': dataAttr(!ctx.disableAnimation),
        'data-unstyled': dataAttr(config.unstyled),
        // Escape already went through the dismiss stack; this is any other platform close request.
        onCancel: (e: React.SyntheticEvent) => {
          e.preventDefault();
          if (closeOnEscape) close('escape');
        },
        // A `<form method="dialog">` inside closes the element directly: keep the state in step.
        onClose: () => {
          if (current.current && node.current && !node.current.hasAttribute('open')) close('form');
        },
      },
      props,
    );

  const render = (rootProps?: DialogRootProps & { children?: React.ReactNode }): React.ReactElement => {
    const { children, ...rest } = rootProps ?? {};
    if (process.env.NODE_ENV !== 'production') {
      const named = filled(config.title) || !!(rest as PropsBag)['aria-label'] || !!(rest as PropsBag)['aria-labelledby'] || !!config.slotProps?.root?.['aria-label'];
      warnOnce(!named, 'Dialog: without a `title` it has no accessible name. Give it one, or pass `aria-label` on the root.');
    }
    const cls = (name: string) => (config.unstyled ? undefined : name);
    const slot = (name: DialogSlot, content: React.ReactNode, tag: string, base: PropsBag = {}) =>
      renderSlot(config, name, slotProps(config, name, { className: cls(`pinfold-dialog__${name}`), ...base }), state, content, (p, c) => React.createElement(tag, p, c));
    const vars = dimensionVars('dialog', config.dimensions);
    const root = slotProps(
      config,
      'root',
      getRootProps(mergeProps({ className: config.unstyled ? config.className : cn('pinfold pinfold-dialog', config.className), style: vars || config.style ? { ...vars, ...config.style } : undefined }, rest as PropsBag)),
    );
    const actions = config.actions ?? [];
    const button = (action: ButtonConfig, i: number) => {
      const safe = alert && i === 0 ? { slotProps: { ...action.slotProps, root: { 'data-autofocus': '', ...action.slotProps?.root } } } : null;
      return <Button key={i} variant={i === actions.length - 1 ? 'solid' : 'ghost'} {...closingAction(action, () => close('action'))} {...safe} />;
    };
    const header = present ? resolveNode(config.header, renderContext) : null;
    const footer = present ? resolveNode(config.footer, renderContext) : null;
    const main = present ? resolveNode(config.content ?? children, renderContext) : null;
    const hasHeader = filled(config.title) || filled(config.description) || filled(header);
    const hasFooter = filled(footer) || actions.length > 0;
    // Only while open (and closing): closed content must not be found, focused or run effects.
    const content = present
      ? slot(
          'panel',
          <>
            {hasHeader
              ? slot(
                  'header',
                  <>
                    {filled(config.title) ? slot('title', config.title, 'h2', { id: titleId }) : null}
                    {filled(config.description) ? slot('description', config.description, 'p', { id: descriptionId }) : null}
                    {header}
                  </>,
                  'div',
                )
              : null}
            {filled(main) ? slot('content', main, 'div', { ref: body, 'data-scroll-body': '' }) : null}
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
            {/* Last in the DOM, so opening focuses the content or the actions, not the corner. */}
            {closeButton ? slot('close', <Button label={config.closeLabel ?? 'Close'} icon={CLOSE_ICON} iconOnly variant="ghost" tone="neutral" size="sm" onClick={() => close('closeButton')} />, 'span') : null}
          </>,
          'div',
          {
            ref: panel,
            tabIndex: config.initialFocus === 'panel' || (config.initialFocus === undefined && scrollBehavior === 'outside') ? -1 : undefined,
            'data-header': dataAttr(hasHeader),
            'data-footer': dataAttr(hasFooter),
            'data-close-button': dataAttr(closeButton),
          },
        )
      : null;
    return (
      <>
        {renderTrigger(config.trigger, getTriggerProps(), null)}
        {renderSlot(config, 'root', root, state, content, (p, c) => <dialog {...p}>{c}</dialog>)}
      </>
    );
  };

  const api: DialogApi = { isOpen, open: () => setOpen(true, 'api'), close: () => close('api'), getTriggerProps, getRootProps, render };
  return usePinfoldComponent<DialogApi, DialogRootProps>('Dialog', api, (props) => render(props));
}
