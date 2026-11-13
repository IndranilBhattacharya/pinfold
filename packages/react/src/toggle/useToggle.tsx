import * as React from 'react';
import { cn, dataAttr, dimensionVars, inactiveToggleOptions, mergeProps, nextIndexFromKey, warnOnce, type PropsBag, radiusProps } from '@pinfold/core';
import { useControllableState, useId } from '../hooks';
import { useSlidingIndicator } from '../indicator';
import { usePinfold } from '../provider';
import { usePinfoldComponent } from '../component';
import { mergeConfig } from '../preset';
import { ITEM, renderSlot, slotProps } from '../slots';
import { VISUALLY_HIDDEN } from '../a11y';
import type { ToggleApi, ToggleComponent, ToggleConfig, ToggleItem, ToggleRootProps, ToggleSlot, ToggleState } from './types';

const filled = (node: React.ReactNode) => node != null && node !== false && node !== '';
const NONE: string[] = [];
type Press = React.MouseEvent | React.KeyboardEvent;

/**
 * A button that stays pressed, or a group of them from `items`, as a hook that hands back a component.
 *
 *   const View = useToggle({ label: 'View', items: [{ value: 'list', label: 'List' }, { value: 'board', label: 'Board' }] });
 *   return <View />;
 *
 * The same value is the controller (`View.value`, `View.setValue(['board'])`). Precedence: this
 * config, then `defaults.toggle`, then the provider (size, tone), then the library default.
 */
