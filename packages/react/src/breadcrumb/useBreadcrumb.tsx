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
import { VISUALLY_HIDDEN } from '../a11y';
import type { BreadcrumbApi, BreadcrumbComponent, BreadcrumbConfig, BreadcrumbItem, BreadcrumbLink, BreadcrumbRootProps, BreadcrumbSlot, BreadcrumbState } from './types';

const MARKS: Record<string, React.ReactNode> = { chevron: CHEVRON_ICON, slash: '/', dot: '·', arrow: ARROW_ICON };
const HOME_ICON = (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" focusable="false" aria-hidden="true">
    <path d="M4 10.5 12 4l8 6.5V19a1 1 0 0 1-1 1h-4.5v-5.5h-5V20H5a1 1 0 0 1-1-1z" />
  </svg>
);

/** The crumbs from `items`, or from `path` when there are none; `home` adds or dresses the first one. */
function crumbsOf(config: BreadcrumbConfig): BreadcrumbItem[] {
  let list: BreadcrumbItem[] = [];
  const fromPath = !config.items && config.path !== undefined;
  if (config.items) list = config.items.map((item) => (typeof item === 'string' ? { label: item } : item));
  else if (fromPath) {
    const names = config.pathLabels;
    list = breadcrumbPath(config.path!).map(({ segment, href, label }, i) => {
      const named = typeof names === 'function' ? names(segment, href) : names?.[href] ?? names?.[segment];
      return { label: i === 0 ? config.homeLabel ?? named ?? label : named ?? label, href };
    });
  }
  const home = config.home;
  if (!home) return list;
  const base: BreadcrumbItem = { label: config.homeLabel ?? 'Home', href: '/', icon: HOME_ICON, iconOnly: true, key: 'home' };
  const own = typeof home === 'object' ? home : {};
  // A path already starts at its root: dress that crumb as the home crumb. Items get one in front.
  if (fromPath && list.length) return [{ ...base, ...list[0], icon: HOME_ICON, iconOnly: true, key: 'home', ...own }, ...list.slice(1)];
  return [{ ...base, ...own }, ...list];
}

/** What `onChange` reports a crumb or a menu row as: its `key`, else its `href`, else its text, else its position. */
const keyOf = (link: BreadcrumbLink, index: number) => link.key ?? link.href ?? (typeof link.label === 'string' ? link.label : String(index));

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

  // The crumb's own onClick, then `onChange`, then `onNavigate`, the provider's router, or the browser.
  const follow = (event: React.MouseEvent<HTMLElement>, link: BreadcrumbLink, index: number) => {
    link.onClick?.(event);
    if (!event.defaultPrevented) config.onChange?.(keyOf(link, index), link, event);
    const own = config.onNavigate;
    followLink(event, link.href, own ? (href) => own(href, event) : ctx.navigate);
  };
  // Rows are real links; a hidden crumb reports its place in the trail (`offset`), a sibling page its place in the menu.
  const menuItems = (links: readonly BreadcrumbItem[], offset = 0): MenuItem[] =>
    links.map((link, i) => ({ label: link.label, icon: link.icon, href: link.href, disabled: link.disabled, onSelect: (event) => follow(event as React.MouseEvent<HTMLElement>, link, offset + i) }));

  const getRootProps = (props?: PropsBag): PropsBag =>
    mergeProps(
      {
        ...radiusProps(config.radius),
        'aria-label': config.label ?? 'Breadcrumb',
        'data-variant': state.variant,
        'data-separator': typeof (config.separator ?? 'chevron') === 'string' ? config.separator ?? 'chevron' : 'custom',
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
    // An icon-only crumb keeps its label for screen readers (visually hidden) and as its tooltip.
    const text = (item: BreadcrumbLink) => (
      <>
        {item.icon != null ? slot('icon', item.icon, 'span', { 'aria-hidden': true }) : null}
        <span
          className={config.unstyled || item.iconOnly ? undefined : 'pinfold-breadcrumb__text'}
          style={item.iconOnly && item.icon != null ? VISUALLY_HIDDEN : undefined}
          title={typeof item.label === 'string' && !item.iconOnly ? item.label : undefined}
        >
          {item.label}
        </span>
      </>
    );
    const tip = (item: BreadcrumbLink) => (item.iconOnly && typeof item.label === 'string' ? item.label : undefined);
    const crumbs = visible.map((index, n) => {
      const last = n === visible.length - 1;
      if (index === -1) {
        const hidden = items.slice(before, items.length - after);
        const trigger = slot('ellipsis', MORE_ICON, 'button', { type: 'button', 'aria-label': expandLabel, title: expandLabel });
        return (
          <li key="gap" className={config.unstyled ? undefined : 'pinfold-breadcrumb__item'} data-crumb="">
            {(config.collapse ?? 'menu') === 'menu' ? (
              <Menu trigger={trigger as React.ReactElement} items={menuItems(hidden, before)} size={state.size} />
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
          ? slot('link', text(item), 'a', { href: item.href, title: tip(item), 'data-icon-only': dataAttr(item.iconOnly), onClick: (event: React.MouseEvent<HTMLElement>) => follow(event, item, index) })
          : slot('link', text(item), 'span', { 'aria-current': current ? 'page' : undefined, 'aria-disabled': item.disabled || undefined, title: tip(item), 'data-icon-only': dataAttr(item.iconOnly), tabIndex: -1 });
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
