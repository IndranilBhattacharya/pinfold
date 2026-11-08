import * as React from 'react';
import { breadcrumbVisible, cn, dataAttr, inactiveBreadcrumbOptions, mergeProps, warnOnce, type PropsBag } from '@pinfold/core';
import { usePinfold } from '../provider';
import { usePinfoldComponent } from '../component';
import { mergeConfig } from '../preset';
import { renderSlot, slotProps } from '../slots';
import { CHEVRON_ICON, MORE_ICON } from '../nav-icons';
import type { BreadcrumbApi, BreadcrumbComponent, BreadcrumbConfig, BreadcrumbRootProps, BreadcrumbSlot, BreadcrumbState } from './types';

const MARKS: Record<string, React.ReactNode> = { chevron: CHEVRON_ICON, slash: '/', dot: '·' };

/**
 * The path to the current page, as a hook that hands back a component.
 *
 *   const Trail = useBreadcrumb({ items: [{ label: 'Home', href: '/' }, { label: 'Settings' }] });
 *   return <Trail />;
 *
 * Precedence: this config, then `defaults.breadcrumb`, then the provider (size), then the library default.
 */
export function useBreadcrumb(input: BreadcrumbConfig): BreadcrumbComponent {
  const ctx = usePinfold();
  const config = ctx.defaults.breadcrumb ? mergeConfig<BreadcrumbConfig>(ctx.defaults.breadcrumb, input) : input;
  const [expanded, setExpanded] = React.useState(false);
  const list = React.useRef<HTMLOListElement | null>(null);
  // After a reveal, focus goes to the first crumb that was hidden, so the keyboard lands where it was.
  const revealFocus = React.useRef<number | null>(null);
  const items = config.items ?? [];

  if (process.env.NODE_ENV !== 'production') {
    void import('@pinfold/core/meta').then(({ breadcrumbMeta, validateConfig }) => {
      for (const problem of validateConfig(breadcrumbMeta, input)) warnOnce(true, problem.message);
      const inactive = inactiveBreadcrumbOptions(config);
      for (const key in inactive) warnOnce((input as unknown as Record<string, unknown>)[key] !== undefined, `Breadcrumb: \`${key}\` has no visible effect here. ${inactive[key]}`);
    });
  }

  const before = config.itemsBeforeCollapse ?? 1;
  const after = config.itemsAfterCollapse ?? 2;
  const visible = expanded ? breadcrumbVisible(items.length) : breadcrumbVisible(items.length, config.maxItems, before, after);
  const collapsed = visible.includes(-1);
  const state: BreadcrumbState = { variant: config.variant ?? 'plain', size: config.size ?? ctx.size, collapsed };

  React.useEffect(() => {
    if (revealFocus.current === null) return;
    list.current?.querySelectorAll<HTMLElement>('[data-crumb] > :first-child')[revealFocus.current]?.focus();
    revealFocus.current = null;
  });

  const getRootProps = (props?: PropsBag): PropsBag =>
    mergeProps(
      {
        'aria-label': config.label ?? 'Breadcrumb',
        'data-variant': state.variant,
        'data-size': state.size,
        'data-animate': dataAttr(!ctx.disableAnimation),
        'data-unstyled': dataAttr(config.unstyled),
      },
      props,
    );

  const render = (rootProps?: BreadcrumbRootProps): React.ReactElement => {
    const slot = (name: BreadcrumbSlot, content: React.ReactNode, tag: string, own: PropsBag = {}) =>
      renderSlot(config, name, slotProps(config, name, { className: config.unstyled ? undefined : `pinfold-breadcrumb__${name}`, ...own }), state, content, (p, c) => React.createElement(tag, p, c));
    const root = slotProps(config, 'root', getRootProps(mergeProps({ className: config.unstyled ? config.className : cn('pinfold pinfold-breadcrumb', config.className), style: config.style }, rootProps)));
    const sep = config.separator ?? 'chevron';
    const mark = typeof sep === 'string' ? MARKS[sep] : sep;
    const separator = slot('separator', mark, 'span', { 'aria-hidden': true, 'data-mark': typeof sep === 'string' ? sep : 'custom' });
    const crumbs = visible.map((index, n) => {
      const last = n === visible.length - 1;
      if (index === -1) {
        const firstHidden = before;
        return (
          <li key="gap" className={config.unstyled ? undefined : 'pinfold-breadcrumb__item'}>
            {slot('ellipsis', MORE_ICON, 'button', {
              type: 'button',
              'aria-label': config.expandLabel ?? 'Show the full path',
              title: config.expandLabel ?? 'Show the full path',
              onClick: () => {
                revealFocus.current = firstHidden;
                setExpanded(true);
              },
            })}
            {separator}
          </li>
        );
      }
      const item = items[index];
      const current = index === items.length - 1;
      const content = (
        <>
          {item.icon != null ? slot('icon', item.icon, 'span', { 'aria-hidden': true }) : null}
          <span className={config.unstyled ? undefined : 'pinfold-breadcrumb__text'}>{item.label}</span>
        </>
      );
      return (
        <React.Fragment key={index}>
          {slot(
            'item',
            <>
              {current || (!item.href && !item.onClick)
                ? slot('link', content, 'span', { 'aria-current': current ? 'page' : undefined, tabIndex: -1 })
                : slot('link', content, 'a', { href: item.href, onClick: item.onClick })}
              {last ? null : separator}
            </>,
            'li',
            { 'data-crumb': '', 'data-current': dataAttr(current) },
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
