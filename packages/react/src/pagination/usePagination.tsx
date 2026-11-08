import * as React from 'react';
import { cn, dataAttr, inactivePaginationOptions, mergeProps, paginationRange, warnOnce, type PropsBag } from '@pinfold/core';
import { useControllableState } from '../hooks';
import { usePinfold } from '../provider';
import { usePinfoldComponent } from '../component';
import { mergeConfig } from '../preset';
import { renderSlot, slotProps } from '../slots';
import { CHEVRON_ICON, CHEVRONS_ICON, MORE_ICON } from '../nav-icons';
import type { PaginationApi, PaginationComponent, PaginationConfig, PaginationRootProps, PaginationSlot, PaginationState } from './types';

/**
 * Pages of results, as a hook that hands back a component.
 *
 *   const Pages = usePagination({ count: 24, page, onChange: setPage });
 *   return <Pages />;
 *
 * Precedence: this config, then `defaults.pagination`, then the provider (size, tone), then the library default.
 */
export function usePagination(input: PaginationConfig): PaginationComponent {
  const ctx = usePinfold();
  const config = ctx.defaults.pagination ? mergeConfig<PaginationConfig>(ctx.defaults.pagination, input) : input;
  const count = Math.max(0, Math.floor(config.count ?? 0));
  const clamp = (p: number) => Math.min(Math.max(1, Math.round(p)), Math.max(1, count));
  const [raw, setRaw] = useControllableState<number>({ value: config.page, defaultValue: config.defaultPage ?? 1 });
  const page = clamp(raw);

  if (process.env.NODE_ENV !== 'production') {
    void import('@pinfold/core/meta').then(({ paginationMeta, validateConfig }) => {
      for (const problem of validateConfig(paginationMeta, input)) warnOnce(true, problem.message);
      const inactive = inactivePaginationOptions(config);
      for (const key in inactive) warnOnce((input as unknown as Record<string, unknown>)[key] !== undefined, `Pagination: \`${key}\` has no visible effect here. ${inactive[key]}`);
    });
  }

  const state: PaginationState = { variant: config.variant ?? 'ghost', size: config.size ?? ctx.size, tone: config.tone ?? ctx.tone, page, count };
  const labels = config.labels ?? {};
  const go = (target: number, event: React.MouseEvent) => {
    const next = clamp(target);
    if (config.disabled || next === page) {
      // A link to the page you are on, or a disabled control: nothing to follow.
      if (config.getHref) event.preventDefault();
      return;
    }
    setRaw(next);
    config.onChange?.(next, event);
  };

  const getRootProps = (props?: PropsBag): PropsBag =>
    mergeProps(
      {
        'aria-label': config.label ?? 'Pagination',
        'data-variant': state.variant,
        'data-size': state.size,
        'data-tone': state.tone,
        'data-disabled': dataAttr(config.disabled),
        'data-animate': dataAttr(!ctx.disableAnimation),
        'data-unstyled': dataAttr(config.unstyled),
      },
      props,
    );

  const render = (rootProps?: PaginationRootProps): React.ReactElement => {
    const slot = (name: PaginationSlot, content: React.ReactNode, tag: string, own: PropsBag = {}) =>
      renderSlot(config, name, slotProps(config, name, { className: config.unstyled ? undefined : `pinfold-pagination__${name}`, ...own }), state, content, (p, c) => React.createElement(tag, p, c));
    const root = slotProps(config, 'root', getRootProps(mergeProps({ className: config.unstyled ? config.className : cn('pinfold pinfold-pagination', config.className), style: config.style }, rootProps)));
    // A page or control: a link with `getHref`, else a button. Unavailable ones stay focusable
    // (aria-disabled), so focus never jumps when you reach an end.
    const control = (name: PaginationSlot, target: number, content: React.ReactNode, own: PropsBag) => {
      const off = !!config.disabled || (name !== 'item' && clamp(target) === page);
      const link = !!config.getHref && !off;
      return slot(name, content, link ? 'a' : 'button', {
        ...(link ? { href: config.getHref!(clamp(target)) } : { type: 'button' }),
        'aria-disabled': off || undefined,
        'data-pagination-control': '',
        onClick: (event: React.MouseEvent) => (off ? event.preventDefault() : go(target, event)),
        ...own,
      });
    };
    const li = (key: string | number, child: React.ReactNode) => (
      <li key={key} className={config.unstyled ? undefined : 'pinfold-pagination__cell'}>
        {child}
      </li>
    );
    const edges = config.showEdges && config.showControls !== false;
    const controls = config.showControls !== false;
    const cells: React.ReactNode[] = [];
    if (edges) cells.push(li('first', control('first', 1, CHEVRONS_ICON, { 'aria-label': labels.first ?? 'First page', 'data-flip': '' })));
    if (controls) cells.push(li('previous', control('previous', page - 1, CHEVRON_ICON, { 'aria-label': labels.previous ?? 'Previous page', 'data-flip': '' })));
    for (const entry of paginationRange(page, count, config.siblings ?? 1, config.boundaries ?? 1)) {
      if (typeof entry === 'string') {
        cells.push(li(entry, slot('gap', MORE_ICON, 'span', { 'aria-hidden': true })));
        continue;
      }
      const current = entry === page;
      cells.push(
        li(
          entry,
          control('item', entry, entry, {
            'aria-label': labels.page ? labels.page(entry) : `Page ${entry}`,
            'aria-current': current ? 'page' : undefined,
            'data-current': dataAttr(current),
          }),
        ),
      );
    }
    if (controls) cells.push(li('next', control('next', page + 1, CHEVRON_ICON, { 'aria-label': labels.next ?? 'Next page' })));
    if (edges) cells.push(li('last', control('last', count, CHEVRONS_ICON, { 'aria-label': labels.last ?? 'Last page' })));
    return renderSlot(config, 'root', root, state, slot('list', cells, 'ul'), (p, c) => <nav {...p}>{c}</nav>) as React.ReactElement;
  };

  const api: PaginationApi = { page, setPage: (p) => setRaw(clamp(p)), getRootProps, render };
  return usePinfoldComponent<PaginationApi, PaginationRootProps>('Pagination', api, (props) => render(props));
}
