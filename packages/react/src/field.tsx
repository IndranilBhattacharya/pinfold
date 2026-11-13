import * as React from 'react';
import { fieldDescribedBy, type PropsBag } from '@pinfold/core';
import { VISUALLY_HIDDEN } from './a11y';
import { useId } from './hooks';
import { ToneIcon } from './icons';

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

/* ------------------------------------------------------------ validation */

/** The tone of a field's message: an error blocks the form; a warning or a success only informs. */
export type FieldStatus = 'error' | 'warning' | 'success';

/**
 * What `validate` returns: a message (an error), nothing (valid), or a message with its own status,
 * e.g. `{ status: 'warning', message: 'Weak password' }`.
 */
export type FieldValidateOutcome = string | null | undefined | false | { status: FieldStatus; message: React.ReactNode };

/** What `onValidate` receives after every validation run. */
export interface FieldValidationResult<V = unknown> {
  /** No error (a warning or a success is still valid). */
  valid: boolean;
  status: FieldStatus | null;
  message: React.ReactNode | null;
  /** The value that was checked. */
  value: V;
}

/** The state an `error` function receives. */
export interface FieldErrorState {
  /** The message validation produced (your `validate`, or the browser's), or null. */
  message: React.ReactNode | null;
  /** An async `validate` is running. */
  validating: boolean;
  status: FieldStatus | null;
}

/**
 * Your own text for the browser's constraint messages, for translation: a string, or a function of
 * the native element (`(el) => 'At least ' + el.min`).
 */
export interface FieldMessages {
  required?: string | ((el: HTMLInputElement) => string);
  type?: string | ((el: HTMLInputElement) => string);
  pattern?: string | ((el: HTMLInputElement) => string);
  min?: string | ((el: HTMLInputElement) => string);
  max?: string | ((el: HTMLInputElement) => string);
  minLength?: string | ((el: HTMLInputElement) => string);
  maxLength?: string | ((el: HTMLInputElement) => string);
  step?: string | ((el: HTMLInputElement) => string);
  badInput?: string | ((el: HTMLInputElement) => string);
}

/** Validation options shared by input, number field, one-time code, checkbox, radio, switch and slider. */
export interface FieldValidationConfig<V> {
  /**
   * The error message: shows it, marks the control invalid and links it. A function receives the
   * message validation produced, so you can wrap or replace it.
   */
  error?: React.ReactNode | ((state: FieldErrorState) => React.ReactNode);
  /**
   * Your check: return a message for an error, nothing when valid, or `{ status, message }` for a
   * warning or a success. May return a promise; a newer run makes an older result stale, and it is
   * dropped. An error is also set as the native custom validity, so a plain `<form>` will not submit.
   */
  validate?: (value: V) => FieldValidateOutcome | Promise<FieldValidateOutcome>;
  /**
   * When results show: `change` as you type, `blur` when the field is left after an edit (then live
   * while it shows an error), `submit` when the form is submitted or `validate()` is called.
   * @default 'blur'
   */
  validateOn?: 'change' | 'blur' | 'submit';
  /** Your text for the browser's constraint messages, for translation. */
  messages?: FieldMessages;
  /** After every validation run: `{ valid, status, message, value }`. */
  onValidate?: (result: FieldValidationResult<V>) => void;
  /** The browser refused to submit the form because of this field: `(message, event)`. */
  onInvalid?: (message: string, event: React.FormEvent<HTMLElement>) => void;
  /** A helper state for the description and frame: `warning` and `success` tone it; `error` marks it invalid. */
  status?: FieldStatus;
}

/** The controller methods every validated control adds. */
export interface FieldValidationApi {
  /** Run the browser's checks and `validate` now, show the result, and resolve to whether it is valid. */
  validate: () => Promise<boolean>;
  /** Show an error from elsewhere (a server reply). It blocks native submit until cleared or edited. */
  setError: (message: React.ReactNode) => void;
  /** Remove the errors set with `setError` and by validation. */
  clearError: () => void;
}

type Native = HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement;

const isThenable = (v: unknown): v is PromiseLike<unknown> => !!v && typeof (v as PromiseLike<unknown>).then === 'function';

const normalize = (out: FieldValidateOutcome): { status: FieldStatus; message: React.ReactNode } | null => {
  if (out == null || out === false || out === '') return null;
  if (typeof out === 'object' && 'status' in out) return filled(out.message) || out.status === 'error' ? out : null;
  return { status: 'error', message: out as React.ReactNode };
};

