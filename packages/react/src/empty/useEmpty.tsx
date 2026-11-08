import * as React from 'react';
import { cn, dataAttr, inactiveEmptyOptions, mergeProps, warnOnce, type PropsBag } from '@pinfold/core';
import { usePinfold } from '../provider';
import { usePinfoldComponent } from '../component';
import { mergeConfig } from '../preset';
import { renderSlot, slotProps } from '../slots';
import { Button } from '../button/Button';
import type { EmptyApi, EmptyComponent, EmptyConfig, EmptyRootProps, EmptySlot, EmptyState } from './types';

const TRAY = (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.6} strokeLinecap="round" strokeLinejoin="round" focusable="false" aria-hidden="true">
    <path d="M3 13h5l1.5 2.5h5L16 13h5" />
    <path d="M5.5 5h13L21 13v5a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-5z" />
  </svg>
);

/**
 * An empty state: what is missing and what to do about it, as a hook that hands back a component.
 * Use it where a list, a search or a page has nothing to show yet.
 *
 *   const NoResults = useEmpty({ title: 'No results', description: 'Try fewer filters.', actions: [{ label: 'Clear filters', onClick: clear }] });
 *   return <NoResults />;
 *
 * Precedence: this config, then `defaults.empty`, then the provider (size, tone), then the library default.
 */
export function useEmpty(input: EmptyConfig): EmptyComponent {
  const ctx = usePinfold();
  const config = ctx.defaults.empty ? mergeConfig<EmptyConfig>(ctx.defaults.empty, input) : input;

  if (process.env.NODE_ENV !== 'production') {
    void import('@pinfold/core/meta').then(({ emptyMeta, validateConfig }) => {
      for (const problem of validateConfig(emptyMeta, input)) warnOnce(true, problem.message);
      const inactive = inactiveEmptyOptions(config);
      for (const key in inactive) warnOnce((input as unknown as Record<string, unknown>)[key] !== undefined, `Empty: \`${key}\` has no visible effect here. ${inactive[key]}`);
    });
  }

  const state: EmptyState = { variant: config.variant ?? 'plain', size: config.size ?? ctx.size, tone: config.tone ?? ctx.tone };

  const getRootProps = (props?: PropsBag): PropsBag =>
    mergeProps({ 'data-variant': state.variant, 'data-size': state.size, 'data-tone': state.tone, 'data-animate': dataAttr(!ctx.disableAnimation), 'data-unstyled': dataAttr(config.unstyled) }, props);

  const render = (rootProps?: EmptyRootProps): React.ReactElement => {
    const cls = (name: string) => (config.unstyled ? undefined : name);
    const slot = (name: EmptySlot, content: React.ReactNode, tag: string, own: PropsBag = {}) =>
      renderSlot(config, name, slotProps(config, name, { className: cls(`pinfold-empty__${name}`), ...own }), state, content, (p, c) => React.createElement(tag, p, c));
    const root = slotProps(config, 'root', getRootProps(mergeProps({ className: config.unstyled ? config.className : cn('pinfold pinfold-empty', config.className), style: config.style }, rootProps)));
    const level = [2, 3, 4, 5, 6].includes(Number(config.headingLevel)) ? Number(config.headingLevel) : 3;
    const actions = config.actions ?? [];
    const content = (
      <>
        {config.media === null ? null : slot('media', config.media ?? TRAY, 'div', { 'aria-hidden': true })}
        {slot('title', config.title, `h${level}`)}
        {config.description != null ? slot('description', config.description, 'p') : null}
        {actions.length
          ? slot(
              'actions',
              actions.map((a, i) => <Button key={i} size={state.size} tone={i === 0 ? state.tone : 'neutral'} variant={i === 0 ? 'solid' : 'ghost'} {...a} />),
              'div',
            )
          : null}
      </>
    );
    return renderSlot(config, 'root', root, state, content, (p, c) => <div {...p}>{c}</div>) as React.ReactElement;
  };

  const api: EmptyApi = { getRootProps, render };
  return usePinfoldComponent<EmptyApi, EmptyRootProps>('Empty', api, (props) => render(props));
}
