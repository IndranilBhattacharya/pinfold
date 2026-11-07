import * as React from 'react';
import { cn, dataAttr, dimensionVars, mergeProps, nextIndexFromKey, warnOnce, type PropsBag } from '@pinfold/core';
import { usePinfold } from '../provider';
import { usePinfoldComponent } from '../component';
import { mergeConfig } from '../preset';
import { renderSlot, slotProps } from '../slots';
import { Button } from '../button/Button';
import type { ToolbarApi, ToolbarComponent, ToolbarConfig, ToolbarRootProps, ToolbarState } from './types';

/**
 * A row of buttons from a list, as a hook that hands back a component: joined into a button group
 * (the default) or spaced as a toolbar, with one tab stop and arrow keys between the buttons.
 *
 *   const Pager = useToolbar({ label: 'Pages', items: [{ label: 'Previous', onClick: prev }, { label: 'Next', onClick: next }] });
 *   return <Pager />;
 *
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
    });
    warnOnce(!config.label, 'Toolbar: give it a `label`, e.g. "Text formatting": it names the toolbar for screen readers.');
  }

  const orientation = config.orientation ?? 'horizontal';
  const state: ToolbarState = { attached: config.attached !== false, orientation, size: config.size ?? ctx.size };
  // The tab stop: the button last focused, else the first one that can take focus.
  const stop = active < items.length ? active : 0;
  const buttons = () => Array.from(root.current?.querySelectorAll<HTMLElement>(':scope > [data-toolbar-item]') ?? []);

  const onKeyDown = (event: React.KeyboardEvent) => {
    const all = buttons();
    const current = all.indexOf(document.activeElement as HTMLElement);
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
        ref: root,
        role: 'toolbar',
        'aria-label': config.label,
        'aria-orientation': orientation === 'vertical' ? 'vertical' : undefined,
        'data-attached': dataAttr(state.attached),
        'data-orientation': orientation,
        'data-variant': config.variant ?? 'soft',
        'data-size': state.size,
        'data-tone': config.tone ?? 'neutral',
        'data-unstyled': dataAttr(config.unstyled),
        onKeyDown,
      },
      props,
    );

  const render = (rootProps?: ToolbarRootProps): React.ReactElement => {
    const vars = dimensionVars('toolbar', config.dimensions);
    const rootBag = slotProps(
      config,
      'root',
      getRootProps(mergeProps({ className: config.unstyled ? config.className : cn('pinfold pinfold-toolbar', config.className), style: vars || config.style ? { ...vars, ...config.style } : undefined }, rootProps)),
    );
    const content = items.map((item, i) => {
      const own = slotProps(config, 'item', {
        className: config.unstyled ? undefined : 'pinfold-toolbar__item',
        'data-toolbar-item': '',
        tabIndex: i === stop ? 0 : -1,
        onFocus: () => setActive(i),
      });
      // The toolbar's look first; each item's own config wins.
      const look = { variant: config.variant ?? 'soft', size: state.size, tone: config.tone ?? 'neutral', disabled: config.disabled || undefined };
      return (
        <React.Fragment key={i}>
          {renderSlot(config, 'item', own, state, null, (p) => (
            <Button {...look} {...item} {...p} className={cn(p.className as string | undefined, item.className)} />
          ))}
        </React.Fragment>
      );
    });
    return renderSlot(config, 'root', rootBag, state, content, (p, c) => <div {...p}>{c}</div>) as React.ReactElement;
  };

  const api: ToolbarApi = { focus: () => buttons()[Math.max(0, stop)]?.focus(), getRootProps, render };
  return usePinfoldComponent<ToolbarApi, ToolbarRootProps>('Toolbar', api, (props) => render(props));
}
