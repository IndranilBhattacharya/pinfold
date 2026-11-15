import * as React from 'react';
import { toText, type GridColumnType, type GridFilter, type GridFilterOp, type PinfoldTone } from '@pinfold/core';
import { CheckMark } from '../checkmark';
import { SubInput, SubSelect } from '../subcontrols';

/**
 * The table's built-in controls: a filter per column type, an editor per column type, and an input that
 * commits after typing pauses (filters and search on large data).
 */

type PausedInputProps = Omit<React.InputHTMLAttributes<HTMLInputElement>, 'value' | 'onChange' | 'type' | 'size'> & {
  value: string;
  onCommit: (v: string) => void;
  delay?: number;
  type?: 'text' | 'search' | 'number' | 'date';
  tone?: PinfoldTone;
  startContent?: React.ReactNode;
};

/** A Pinfold Input that keeps its own text and reports it after a pause (or at once on Enter). */
export function PausedInput({ value, onCommit, delay = 180, type, placeholder, className, tone, startContent, 'aria-label': ariaLabel, onKeyDown, ...rest }: PausedInputProps) {
  const [text, setText] = React.useState(value);
  const timer = React.useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  const last = React.useRef(value);
  // A new value from outside (cleared filters) replaces what is shown.
  if (value !== last.current) {
    last.current = value;
    if (value !== text) setText(value);
  }
  React.useEffect(() => () => clearTimeout(timer.current), []);
  const commit = (v: string) => {
    clearTimeout(timer.current);
    last.current = v;
    onCommit(v);
  };
  return (
    <SubInput
      label={ariaLabel ?? placeholder ?? ''}
      type={type}
      placeholder={placeholder}
      className={className}
      tone={tone}
      startContent={startContent}
      value={text}
      onChange={(v) => {
        setText(v);
        clearTimeout(timer.current);
        timer.current = setTimeout(() => commit(v), delay);
      }}
      inputProps={{
        ...rest,
        onKeyDown: (e: React.KeyboardEvent<HTMLInputElement>) => {
          if (e.key === 'Enter') commit(text);
          onKeyDown?.(e);
        },
      }}
    />
  );
}

export interface FilterControlProps {
  type: GridColumnType;
  tone?: PinfoldTone;
  label: string;
  filter: GridFilter | null;
  options: ReadonlyArray<{ value: string; label: string }>;
  setFilter: (value: unknown, op?: GridFilterOp) => void;
  className?: (name: string) => string | undefined;
  labels: { any: string; yes: string; no: string; from: string; to: string; placeholder: string };
}

/** The filter row's control for one column, by its type. */
/** Select rows cannot be empty strings: "any" is this value. */
const ANY = '\u0000any';

export function FilterControl({ type, tone, label, filter, options, setFilter, className, labels }: FilterControlProps): React.ReactElement {
  const cls = className ?? (() => undefined);
  const v = filter?.value;
  if (type === 'number' || type === 'date') {
    const [from, to] = Array.isArray(v) ? (v as unknown[]) : ['', ''];
    const kind = type === 'number' ? 'number' : 'date';
    const set = (a: unknown, b: unknown) => setFilter(a === '' && b === '' ? undefined : [a, b], 'between');
    return (
      <span className={cls('pinfold-table__range')}>
        <PausedInput type={kind} tone={tone} aria-label={`${label} ${labels.from}`} placeholder={type === 'number' ? labels.from : undefined} value={toText(from ?? '')} onCommit={(a) => set(a, to ?? '')} className={cls('pinfold-table__filterInput')} />
        <PausedInput type={kind} tone={tone} aria-label={`${label} ${labels.to}`} placeholder={type === 'number' ? labels.to : undefined} value={toText(to ?? '')} onCommit={(b) => set(from ?? '', b)} className={cls('pinfold-table__filterInput')} />
      </span>
    );
  }
  if (type === 'boolean' || type === 'enum') {
    const current = type === 'boolean' ? (v === undefined || v === null ? '' : String(v)) : Array.isArray(v) ? toText(v[0] ?? '') : toText(v ?? '');
    return (
      <SubSelect
        label={label}
        tone={tone}
        className={cls('pinfold-table__filterInput')}
        value={current || ANY}
        options={[{ value: ANY, label: labels.any }, ...(type === 'boolean' ? [{ value: 'true', label: labels.yes }, { value: 'false', label: labels.no }] : options)]}
        onChange={(next) => {
          if (next === ANY) setFilter(undefined);
          else if (type === 'boolean') setFilter(next === 'true', 'equals');
          else setFilter([next], 'in');
        }}
      />
    );
  }
  return <PausedInput type="search" tone={tone} aria-label={label} placeholder={labels.placeholder} className={cls('pinfold-table__filterInput')} value={toText(v ?? '')} onCommit={(t) => setFilter(t || undefined, 'contains')} />;
}

