import * as React from 'react';
import { fieldDescribedBy, type PropsBag } from '@pinfold/core';
import { VISUALLY_HIDDEN } from './a11y';
import { useId } from './hooks';

/** The options every form control shares. */
export interface FieldConfig {
  /** The visible name, and the accessible one. */
  label: React.ReactNode;
  /** @default false */
  hideLabel?: boolean;
  /** Help text, linked with `aria-describedby`. */
  description?: React.ReactNode;
  /** The error message: shows it, marks the control invalid and links it. */
  error?: React.ReactNode;
  /** @default false */
  invalid?: boolean;
  /** @default false */
  required?: boolean;
  /** @default false */
  disabled?: boolean;
  /**
   * Show the browser's validation message in place of its bubble.
   * @default true
   */
  nativeErrors?: boolean;
  /** The form field name. */
  name?: string;
  /** Id of the control. Generated without one. */
  id?: string;
}

export const filled = (node: React.ReactNode) => node != null && node !== false && node !== '';

/**
 * Field wiring shared by the form controls: ids, `aria-*`, and native validation shown in the
 * error slot. It stays out of the value: controls keep the native element as the source of truth,
 * so forms submit and reset without help.
 */
export function useField(config: FieldConfig) {
  const base = useId();
  const root = React.useRef<HTMLElement | null>(null);
  const [native, setNative] = React.useState<string | null>(null);
  const message = filled(config.error) ? config.error : native;
  const invalid = !!config.invalid || filled(message);
  const descriptionId = `${base}-description`;
  const errorId = `${base}-error`;
  const describedBy = fieldDescribedBy([filled(config.description) && descriptionId, filled(message) && errorId]);

  // A form reset puts the values back natively; the messages have to follow.
  React.useEffect(() => {
    const form = root.current?.closest('form');
    if (!form) return;
    const onReset = () => setNative(null);
    form.addEventListener('reset', onReset);
    return () => form.removeEventListener('reset', onReset);
  }, []);

  const onInvalid = (event: React.FormEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    if (config.nativeErrors === false) return;
    // Our message replaces the bubble. Cancelling also cancels the browser's focus move, so do it here.
    event.preventDefault();
    const el = event.currentTarget;
    setNative(el.validationMessage);
    // Controls only: a <fieldset> around an invalid control matches `:invalid` too.
    if (el.form?.querySelector('input:invalid, textarea:invalid, select:invalid') === el) el.focus();
  };
  /** After every edit: a field that became valid drops the browser's message. */
  const revalidate = (el: HTMLInputElement | HTMLTextAreaElement) => {
    if (native !== null && el.validity.valid) setNative(null);
  };

  return { base, root, message, invalid, descriptionId, errorId, describedBy, controlId: config.id ?? `${base}-control`, labelId: `${base}-label`, onInvalid, revalidate };
}

export type Field = ReturnType<typeof useField>;

/** The label's text: a marker for `required`, hidden from screen readers (the native attribute says it). */
export function labelContent(config: FieldConfig, unstyled: boolean | undefined): React.ReactNode {
  return (
    <>
      {config.label}
      {config.required ? (
        <span className={unstyled ? undefined : 'pinfold-field__required'} aria-hidden="true">
          {' *'}
        </span>
      ) : null}
    </>
  );
}

export const hiddenStyle = (hide: boolean | undefined): PropsBag => (hide ? { style: VISUALLY_HIDDEN } : {});

/* ---------------------------------------------------------------- choices */

export interface ChoiceRow {
  value?: string;
  label: React.ReactNode;
  description?: React.ReactNode;
  disabled?: boolean;
}

type Slot = (name: string, content: React.ReactNode, tag: string, base?: PropsBag) => React.ReactNode;

interface ChoiceOptions {
  slot: Slot;
  id: string;
  row: ChoiceRow;
  /** The box's insides: a check, a dot, a thumb. */
  indicator: React.ReactNode;
  input: PropsBag;
  labelText?: React.ReactNode;
  hideLabel?: boolean;
  /** Extra ids for `aria-describedby` (the field's own, on a single control). */
  describedBy?: string;
}

/**
 * A checkbox, radio or switch row. The native input is transparent and on top of the drawn box, so
 * focus, keyboard, forms and assistive tech are all the browser's. The whole row is the `<label>`,
 * but the input is named by the label text alone: the description is linked, not part of the name.
 */
export function renderChoice({ slot, id, row, indicator, input, labelText, hideLabel, describedBy }: ChoiceOptions): React.ReactNode {
  const labelId = `${id}-label`;
  const descriptionId = `${id}-description`;
  const hasDescription = filled(row.description);
  return slot(
    'item',
    <>
      <span className="pinfold-choice__control">
        {slot('input', null, 'input', {
          id,
          'aria-labelledby': labelId,
          'aria-describedby': fieldDescribedBy([hasDescription && descriptionId, describedBy]),
          disabled: row.disabled || undefined,
          ...input,
        })}
        {slot('box', indicator, 'span', { 'aria-hidden': true })}
        <span className="pinfold-choice__frame" aria-hidden="true" />
      </span>
      <span className="pinfold-choice__text">
        {slot('itemLabel', labelText ?? row.label, 'span', { id: labelId, ...hiddenStyle(hideLabel) })}
        {hasDescription ? slot('itemDescription', row.description, 'span', { id: descriptionId }) : null}
      </span>
    </>,
    'label',
    { htmlFor: id, 'data-disabled': row.disabled ? '' : undefined },
  );
}
