import * as React from 'react';
import { cn, dataAttr, inactiveRatingOptions, mergeProps, ratingFill, ratingFromPointer, warnOnce, type PropsBag } from '@pinfold/core';
import { useControllableState, useId } from '../hooks';
import { usePinfold } from '../provider';
import { usePinfoldComponent } from '../component';
import { mergeConfig } from '../preset';
import { ITEM, renderSlot, slotProps } from '../slots';
import { VISUALLY_HIDDEN } from '../a11y';
import type { RatingApi, RatingComponent, RatingConfig, RatingIcon, RatingRootProps, RatingSlot, RatingState, RatingSymbolContext } from './types';

const STAR = (
  <svg viewBox="0 0 24 24" fill="currentColor" focusable="false" aria-hidden="true">
    <path d="M12 2.6l2.9 5.9 6.5.9-4.7 4.6 1.1 6.5L12 17.4l-5.8 3.1 1.1-6.5L2.6 9.4l6.5-.9z" />
  </svg>
);

/**
 * A rating: stars (or any symbol) to give or show a score, as a hook that hands back a component.
 * Underneath it is a group of native radios, so keys, forms and screen readers work as they do for
 * any radio group; read-only, it is one image read as "4.3 out of 5".
 *
 *   const Stars = useRating({ label: 'Your rating', value, onChange: setValue });
 *   return <Stars />;
 *
 * Precedence: this config, then `defaults.rating`, then the provider (size), then the library default.
 * The tone is warning (gold) unless set: never the provider's.
 */