export function useToggle(input: ToggleConfig): ToggleComponent {
  const ctx = usePinfold();
  const config = ctx.defaults.toggle ? mergeConfig<ToggleConfig>(ctx.defaults.toggle, input) : input;
  const base = useId();
  const items = config.items;
  const group = Array.isArray(items);
  const multiple = config.selection === 'multiple';
  const list = React.useRef<HTMLDivElement | null>(null);
  const self = React.useRef<HTMLButtonElement | null>(null);
  const [active, setActive] = React.useState<number | null>(null);

  if (process.env.NODE_ENV !== 'production') {
    void import('@pinfold/core/meta').then(({ toggleMeta, validateConfig }) => {
      for (const problem of validateConfig(toggleMeta, input)) warnOnce(true, problem.message);
      const inactive = inactiveToggleOptions(config);
      for (const key in inactive) warnOnce((input as unknown as Record<string, unknown>)[key] !== undefined, `Toggle: \`${key}\` has no visible effect here. ${inactive[key]}`);
    });
    warnOnce(!filled(config.label), 'Toggle: give it a `label`: it names the button, or the group.');
    // An icon-only button is named by its label, so the label must be text.
    warnOnce(!group && !!config.iconOnly && typeof config.label !== 'string', 'Toggle: an `iconOnly` toggle needs a text `label`: it becomes the accessible name and the tooltip.');
    warnOnce(group && items!.some((item) => item.iconOnly && typeof item.label !== 'string'), 'Toggle: an `iconOnly` item needs a text `label`: it becomes the accessible name and the tooltip.');
  }

  const [pressed, setPressed] = useControllableState<boolean>({ value: config.pressed, defaultValue: config.defaultPressed ?? false });
  const [selected, setSelected] = useControllableState<readonly string[]>({ value: config.value, defaultValue: config.defaultValue ?? NONE });
  const value = group ? [...selected] : pressed ? ['on'] : [];
  const state: ToggleState = { variant: config.variant ?? 'segmented', size: config.size ?? ctx.size, tone: config.tone ?? ctx.tone, group, value };
  // A single selection draws one indicator that slides to the selected button (every variant).
  const slides = group && !multiple;

  const choose = (item: ToggleItem, event: Press) => {
    const on = selected.includes(item.value);
    let next: string[];
    if (multiple) next = on ? selected.filter((v) => v !== item.value) : [...selected, item.value];
    else if (on) {
      if (!config.allowEmpty) return;
      next = [];
    } else next = [item.value];
    setSelected(next);
    config.onChange?.(next, event);
  };
  const press = (event: Press) => {
    setPressed(!pressed);
    config.onChange?.(!pressed, event);
  };

  // The segmented pill: measured from the selected button, so it slides between any widths. One
  // observer per group, only while it shows.
  const selectedIndex = group ? items!.findIndex((item) => selected.includes(item.value)) : -1;
  useSlidingIndicator(list, slides, '[data-toggle-item]', selectedIndex, '--pinfold-tgl-i', `${items?.length}|${state.variant}|${state.size}|${config.orientation}`);

  const enabled = (i: number) => !config.disabled && !items![i]?.disabled;
  const firstEnabled = group ? items!.findIndex((_, i) => enabled(i)) : -1;
  const stop = active !== null && group ? active : selectedIndex >= 0 && enabled(selectedIndex) ? selectedIndex : firstEnabled;
  const buttons = () => Array.from(list.current?.querySelectorAll<HTMLButtonElement>('[data-toggle-item]') ?? []);

  const onKeyDown = (event: React.KeyboardEvent) => {
    if (!group) return;
    const all = buttons();
    const current = all.indexOf(document.activeElement as HTMLButtonElement);
    if (current === -1) return;
    // Disabled buttons are focusable and on the way (discoverable), but never selected.
    const next = nextIndexFromKey(event.key, current, all.length, { orientation: config.orientation ?? 'horizontal', dir: ctx.dir });
    if (next === null) return;
    event.preventDefault();
    all[next].focus();
    // A single selection is a radio group: arrows select as they move.
    if (!multiple && enabled(next) && !selected.includes(items![next].value)) choose(items![next], event);
  };

  const getRootProps = (props?: PropsBag): PropsBag =>
    mergeProps(
      {
        ...radiusProps(config.radius),
        'data-variant': state.variant,
        'data-size': state.size,
        'data-tone': state.tone,
        'data-disabled': dataAttr(config.disabled),
        'data-animate': dataAttr(!ctx.disableAnimation),
        'data-unstyled': dataAttr(config.unstyled),
        ...(group
          ? {
              role: multiple ? 'group' : 'radiogroup',
              'aria-labelledby': `${base}-label`,
              'aria-orientation': config.orientation === 'vertical' ? 'vertical' : undefined,
              'data-group': '',
              'data-selection': multiple ? 'multiple' : 'single',
              'data-orientation': config.orientation ?? 'horizontal',
              'data-full-width': dataAttr(config.fullWidth),
            }
          : {
              ref: self,
              type: 'button',
              'aria-pressed': pressed,
              'aria-label': config.iconOnly ? (typeof config.label === 'string' ? config.label : undefined) : undefined,
              title: config.iconOnly && typeof config.label === 'string' ? config.label : undefined,
              'aria-disabled': config.disabled || undefined,
              'data-pressed': dataAttr(pressed),
              'data-icon-only': dataAttr(config.iconOnly),
              onClick: (event: React.MouseEvent) => {
                if (!config.disabled) press(event);
              },
            }),
      },
      props,
    );

  const render = (rootProps?: ToggleRootProps): React.ReactElement => {
    const cls = (name: string) => (config.unstyled ? undefined : `pinfold-toggle__${name}`);
    const slot = (name: ToggleSlot, content: React.ReactNode, tag: string, extra: PropsBag = {}) =>
      renderSlot(config, name, slotProps(config, name, { className: cls(name), ...extra }), state, content, (p, c) => React.createElement(tag, p, c));
    const vars = dimensionVars('toggle', config.dimensions);
    const root = slotProps(
      config,
      'root',
      getRootProps(mergeProps({ className: config.unstyled ? config.className : cn('pinfold pinfold-toggle', config.className), style: vars || config.style ? { ...vars, ...config.style } : undefined }, rootProps)),
    );
    const face = (icon: React.ReactNode, label: React.ReactNode, iconOnly: boolean | undefined) => (
      <>
        {filled(icon) ? slot('icon', icon, 'span', { 'aria-hidden': true }) : null}
        {iconOnly ? null : slot('text', label, 'span')}
      </>
    );

    if (!group) {
      return renderSlot(config, 'root', root, state, face(config.icon, config.label, config.iconOnly), (p, c) => <button {...p}>{c}</button>) as React.ReactElement;
    }

    const content = (
      <>
        {slot('label', config.label, 'span', { id: `${base}-label`, ...(config.hideLabel === false ? {} : { style: VISUALLY_HIDDEN }) })}
        {slot(
          'items',
          <>
            {slides ? slot('indicator', null, 'span', { 'aria-hidden': true }) : null}
            {items!.map((item, i) => {
              const on = selected.includes(item.value);
              const name = typeof item.label === 'string' ? item.label : undefined;
              return (
                <React.Fragment key={item.value}>
                  {slot('item', face(item.icon, item.label, item.iconOnly), 'button', {
                    [ITEM]: { ...item, index: i, selected: on },
                    type: 'button',
                    'data-toggle-item': '',
                    role: multiple ? undefined : 'radio',
                    'aria-checked': multiple ? undefined : on,
                    'aria-pressed': multiple ? on : undefined,
                    'aria-label': item.iconOnly ? name : undefined,
                    title: item.iconOnly ? name : undefined,
                    // Focusable while disabled, as every Pinfold control: arrows still pass over it.
                    'aria-disabled': !enabled(i) || undefined,
                    tabIndex: i === stop ? 0 : -1,
                    'data-pressed': dataAttr(on),
                    'data-icon-only': dataAttr(item.iconOnly),
                    onClick: (event: React.MouseEvent) => {
                      if (enabled(i)) choose(item, event);
                    },
                    onFocus: () => setActive(i),
                  })}
                </React.Fragment>
              );
            })}
          </>,
          'div',
          { ref: list, onKeyDown },
        )}
        {config.name ? selected.map((v) => <input key={v} type="hidden" name={config.name} value={v} />) : null}
      </>
    );
    return renderSlot(config, 'root', root, state, content, (p, c) => <div {...p}>{c}</div>) as React.ReactElement;
  };

  const api: ToggleApi = {
    value,
    setValue: (next) => (group ? setSelected(next) : setPressed(next.length > 0)),
    focus: () => (group ? buttons()[Math.max(0, stop)] : self.current)?.focus(),
    getRootProps,
    render,
  };
  return usePinfoldComponent<ToggleApi, ToggleRootProps>('Toggle', api, (props) => render(props));
}
