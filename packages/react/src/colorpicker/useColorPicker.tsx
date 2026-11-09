import * as React from 'react';
import { cn, dataAttr, formatColor, hsvToRgba, inactiveColorPickerOptions, mergeProps, parseColor, rgbToHsv, warnOnce, type Hsva, type PropsBag, type Rgba, radiusProps } from '@pinfold/core';
import { useId } from '../hooks';
import { usePinfold } from '../provider';
import { usePinfoldComponent } from '../component';
import { mergeConfig } from '../preset';
import { renderSlot, slotProps } from '../slots';
import type { ColorPickerApi, ColorPickerComponent, ColorPickerConfig, ColorPickerRootProps, ColorPickerSlot, ColorPickerState, ColorPickerValue } from './types';

const FALLBACK = '#6366f1';
const FORMAT_NAME = { hex: 'Hex', rgb: 'RGB', hsl: 'HSL', oklch: 'OKLCH' } as const;
const DROPPER = (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" focusable="false" aria-hidden="true">
    <path d="m14 7 3 3M5 19l1.5-.5L17 8a2.1 2.1 0 0 0-3-3L3.5 15.5 3 17z" />
    <path d="m13 5 1.5-1.5a2.1 2.1 0 0 1 3 0l3 3a2.1 2.1 0 0 1 0 3L19 11" />
  </svg>
);
// The colour data a picker draws: these are the colours themselves, not theme colours.
const HUE_TRACK = 'linear-gradient(to right, #f00, #ff0 16.67%, #0f0 33.33%, #0ff 50%, #00f 66.67%, #f0f 83.33%, #f00)';
const subscribe = () => () => {};

const opaque = (c: Rgba) => formatColor({ ...c, a: 1 }, 'rgb');
const every = (c: Rgba): ColorPickerValue => ({ hex: formatColor(c, 'hex'), rgb: formatColor(c, 'rgb'), hsl: formatColor(c, 'hsl'), oklch: formatColor(c, 'oklch'), alpha: Math.round(c.a * 100) / 100 });
/** A grey has no hue, black no saturation: keep what the picker had so the thumbs do not jump. */
const keepShape = (next: Hsva, prev: Hsva): Hsva => ({ ...next, h: next.s === 0 || next.v === 0 ? prev.h : next.h, s: next.v === 0 ? prev.s : next.s });
const clamp = (n: number) => (n < 0 ? 0 : n > 1 ? 1 : n);

/**
 * A colour picker: a saturation and brightness area, hue and opacity sliders, a text field for any
 * CSS colour, swatches and the screen eyedropper. As a hook that hands back a component.
 *
 *   const Picker = useColorPicker({ label: 'Brand colour', value, onChange: setValue, format: 'oklch' });
 *   return <Picker />;
 *
 * Precedence: this config, then `defaults.colorpicker`, then the provider (size), then the library default.
 */
