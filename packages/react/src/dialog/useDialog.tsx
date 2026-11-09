import * as React from 'react';
import { cn, dataAttr, dimensionVars, inactiveDialogOptions, mergeProps, warnOnce, type PropsBag, radiusProps } from '@pinfold/core';
import { useControllableState, useId, useIsomorphicLayoutEffect } from '../hooks';
import { usePinfold } from '../provider';
import { usePinfoldComponent } from '../component';
import { mergeConfig } from '../preset';
import { renderSlot, slotProps } from '../slots';
import { Button } from '../button/Button';
import type { ButtonConfig } from '../button/types';
import { CLOSE_ICON } from '../icons';
import { closingAction, renderTrigger, useOverlayLayer } from '../overlay';
import type { DialogApi, DialogComponent, DialogConfig, DialogRootProps, DialogSlot, DialogState } from './types';

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
  const [isOpen, setOpen] = useControllableState<boolean>({ value: config.open, defaultValue: config.defaultOpen ?? false, onChange: config.onOpenChange });

  if (process.env.NODE_ENV !== 'production') {
    void import('@pinfold/core/meta').then(({ dialogMeta, validateConfig }) => {
      for (const problem of validateConfig(dialogMeta, input)) warnOnce(true, problem.message);
      const inactive = inactiveDialogOptions(config);
      for (const key in inactive) warnOnce((input as Record<string, unknown>)[key] !== undefined, `Dialog: \`${key}\` has no visible effect here. ${inactive[key]}`);
    });
    warnOnce(!filled(config.title), 'Dialog: without a `title` it has no accessible name. Give it one, or pass `aria-label` on the root.');
  }

  const alert = config.role === 'alertdialog';
  const modal = config.modal ?? true;
  const closeButton = config.closeButton ?? !alert;
  const closeOnOutside = config.closeOnOutside ?? !alert;
  const state: DialogState = { open: isOpen, placement: config.placement ?? 'center', size: config.size ?? 'md' };
  const close = () => setOpen(false);

  // The browser owns the rest: top layer, inert page, focus move and return.
  useIsomorphicLayoutEffect(() => {
    const el = node.current;
    if (!el || !isOpen) return;
    if (!el.hasAttribute('open')) {
      const show = modal ? el.showModal : el.show;
      if (typeof show === 'function') show.call(el);
      else el.setAttribute('open', '');
    }
    panel.current?.querySelector<HTMLElement>('[data-autofocus]')?.focus();
    const unlock = modal ? lockScroll() : null;
    return () => {
      unlock?.();
      if (typeof el.close === 'function') el.close();
      else el.removeAttribute('open');
    };
  }, [isOpen, modal]);

  useOverlayLayer(
    isOpen,
    (target) => !modal || !!panel.current?.contains(target),
    () => {
      if (config.closeOnEscape ?? true) close();
    },
    () => {
      if (closeOnOutside) close();
    },
  );

  const getTriggerProps = (props?: PropsBag): PropsBag =>
    mergeProps({ 'aria-haspopup': 'dialog', 'aria-expanded': isOpen, onClick: () => setOpen(true) }, props);

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
        'data-modal': dataAttr(modal),
        'data-animate': dataAttr(!ctx.disableAnimation),
        'data-unstyled': dataAttr(config.unstyled),
        // Escape already went through the dismiss stack; this is any other platform close request.
        onCancel: (e: React.SyntheticEvent) => {
          e.preventDefault();
          if (config.closeOnEscape ?? true) close();
        },
        // A `<form method="dialog">` inside closes the element directly: keep the state in step.
        onClose: () => {
          if (isOpen && node.current && !node.current.hasAttribute('open')) close();
        },
      },
      props,
    );

  const render = (rootProps?: DialogRootProps): React.ReactElement => {
    const cls = (name: string) => (config.unstyled ? undefined : name);
    const slot = (name: DialogSlot, content: React.ReactNode, tag: string, base: PropsBag = {}) =>
      renderSlot(config, name, slotProps(config, name, { className: cls(`pinfold-dialog__${name}`), ...base }), state, content, (p, c) => React.createElement(tag, p, c));
    const vars = dimensionVars('dialog', config.dimensions);
    const root = slotProps(
      config,
      'root',
      getRootProps(mergeProps({ className: config.unstyled ? config.className : cn('pinfold pinfold-dialog', config.className), style: vars || config.style ? { ...vars, ...config.style } : undefined }, rootProps)),
    );
    const actions = config.actions ?? [];
    const button = (action: ButtonConfig, i: number) => {
      const safe = alert && i === 0 ? { slotProps: { ...action.slotProps, root: { 'data-autofocus': '', ...action.slotProps?.root } } } : null;
      return <Button key={i} variant={i === actions.length - 1 ? 'solid' : 'ghost'} {...closingAction(action, close)} {...safe} />;
    };
    // Only while open: closed content must not be found, focused or run effects.
    const content = isOpen
      ? slot(
          'panel',
          <>
            {filled(config.title) ? slot('title', config.title, 'h2', { id: titleId }) : null}
            {filled(config.description) ? slot('description', config.description, 'p', { id: descriptionId }) : null}
            {filled(config.content) ? slot('content', config.content, 'div') : null}
            {actions.length ? slot('actions', actions.map(button), 'div') : null}
            {/* Last in the DOM, so opening focuses the content or the actions, not the corner. */}
            {closeButton ? slot('close', <Button label={config.closeLabel ?? 'Close'} icon={CLOSE_ICON} iconOnly variant="ghost" tone="neutral" size="sm" onClick={close} />, 'span') : null}
          </>,
          'div',
          { ref: panel },
        )
      : null;
    return (
      <>
        {renderTrigger(config.trigger, getTriggerProps(), null)}
        {renderSlot(config, 'root', root, state, content, (p, c) => <dialog {...p}>{c}</dialog>)}
      </>
    );
  };

  const api: DialogApi = { isOpen, open: () => setOpen(true), close, getTriggerProps, getRootProps, render };
  return usePinfoldComponent<DialogApi, DialogRootProps>('Dialog', api, (props) => render(props));
}
