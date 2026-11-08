import * as React from 'react';
import { cn, dataAttr, dimensionVars, headerFromKey, inactiveTableOptions, mergeProps, nextSort, selectionState, sortRows, warnOnce, type PropsBag, type TableSort } from '@pinfold/core';
import { useControllableState, useId } from '../hooks';
import { usePinfold } from '../provider';
import { usePinfoldComponent } from '../component';
import { mergeConfig } from '../preset';
import { renderSlot, slotProps } from '../slots';
import { VISUALLY_HIDDEN } from '../a11y';
import { Pagination } from '../pagination/Pagination';
import type { TableApi, TableColumn, TableComponent, TableConfig, TableRootProps, TableSlot, TableState } from './types';

const SORT_ICON = (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" focusable="false" aria-hidden="true">
    <path d="m8 9 4-4 4 4M16 15l-4 4-4-4" />
  </svg>
);

/**
 * A data table: your rows and columns, sorting, choosing rows, pages, a loading and an empty state,
 * as a hook that hands back a component and its controller.
 *
 *   const Invoices = useTable({ label: 'Invoices', rows, columns: ['id', 'customer', 'amount'], pageSize: 10 });
 *   return <Invoices />;
 *
 * Precedence: this config, then `defaults.table`, then the provider (size, tone), then the library default.
 */
