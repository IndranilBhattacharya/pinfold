import * as React from 'react';
import { cn, dataAttr, dimensionVars, inactiveTabsOptions, mergeProps, moveItem, nextIndexFromKey, warnOnce, type PropsBag } from '@pinfold/core';
import { useControllableState, useId, useIsomorphicLayoutEffect } from '../hooks';
import { useSlidingIndicator } from '../indicator';
import { usePinfold } from '../provider';
import { usePinfoldComponent } from '../component';
import { mergeConfig } from '../preset';
import { renderSlot, slotProps } from '../slots';
import { followLink } from '../link';
import { VISUALLY_HIDDEN } from '../a11y';
import { CLOSE_ICON, PLUS_ICON } from '../nav-icons';
import type { TabsApi, TabsComponent, TabsConfig, TabsItem, TabsRootProps, TabsSlot, TabsState } from './types';

/**
 * Panels from a list, one shown at a time, as a hook that hands back a component.
 *
 *   const Settings = useTabs({ label: 'Settings', items: [{ id: 'profile', label: 'Profile', content: <Profile /> }] });
 *   return <Settings />;
 *
 * Precedence: this config, then `defaults.tabs`, then the provider (size, tone), then the library default.
 */
export function useTabs<Id extends string = string>(input: TabsConfig<Id>): TabsComponent {
  const ctx = usePinfold();
  const own = input as unknown as TabsConfig;
  const config = ctx.defaults.tabs ? mergeConfig<TabsConfig>(ctx.defaults.tabs, own) : own;
  const base = useId();
  const header = React.useRef<HTMLDivElement | null>(null);
  const list = React.useRef<HTMLDivElement | null>(null);
  const items: TabsItem[] = (config.items ?? []).map((item) => (typeof item === 'string' ? { id: item } : item));
  const enabled = (i: number) => !!items[i] && !items[i].disabled;
  const firstEnabled = items.findIndex((_, i) => enabled(i));
  const [value, setValue] = useControllableState<string>({ value: config.value, defaultValue: config.defaultValue ?? items[firstEnabled]?.id ?? '' });
  const [focused, setFocused] = React.useState<number | null>(null);
  // Which way the last change went, so the new panel slides in from that side; unset until a change,
  // so a page loads still.
  const [direction, setDirection] = React.useState<'forward' | 'back' | null>(null);
  // After a close, focus the tab that took the closed one's place.
  const refocus = React.useRef<number | null>(null);

  if (process.env.NODE_ENV !== 'production') {
    void import('@pinfold/core/meta').then(({ tabsMeta, validateConfig }) => {
      for (const problem of validateConfig(tabsMeta, input)) warnOnce(true, problem.message);
      const inactive = inactiveTabsOptions(config);
      for (const key in inactive) warnOnce((input as unknown as Record<string, unknown>)[key] !== undefined, `Tabs: \`${key}\` has no visible effect here. ${inactive[key]}`);
    });
    warnOnce(!config.label, 'Tabs: give it a `label`, e.g. "Account settings": it names the tab list for screen readers.');
    warnOnce(new Set(items.map((item) => item.id)).size !== items.length, 'Tabs: every item needs its own `id`.');
  }

  const placement = config.placement ?? 'top';
  const orientation = placement === 'start' || placement === 'end' ? 'vertical' : 'horizontal';
  const variant = config.variant ?? 'segmented';
  const selected = items.findIndex((item) => item.id === value);
  const state: TabsState = { variant, placement, orientation, size: config.size ?? ctx.size, tone: config.tone ?? ctx.tone, value };
  useSlidingIndicator(list, true, '[data-tabs-tab]', selected, '--pinfold-tab-i', `${items.length}${placement}${variant}`);

  const tabs = () => Array.from(list.current?.querySelectorAll<HTMLElement>('[data-tabs-tab]') ?? []);

  // A row wider than its box scrolls; the edges fade where there is more to see.
  const overflow = React.useCallback(() => {
    const el = list.current;
    const box = header.current;
    if (!el || !box) return;
    const vertical = orientation === 'vertical';
    const start = vertical ? el.scrollTop : Math.abs(el.scrollLeft);
    const size = vertical ? el.scrollHeight - el.clientHeight : el.scrollWidth - el.clientWidth;
    box.toggleAttribute('data-overflow-start', size > 1 && start > 1);
    box.toggleAttribute('data-overflow-end', size > 1 && start < size - 1);
  }, [orientation]);
  useIsomorphicLayoutEffect(() => {
    overflow();
    const el = list.current;
    if (!el || typeof ResizeObserver === 'undefined') return;
    const observer = new ResizeObserver(overflow);
    observer.observe(el);
    return () => observer.disconnect();
  }, [overflow, items.length]);
  React.useEffect(() => {
    tabs()[selected]?.scrollIntoView?.({ block: 'nearest', inline: 'nearest' });
    if (refocus.current !== null) {
      const all = tabs();
      all[Math.min(refocus.current, all.length - 1)]?.focus();
      refocus.current = null;
    }
  });

  // A change from the controller (no event) does not call `onChange`, as with every Pinfold controller.
  const select = (i: number, event?: React.SyntheticEvent) => {
    if (!enabled(i) || items[i].id === value) return;
    setDirection(i > selected ? 'forward' : 'back');
    setValue(items[i].id);
    if (event) config.onChange?.(items[i].id as Id & string, event);
  };
  const step = (by: 1 | -1) => {
    for (let n = 1; n <= items.length; n++) {
      const i = (((selected < 0 ? 0 : selected) + by * n) % items.length + items.length) % items.length;
      if (enabled(i)) return select(i);
    }
  };
  const closable = (i: number) => !!config.onClose && items[i]?.closable !== false;
  const close = (i: number, event: React.SyntheticEvent) => {
    if (!closable(i)) return;
    // Closing the selected tab selects its neighbour first: the next one, else the one before.
    if (i === selected) {
      const after = items.findIndex((_, n) => n > i && enabled(n));
      const before = items.map((_, n) => n).reverse().find((n) => n < i && enabled(n));
      const next = after >= 0 ? after : before;
      if (next !== undefined) select(next, event);
    }
    refocus.current = i;
    config.onClose!(items[i].id as Id & string, event);
  };

  const [moved, setMoved] = React.useState('');
  const dragFrom = React.useRef<number | null>(null);
  const [drop, setDrop] = React.useState<{ at: number; side: 'before' | 'after' } | null>(null);
  const reorder = (from: number, to: number, event: React.SyntheticEvent) => {
    if (!config.onReorder || from === to) return;
    const ids = moveItem(items.map((it) => it.id as Id & string), from, to);
    config.onReorder(ids, event);
    const label = items[from]?.label;
    setMoved(`${typeof label === 'string' ? label : items[from]?.id}: ${to + 1} of ${items.length}`);
  };
  const onKeyDown = (event: React.KeyboardEvent) => {
    const all = tabs();
    const current = all.indexOf(document.activeElement as HTMLElement);
    if (current === -1) return;
    if (config.onReorder && (event.ctrlKey || event.metaKey) && event.shiftKey) {
      const by = nextIndexFromKey(event.key, current, all.length, { orientation, dir: ctx.dir, loop: false });
      if (by !== null && by !== current && Math.abs(by - current) === 1) {
        event.preventDefault();
        reorder(current, by, event);
        return;
      }
    }
    if ((event.key === 'Delete' || event.key === 'Backspace') && closable(current)) {
      event.preventDefault();
      close(current, event);
      return;
    }
    if ((event.key === 'Enter' || event.key === ' ') && (config.activation ?? 'auto') === 'manual') {
      if (event.key === ' ') event.preventDefault();
      select(current, event);
      return;
    }
    // Disabled tabs are on the arrow path (discoverable) but never selected.
    const next = nextIndexFromKey(event.key, current, all.length, { orientation, dir: ctx.dir, loop: true });
    if (next === null) return;
    event.preventDefault();
    all[next].focus();
    if ((config.activation ?? 'auto') === 'auto') select(next, event);
  };

  const getRootProps = (props?: PropsBag): PropsBag =>
    mergeProps(
      {
        'data-variant': variant,
        'data-placement': placement,
        'data-orientation': orientation,
        'data-size': state.size,
        'data-tone': state.tone,
        'data-full-width': dataAttr(config.fullWidth && orientation === 'horizontal'),
        'data-direction': direction ?? undefined,
        'data-animate': dataAttr(!ctx.disableAnimation),
        'data-unstyled': dataAttr(config.unstyled),
      },
      props,
    );

  const render = (rootProps?: TabsRootProps): React.ReactElement => {
    const slot = (name: TabsSlot, content: React.ReactNode, tag: string, own: PropsBag = {}) =>
      renderSlot(config, name, slotProps(config, name, { className: config.unstyled ? undefined : `pinfold-tabs__${name}`, ...own }), state, content, (p, c) => React.createElement(tag, p, c));
    const vars = dimensionVars('tabs', config.dimensions);
    const root = slotProps(
      config,
      'root',
      getRootProps(mergeProps({ className: config.unstyled ? config.className : cn('pinfold pinfold-tabs', config.className), style: vars || config.style ? { ...vars, ...config.style } : undefined }, rootProps)),
    );
    // The tab stop: the focused tab while focus is inside, else the selected one (or the first that can be).
    const stop = focused ?? (selected >= 0 ? selected : firstEnabled);
    const hint = `${base}-close-hint`;
    const moveHint = `${base}-move-hint`;
    const horizontal = orientation === 'horizontal';
    const tablist = slot(
      'list',
      <>
        {slot('indicator', null, 'span', { 'aria-hidden': true })}
        {items.map((item, i) => {
          const isSelected = i === selected;
          const link = item.href !== undefined && !item.disabled;
          return (
            <React.Fragment key={item.id}>
              {slot(
                'tab',
                <>
                  {item.icon != null ? slot('icon', item.icon, 'span', { 'aria-hidden': true }) : null}
                  <span className={config.unstyled ? undefined : 'pinfold-tabs__text'}>{item.label ?? item.id}</span>
                  {item.endContent != null ? slot('endContent', item.endContent, 'span') : null}
                  {/* Pointer only: the keyboard closes with Delete, which the tab announces. */}
                  {closable(i)
                    ? slot('close', CLOSE_ICON, 'span', {
                        'aria-hidden': true,
                        title: 'Close',
                        onClick: (event: React.MouseEvent) => {
                          event.preventDefault();
                          event.stopPropagation();
                          close(i, event);
                        },
                      })
                    : null}
                </>,
                link ? 'a' : 'button',
                {
                  ...(link ? { href: item.href } : { type: 'button' }),
                  role: 'tab',
                  id: `${base}-tab-${i}`,
                  'aria-selected': isSelected,
                  'aria-controls': isSelected || config.keepMounted ? `${base}-panel-${i}` : undefined,
                  'aria-disabled': item.disabled || undefined,
                  'aria-keyshortcuts': [closable(i) ? 'Delete' : '', config.onReorder ? (horizontal ? 'Control+Shift+ArrowLeft Control+Shift+ArrowRight' : 'Control+Shift+ArrowUp Control+Shift+ArrowDown') : ''].filter(Boolean).join(' ') || undefined,
                  'aria-describedby': [closable(i) ? hint : '', config.onReorder ? moveHint : ''].filter(Boolean).join(' ') || undefined,
                  'data-drop': drop && drop.at === i ? drop.side : undefined,
                  'data-dragging': dataAttr(config.onReorder ? dragFrom.current === i && drop !== null : false),
                  ...(config.onReorder
                    ? {
                        draggable: true,
                        onDragStart: (event: React.DragEvent) => {
                          dragFrom.current = i;
                          event.dataTransfer.effectAllowed = 'move';
                          event.dataTransfer.setData('text/plain', String(item.id));
                        },
                        onDragOver: (event: React.DragEvent<HTMLElement>) => {
                          if (dragFrom.current === null) return;
                          event.preventDefault();
                          const box = event.currentTarget.getBoundingClientRect();
                          const rtl = horizontal && getComputedStyle(event.currentTarget).direction === 'rtl';
                          const past = horizontal ? event.clientX > box.left + box.width / 2 : event.clientY > box.top + box.height / 2;
                          const side = past !== rtl ? 'after' : 'before';
                          if (drop?.at !== i || drop.side !== side) setDrop({ at: i, side });
                        },
                        onDrop: (event: React.DragEvent) => {
                          event.preventDefault();
                          const from = dragFrom.current;
                          if (from !== null && drop) {
                            const to = drop.side === 'after' ? drop.at + 1 : drop.at;
                            reorder(from, to > from ? to - 1 : to, event);
                          }
                          dragFrom.current = null;
                          setDrop(null);
                        },
                        onDragEnd: () => {
                          dragFrom.current = null;
                          setDrop(null);
                        },
                      }
                    : null),
                  'data-tabs-tab': '',
                  'data-selected': dataAttr(isSelected),
                  tabIndex: i === stop ? 0 : -1,
                  onClick: (event: React.MouseEvent) => {
                    if (item.disabled) {
                      event.preventDefault();
                      return;
                    }
                    select(i, event);
                    if (link) followLink(event, item.href, ctx.navigate);
                  },
                  onFocus: () => setFocused(i),
                  onBlur: () => setFocused(null),
                },
              )}
            </React.Fragment>
          );
        })}
      </>,
      'div',
      { ref: list, role: 'tablist', 'aria-label': config.label, 'aria-orientation': orientation, onKeyDown, onScroll: overflow },
    );
    const add = config.onAdd
      ? slot('add', PLUS_ICON, 'button', { type: 'button', 'aria-label': config.addLabel ?? 'New tab', title: config.addLabel ?? 'New tab', onClick: config.onAdd })
      : null;
    const bar = slot(
      'header',
      <>
        {tablist}
        {add}
        {config.onClose ? (
          <span id={hint} style={VISUALLY_HIDDEN}>
            {config.closeLabel ?? 'Press Delete to close'}
          </span>
        ) : null}
        {config.onReorder ? (
          <>
            <span id={moveHint} style={VISUALLY_HIDDEN}>
              {config.reorderLabel ?? 'Press Control, Shift and an arrow key to move'}
            </span>
            <span role="status" style={VISUALLY_HIDDEN}>
              {moved}
            </span>
          </>
        ) : null}
      </>,
      'div',
      { ref: header },
    );
    const panels = items.map((item, i) =>
      i === selected || config.keepMounted ? (
        <React.Fragment key={item.id}>
          {slot('panel', item.content, 'div', { role: 'tabpanel', id: `${base}-panel-${i}`, 'aria-labelledby': `${base}-tab-${i}`, tabIndex: 0, hidden: i !== selected || undefined })}
        </React.Fragment>
      ) : null,
    );
    return renderSlot(config, 'root', root, state, <>{bar}{panels}</>, (p, c) => <div {...p}>{c}</div>) as React.ReactElement;
  };

  const api: TabsApi = {
    value,
    select: (id) => select(items.findIndex((item) => item.id === id)),
    next: () => step(1),
    previous: () => step(-1),
    focus: () => tabs()[selected >= 0 ? selected : 0]?.focus(),
    getRootProps,
    render,
  };
  return usePinfoldComponent<TabsApi, TabsRootProps>('Tabs', api, (props) => render(props));
}
