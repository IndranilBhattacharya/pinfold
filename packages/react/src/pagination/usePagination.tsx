import * as React from 'react';
import { cn, dataAttr, inactivePaginationOptions, mergeProps, pageAt, pageCount, pageWindow, paginationRange, warnOnce, type PropsBag } from '@pinfold/core';
import { useControllableState } from '../hooks';
import { useSlidingIndicator } from '../indicator';
import { usePinfold } from '../provider';
import { usePinfoldComponent } from '../component';
import { mergeConfig } from '../preset';
import { renderSlot, slotProps } from '../slots';
import { followLink } from '../link';
import { VISUALLY_HIDDEN } from '../a11y';
import { CHEVRON_DOWN_ICON, CHEVRON_ICON, CHEVRONS_ICON, MORE_ICON } from '../nav-icons';
import type { PaginationApi, PaginationChange, PaginationComponent, PaginationConfig, PaginationRootProps, PaginationSlot, PaginationState } from './types';

/**
 * Pages of results, as a hook that hands back a component and its controller.
 *
 *   const Pages = usePagination({ total: rows.length, pageSizes: [10, 25] });
 *   return <>{Pages.slice(rows).map(renderRow)}<Pages /></>;
 *
 * Precedence: this config, then `defaults.pagination`, then the provider (size, tone), then the library default.
 */