export function useColorPicker(input: ColorPickerConfig): ColorPickerComponent {
  const ctx = usePinfold();
  const config = ctx.defaults.colorpicker ? mergeConfig<ColorPickerConfig>(ctx.defaults.colorpicker, input) : input;
  const base = useId();
  const format = config.format ?? 'hex';
  const disabled = !!config.disabled;
  const [hsva, setHsva] = React.useState<Hsva>(() => rgbToHsv(parseColor(config.value ?? config.defaultValue ?? FALLBACK) ?? parseColor(FALLBACK)!));
  const rgba = hsvToRgba(hsva);
  const text = formatColor(rgba, format);
  const [draft, setDraft] = React.useState<string | null>(null);
  const sent = React.useRef<string | undefined>(undefined);
  const area = React.useRef<HTMLDivElement | null>(null);
  const thumb = React.useRef<HTMLDivElement | null>(null);
  const canDrop = React.useSyncExternalStore(subscribe, () => typeof window !== 'undefined' && 'EyeDropper' in window, () => false);

  if (process.env.NODE_ENV !== 'production') {
    void import('@pinfold/core/meta').then(({ colorpickerMeta, validateConfig }) => {
      for (const problem of validateConfig(colorpickerMeta, input)) warnOnce(true, problem.message);
      const inactive = inactiveColorPickerOptions(config);
      for (const key in inactive) warnOnce((input as unknown as Record<string, unknown>)[key] !== undefined, `Color picker: \`${key}\` has no visible effect here. ${inactive[key]}`);
    });
  }

  // A controlled value from outside (not the one just sent) moves the picker.
  React.useEffect(() => {
    if (config.value === undefined || config.value === sent.current) return;
    const c = parseColor(config.value);
    if (c) setHsva((prev) => keepShape(rgbToHsv(c), prev));
  }, [config.value]);

  const commit = (next: Hsva) => {
    if (disabled) return;
    setHsva(next);
    const c = hsvToRgba(next);
    const value = formatColor(c, format);
    sent.current = value;
    config.onChange?.(value, every(c));
  };
  const setValue = (color: string) => {
    const c = parseColor(color);
    if (c) commit(keepShape(rgbToHsv(c), hsva));
  };

  const fromPointer = (event: { clientX: number; clientY: number }) => {
    const box = area.current?.getBoundingClientRect();
    if (!box || !box.width || !box.height) return;
    commit({ ...hsva, s: clamp((event.clientX - box.left) / box.width), v: clamp(1 - (event.clientY - box.top) / box.height) });
  };

  const state: ColorPickerState = { size: config.size ?? ctx.size, value: text, disabled };
  const labels = config.labels ?? {};

  const getRootProps = (props?: PropsBag): PropsBag =>
    mergeProps(
      {
        ...radiusProps(config.radius),
        role: 'group',
        'aria-label': config.label,
        'data-size': state.size,
        'data-disabled': dataAttr(disabled),
        'data-alpha': dataAttr(config.alpha),
        'data-animate': dataAttr(!ctx.disableAnimation),
        'data-unstyled': dataAttr(config.unstyled),
      },
      props,
    );

  const render = (rootProps?: ColorPickerRootProps): React.ReactElement => {
    const cls = (name: string) => (config.unstyled ? undefined : name);
    const slot = (name: ColorPickerSlot, content: React.ReactNode, tag: string, own: PropsBag = {}) =>
      renderSlot(config, name, slotProps(config, name, { className: cls(`pinfold-colorpicker__${name}`), ...own }), state, content, (p, c) => React.createElement(tag, p, c));
    const root = slotProps(
      config,
      'root',
      getRootProps(mergeProps({ className: config.unstyled ? config.className : cn('pinfold pinfold-colorpicker', config.className), style: { ...config.style, '--pinfold-cp-i-color': opaque(rgba), '--pinfold-cp-i-value': formatColor(rgba, 'rgb') } }, rootProps)),
    );
    const s = Math.round(hsva.s * 100);
    const v = Math.round(hsva.v * 100);

    const areaEl = slot(
      'area',
      slot('thumb', null, 'div', {
        ref: thumb,
        role: 'slider',
        tabIndex: disabled ? -1 : 0,
        'aria-label': labels.area ?? 'Saturation and brightness',
        'aria-valuemin': 0,
        'aria-valuemax': 100,
        'aria-valuenow': s,
        'aria-valuetext': `saturation ${s}%, brightness ${v}%`,
        'aria-disabled': disabled || undefined,
        style: { insetInlineStart: `${s}%`, insetBlockStart: `${100 - v}%` },
        onKeyDown: (event: React.KeyboardEvent) => {
          const step = event.shiftKey ? 0.1 : 0.01;
          const rtl = getComputedStyle(event.currentTarget).direction === 'rtl';
          const moves: Record<string, Partial<Hsva>> = {
            ArrowRight: { s: hsva.s + (rtl ? -step : step) },
            ArrowLeft: { s: hsva.s - (rtl ? -step : step) },
            ArrowUp: { v: hsva.v + step },
            ArrowDown: { v: hsva.v - step },
            PageUp: { v: hsva.v + 0.1 },
            PageDown: { v: hsva.v - 0.1 },
            Home: { s: 0 },
            End: { s: 1 },
          };
          const move = moves[event.key];
          if (!move) return;
          event.preventDefault();
          const next = { ...hsva, ...move };
          commit({ ...next, s: clamp(next.s), v: clamp(next.v) });
        },
      }),
      'div',
      {
        ref: area,
        // Saturation left to right, brightness bottom to top, over the pure hue.
        style: { background: `linear-gradient(to top, #000, transparent), linear-gradient(to right, #fff, transparent), hsl(${Math.round(hsva.h)} 100% 50%)` },
        onPointerDown: (event: React.PointerEvent<HTMLDivElement>) => {
          if (disabled || event.button !== 0) return;
          event.preventDefault();
          const el = event.currentTarget;
          el.setPointerCapture?.(event.pointerId);
          thumb.current?.focus();
          fromPointer(event);
          const move = (e: PointerEvent) => fromPointer(e);
          const stop = () => {
            el.removeEventListener('pointermove', move);
            el.removeEventListener('pointerup', stop);
            el.removeEventListener('pointercancel', stop);
          };
          el.addEventListener('pointermove', move);
          el.addEventListener('pointerup', stop);
          el.addEventListener('pointercancel', stop);
        },
      },
    );

    const range = (name: 'hue' | 'alpha', value: number, max: number, label: string, track: string, onValue: (n: number) => void) =>
      slot(name, null, 'input', {
        type: 'range',
        min: 0,
        max,
        step: 1,
        value,
        disabled,
        'aria-label': label,
        'aria-valuetext': name === 'hue' ? `${value} degrees` : `${value}%`,
        style: { '--pinfold-cp-i-track': track },
        onChange: (event: React.ChangeEvent<HTMLInputElement>) => onValue(Number(event.target.value)),
      });

    const commitDraft = () => {
      if (draft === null) return;
      const c = parseColor(draft);
      if (c) commit(keepShape(rgbToHsv(c), hsva));
      setDraft(null);
    };
    const invalid = draft !== null && draft.trim() !== '' && !parseColor(draft);

    const swatches = config.swatches ?? [];
    const current = formatColor(rgba, 'hex');
    const content = (
      <>
        {areaEl}
        {slot(
          'controls',
          <>
            {slot('preview', null, 'div', { 'aria-hidden': true })}
            <div className={cls('pinfold-colorpicker__sliders')}>
              {range('hue', Math.round(hsva.h), 360, labels.hue ?? 'Hue', HUE_TRACK, (h) => commit({ ...hsva, h }))}
              {config.alpha ? range('alpha', Math.round(hsva.a * 100), 100, labels.alpha ?? 'Opacity', `linear-gradient(to right, transparent, ${opaque(rgba)})`, (a) => commit({ ...hsva, a: a / 100 })) : null}
            </div>
            {config.eyeDropper !== false && canDrop
              ? slot('eyedropper', DROPPER, 'button', {
                  type: 'button',
                  disabled,
                  'aria-label': labels.eyeDropper ?? 'Pick a colour from the screen',
                  onClick: async () => {
                    try {
                      const Dropper = (window as unknown as { EyeDropper: new () => { open: () => Promise<{ sRGBHex: string }> } }).EyeDropper;
                      setValue((await new Dropper().open()).sRGBHex);
                    } catch {
                      // Escape or a refusal: nothing changes.
                    }
                  },
                })
              : null}
          </>,
          'div',
        )}
        {config.showInput !== false
          ? slot(
              'field',
              slot('input', null, 'input', {
                id: `${base}-input`,
                type: 'text',
                value: draft ?? text,
                disabled,
                spellCheck: false,
                autoComplete: 'off',
                'aria-label': labels.input ?? FORMAT_NAME[format] ?? 'Colour',
                'aria-invalid': invalid || undefined,
                onChange: (event: React.ChangeEvent<HTMLInputElement>) => setDraft(event.target.value),
                onBlur: commitDraft,
                onKeyDown: (event: React.KeyboardEvent) => {
                  if (event.key === 'Enter') {
                    event.preventDefault();
                    commitDraft();
                  } else if (event.key === 'Escape' && draft !== null) setDraft(null);
                },
              }),
              'div',
            )
          : null}
        {swatches.length
          ? slot(
              'swatches',
              swatches.map((sw) => {
                const c = parseColor(sw);
                return c ? (
                  <React.Fragment key={sw}>
                    {slot('swatch', null, 'button', {
                      type: 'button',
                      disabled,
                      'aria-label': sw,
                      'aria-pressed': formatColor(c, 'hex') === current,
                      style: { '--pinfold-cp-i-swatch': formatColor(c, 'rgb') },
                      onClick: () => setValue(sw),
                    })}
                  </React.Fragment>
                ) : null;
              }),
              'div',
              { role: 'group', 'aria-label': labels.swatches ?? 'Swatches' },
            )
          : null}
        {config.name ? <input type="hidden" name={config.name} value={text} disabled={disabled} /> : null}
      </>
    );
    return renderSlot(config, 'root', root, state, content, (p, c) => <div {...p}>{c}</div>) as React.ReactElement;
  };

  const api: ColorPickerApi = { value: text, setValue, getRootProps, render };
  return usePinfoldComponent<ColorPickerApi, ColorPickerRootProps>('ColorPicker', api, (props) => render(props));
}
