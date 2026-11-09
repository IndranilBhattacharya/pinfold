import * as React from 'react';
import { breadcrumbPath, breadcrumbVisible, cn, dataAttr, dimensionVars, inactiveBreadcrumbOptions, mergeProps, warnOnce, type PropsBag, radiusProps } from '@pinfold/core';
import { usePinfold } from '../provider';
import { usePinfoldComponent } from '../component';
import { mergeConfig } from '../preset';
import { ITEM, renderSlot, slotProps } from '../slots';
import { followLink } from '../link';
import { Menu } from '../menu/Menu';
import type { MenuItem } from '../menu/types';
import { ARROW_ICON, CHEVRON_DOWN_ICON, CHEVRON_ICON, MORE_ICON } from '../nav-icons';
import type { BreadcrumbApi, BreadcrumbComponent, BreadcrumbConfig, BreadcrumbItem, BreadcrumbLink, BreadcrumbRootProps, BreadcrumbSlot, BreadcrumbState } from './types';

const MARKS: Record<string, React.ReactNode> = { chevron: CHEVRON_ICON, slash: '/', dot: '·', arrow: ARROW_ICON };

/** The crumbs from `items`, or from `path` when there are none. */
function crumbsOf(config: BreadcrumbConfig): BreadcrumbItem[] {
  if (config.items) return config.items.map((item) => (typeof item === 'string' ? { label: item } : item));
  if (config.path === undefined) return [];
  const names = config.pathLabels;
  return breadcrumbPath(config.path).map(({ segment, href, label }, i) => {
    const named = typeof names === 'function' ? names(segment, href) : names?.[href] ?? names?.[segment];
    return { label: i === 0 ? config.homeLabel ?? named ?? label : named ?? label, href };
  });
}

/**
 * The path to the current page, as a hook that hands back a component.
 *
 *   const Trail = useBreadcrumb({ path: '/projects/pinfold/settings', onNavigate: router.push });
 *   return <Trail />;
 *
 * Precedence: this config, then `defaults.breadcrumb`, then the provider (size, tone), then the library default.
 */
