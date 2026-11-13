import * as React from 'react';
import { cn, dataAttr, dimensionVars, inactiveToolbarOptions, mergeProps, nextIndexFromKey, toolbarPress, warnOnce, watchScrollEdges, type PropsBag, radiusProps } from '@pinfold/core';
import { useControllableState } from '../hooks';
import { usePinfold } from '../provider';
import { usePinfoldComponent } from '../component';
import { mergeConfig } from '../preset';
import { renderSlot, slotProps } from '../slots';
import { Button } from '../button/Button';
import type { ToolbarApi, ToolbarButtonItem, ToolbarComponent, ToolbarConfig, ToolbarCustomItem, ToolbarItem, ToolbarRootProps, ToolbarState } from './types';

const isSeparator = (item: ToolbarItem): item is { type: 'separator' } => (item as { type?: string }).type === 'separator';
const isCustom = (item: ToolbarItem): item is ToolbarCustomItem => !isSeparator(item) && 'content' in item && !('label' in item);
/** A control that keeps the arrow keys for itself (moving a caret, changing a value). */
const ownsKeys = (el: Element | null) => !!el && (/^(INPUT|TEXTAREA|SELECT)$/.test(el.tagName) || (el as HTMLElement).isContentEditable);

/**
 * A row of buttons from a list, as a hook that hands back a component: joined into a button group
 * (the default) or spaced as a toolbar, with one tab stop and arrow keys between the buttons.
 *
 *   const Pager = useToolbar({ label: 'Pages', items: [{ label: 'Previous', onClick: prev }, { label: 'Next', onClick: next }] });
 *   return <Pager />;
 *
 * Items are buttons, `{ type: 'separator' }` between groups, or `{ content }` for anything else.
 * Precedence: each item's own settings, then this config, then `defaults.toolbar`, then the
 * provider (size), then the library default. The tone never comes from the provider.
 */
