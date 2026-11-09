import * as React from 'react';
import { cn, dataAttr, dimensionVars, inactiveSidebarOptions, mergeProps, sidebarKey, sidebarTrail, warnOnce, type PropsBag, radiusProps } from '@pinfold/core';
import { useControllableState, useId } from '../hooks';
import { usePinfold } from '../provider';
import { usePinfoldComponent } from '../component';
import { mergeConfig } from '../preset';
import { ITEM, renderSlot, slotProps } from '../slots';
import { followLink } from '../link';
import { CHEVRON_DOWN_ICON } from '../nav-icons';
import type { SidebarApi, SidebarComponent, SidebarConfig, SidebarItem, SidebarRootProps, SidebarSlot, SidebarState } from './types';

const PANEL_ICON = (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" focusable="false" aria-hidden="true">
    <rect x="3.5" y="4.5" width="17" height="15" rx="2.5" />
    <path d="M9.5 4.5v15M15.5 10l-2 2 2 2" />
  </svg>
);

const toItem = (item: SidebarItem | string): SidebarItem => (typeof item === 'string' ? { label: item } : item);

/**
 * App navigation down the side: links, buttons and sections that open, under group headings, with
 * a header and a footer, folding into a rail of icons. As a hook that hands back a component.
 *
 *   const Nav = useSidebar({ label: 'Main', value: pathname, items });
 *   return <Nav />;
 *
 * Precedence: this config, then `defaults.sidebar`, then the provider (size, tone), then the library default.
 */