export function useBreadcrumb(input: BreadcrumbConfig): BreadcrumbComponent {
  const ctx = usePinfold();
  const config = ctx.defaults.breadcrumb ? mergeConfig<BreadcrumbConfig>(ctx.defaults.breadcrumb, input) : input;
  const [expanded, setExpanded] = React.useState(false);
  const list = React.useRef<HTMLOListElement | null>(null);
  // After a reveal, focus goes to the first crumb that was hidden, so the keyboard lands where it was.
  const revealFocus = React.useRef<number | null>(null);
  const items = crumbsOf(config);

  if (process.env.NODE_ENV !== 'production') {
    void import('@pinfold/core/meta').then(({ breadcrumbMeta, validateConfig }) => {
      for (const problem of validateConfig(breadcrumbMeta, input)) warnOnce(true, problem.message);
      const inactive = inactiveBreadcrumbOptions(config);
      for (const key in inactive) warnOnce((input as unknown as Record<string, unknown>)[key] !== undefined, `Breadcrumb: \`${key}\` has no visible effect here. ${inactive[key]}`);
    });
    warnOnce(config.items === undefined && config.path === undefined, 'Breadcrumb: give it `items`, or a `path` such as "/projects/pinfold".');
  }

  const before = config.itemsBeforeCollapse ?? 1;
  const after = config.itemsAfterCollapse ?? 2;
  const visible = expanded ? breadcrumbVisible(items.length) : breadcrumbVisible(items.length, config.maxItems, before, after);
  const collapsed = visible.includes(-1);
  const state: BreadcrumbState = { variant: config.variant ?? 'plain', size: config.size ?? ctx.size, tone: config.tone ?? ctx.tone, collapsed };

  React.useEffect(() => {
    if (revealFocus.current === null) return;
    list.current?.querySelectorAll<HTMLElement>('[data-crumb] > :first-child')[revealFocus.current]?.focus();
    revealFocus.current = null;
  });

  // The crumb's own onClick, then `onNavigate`, the provider's router, or the browser.
  const follow = (event: React.MouseEvent<HTMLElement>, link: BreadcrumbLink) => {
    link.onClick?.(event);
    const own = config.onNavigate;
    followLink(event, link.href, own ? (href) => own(href, event) : ctx.navigate);
  };
  const menuItems = (links: readonly BreadcrumbLink[]): MenuItem[] =>
    links.map((link) => ({ label: link.label, icon: link.icon, href: link.href, onSelect: (event) => follow(event as React.MouseEvent<HTMLElement>, link) }));

  const getRootProps = (props?: PropsBag): PropsBag =>
    mergeProps(
      {
        ...radiusProps(config.radius),
        'aria-label': config.label ?? 'Breadcrumb',
        'data-variant': state.variant,
        'data-size': state.size,
        'data-tone': state.tone,
        'data-animate': dataAttr(!ctx.disableAnimation),
        'data-unstyled': dataAttr(config.unstyled),
      },
      props,
    );

  const render = (rootProps?: BreadcrumbRootProps): React.ReactElement => {
    const slot = (name: BreadcrumbSlot, content: React.ReactNode, tag: string, own: PropsBag = {}) =>
      renderSlot(config, name, slotProps(config, name, { className: config.unstyled ? undefined : `pinfold-breadcrumb__${name}`, ...own }), state, content, (p, c) => React.createElement(tag, p, c));
    const vars = dimensionVars('breadcrumb', config.dimensions);
    const root = slotProps(
      config,
      'root',
      getRootProps(mergeProps({ className: config.unstyled ? config.className : cn('pinfold pinfold-breadcrumb', config.className), style: vars || config.style ? { ...vars, ...config.style } : undefined }, rootProps)),
    );
    const sep = config.separator ?? 'chevron';
    const mark = typeof sep === 'string' ? MARKS[sep] : sep;
    const separator = slot('separator', mark, 'span', { 'aria-hidden': true, 'data-mark': typeof sep === 'string' ? sep : 'custom' });
    const menuLabel = config.menuLabel ?? 'Other pages';
    const expandLabel = config.expandLabel ?? 'Show the full path';
    const text = (item: BreadcrumbLink) => (
      <>
        {item.icon != null ? slot('icon', item.icon, 'span', { 'aria-hidden': true }) : null}
        <span className={config.unstyled ? undefined : 'pinfold-breadcrumb__text'} title={typeof item.label === 'string' ? item.label : undefined}>
          {item.label}
        </span>
      </>
    );
    const crumbs = visible.map((index, n) => {
      const last = n === visible.length - 1;
      if (index === -1) {
        const hidden = items.slice(before, items.length - after);
        const trigger = slot('ellipsis', MORE_ICON, 'button', { type: 'button', 'aria-label': expandLabel, title: expandLabel });
        return (
          <li key="gap" className={config.unstyled ? undefined : 'pinfold-breadcrumb__item'} data-crumb="">
            {(config.collapse ?? 'menu') === 'menu' ? (
              <Menu trigger={trigger as React.ReactElement} items={menuItems(hidden)} size={state.size} />
            ) : (
              React.cloneElement(trigger as React.ReactElement, {
                onClick: () => {
                  revealFocus.current = before;
                  setExpanded(true);
                },
              } as PropsBag)
            )}
            {separator}
          </li>
        );
      }
      const item = items[index];
      const current = index === items.length - 1;
      const link = !current && !item.disabled && (item.href !== undefined || !!item.onClick);
      const menu = item.menu?.length ? item.menu : null;
      // A crumb with a menu and nowhere to go is itself the menu's button.
      const own = menu && !link && !current;
      const body = own
        ? (
            <Menu
              trigger={slot('menuButton', <>{text(item)}{CHEVRON_DOWN_ICON}</>, 'button', { type: 'button', 'data-crumb-trigger': '' }) as React.ReactElement}
              items={menuItems(menu)}
              size={state.size}
            />
          )
        : link
          ? slot('link', text(item), 'a', { href: item.href, onClick: (event: React.MouseEvent<HTMLElement>) => follow(event, item) })
          : slot('link', text(item), 'span', { 'aria-current': current ? 'page' : undefined, 'aria-disabled': item.disabled || undefined, tabIndex: -1 });
      const toggle =
        menu && !own ? (
          <Menu trigger={slot('menuButton', CHEVRON_DOWN_ICON, 'button', { type: 'button', 'aria-label': menuLabel, title: menuLabel }) as React.ReactElement} items={menuItems(menu)} size={state.size} />
        ) : null;
      return (
        <React.Fragment key={index}>
          {slot(
            'item',
            <>
              {body}
              {toggle}
              {last ? null : separator}
            </>,
            'li',
            { [ITEM]: { ...item, index, current }, 'data-crumb': '', 'data-current': dataAttr(current) },
          )}
        </React.Fragment>
      );
    });
    const content = slot('list', crumbs, 'ol', { ref: list });
    return renderSlot(config, 'root', root, state, content, (p, c) => <nav {...p}>{c}</nav>) as React.ReactElement;
  };

  const api: BreadcrumbApi = { collapsed, expand: () => setExpanded(true), getRootProps, render };
  return usePinfoldComponent<BreadcrumbApi, BreadcrumbRootProps>('Breadcrumb', api, (props) => render(props));
}