const asText = (message: React.ReactNode): string => (typeof message === 'string' || typeof message === 'number' ? String(message) : 'Invalid value');

/** The browser's message for a native element, or the `messages` override for the first failing constraint. */
export function nativeMessage(el: Native, messages?: FieldMessages): string | null {
  const v = el.validity;
  if (!v || v.valid) return null;
  const pick = (key: keyof FieldMessages): string | null => {
    const m = messages?.[key];
    if (m === undefined) return el.validationMessage || null;
    return typeof m === 'function' ? m(el as HTMLInputElement) : m;
  };
  if (v.valueMissing) return pick('required');
  if (v.typeMismatch) return pick('type');
  if (v.patternMismatch) return pick('pattern');
  if (v.rangeUnderflow) return pick('min');
  if (v.rangeOverflow) return pick('max');
  if (v.tooShort) return pick('minLength');
  if (v.tooLong) return pick('maxLength');
  if (v.stepMismatch) return pick('step');
  if (v.badInput) return pick('badInput');
  // Only our own custom validity: validation state already shows it.
  return null;
}

export interface UseFieldOptions {
  /** The value `validate` checks, read when it runs. */
  value?: () => unknown;
  /** The native element that carries the custom validity (default: the first control in the root). */
  control?: () => Native | null | undefined;
}

export const filled = (node: React.ReactNode) => node != null && node !== false && node !== '';

/**
 * Field wiring shared by the form controls: ids, `aria-*`, and native validation shown in the
 * error slot. It stays out of the value: controls keep the native element as the source of truth,
 * so forms submit and reset without help.
 *
 * With `FieldValidationConfig` options it also runs `validate` (sync or async, stale results
 * dropped), keeps the native custom validity in step so a plain form blocks submit, and shows
 * results when `validateOn` says. Without them it behaves exactly as before.
 */
