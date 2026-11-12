import * as React from 'react';
import { GRID_FILTER_OPS, foldText, toText, type GridColumnType, type GridDistinct, type GridFilter, type GridFilterOp } from '@pinfold/core';
import { restoreFocus, useFloating, useMounted, useOverlayLayer } from '../overlay';
import { PausedInput } from './parts';
import type { TableLabels } from './types';

/**
 * The table's floating panels: a column's menu (sort, pin, hide, filter by its values or by a
 * condition) and the columns panel. Each panel is its own instance: its state lives in the
 * component that renders it and is dropped when it closes.
 */

const svg = (d: string, extra?: React.ReactNode) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" focusable="false" aria-hidden="true">
    <path d={d} />
    {extra}
  </svg>
);
export const ICON = {
  up: svg('M12 19V5M5 12l7-7 7 7'),
  down: svg('M12 5v14M19 12l-7 7-7-7'),
  funnel: svg('M3 5h18l-7 8.5V19l-4 2v-7.5z'),
  more: svg('M12 5.5v.01M12 12v.01M12 18.5v.01'),
  pin: svg('M9 4h6l-1 6 3 3v2H7v-2l3-3zM12 15v6'),
  hide: svg('M3 3l18 18M10.6 6.2A9.8 9.8 0 0 1 12 6c5 0 8.5 4 9.5 6a13 13 0 0 1-2.7 3.4M6.5 7.6A13.3 13.3 0 0 0 2.5 12c1 2 4.5 6 9.5 6 1.3 0 2.5-.3 3.6-.7M9.9 9.900a3 3 0 0 0 4.2 4.2'),
  close: svg('M6 6l12 12M18 6 6 18'),
  search: svg('m20 20-3.5-3.5M17 11a6 6 0 1 1-12 0 6 6 0 0 1 12 0z'),
  columns: svg('M4 5h16v14H4zM9.3 5v14M14.7 5v14'),
  download: svg('M12 4v11M7 10.5l5 5 5-5M5 20h14'),
  group: svg('M4 6h16M4 12h10M4 18h6'),
  grip: svg('M9 6v.01M15 6v.01M9 12v.01M15 12v.01M9 18v.01M15 18v.01'),
};

const OP_LABEL: Record<GridFilterOp, string> = {
  contains: 'contains',
  notContains: 'does not contain',
  equals: 'is',
  notEquals: 'is not',
  startsWith: 'starts with',
  endsWith: 'ends with',
  lt: 'less than',
  lte: 'at most',
  gt: 'greater than',
  gte: 'at least',
  between: 'between',
  in: 'is any of',
  notIn: 'is none of',
  empty: 'is empty',
  notEmpty: 'is not empty',
};

export interface FloatingPanelProps {
  open: boolean;
  /** The element the panel hangs from. */
  anchor: () => Element | null;
  onClose: () => void;
  label: string;
  className?: string;
  placement?: 'bottom-start' | 'bottom-end';
  children: React.ReactNode;
}

/** A small non-modal dialog next to its anchor: Escape and outside presses close it, focus returns. */
export function FloatingPanel({ open, anchor, onClose, label, className, placement = 'bottom-start', children }: FloatingPanelProps): React.ReactElement | null {
  const ref = React.useRef<HTMLDivElement | null>(null);
  const mounted = useMounted();
  useFloating({ open, anchor, floating: ref, placement, offset: 6 });
  useOverlayLayer(
    open,
    (node) => !!ref.current?.contains(node) || !!anchor()?.contains(node),
    () => {
      onClose();
      restoreFocus(anchor(), ref.current);
    },
    onClose,
  );
  React.useEffect(() => {
    if (!open) return;
    // Focus the first control, so the keyboard lands inside what just opened.
    ref.current?.querySelector<HTMLElement>('input, button, select, [tabindex="0"]')?.focus({ preventScroll: true });
  }, [open]);
  if (!open || !mounted) return null;
  return (
    <div ref={ref} role="dialog" aria-label={label} className={className} data-pinfold-floating="">
      {children}
    </div>
  );
}