export interface EditorProps {
  type: GridColumnType;
  editor?: 'text' | 'number' | 'date' | 'select' | 'checkbox';
  label: string;
  value: unknown;
  options: ReadonlyArray<{ value: string; label: string }>;
  error: string | null;
  errorId: string;
  commit: (value: unknown) => void;
  cancel: () => void;
  className?: string;
  tone?: PinfoldTone;
}

/** A cell's editor by type: Enter or leaving saves, Escape cancels, focus starts in it. */
export function CellEditor({ type, editor, label, value, options, error, errorId, commit, cancel, className, tone }: EditorProps): React.ReactElement {
  const kind = editor ?? (type === 'number' ? 'number' : type === 'date' ? 'date' : type === 'boolean' ? 'checkbox' : type === 'enum' && options.length ? 'select' : 'text');
  const ref = React.useRef<HTMLInputElement & HTMLSelectElement>(null);
  const done = React.useRef(false);
  React.useEffect(() => {
    ref.current?.focus();
    if (ref.current && 'select' in ref.current && kind !== 'select' && kind !== 'checkbox') ref.current.select();
  }, [kind]);
  const read = (el: HTMLInputElement | HTMLSelectElement): unknown => {
    if (kind === 'checkbox') return (el as HTMLInputElement).checked;
    if (kind === 'number') return el.value === '' ? null : Number(el.value);
    return el.value;
  };
  const common = {
    ref,
    'aria-label': label,
    'aria-invalid': error ? true : undefined,
    'aria-describedby': error ? errorId : undefined,
    className,
    onKeyDown: (e: React.KeyboardEvent<HTMLInputElement | HTMLSelectElement>) => {
      e.stopPropagation();
      if (e.key === 'Enter') {
        e.preventDefault();
        done.current = true;
        commit(read(e.currentTarget));
      } else if (e.key === 'Escape') {
        e.preventDefault();
        done.current = true;
        cancel();
      }
    },
    onBlur: (e: React.FocusEvent<HTMLInputElement | HTMLSelectElement>) => {
      if (!done.current) commit(read(e.currentTarget));
      done.current = false;
    },
  };
  // A choice saves when picked; Escape, or leaving without a pick, cancels.
  if (kind === 'select')
    return (
      <span
        className="pinfold-table__editorSelect"
        onKeyDown={(e) => {
          e.stopPropagation();
          if (e.key === 'Escape' && !(e.target as HTMLElement).closest('[aria-expanded="true"]')) cancel();
        }}
        onBlur={(e) => {
          if (!e.currentTarget.contains(e.relatedTarget as Node | null)) cancel();
        }}
      >
        <SubSelect label={label} tone={tone} autoFocus value={toText(value)} options={options} onChange={(next) => commit(next)} />
      </span>
    );
  if (kind === 'checkbox') return <CheckMark {...common} tone={tone} defaultChecked={!!value} />;
  const text = kind === 'date' && typeof value === 'string' ? value.slice(0, 10) : value instanceof Date ? value.toISOString().slice(0, 10) : toText(value);
  return <input {...common} type={kind} defaultValue={text} />;
}