export function useToolbar(input: ToolbarConfig): ToolbarComponent {
  const ctx = usePinfold();
  const config = ctx.defaults.toolbar ? mergeConfig<ToolbarConfig>(ctx.defaults.toolbar, input) : input;
  const root = React.useRef<HTMLDivElement | null>(null);
  const [active, setActive] = React.useState(0);
  const items = config.items ?? [];

  if (process.env.NODE_ENV !== 'production') {
    void import('@pinfold/core/meta').then(({ toolbarMeta, validateConfig }) => {
      for (const problem of validateConfig(toolbarMeta, input)) warnOnce(true, problem.message);
      const inactive = inactiveToolbarOptions(config);
      for (const key in inactive) warnOnce((input as unknown as Record<string, unknown>)[key] !== undefined, `Toolbar: \`${key}\` has no visible effect here. ${inactive[key]}`);
    });
    warnOnce(!config.label, 'Toolbar: give it a `label`, e.g. "Text formatting": it names the toolbar for screen readers.');
    warnOnce(
      items.some((item) => !isSeparator(item) && !isCustom(item) && (item as ToolbarButtonItem).label == null),
      'Toolbar: every button item needs a `label` (its name). Use `{ type: "separator" }` for a divider and `{ content }` for anything else.',
    );
  }

  const orientation = config.orientation ?? 'horizontal';
  const selection = config.selection ?? 'none';
  const overflow = config.overflow ?? 'wrap';
  const [pressed, setPressed] = useControllableState<readonly string[]>({ value: config.value, defaultValue: config.defaultValue ?? [] });
  const state: ToolbarState = { attached: config.attached !== false, orientation, size: config.size ?? ctx.size, value: [...pressed], overflow };

  // Stops: buttons, and custom items that take the roving props. The tab stop is the one last
  // focused, else the first.
  const stops = items.map((item, i) => (isSeparator(item) || (isCustom(item) && typeof item.content !== 'function') ? -1 : i)).filter((i) => i >= 0);
  const stop = stops.indexOf(active) !== -1 ? active : (stops[0] ?? -1);
  const buttons = () => Array.from(root.current?.querySelectorAll<HTMLElement>('[data-toolbar-item]') ?? []).filter((el) => el.closest('[role="toolbar"]') === root.current);

  // Scroll overflow: fading edges where buttons are hidden, written straight onto the root.
  React.useEffect(() => {
    const el = root.current;
    if (overflow !== 'scroll' || !el) return;
    return watchScrollEdges(el);
  }, [overflow]);

  const onKeyDown = (event: React.KeyboardEvent) => {
    if (ownsKeys(event.target as Element)) return;
    const all = buttons();
    const current = all.findIndex((el) => el === document.activeElement || el.contains(document.activeElement));
    if (current === -1) return;
    // Disabled buttons stay focusable and on the way, so they can be found; they do nothing.
    const next = nextIndexFromKey(event.key, current, all.length, { orientation, dir: ctx.dir, loop: false });
    if (next === null) return;
    event.preventDefault();
    all[next].focus();
  };

  const getRootProps = (props?: PropsBag): PropsBag =>
    mergeProps(
      {
        ...radiusProps(config.radius),
        ref: root,
        role: 'toolbar',
        'aria-label': config.label,
        'aria-orientation': orientation === 'vertical' ? 'vertical' : undefined,
        'data-attached': dataAttr(state.attached),
        'data-orientation': orientation,
        'data-overflow': overflow,
        'data-variant': config.variant ?? 'ghost',
        'data-size': state.size,
        'data-tone': config.tone ?? 'neutral',
        'data-selection': selection,
        'data-animate': dataAttr(!ctx.disableAnimation),
        'data-unstyled': dataAttr(config.unstyled),
        onKeyDown,
      },
      props,
    );

  const render = (rootProps?: ToolbarRootProps): React.ReactElement => {
    const vars = dimensionVars('toolbar', config.dimensions);
    const cls = (name: string) => (config.unstyled ? undefined : `pinfold-toolbar__${name}`);
    const rootBag = slotProps(
      config,
      'root',
      getRootProps(mergeProps({ className: config.unstyled ? config.className : cn('pinfold pinfold-toolbar', config.className), style: vars || config.style ? { ...vars, ...config.style } : undefined }, rootProps)),
    );
    // Groups between separators: their first and last entries get the outer corners.
    const edge = (i: number) => {
      const solid = (j: number) => j >= 0 && j < items.length && !isSeparator(items[j]);
      return { 'data-group-start': dataAttr(!solid(i - 1)), 'data-group-end': dataAttr(!solid(i + 1)) };
    };
    const roving = (i: number): PropsBag => ({ 'data-toolbar-item': '', tabIndex: i === stop ? 0 : -1, onFocus: () => setActive(i) });

    const content = items.map((entry, i) => {
      if (isSeparator(entry)) {
        return (
          <React.Fragment key={i}>
            {renderSlot(
              config,
              'separator',
              slotProps(config, 'separator', { className: cls('separator'), role: 'separator', 'aria-orientation': orientation === 'vertical' ? 'horizontal' : 'vertical' }),
              state,
              null,
              (p) => <div {...p} />,
            )}
          </React.Fragment>
        );
      }
      if (isCustom(entry)) {
        const body = typeof entry.content === 'function' ? entry.content({ props: roving(i), state }) : entry.content;
        return (
          <React.Fragment key={i}>
            {renderSlot(config, 'custom', slotProps(config, 'custom', { className: cls('custom'), ...edge(i) }), state, body, (p, c) => <div {...p}>{c}</div>)}
          </React.Fragment>
        );
      }
      const item = entry as ToolbarButtonItem;
      const own = slotProps(config, 'item', { className: cls('item'), ...roving(i), ...edge(i) });
      const value = item.value ?? String(i);
      const on = selection !== 'none' && pressed.includes(value);
      // The toolbar's look first; each item's own config wins. A pressed button takes the selected tone.
      const look = {
        variant: config.variant ?? 'ghost',
        size: state.size,
        tone: on ? config.selectedTone ?? 'primary' : config.tone ?? 'neutral',
        disabled: config.disabled || undefined,
      };
      // A toggle button keeps its own onClick, then flips its value.
      const toggle =
        selection === 'none'
          ? null
          : {
              'aria-pressed': on,
              'data-pressed': dataAttr(on),
              onClick: (event: React.MouseEvent<HTMLElement>) => {
                const result = item.onClick?.(event);
                const next = toolbarPress(pressed, value, selection);
                setPressed(next);
                config.onChange?.(next, event);
                return result;
              },
            };
      return (
        <React.Fragment key={i}>
          {renderSlot(config, 'item', own, state, null, (p) => (
            <Button {...look} {...item} {...toggle} {...p} className={cn(p.className as string | undefined, item.className)} />
          ))}
        </React.Fragment>
      );
    });
    return renderSlot(config, 'root', rootBag, state, content, (p, c) => <div {...p}>{c}</div>) as React.ReactElement;
  };

  const api: ToolbarApi = { focus: () => buttons()[Math.max(0, stops.indexOf(stop))]?.focus(), getRootProps, render };
  return usePinfoldComponent<ToolbarApi, ToolbarRootProps>('Toolbar', api, (props) => render(props));
}