export function useRating(input: RatingConfig): RatingComponent {
  const ctx = usePinfold();
  const config = ctx.defaults.rating ? mergeConfig<RatingConfig>(ctx.defaults.rating, input) : input;
  const base = useId();
  const max = Math.max(1, Math.round(config.max ?? 5));
  const [value, setValue] = useControllableState<number>({ value: config.value, defaultValue: config.defaultValue ?? 0 });
  const [hover, setHoverState] = React.useState<number | null>(null);
  const setHover = (next: number | null) => {
    if (next === hover) return;
    setHoverState(next);
    config.onHover?.(next);
  };
  const symbols = React.useRef<HTMLDivElement | null>(null);

  if (process.env.NODE_ENV !== 'production') {
    void import('@pinfold/core/meta').then(({ ratingMeta, validateConfig }) => {
      for (const problem of validateConfig(ratingMeta, input)) warnOnce(true, problem.message);
      const inactive = inactiveRatingOptions(config);
      for (const key in inactive) warnOnce((input as unknown as Record<string, unknown>)[key] !== undefined, `Rating: \`${key}\` has no visible effect here. ${inactive[key]}`);
    });
    warnOnce(!config.label, 'Rating: give it a `label`, e.g. "Rate this recipe".');
  }

  const readOnly = !!config.readOnly;
  const disabled = !!config.disabled;
  const step = config.allowHalf ? 0.5 : 1;
  const state: RatingState = { size: config.size ?? ctx.size, tone: config.tone ?? 'warning', value, readOnly, hover };
  /** The word for a value: its whole step's (3.5 reads as the fourth). */
  // A half value takes the word of the whole step it has reached (3.5 reads as 3); 0.5 as the first.
  const wordOf = (v: number) => (v > 0 ? config.valueLabels?.[Math.max(1, Math.floor(v)) - 1] : undefined);
  const spoken = (v: number) => (config.getValueLabel ? config.getValueLabel(v) : wordOf(v) && v % 1 === 0 ? `${wordOf(v)}, ${v} star${v === 1 ? '' : 's'}` : `${v} star${v === 1 ? '' : 's'}`);
  const choose = (v: number) => {
    if (readOnly || disabled) return;
    const next = v === value && config.clearable !== false ? 0 : v;
    setValue(next);
    config.onChange?.(next);
  };
  const fromPointer = (event: React.PointerEvent) => {
    const box = symbols.current?.getBoundingClientRect();
    if (!box) return 0;
    return ratingFromPointer(event.clientX - box.left, box.width, max, !!config.allowHalf, ctx.dir === 'rtl');
  };

  const getRootProps = (props?: PropsBag): PropsBag =>
    mergeProps(
      {
        'data-size': state.size,
        'data-tone': state.tone,
        'data-readonly': dataAttr(readOnly),
        'data-previewing': dataAttr(hover !== null),
        'data-disabled': dataAttr(disabled),
        'data-animate': dataAttr(!ctx.disableAnimation),
        'data-unstyled': dataAttr(config.unstyled),
      },
      props,
    );

  const render = (rootProps?: RatingRootProps): React.ReactElement => {
    const cls = (name: string) => (config.unstyled ? undefined : name);
    const slot = (name: RatingSlot, content: React.ReactNode, tag: string, own: PropsBag = {}) =>
      renderSlot(config, name, slotProps(config, name, { className: cls(`pinfold-rating__${name}`), ...own }), state, content, (p, c) => React.createElement(tag, p, c));
    const root = slotProps(config, 'root', getRootProps(mergeProps({ className: config.unstyled ? config.className : cn('pinfold pinfold-rating', config.className), style: config.style }, rootProps)));
    const shown = hover ?? value;
    const fill = ratingFill(shown, max);
    const labelId = `${base}-label`;
    const draw = (icon: RatingIcon | undefined, symbol: RatingSymbolContext) => (typeof icon === 'function' ? icon(symbol) : icon);
    const marks = fill.map((f, i) => {
      const symbol: RatingSymbolContext = { index: i, value: i + 1, fill: f, previewing: hover !== null, label: config.valueLabels?.[i] };
      const full = draw(config.icon, symbol) ?? STAR;
      const empty = draw(config.emptyIcon, symbol) ?? full;
      return (
        <React.Fragment key={i}>
          {slot(
            'symbol',
            <>
              <span className={cls('pinfold-rating__empty')} data-own={config.emptyIcon !== undefined ? '' : undefined}>
                {empty}
              </span>
              <span className={cls('pinfold-rating__full')} style={{ clipPath: f === 1 ? 'none' : f === 0.5 ? 'inset(0 50% 0 0)' : 'inset(0 100% 0 0)' }}>
                {full}
              </span>
            </>,
            'span',
            { [ITEM]: symbol, 'aria-hidden': true, 'data-fill': String(f), title: readOnly ? undefined : symbol.label },
          )}
        </React.Fragment>
      );
    });
    // Choices: each step a native radio, visually hidden over the row; pointer picks by position.
    const choices = readOnly
      ? null
      : Array.from({ length: max / step }, (_, i) => (i + 1) * step).map((v) => (
          <label key={v} style={VISUALLY_HIDDEN}>
            <input
              type="radio"
              name={config.name ?? `${base}-rating`}
              value={v}
              checked={value === v}
              disabled={disabled}
              onChange={() => choose(v)}
              onClick={(event) => {
                // A radio fires no change when it is already checked: a click on the current value clears it.
                if (value === v && event.detail === 0) choose(v);
              }}
              onFocus={() => setHover(null)}
            />
            {spoken(v)}
          </label>
        ));
    const content = (
      <>
        {slot('label', config.label, 'span', { id: labelId, ...(config.hideLabel ? { style: VISUALLY_HIDDEN } : {}) })}
        {slot(
          'symbols',
          <>
            {marks}
            {choices}
          </>,
          'div',
          readOnly
            ? { role: 'img', 'aria-label': `${config.label}: ${value} out of ${max}` }
            : {
                ref: symbols,
                role: 'radiogroup',
                'aria-labelledby': labelId,
                'aria-disabled': disabled || undefined,
                onPointerMove: (event: React.PointerEvent) => !disabled && event.pointerType !== 'touch' && setHover(fromPointer(event)),
                onPointerLeave: () => setHover(null),
                onClick: (event: React.MouseEvent) => {
                  // A pointer press picks the step under it; keyboard presses go through the radios.
                  if (event.detail === 0 || disabled) return;
                  choose(fromPointer(event as unknown as React.PointerEvent));
                },
              },
        )}
        {config.showValue ? slot('value', `${value % 1 ? value.toFixed(1) : value}`, 'span', { 'aria-hidden': true }) : null}
        {/* The word for the value under the pointer, else the chosen one; the radios already speak it. */}
        {config.valueLabels?.length ? slot('hint', wordOf(shown) ?? '', 'span', { 'aria-hidden': true, 'data-preview': dataAttr(hover !== null) }) : null}
      </>
    );
    return renderSlot(config, 'root', root, state, content, (p, c) => <div {...p}>{c}</div>) as React.ReactElement;
  };

  const api: RatingApi = { value, setValue: (v) => setValue(v), getRootProps, render };
  return usePinfoldComponent<RatingApi, RatingRootProps>('Rating', api, (props) => render(props));
}