export function useSidebar(input: SidebarConfig): SidebarComponent {
  const ctx = usePinfold();
  const config = ctx.defaults.sidebar ? mergeConfig<SidebarConfig>(ctx.defaults.sidebar, input) : input;
  const base = useId();
  const items = config.items ?? [];
  const [value, setValueState] = useControllableState<string | undefined>({ value: config.value, defaultValue: config.defaultValue });
  const [expanded, setExpandedState] = useControllableState<readonly string[]>({
    value: config.expanded,
    defaultValue: config.defaultExpanded ?? sidebarTrail(items, config.value ?? config.defaultValue),
    onChange: (keys) => config.onExpandedChange?.([...keys]),
  });
  const [collapsed, setCollapsedState] = useControllableState<boolean>({ value: config.collapsed, defaultValue: config.defaultCollapsed ?? false, onChange: config.onCollapsedChange });

  if (process.env.NODE_ENV !== 'production') {
    void import('@pinfold/core/meta').then(({ sidebarMeta, validateConfig }) => {
      for (const problem of validateConfig(sidebarMeta, input)) warnOnce(true, problem.message);
      const inactive = inactiveSidebarOptions(config);
      for (const key in inactive) warnOnce((input as unknown as Record<string, unknown>)[key] !== undefined, `Sidebar: \`${key}\` has no visible effect here. ${inactive[key]}`);
    });
  }

  // A current entry inside a closed section still marks the section.
  const trail = sidebarTrail(items, value);
  const state: SidebarState = { variant: config.variant ?? 'soft', size: config.size ?? ctx.size, tone: config.tone ?? ctx.tone, value, collapsed };
  const setExpanded = (keys: string[]) => setExpandedState(keys);
  const toggleSection = (key: string) => setExpanded(expanded.includes(key) ? expanded.filter((k) => k !== key) : [...expanded, key]);

  const getRootProps = (props?: PropsBag): PropsBag =>
    mergeProps(
      {
        ...radiusProps(config.radius),
        'aria-label': config.label,
        'data-variant': state.variant,
        'data-collapsed': dataAttr(collapsed),
        'data-size': state.size,
        'data-tone': state.tone,
        'data-animate': dataAttr(!ctx.disableAnimation),
        'data-unstyled': dataAttr(config.unstyled),
      },
      props,
    );

  const render = (rootProps?: SidebarRootProps): React.ReactElement => {
    const cls = (name: string) => (config.unstyled ? undefined : name);
    const slot = (name: SidebarSlot, content: React.ReactNode, tag: string, own: PropsBag = {}) =>
      renderSlot(config, name, slotProps(config, name, { className: cls(`pinfold-sidebar__${name}`), ...own }), state, content, (p, c) => React.createElement(tag, p, c));
    const vars = dimensionVars('sidebar', config.dimensions);
    const root = slotProps(
      config,
      'root',
      getRootProps(mergeProps({ className: config.unstyled ? config.className : cn('pinfold pinfold-sidebar', config.className), style: vars ? { ...vars, ...config.style } : config.style }, rootProps)),
    );

    const entry = (raw: SidebarItem | string, depth: number, path: string): React.ReactNode => {
      const item = toItem(raw);
      const key = sidebarKey(raw);
      const section = !!item.items?.length;
      const open = section && expanded.includes(key) && !collapsed;
      const current = !section && key === value;
      const subId = `${base}-${path}`;
      const text = <span className={cls('pinfold-sidebar__text')}>{item.label}</span>;
      // In a rail the icon stands for the entry: the first letter when there is none.
      const icon = item.icon ?? (depth === 0 ? <span className={cls('pinfold-sidebar__initial')}>{item.label.charAt(0)}</span> : null);
      const inner = (
        <>
          {icon ? slot('icon', icon, 'span', { 'aria-hidden': true }) : null}
          {text}
          {item.badge != null ? slot('badge', item.badge, 'span') : null}
          {section ? slot('chevron', CHEVRON_DOWN_ICON, 'span', { 'aria-hidden': true }) : null}
        </>
      );
      const onClick = (event: React.MouseEvent) => {
        item.onClick?.(event);
        if (event.defaultPrevented || item.disabled) return;
        if (section) {
          // A section in a rail opens the sidebar on it.
          if (collapsed) {
            setCollapsedState(false);
            if (!expanded.includes(key)) setExpanded([...expanded, key]);
          } else toggleSection(key);
          return;
        }
        setValueState(key);
        config.onChange?.(key, item, event);
        if (item.href !== undefined) {
          const own = config.onNavigate;
          followLink(event, item.href, own ? (href) => own(href, event) : ctx.navigate, item.target);
        }
      };
      const common = {
        className: cls('pinfold-sidebar__link'),
        title: collapsed && depth === 0 ? item.label : undefined,
        'aria-current': current ? 'page' : undefined,
        'data-current': dataAttr(current),
        'data-holds-current': dataAttr(section && trail.includes(key)),
        'data-depth': depth,
        onClick,
      };
      const control =
        item.href !== undefined && !section && !item.disabled
          ? slot('link', inner, 'a', { ...common, href: item.href, target: item.target })
          : slot('link', inner, 'button', {
              ...common,
              type: 'button',
              'aria-disabled': item.disabled || undefined,
              'aria-expanded': section ? open : undefined,
              'aria-controls': section ? subId : undefined,
            });
      return slot(
        'item',
        <>
          {control}
          {section
            ? slot(
                'sublist',
                slot(
                  'list',
                  item.items!.map((child, i) => <React.Fragment key={sidebarKey(child)}>{entry(child, depth + 1, `${path}-${i}`)}</React.Fragment>),
                  'ul',
                ),
                'div',
                { id: subId, 'data-open': dataAttr(open) },
              )
            : null}
        </>,
        'li',
        { [ITEM]: { ...item, key, depth, current, open: section ? open : undefined }, 'data-disabled': dataAttr(item.disabled) },
      );
    };

    // Top-level entries in order of their first group; ungrouped ones come first.
    const groups: Array<{ name: string | undefined; entries: Array<[SidebarItem | string, number]> }> = [];
    items.forEach((raw, i) => {
      const name = toItem(raw).group;
      const found = groups.find((g) => g.name === name);
      if (found) found.entries.push([raw, i]);
      else groups.push({ name, entries: [[raw, i]] });
    });
    const toggleLabel = collapsed ? (config.labels?.expand ?? 'Expand sidebar') : (config.labels?.collapse ?? 'Collapse sidebar');

    const content = (
      <>
        {config.header != null ? slot('header', config.header, 'div') : null}
        {slot(
          'body',
          groups.map((g, gi) => {
            const headingId = `${base}-g${gi}`;
            return (
              <React.Fragment key={g.name ?? ''}>
                {slot(
                  'group',
                  <>
                    {g.name ? slot('groupLabel', g.name, 'div', { id: headingId }) : null}
                    {slot(
                      'list',
                      g.entries.map(([raw, i]) => <React.Fragment key={sidebarKey(raw)}>{entry(raw, 0, String(i))}</React.Fragment>),
                      'ul',
                      { 'aria-labelledby': g.name ? headingId : undefined },
                    )}
                  </>,
                  'div',
                )}
              </React.Fragment>
            );
          }),
          'div',
        )}
        {config.footer != null ? slot('footer', config.footer, 'div') : null}
        {config.collapsible
          ? slot(
              'toggle',
              <>
                {PANEL_ICON}
                <span className={cls('pinfold-sidebar__text')}>{toggleLabel}</span>
              </>,
              'button',
              { type: 'button', 'aria-expanded': !collapsed, title: collapsed ? toggleLabel : undefined, onClick: () => setCollapsedState(!collapsed) },
            )
          : null}
      </>
    );
    return renderSlot(config, 'root', root, state, content, (p, c) => <nav {...p}>{c}</nav>) as React.ReactElement;
  };

  const api: SidebarApi = {
    value,
    setValue: (key) => setValueState(key),
    expanded: [...expanded],
    setExpanded,
    collapsed,
    setCollapsed: (c) => setCollapsedState(c),
    getRootProps,
    render,
  };
  return usePinfoldComponent<SidebarApi, SidebarRootProps>('Sidebar', api, (props) => render(props));
}
