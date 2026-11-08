import * as React from 'react';
import { cn, dataAttr, dimensionVars, inactiveTabsOptions, mergeProps, nextIndexFromKey, warnOnce, type PropsBag } from '@pinfold/core';
import { useControllableState, useId } from '../hooks';
import { useSlidingIndicator } from '../indicator';
import { usePinfold } from '../provider';
import { usePinfoldComponent } from '../component';
import { mergeConfig } from '../preset';
import { renderSlot, slotProps } from '../slots';
import type { TabsApi, TabsComponent, TabsConfig, TabsRootProps, TabsSlot, TabsState } from './types';

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
  const list = React.useRef<HTMLDivElement | null>(null);
  const items = config.items ?? [];
  const enabled = (i: number) => !!items[i] && !items[i].disabled;
  const firstEnabled = items.findIndex((_, i) => enabled(i));
  const [value, setValue] = useControllableState<string>({ value: config.value, defaultValue: config.defaultValue ?? items[firstEnabled]?.id ?? '' });
  const [focused, setFocused] = React.useState<number | null>(null);

  if (process.env.NODE_ENV !== 'production') {
    void import('@pinfold/core/meta').then(({ tabsMeta, validateConfig }) => {
      for (const problem of validateConfig(tabsMeta, input)) warnOnce(true, problem.message);
      const inactive = inactiveTabsOptions(config);
      for (const key in inactive) warnOnce((input as unknown as Record<string, unknown>)[key] !== undefined, `Tabs: \`${key}\` has no visible effect here. ${inactive[key]}`);
    });
    warnOnce(!config.label, 'Tabs: give it a `label`, e.g. "Account settings": it names the tab list for screen readers.');
    warnOnce(new Set(items.map((item) => item.id)).size !== items.length, 'Tabs: every item needs its own `id`.');
  }

  const orientation = config.orientation ?? 'horizontal';
  const variant = config.variant ?? 'underline';
  const selected = items.findIndex((item) => item.id === value);
  const state: TabsState = { variant, orientation, size: config.size ?? ctx.size, tone: config.tone ?? ctx.tone, value };
  useSlidingIndicator(list, true, '[data-tabs-tab]', selected, '--pinfold-tab-i', `${items.length}${orientation}${variant}`);

  const tabs = () => Array.from(list.current?.querySelectorAll<HTMLButtonElement>('[data-tabs-tab]') ?? []);
  const select = (i: number, event: React.MouseEvent | React.KeyboardEvent) => {
    if (!enabled(i) || items[i].id === value) return;
    setValue(items[i].id);
    config.onChange?.(items[i].id as Id & string, event);
  };

  const onKeyDown = (event: React.KeyboardEvent) => {
    const all = tabs();
    const current = all.indexOf(document.activeElement as HTMLButtonElement);
    if (current === -1) return;
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
        'data-orientation': orientation,
        'data-size': state.size,
        'data-tone': state.tone,
        'data-full-width': dataAttr(config.fullWidth && orientation === 'horizontal'),
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
    const tablist = slot(
      'list',
      <>
        {slot('indicator', null, 'span', { 'aria-hidden': true })}
        {items.map((item, i) => {
          const isSelected = i === selected;
          return (
            <React.Fragment key={item.id}>
              {slot(
                'tab',
                <>
                  {item.icon != null ? slot('icon', item.icon, 'span', { 'aria-hidden': true }) : null}
                  <span className={config.unstyled ? undefined : 'pinfold-tabs__text'}>{item.label}</span>
                  {item.endContent != null ? slot('endContent', item.endContent, 'span') : null}
                </>,
                'button',
                {
                  type: 'button',
                  role: 'tab',
                  id: `${base}-tab-${i}`,
                  'aria-selected': isSelected,
                  'aria-controls': isSelected || config.keepMounted ? `${base}-panel-${i}` : undefined,
                  'aria-disabled': item.disabled || undefined,
                  'data-tabs-tab': '',
                  'data-selected': dataAttr(isSelected),
                  tabIndex: i === stop ? 0 : -1,
                  onClick: (event: React.MouseEvent) => select(i, event),
                  onFocus: () => setFocused(i),
                  onBlur: () => setFocused(null),
                },
              )}
            </React.Fragment>
          );
        })}
      </>,
      'div',
      { ref: list, role: 'tablist', 'aria-label': config.label, 'aria-orientation': orientation, onKeyDown },
    );
    const panels = items.map((item, i) =>
      i === selected || config.keepMounted ? (
        <React.Fragment key={item.id}>
          {slot('panel', item.content, 'div', { role: 'tabpanel', id: `${base}-panel-${i}`, 'aria-labelledby': `${base}-tab-${i}`, tabIndex: 0, hidden: i !== selected || undefined })}
        </React.Fragment>
      ) : null,
    );
    return renderSlot(config, 'root', root, state, <>{tablist}{panels}</>, (p, c) => <div {...p}>{c}</div>) as React.ReactElement;
  };

  const api: TabsApi = {
    value,
    select: (id) => {
      const i = items.findIndex((item) => item.id === id);
      if (enabled(i)) setValue(id);
    },
    focus: () => tabs()[selected >= 0 ? selected : 0]?.focus(),
    getRootProps,
    render,
  };
  return usePinfoldComponent<TabsApi, TabsRootProps>('Tabs', api, (props) => render(props));
}