export function useTable<T extends object>(input: TableConfig<T>): TableComponent {
  const ctx = usePinfold();
  const own = input as unknown as TableConfig<Record<string, unknown>>;
  const config = ctx.defaults.table ? mergeConfig<TableConfig<Record<string, unknown>>>(ctx.defaults.table as TableConfig<Record<string, unknown>>, own) : own;
  const base = useId();
  const rows = config.rows ?? [];
  const [sort, setSortState] = useControllableState<TableSort | null>({ value: config.sort, defaultValue: config.defaultSort ?? null });
  const [selected, setSelectedState] = useControllableState<readonly string[]>({ value: config.selected, defaultValue: config.defaultSelected ?? [] });
  const [page, setPageState] = useControllableState<number>({ value: config.page, defaultValue: config.defaultPage ?? 1 });
  const headerBox = React.useRef<HTMLInputElement | null>(null);

  if (process.env.NODE_ENV !== 'production') {
    void import('@pinfold/core/meta').then(({ tableMeta, validateConfig }) => {
      for (const problem of validateConfig(tableMeta, input)) warnOnce(true, problem.message);
      const inactive = inactiveTableOptions(config);
      for (const key in inactive) warnOnce((input as unknown as Record<string, unknown>)[key] !== undefined, `Table: \`${key}\` has no visible effect here. ${inactive[key]}`);
    });
    warnOnce(!config.label, 'Table: give it a `label`: it is the caption that names the table.');
  }

  const columns: Array<TableColumn<Record<string, unknown>>> = (config.columns ?? (rows[0] ? (Object.keys(rows[0]) as string[]) : [])).map((c) => (typeof c === 'string' ? { key: c } : c));
  const keyOf = (row: Record<string, unknown>, i: number) =>
    typeof config.rowKey === 'function' ? config.rowKey(row, i) : config.rowKey ? String(row[config.rowKey]) : row.id !== undefined ? String(row.id) : String(i);
  const sortColumn = sort ? columns.find((c) => c.key === sort.key) : undefined;
  const sorted = config.manualSort ? [...rows] : sortRows(rows, sort, sortColumn?.compare);
  const paged = config.pageSize !== undefined && config.total === undefined;
  const shown = paged ? sorted.slice((page - 1) * config.pageSize!, page * config.pageSize!) : sorted;
  const shownKeys = shown.map((row) => keyOf(row, rows.indexOf(row)));
  const selection = config.selection ?? 'none';
  const loading = !!config.loading;
  const state: TableState = { variant: config.variant ?? 'card', size: config.size ?? ctx.size, tone: config.tone ?? ctx.tone, density: config.density ?? 'normal', loading, sort };
  const boxState = selectionState(selected, shownKeys);

  React.useEffect(() => {
    if (headerBox.current) headerBox.current.indeterminate = boxState === 'some';
  });

  const setSort = (next: TableSort | null) => {
    setSortState(next);
    config.onSortChange?.(next);
  };
  const setSelected = (next: string[]) => {
    setSelectedState(next);
    config.onSelectionChange?.(next);
  };
  const toggle = (key: string) => {
    if (selection === 'single') return setSelected(selected.includes(key) ? [] : [key]);
    setSelected(selected.includes(key) ? selected.filter((k) => k !== key) : [...selected, key]);
  };

  const getRootProps = (props?: PropsBag): PropsBag =>
    mergeProps(
      {
        'data-variant': state.variant,
        'data-density': state.density,
        'data-size': state.size,
        'data-tone': state.tone,
        'data-striped': dataAttr(config.striped),
        'data-sticky': dataAttr(config.stickyHeader),
        'data-loading': dataAttr(loading),
        'data-animate': dataAttr(!ctx.disableAnimation),
        'data-unstyled': dataAttr(config.unstyled),
      },
      props,
    );

  const render = (rootProps?: TableRootProps): React.ReactElement => {
    const cls = (name: string) => (config.unstyled ? undefined : name);
    const slot = (name: TableSlot, content: React.ReactNode, tag: string, own: PropsBag = {}) =>
      renderSlot(config, name, slotProps(config, name, { className: cls(`pinfold-table__${name}`), ...own }), state, content, (p, c) => React.createElement(tag, p, c));
    const vars = dimensionVars('table', config.dimensions);
    const root = slotProps(
      config,
      'root',
      getRootProps(mergeProps({ className: config.unstyled ? config.className : cn('pinfold pinfold-table', config.className), style: vars || config.style ? { ...vars, ...config.style } : undefined }, rootProps)),
    );
    const span = columns.length + (selection === 'none' ? 0 : 1);
    const align = (c: TableColumn<Record<string, unknown>>) => (c.align && c.align !== 'start' ? c.align : undefined);
    const textOf = (row: Record<string, unknown>) => String(row[columns[0]?.key] ?? '');
    const head = slot(
      'head',
      <tr>
        {selection === 'none' ? null : (
          <th scope="col" className={cls('pinfold-table__select')}>
            {selection === 'multiple' ? (
              <input
                ref={headerBox}
                type="checkbox"
                aria-label={config.labels?.selectAll ?? 'Select all rows on this page'}
                checked={boxState === 'all'}
                disabled={!shownKeys.length}
                onChange={() => setSelected(boxState === 'all' ? selected.filter((k) => !shownKeys.includes(k)) : [...new Set([...selected, ...shownKeys])])}
              />
            ) : (
              <span style={VISUALLY_HIDDEN}>Select</span>
            )}
          </th>
        )}
        {columns.map((c) => {
          const active = sort?.key === c.key;
          const label = c.header ?? headerFromKey(c.key);
          return (
            <React.Fragment key={c.key}>
              {slot(
                'header',
                c.sortable ? (
                  slot('sort', <>{label}{SORT_ICON}</>, 'button', { type: 'button', 'data-direction': active ? sort!.direction : undefined, onClick: () => setSort(nextSort(sort, c.key)) })
                ) : (
                  label
                ),
                'th',
                { scope: 'col', 'aria-sort': active ? sort!.direction : c.sortable ? 'none' : undefined, 'data-align': align(c), style: c.width !== undefined ? { width: typeof c.width === 'number' ? `${c.width}px` : c.width } : undefined },
              )}
            </React.Fragment>
          );
        })}
      </tr>,
      'thead',
    );
    let bodyRows: React.ReactNode;
    if (!shown.length && loading)
      bodyRows = Array.from({ length: Math.min(config.pageSize ?? 5, 5) }, (_, i) => (
        <tr key={i} aria-hidden="true">
          {Array.from({ length: span }, (_, j) => (
            <td key={j} className={cls('pinfold-table__cell')}>
              {slot('loading', null, 'span')}
            </td>
          ))}
        </tr>
      ));
    else if (!shown.length)
      bodyRows = (
        <tr>
          {slot('empty', config.emptyText ?? 'Nothing to show', 'td', { colSpan: span })}
        </tr>
      );
    else
      bodyRows = shown.map((row, i) => {
        const key = shownKeys[i];
        const on = selected.includes(key);
        const action = config.onRowAction;
        return (
          <React.Fragment key={key}>
            {slot(
              'row',
              <>
                {selection === 'none' ? null : (
                  <td className={cls('pinfold-table__select')}>
                    <input
                      type={selection === 'single' ? 'radio' : 'checkbox'}
                      name={selection === 'single' ? `${base}-row` : undefined}
                      aria-label={config.labels?.selectRow ? config.labels.selectRow(textOf(row)) : `Select ${textOf(row)}`}
                      checked={on}
                      onChange={() => toggle(key)}
                      onClick={(event) => event.stopPropagation()}
                    />
                  </td>
                )}
                {columns.map((c) => (
                  <React.Fragment key={c.key}>{slot('cell', c.cell ? c.cell(row, i) : String(row[c.key] ?? ''), 'td', { 'data-align': align(c) })}</React.Fragment>
                ))}
              </>,
              'tr',
              {
                'aria-selected': selection === 'none' ? undefined : on,
                'data-selected': dataAttr(on),
                ...(action
                  ? {
                      tabIndex: 0,
                      'data-action': '',
                      onClick: (event: React.MouseEvent) => action(row, event),
                      onKeyDown: (event: React.KeyboardEvent) => {
                        if (event.key === 'Enter' && event.target === event.currentTarget) action(row, event);
                      },
                    }
                  : null),
              },
            )}
          </React.Fragment>
        );
      });
    const count = config.pageSize ? Math.ceil((config.total ?? rows.length) / config.pageSize) : 0;
    const content = (
      <>
        {slot(
          'scroll',
          slot(
            'table',
            <>
              {slot('caption', config.label, 'caption', config.hideLabel ? { style: VISUALLY_HIDDEN } : {})}
              {head}
              {slot('body', bodyRows, 'tbody')}
            </>,
            'table',
            { 'aria-busy': loading || undefined, 'aria-rowcount': config.total !== undefined ? config.total + 1 : undefined },
          ),
          'div',
          // Scrolls on its own when wider than the page; a keyboard user can reach it.
          { tabIndex: 0, role: 'region', 'aria-label': typeof config.label === 'string' ? config.label : 'Table' },
        )}
        {config.pageSize !== undefined && count > 1
          ? slot(
              'footer',
              <Pagination
                count={count}
                page={page}
                size="sm"
                variant="ghost"
                tone={state.tone}
                loading={loading}
                label={`${typeof config.label === 'string' ? config.label : 'Table'} pages`}
                onChange={(p) => {
                  setPageState(p);
                  config.onPageChange?.(p);
                }}
              />,
              'div',
            )
          : null}
      </>
    );
    return renderSlot(config, 'root', root, state, content, (p, c) => <div {...p}>{c}</div>) as React.ReactElement;
  };

  const api: TableApi = { visibleRows: shown, sort, selected, setSort: (s) => setSortState(s), setSelected: (k) => setSelectedState([...k]), getRootProps, render };
  return usePinfoldComponent<TableApi, TableRootProps>('Table', api, (props) => render(props));
}