export function usePagination(input: PaginationConfig): PaginationComponent {
  const ctx = usePinfold();
  const config = ctx.defaults.pagination ? mergeConfig<PaginationConfig>(ctx.defaults.pagination, input) : input;
  const list = React.useRef<HTMLUListElement | null>(null);
  const [pageSize, setPageSize] = useControllableState<number>({ value: config.pageSize, defaultValue: config.defaultPageSize ?? config.pageSizes?.[0] ?? 10 });
  const size = Math.max(1, Math.floor(pageSize) || 1);
  const known = config.count !== undefined || config.total !== undefined;
  const count = config.count !== undefined ? Math.max(0, Math.floor(config.count)) : config.total !== undefined ? pageCount(config.total, size) : undefined;
  const clamp = (p: number) => Math.min(Math.max(1, Math.round(p) || 1), count === undefined ? Infinity : Math.max(1, count));
  const [raw, setRaw] = useControllableState<number>({ value: config.page, defaultValue: config.defaultPage ?? 1 });
  const page = clamp(raw);
  const [jump, setJump] = React.useState('');

  if (process.env.NODE_ENV !== 'production') {
    void import('@pinfold/core/meta').then(({ paginationMeta, validateConfig }) => {
      for (const problem of validateConfig(paginationMeta, input)) warnOnce(true, problem.message);
      const inactive = inactivePaginationOptions(config);
      for (const key in inactive) warnOnce((input as unknown as Record<string, unknown>)[key] !== undefined, `Pagination: \`${key}\` has no visible effect here. ${inactive[key]}`);
    });
    warnOnce(!known && config.hasNext === undefined, 'Pagination: give it `count` (pages), `total` (items), or `hasNext` when the total is unknown.');
  }

  const loading = !!config.loading;
  const blocked = !!config.disabled || loading;
  const compact = known && !!config.compact;
  const state: PaginationState = { variant: config.variant ?? 'soft', size: config.size ?? ctx.size, tone: config.tone ?? ctx.tone, page, count, pageSize: size, loading };
  const labels = config.labels ?? {};
  const { offset, from, to } = pageWindow(page, size, config.total);
  const atStart = page <= 1;
  const atEnd = count === undefined ? !config.hasNext : page >= count;
  const pages = known && !compact;
  useSlidingIndicator(list, pages, '[data-current-cell]', 0, '--pinfold-pgn-i', `${page}/${count}/${size}`);

  const change = (next: number, details: PaginationChange) => {
    setRaw(next);
    config.onChange?.(next, details);
  };
  const go = (target: number, event?: React.SyntheticEvent) => {
    const next = clamp(target);
    if (blocked || next === page) {
      // A link to the page you are on, or a blocked control: nothing to follow.
      if (config.getHref) event?.preventDefault();
      return false;
    }
    change(next, { pageSize: size, offset: (next - 1) * size, reason: 'page', event });
    return true;
  };
  const resize = (value: number, event?: React.SyntheticEvent) => {
    const next = Math.max(1, Math.floor(value));
    if (next === size) return;
    // The first item on screen stays on screen.
    const target = pageAt(offset, next);
    setPageSize(next);
    change(target, { pageSize: next, offset: (target - 1) * next, reason: 'pageSize', event });
  };

  const getRootProps = (props?: PropsBag): PropsBag =>
    mergeProps(
      {
        'aria-label': config.label ?? 'Pagination',
        'aria-busy': loading || undefined,
        'data-variant': state.variant,
        'data-radius': config.radius ?? 'md',
        'data-size': state.size,
        'data-tone': state.tone,
        'data-disabled': dataAttr(config.disabled),
        'data-loading': dataAttr(loading),
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
    const control = (name: PaginationSlot, target: number, content: React.ReactNode, own: PropsBag, off = false) => {
      const unavailable = blocked || off;
      const link = !!config.getHref && !unavailable;
      return slot(name, content, link ? 'a' : 'button', {
        ...(link ? { href: config.getHref!(clamp(target)) } : { type: 'button' }),
        'aria-disabled': unavailable || undefined,
        'data-pagination-control': '',
        onClick: (event: React.MouseEvent) => {
          if (unavailable) {
            event.preventDefault();
            return;
          }
          if (go(target, event) && link) followLink(event, config.getHref!(clamp(target)), ctx.navigate);
        },
        ...own,
      });
    };
    // The cursor is measured from the current page's cell (the list is its offset parent).
    const li = (key: string | number, child: React.ReactNode, current = false) => (
      <li key={key} className={config.unstyled ? undefined : 'pinfold-pagination__cell'} data-current-cell={current ? '' : undefined}>
        {child}
      </li>
    );
    const summary = labels.info
      ? labels.info({ from, to, total: config.total, page, count })
      : config.total !== undefined
        ? `${from}–${to} of ${config.total}`
        : count !== undefined
          ? `Page ${page} of ${count}`
          : `Page ${page}`;
    const controls = config.showControls !== false;
    const edges = known && !!config.showEdges && controls;
    const cells: React.ReactNode[] = [];
    if (pages) cells.push(<li key="cursor" aria-hidden="true" className={config.unstyled ? undefined : 'pinfold-pagination__cursor'} />);
    if (edges) cells.push(li('first', control('first', 1, CHEVRONS_ICON, { 'aria-label': labels.first ?? 'First page', 'data-flip': '' }, atStart)));
    if (controls || !pages) cells.push(li('previous', control('previous', page - 1, CHEVRON_ICON, { 'aria-label': labels.previous ?? 'Previous page', 'data-flip': '' }, atStart)));
    if (pages) {
      for (const entry of paginationRange(page, count ?? 0, config.siblings ?? 1, config.boundaries ?? 1)) {
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
            current,
          ),
        );
      }
    } else {
      // Compact, or the total unknown: where you are, as text.
      const shown = count === undefined ? (labels.page ? labels.page(page) : `Page ${page}`) : `${page} / ${count}`;
      cells.push(
        li(
          'status',
          slot(
            'status',
            count === undefined ? (
              shown
            ) : (
              <>
                <span aria-hidden="true">{shown}</span>
                <span style={VISUALLY_HIDDEN}>{labels.page ? labels.page(page) : `Page ${page} of ${count}`}</span>
              </>
            ),
            'span',
            { 'aria-current': 'page' },
          ),
        ),
      );
    }
    if (controls || !pages) cells.push(li('next', control('next', page + 1, CHEVRON_ICON, { 'aria-label': labels.next ?? 'Next page' }, atEnd)));
    if (edges) cells.push(li('last', control('last', count ?? 1, CHEVRONS_ICON, { 'aria-label': labels.last ?? 'Last page' }, atEnd)));

    const sizes = config.pageSizes?.length ? [...new Set([...config.pageSizes, size])].sort((a, b) => a - b) : null;
    const content = (
      <>
        {config.showInfo ? slot('info', summary, 'span', { 'aria-live': 'polite' }) : null}
        {slot('list', cells, 'ul', { ref: list })}
        {sizes
          ? slot(
              'size',
              <>
                <span>{labels.pageSize ?? 'Rows per page'}</span>
                <span className={config.unstyled ? undefined : 'pinfold-pagination__field'}>
                  <select value={size} disabled={blocked} onChange={(event) => resize(Number(event.target.value), event)}>
                    {sizes.map((n) => (
                      <option key={n} value={n}>
                        {n}
                      </option>
                    ))}
                  </select>
                  {CHEVRON_DOWN_ICON}
                </span>
              </>,
              'label',
            )
          : null}
        {config.showJump
          ? slot(
              'jump',
              <>
                <span>{labels.jump ?? 'Go to page'}</span>
                <span className={config.unstyled ? undefined : 'pinfold-pagination__field'}>
                  <input
                    type="number"
                    inputMode="numeric"
                    min={1}
                    max={count}
                    placeholder={String(page)}
                    value={jump}
                    disabled={blocked}
                    onChange={(event) => setJump(event.target.value)}
                    onKeyDown={(event) => {
                      if (event.key !== 'Enter' || jump === '') return;
                      event.preventDefault();
                      go(Number(jump), event);
                      setJump('');
                    }}
                    onBlur={(event) => {
                      if (jump !== '') go(Number(jump), event);
                      setJump('');
                    }}
                  />
                </span>
              </>,
              'label',
            )
          : null}
      </>
    );
    return renderSlot(config, 'root', root, state, content, (p, c) => <nav {...p}>{c}</nav>) as React.ReactElement;
  };

  const api: PaginationApi = {
    page,
    pageSize: size,
    count,
    offset,
    setPage: (p) => setRaw(clamp(p)),
    setPageSize: (n) => {
      const next = Math.max(1, Math.floor(n));
      setPageSize(next);
      setRaw(pageAt(offset, next));
    },
    next: () => {
      if (!atEnd) setRaw(clamp(page + 1));
    },
    previous: () => setRaw(clamp(page - 1)),
    slice: (all) => all.slice(offset, offset + size),
    getRootProps,
    render,
  };
  return usePinfoldComponent<PaginationApi, PaginationRootProps>('Pagination', api, (props) => render(props));
}