export function useField(config: FieldConfig | (Omit<FieldConfig, 'error'> & FieldValidationConfig<any>), options?: UseFieldOptions) {
  const base = useId();
  const root = React.useRef<HTMLElement | null>(null);
  const [native, setNative] = React.useState<string | null>(null);
  const [result, setResult] = React.useState<{ status: FieldStatus; message: React.ReactNode } | null>(null);
  const [manual, setManual] = React.useState<React.ReactNode>(null);
  const [validating, setValidating] = React.useState(false);
  const [shown, setShown] = React.useState(false);
  const v = config as Omit<FieldConfig, 'error'> & FieldValidationConfig<unknown>;
  const mode = v.validateOn ?? 'blur';
  const seq = React.useRef(0);
  const dirty = React.useRef(false);
  const asyncSeen = React.useRef(false);
  const mounted = React.useRef(true);
  const latest = React.useRef({ v, manual, result });
  latest.current = { v, manual, result };
  React.useEffect(() => {
    mounted.current = true;
    return () => {
      mounted.current = false;
    };
  }, []);

  const control = (): Native | null =>
    options?.control?.() ?? (root.current?.querySelector('input, textarea, select') as Native | null) ?? null;
  const readValue = () => (options?.value ? options.value() : (control() as HTMLInputElement | null)?.value);

  /** The custom validity follows the manual error, then the validate error. */
  const syncValidity = (nextManual: React.ReactNode, nextResult: typeof result) => {
    const el = control();
    if (!el || typeof el.setCustomValidity !== 'function') return;
    if (filled(nextManual)) el.setCustomValidity(asText(nextManual));
    else if (nextResult?.status === 'error') el.setCustomValidity(asText(nextResult.message));
    else el.setCustomValidity('');
  };

  const finish = (out: FieldValidateOutcome, value: unknown) => {
    const next = normalize(out);
    setResult(next);
    syncValidity(latest.current.manual, next);
    latest.current.v.onValidate?.({ valid: next?.status !== 'error', status: next?.status ?? null, message: next?.message ?? null, value });
    return next;
  };

  /** One validation run. `quiet` skips async validators (they run only when their result shows). */
  const run = (quiet: boolean): Promise<{ status: FieldStatus; message: React.ReactNode } | null> | { status: FieldStatus; message: React.ReactNode } | null => {
    const check = latest.current.v.validate;
    if (!check) return null;
    if (quiet && asyncSeen.current) return latest.current.result;
    const id = ++seq.current;
    const value = readValue();
    let out: FieldValidateOutcome | Promise<FieldValidateOutcome>;
    try {
      out = check(value);
    } catch (e) {
      out = e instanceof Error ? e.message : String(e);
    }
    if (!isThenable(out)) {
      setValidating(false);
      return finish(out, value);
    }
    asyncSeen.current = true;
    setValidating(true);
    const done = (o: FieldValidateOutcome) => {
      // A newer run, a reset or an unmount made this one stale.
      if (id !== seq.current || !mounted.current) return latest.current.result;
      setValidating(false);
      return finish(o, value);
    };
    return Promise.resolve(out).then(done, (e: unknown) => done(e instanceof Error ? e.message : String(e)));
  };

  const errorMessage = filled(manual) ? manual : result?.status === 'error' && shown && v.validate ? result.message : native;
  const statusMessage = !filled(errorMessage) && shown && result && v.validate && result.status !== 'error' ? result.message : null;
  const raw = v.error;
  const resolved = typeof raw === 'function' ? (raw as (s: FieldErrorState) => React.ReactNode)({ message: errorMessage ?? null, validating, status: filled(errorMessage) ? 'error' : result?.status ?? null }) : raw;
  const message = filled(resolved) ? resolved : typeof raw === 'function' ? null : errorMessage;
  const invalid = !!config.invalid || filled(message) || v.status === 'error';
  const status: FieldStatus | null = invalid ? 'error' : shown && result && v.validate ? result.status : v.status ?? null;
  /** The text under the control: the error, or a warning or success from `validate`. */
  const line = filled(message) ? message : statusMessage;
  const descriptionId = `${base}-description`;
  const errorId = `${base}-error`;
  const describedBy = fieldDescribedBy([filled(config.description) && descriptionId, filled(line) && errorId]);

  // A form reset puts the values back natively; the messages have to follow. A submit shows the
  // results `validateOn: 'submit'` kept back.
  React.useEffect(() => {
    const form = root.current?.closest('form');
    if (!form) return;
    const onReset = () => {
      seq.current++;
      dirty.current = false;
      setNative(null);
      setResult(null);
      setManual(null);
      setValidating(false);
      setShown(false);
      const el = control();
      if (el && typeof el.setCustomValidity === 'function') el.setCustomValidity('');
    };
    const onSubmit = () => setShown(true);
    form.addEventListener('reset', onReset);
    form.addEventListener('submit', onSubmit);
    return () => {
      form.removeEventListener('reset', onReset);
      form.removeEventListener('submit', onSubmit);
    };
  }, []);

  const onInvalid = (event: React.FormEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const el = event.currentTarget;
    setShown(true);
    v.onInvalid?.(nativeMessage(el, v.messages) ?? el.validationMessage, event as React.FormEvent<HTMLElement>);
    if (config.nativeErrors === false) return;
    // Our message replaces the bubble. Cancelling also cancels the browser's focus move, so do it here.
    event.preventDefault();
    setNative(nativeMessage(el, v.messages) ?? (el.validity.customError && !v.validate && !filled(latest.current.manual) ? el.validationMessage : null));
    // Controls only: a <fieldset> around an invalid control matches `:invalid` too.
    if (el.form?.querySelector('input:invalid, textarea:invalid, select:invalid') === el) el.focus();
  };
  /** After every edit: a field that became valid drops the browser's message; `validate` runs per `validateOn`. */
  const revalidate = (el: HTMLInputElement | HTMLTextAreaElement) => {
    dirty.current = true;
    if (filled(manual)) {
      // An edit answers an error set from elsewhere.
      setManual(null);
      syncValidity(null, latest.current.result);
    }
    if (native !== null) setNative(el.validity.valid || (el.validity.customError && !nativeMessage(el, v.messages)) ? null : nativeMessage(el, v.messages) ?? null);
    if (!v.validate) return;
    const live = mode === 'change' || (shown && filled(errorMessage));
    if (live) setShown(true);
    void run(!live);
  };
  /** Leaving the field after an edit shows its results (`validateOn: 'blur'`). */
  const onBlur = (el?: Native | null) => {
    if (!dirty.current || mode === 'submit') return;
    setShown(true);
    const target = el ?? control();
    if (target && config.nativeErrors !== false) setNative(nativeMessage(target, v.messages));
    if (v.validate) void run(false);
  };
  /** The controller's `validate()`. */
  const validateNow = async (): Promise<boolean> => {
    setShown(true);
    const el = control();
    const nat = el && config.nativeErrors !== false ? nativeMessage(el, v.messages) : null;
    setNative(nat);
    const out = await run(false);
    return !nat && out?.status !== 'error' && !filled(latest.current.manual) && !config.invalid;
  };
  const api: FieldValidationApi = {
    validate: validateNow,
    setError: (msg) => {
      setManual(msg);
      syncValidity(msg, latest.current.result);
    },
    clearError: () => {
      seq.current++;
      setManual(null);
      setResult(null);
      setNative(null);
      setValidating(false);
      syncValidity(null, null);
    },
  };

  return {
    base,
    root,
    message,
    invalid,
    descriptionId,
    errorId,
    describedBy,
    controlId: config.id ?? `${base}-control`,
    labelId: `${base}-label`,
    onInvalid,
    revalidate,
    /** Validation additions; unused by controls without validation options. */
    status,
    line,
    validating,
    onBlur,
    api,
  };
}