export interface ColumnMenuProps {
  title: string;
  type: GridColumnType;
  cls: (name: string) => string | undefined;
  labels: TableLabels;
  /** The header cell: the panel hangs from it. */
  anchor: () => Element | null;
  open: boolean;
  onClose: () => void;
  sort: 'ascending' | 'descending' | null;
  onSort?: (direction: 'ascending' | 'descending' | null) => void;
  pinned: 'start' | 'end' | undefined;
  onPin?: (pin: 'start' | 'end' | undefined) => void;
  onHide?: () => void;
  grouped?: boolean;
  onGroup?: (on: boolean) => void;
  filter: GridFilter | null;
  /** Set this column's filter; `undefined` clears it. Absent: the column does not filter. */
  setFilter?: (value: unknown, op?: GridFilterOp) => void;
  /** The column's distinct values over the rows the other filters let through. */
  values?: () => GridDistinct[];
  /** A value drawn the way its cell draws it. */
  renderValue?: (item: GridDistinct) => React.ReactNode;
  /** Your own filter control in place of the built-in one. */
  custom?: React.ReactNode;
}

const MAX_VALUES = 400;

/** One column's menu. */
export function ColumnMenu(props: ColumnMenuProps): React.ReactElement | null {
  const { title, cls, labels: L, open, onClose } = props;
  return (
    <FloatingPanel open={open} anchor={props.anchor} onClose={onClose} label={L.columnMenu ? L.columnMenu(title) : `${title} column`} className={cls('pinfold-table__menu')}>
      {open ? <MenuBody {...props} /> : null}
    </FloatingPanel>
  );
}

function MenuBody({ title, type, cls, labels: L, onClose, sort, onSort, pinned, onPin, onHide, grouped, onGroup, filter, setFilter, values, renderValue, custom }: ColumnMenuProps): React.ReactElement {
  const item = (icon: React.ReactNode, text: string, onClick: () => void, pressed?: boolean, keep?: boolean) => (
    <button
      type="button"
      className={cls('pinfold-table__menuItem')}
      aria-pressed={pressed}
      data-active={pressed ? '' : undefined}
      onClick={() => {
        onClick();
        if (!keep) onClose();
      }}
    >
      <span className={cls('pinfold-table__menuIcon')}>{icon}</span>
      {text}
    </button>
  );
  const numeric = type === 'number' || type === 'date';
  return (
    <>
      {onSort ? (
        <div role="group" aria-label={L.sort ?? 'Sort'} className={cls('pinfold-table__menuGroup')}>
          {item(ICON.up, L.sortAscending ?? (numeric ? 'Sort low to high' : 'Sort A to Z'), () => onSort(sort === 'ascending' ? null : 'ascending'), sort === 'ascending')}
          {item(ICON.down, L.sortDescending ?? (numeric ? 'Sort high to low' : 'Sort Z to A'), () => onSort(sort === 'descending' ? null : 'descending'), sort === 'descending')}
        </div>
      ) : null}
      {onPin || onHide || onGroup ? (
        <div role="group" aria-label={title} className={cls('pinfold-table__menuGroup')}>
          {onPin ? item(ICON.pin, pinned === 'start' ? L.unpin ?? 'Unpin' : L.pinStart ?? 'Pin to the start', () => onPin(pinned === 'start' ? undefined : 'start'), pinned === 'start') : null}
          {onPin ? item(ICON.pin, pinned === 'end' ? L.unpin ?? 'Unpin' : L.pinEnd ?? 'Pin to the end', () => onPin(pinned === 'end' ? undefined : 'end'), pinned === 'end') : null}
          {onGroup ? item(ICON.group, grouped ? L.ungroup ?? 'Stop grouping' : L.groupBy ?? 'Group by this column', () => onGroup(!grouped), grouped) : null}
          {onHide ? item(ICON.hide, L.hideColumn ?? 'Hide column', onHide) : null}
        </div>
      ) : null}
      {setFilter ? (
        <div role="group" aria-label={L.filter ? L.filter(title) : `Filter ${title}`} className={cls('pinfold-table__menuFilter')}>
          {custom ?? <FilterBody type={type} title={title} cls={cls} labels={L} filter={filter} setFilter={setFilter} values={values} renderValue={renderValue} />}
          {filter ? (
            <button type="button" className={cls('pinfold-table__menuClear')} onClick={() => setFilter(undefined)}>
              {L.clearFilter ?? 'Clear filter'}
            </button>
          ) : null}
        </div>
      ) : null}
    </>
  );
}

interface FilterBodyProps extends Pick<ColumnMenuProps, 'type' | 'title' | 'cls' | 'labels' | 'filter' | 'values' | 'renderValue'> {
  setFilter: (value: unknown, op?: GridFilterOp) => void;
}

