import * as React from 'react';
import { cn, type PinfoldSize, type PinfoldTone, type PropsBag, type RadiusOption } from '@pinfold/core';

/*
 * Pinfold controls that other components render inside themselves: the rows-per-page select of a
 * pagination, a table's filter condition and values. Each is the real component (Select, Input), so it
 * looks and behaves like every other field and follows the size, tone, radius and style pack.
 *
 * Select and Input load on first use: an app whose pagination never offers page sizes, or whose table
 * never shows a filter, never downloads them. Until the chunk arrives a box of the same height holds the
 * place (on the server too), so nothing moves when it does.
 */

type LazySelectProps = { config: Record<string, unknown>; autoFocus?: boolean };
const LazySelect = React.lazy(() =>
  import('./select/useSelect').then((m) => ({
    default: function SubSelectField({ config, autoFocus }: LazySelectProps) {
      const api = m.useSelect(config as never);
      React.useEffect(() => {
        if (autoFocus) api.focus();
        // Once, as it arrives: focus is not taken back on later renders.
        // eslint-disable-next-line react-hooks/exhaustive-deps
      }, []);
      return api.render();
    },
  })),
);
type Loose = React.ComponentType<Record<string, unknown>>;
const LazyInput = React.lazy(() => import('./input/Input').then((m) => ({ default: m.Input as unknown as Loose })));
const LazyNumber = React.lazy(() => import('./number/NumberField').then((m) => ({ default: m.NumberField as unknown as Loose })));
const LazyDate = React.lazy(() => import('./datepicker/DatePicker').then((m) => ({ default: m.DatePicker as unknown as Loose })));

/** What a `render` override of a sub-control gets as `item`. */
export interface SubControlContext<V = string> {
  /** The current value. */
  value: V;
  /** The choices, for a select. */
  options: ReadonlyArray<{ value: V; label: string }>;
  /** Report a new value. */
  onChange: (value: V, event?: React.SyntheticEvent) => void;
}

interface Shared {
  /** The control's accessible name (its label is visually hidden). */
  label: string;
  size?: PinfoldSize;
  tone?: PinfoldTone;
  radius?: RadiusOption;
  disabled?: boolean;
  className?: string;
}

const Placeholder = ({ className, size, text }: { className?: string; size?: PinfoldSize; text: string }) => (
  <span className={cn('pinfold-subcontrol', className)} data-size={size} aria-hidden="true">
    {text}
  </span>
);

export interface SubSelectProps extends Shared {
  value: string;
  options: ReadonlyArray<{ value: string; label: string }>;
  onChange: (value: string, event?: React.SyntheticEvent) => void;
  /** Focus the field as it arrives (an editor). */
  autoFocus?: boolean;
}

/** A Pinfold Select with a hidden label, sized for a bar or a menu. */
export function SubSelect({ label, value, options, onChange, size = 'sm', tone, radius, disabled, className, autoFocus }: SubSelectProps): React.ReactElement {
  const text = options.find((o) => o.value === value)?.label ?? value;
  return (
    <React.Suspense fallback={<Placeholder className={className} size={size} text={text} />}>
      <LazySelect
        autoFocus={autoFocus}
        config={{
          label,
          hideLabel: true,
          items: options,
          value,
          onChange: (next: string | null, event?: React.SyntheticEvent) => {
            if (next !== null) onChange(next, event);
          },
          size,
          tone,
          radius,
          disabled,
          className,
        }}
      />
    </React.Suspense>
  );
}

export interface SubInputProps extends Shared {
  value: string;
  onChange: (value: string, event?: React.SyntheticEvent) => void;
  type?: 'text' | 'search' | 'number' | 'date';
  placeholder?: string;
  /** Extra attributes and handlers for the native input (min, max, inputMode, onKeyDown, onBlur…). */
  inputProps?: PropsBag;
  /** An icon at the start of the field. */
  startContent?: React.ReactNode;
}

/** A Pinfold field with a hidden label: a NumberField for a number, a DatePicker for a date (ISO text), else an Input. */
export function SubInput({ label, value, onChange, type = 'text', placeholder, inputProps, startContent, size = 'sm', tone, radius, disabled, className }: SubInputProps): React.ReactElement {
  const { min, max, ...rest } = inputProps ?? {};
  const shared = { label, hideLabel: true, placeholder, size, tone, radius, disabled, className, slotProps: Object.keys(rest).length ? { input: rest } : undefined };
  return (
    <React.Suspense fallback={<Placeholder className={className} size={size} text={value || placeholder || ''} />}>
      {type === 'number' ? (
        <LazyNumber
          {...shared}
          value={value === '' || !Number.isFinite(Number(value)) ? null : Number(value)}
          onChange={(next: number | null, event?: React.SyntheticEvent) => onChange(next === null ? '' : String(next), event)}
          steppers="none"
          min={typeof min === 'number' ? min : undefined}
          max={typeof max === 'number' ? max : undefined}
        />
      ) : type === 'date' ? (
        <LazyDate {...shared} value={value || null} onChange={(next: string | null) => onChange(next ?? '')} />
      ) : (
        <LazyInput {...shared} type={type} value={value} startContent={startContent} onChange={(next: string, event?: React.SyntheticEvent) => onChange(next, event)} />
      )}
    </React.Suspense>
  );
}