export type Field = ReturnType<typeof useField>;

/** The label's text: a marker for `required`, hidden from screen readers (the native attribute says it). */
export function labelContent(config: Pick<FieldConfig, 'label' | 'required'>, unstyled: boolean | undefined): React.ReactNode {
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


type MessageSlot = (name: string, content: React.ReactNode, tag: string, base?: PropsBag) => React.ReactNode;

/**
 * The lines under a validated control: the description (toned by `status`), the message line (an
 * error, or a warning or success from `validate`, with its icon), and the spinner while an async
 * `validate` runs (unless the control shows it inline). Slots: `description`, `error`, `statusIcon`,
 * `validating`.
 */
export function renderFieldMessages(field: Field, description: React.ReactNode, slot: MessageSlot, inlineValidating = false): React.ReactNode {
  const icon = (status: FieldStatus) => slot('statusIcon', <ToneIcon tone={status === 'error' ? 'danger' : status} />, 'span', { 'aria-hidden': true, 'data-status': status });
  const toned = !filled(field.line) && field.status && field.status !== 'error' ? field.status : null;
  const lineStatus: FieldStatus | null = filled(field.message) ? 'error' : filled(field.line) ? field.status : null;
  return (
    <>
      {filled(description) ? slot('description', toned ? <>{icon(toned)}<span>{description}</span></> : description, 'div', { id: field.descriptionId, 'data-status': toned ?? undefined }) : null}
      {field.validating && !inlineValidating ? slot('validating', null, 'span', { 'aria-hidden': true }) : null}
      {filled(field.line) ? slot('error', <>{lineStatus ? icon(lineStatus) : null}<span>{field.line}</span></>, 'div', { id: field.errorId, 'data-status': lineStatus ?? undefined }) : null}
    </>
  );
}

/** Root attributes every validated control reflects. */
export const validationAttrs = (field: Field): PropsBag => ({
  'data-validity': field.status ?? undefined,
  'data-validating': field.validating ? '' : undefined,
});

export const hiddenStyle = (hide: boolean | undefined): PropsBag => (hide ? { style: VISUALLY_HIDDEN } : {});

/* ---------------------------------------------------------------- choices */

export interface ChoiceRow {
  value?: string;
  label: React.ReactNode;
  description?: React.ReactNode;
  disabled?: boolean;
  /** Before the text: an icon or a logo (cards especially). */
  startContent?: React.ReactNode;
  /** After the text, at the end of the row: a price, a badge. */
  endContent?: React.ReactNode;
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
  /** Extra props for the row (`data-*`, the `ITEM` entry for `render` overrides). */
  item?: PropsBag;
}

/**
 * A checkbox, radio or switch row. The native input is transparent and on top of the drawn box, so
 * focus, keyboard, forms and assistive tech are all the browser's. The whole row is the `<label>`,
 * but the input is named by the label text alone: the description is linked, not part of the name.
 */
export function renderChoice({ slot, id, row, indicator, input, labelText, hideLabel, describedBy, item }: ChoiceOptions): React.ReactNode {
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
      {filled(row.startContent) ? slot('itemStartContent', row.startContent, 'span', { 'aria-hidden': true }) : null}
      <span className="pinfold-choice__text">
        {slot('itemLabel', labelText ?? row.label, 'span', { id: labelId, ...hiddenStyle(hideLabel) })}
        {hasDescription ? slot('itemDescription', row.description, 'span', { id: descriptionId }) : null}
      </span>
      {filled(row.endContent) ? slot('itemEndContent', row.endContent, 'span') : null}
    </>,
    'label',
    { htmlFor: id, 'data-disabled': row.disabled ? '' : undefined, ...item },
  );
}