/** A condition (by type) over a searchable list of the column's values with checkboxes. */
function FilterBody({ type, title, cls, labels: L, filter, setFilter, values, renderValue }: FilterBodyProps): React.ReactElement {
  const [query, setQuery] = React.useState('');
  // Read once per opening: the list must not reshuffle while boxes are being ticked.
  const all = React.useMemo(() => (values ? values() : []), []); // eslint-disable-line react-hooks/exhaustive-deps
  const listed = filter && (filter.op === 'in' || (filter.op === undefined && Array.isArray(filter.value))) ? new Set((filter.value as unknown[]).map((v) => foldText(toText(v)))) : null;
  const excluded = filter?.op === 'notIn' ? new Set((filter.value as unknown[]).map((v) => foldText(toText(v)))) : null;
  const isOn = (d: GridDistinct) => (listed ? listed.has(foldText(d.key)) : excluded ? !excluded.has(foldText(d.key)) : !filter || filter.op === 'in');
  const q = foldText(query.trim());
  const text = (d: GridDistinct) => (d.key === '' ? L.blanks ?? '(Blanks)' : toText(d.value));
  const shown = q ? all.filter((d) => foldText(text(d)).includes(q) || foldText(d.key).includes(q)) : all;
  const visible = shown.slice(0, MAX_VALUES);
  const commit = (on: Set<string>) => {
    // Everything ticked is no filter at all.
    if (all.every((d) => on.has(d.key))) setFilter(undefined);
    else setFilter(all.filter((d) => on.has(d.key)).map((d) => d.key), 'in');
  };
  const current = () => new Set(all.filter(isOn).map((d) => d.key));
  const allOn = shown.length > 0 && shown.every(isOn);
  const someOn = shown.some(isOn);
  const head = React.useRef<HTMLInputElement | null>(null);
  React.useEffect(() => {
    if (head.current) head.current.indeterminate = someOn && !allOn;
  });

  const ops = GRID_FILTER_OPS[type].filter((o) => o !== 'in' && o !== 'notIn');
  const conditional = !!filter && !listed && !excluded;
  const op: GridFilterOp = conditional ? filter!.op ?? ops[0] : ops[0];
  const input = type === 'number' ? 'number' : type === 'date' ? 'date' : 'text';
  const [a, b] = conditional ? (Array.isArray(filter!.value) ? (filter!.value as unknown[]) : [filter!.value, '']) : ['', ''];
  const setCondition = (nextOp: GridFilterOp, first: unknown, second: unknown) => {
    if (nextOp === 'empty' || nextOp === 'notEmpty') return setFilter(true, nextOp);
    if (nextOp === 'between') return setFilter(first === '' && second === '' ? undefined : [first, second], nextOp);
    setFilter(first === '' || first === undefined ? undefined : type === 'boolean' ? first === 'true' : first, nextOp);
  };
  const label = L.filter ? L.filter(title) : `Filter ${title}`;

  return (
    <>
      {type !== 'boolean' && type !== 'enum' ? (
        <div className={cls('pinfold-table__menuCondition')}>
          <select aria-label={`${label}: ${L.condition ?? 'condition'}`} className={cls('pinfold-table__filterInput')} value={op} onChange={(e) => setCondition(e.target.value as GridFilterOp, a ?? '', b ?? '')}>
            {ops.map((o) => (
              <option key={o} value={o}>
                {L.operators?.[o] ?? OP_LABEL[o]}
              </option>
            ))}
          </select>
          {op === 'empty' || op === 'notEmpty' ? null : (
            <PausedInput type={input} aria-label={`${label}: ${L.value ?? 'value'}`} placeholder={L.value ?? 'Value'} className={cls('pinfold-table__filterInput')} value={toText(a ?? '')} onCommit={(v) => setCondition(op, v, b ?? '')} />
          )}
          {op === 'between' ? (
            <PausedInput type={input} aria-label={`${label}: ${L.to ?? 'to'}`} placeholder={L.to ?? 'to'} className={cls('pinfold-table__filterInput')} value={toText(b ?? '')} onCommit={(v) => setCondition(op, a ?? '', v)} />
          ) : null}
        </div>
      ) : null}
      {values ? (
        <>
          {all.length > 8 ? (
            <input type="search" aria-label={`${L.searchValues ?? 'Search values'}: ${title}`} placeholder={L.searchValues ?? 'Search values'} className={cls('pinfold-table__filterInput')} value={query} onChange={(e) => setQuery(e.target.value)} />
          ) : null}
          <label className={cls('pinfold-table__menuValue')} data-all="">
            <input
              ref={head}
              type="checkbox"
              checked={allOn}
              disabled={!shown.length}
              onChange={() => {
                const on = current();
                for (const d of shown) (allOn ? on.delete(d.key) : on.add(d.key));
                commit(on);
              }}
            />
            <span>{q ? L.selectResults ?? 'Select all results' : L.selectAllValues ?? 'Select all'}</span>
            <span className={cls('pinfold-table__menuCount')}>{shown.length}</span>
          </label>
          <div className={cls('pinfold-table__menuValues')} role="group" aria-label={L.values ?? 'Values'} tabIndex={-1}>
            {visible.map((d) => (
              <label key={d.key} className={cls('pinfold-table__menuValue')}>
                <input
                  type="checkbox"
                  checked={isOn(d)}
                  onChange={() => {
                    const on = current();
                    if (on.has(d.key)) on.delete(d.key);
                    else on.add(d.key);
                    commit(on);
                  }}
                />
                <span className={cls('pinfold-table__menuValueText')}>{d.key === '' ? L.blanks ?? '(Blanks)' : renderValue ? renderValue(d) : toText(d.value)}</span>
                <span className={cls('pinfold-table__menuCount')}>{d.count}</span>
              </label>
            ))}
            {!shown.length ? <p className={cls('pinfold-table__menuNone')}>{L.noValues ?? 'No values match'}</p> : null}
            {shown.length > visible.length ? <p className={cls('pinfold-table__menuNone')}>{L.moreValues ? L.moreValues(shown.length - visible.length) : `${shown.length - visible.length} more: search to narrow`}</p> : null}
          </div>
        </>
      ) : null}
    </>
  );
}

export interface ColumnsPanelProps {
  cls: (name: string) => string | undefined;
  labels: TableLabels;
  anchor: () => Element | null;
  open: boolean;
  onClose: () => void;
  columns: ReadonlyArray<{ key: string; title: string; hidden: boolean; locked: boolean; pinned: 'start' | 'end' | undefined }>;
  onToggle: (key: string, shown: boolean) => void;
  onPin: (key: string, pin: 'start' | 'end' | undefined) => void;
  onReset?: () => void;
}

/** Show, hide and pin columns from the toolbar. */
export function ColumnsPanel({ cls, labels: L, anchor, open, onClose, columns, onToggle, onPin, onReset }: ColumnsPanelProps): React.ReactElement | null {
  const [query, setQuery] = React.useState('');
  const q = foldText(query.trim());
  const shown = q ? columns.filter((c) => foldText(c.title).includes(q)) : columns;
  return (
    <FloatingPanel open={open} anchor={anchor} onClose={onClose} label={L.columns ?? 'Columns'} placement="bottom-end" className={cls('pinfold-table__menu')}>
      {columns.length > 8 ? <input type="search" aria-label={L.searchColumns ?? 'Search columns'} placeholder={L.searchColumns ?? 'Search columns'} className={cls('pinfold-table__filterInput')} value={query} onChange={(e) => setQuery(e.target.value)} /> : null}
      <div className={cls('pinfold-table__menuValues')} role="group" aria-label={L.columns ?? 'Columns'}>
        {shown.map((c) => (
          <div key={c.key} className={cls('pinfold-table__menuValue')}>
            <label>
              <input type="checkbox" checked={!c.hidden} disabled={c.locked} onChange={(e) => onToggle(c.key, e.target.checked)} />
              <span className={cls('pinfold-table__menuValueText')}>{c.title}</span>
            </label>
            {(['start', 'end'] as const).map((side) => (
              <button
                key={side}
                type="button"
                className={cls('pinfold-table__menuPin')}
                data-side={side}
                aria-pressed={c.pinned === side}
                aria-label={`${side === 'start' ? L.pinStart ?? 'Pin to the start' : L.pinEnd ?? 'Pin to the end'}: ${c.title}`}
                title={side === 'start' ? L.pinStart ?? 'Pin to the start' : L.pinEnd ?? 'Pin to the end'}
                onClick={() => onPin(c.key, c.pinned === side ? undefined : side)}
              >
                {ICON.pin}
              </button>
            ))}
          </div>
        ))}
      </div>
      {onReset ? (
        <button type="button" className={cls('pinfold-table__menuClear')} onClick={onReset}>
          {L.resetColumns ?? 'Reset columns'}
        </button>
      ) : null}
    </FloatingPanel>
  );
}
