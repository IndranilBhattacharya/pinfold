import * as React from 'react';
import { cn, dimensionVars, formatKeys, inactiveKbdOptions, kbdOs, mergeProps, warnOnce, type KbdOs, type PropsBag } from '@pinfold/core';
import { usePinfold } from '../provider';
import { usePinfoldComponent } from '../component';
import { mergeConfig } from '../preset';
import { renderSlot, slotProps } from '../slots';
import type { KbdApi, KbdComponent, KbdConfig, KbdRootProps, KbdState } from './types';

/** Visually hidden but read: the spoken name of a symbol. Inline, so it holds in unstyled mode too. */
const SPOKEN: React.CSSProperties = { position: 'absolute', width: 1, height: 1, padding: 0, margin: -1, overflow: 'hidden', clip: 'rect(0 0 0 0)', whiteSpace: 'nowrap', border: 0 };

const subscribe = () => () => {};
const clientOs = (): KbdOs => {
  const nav = navigator as Navigator & { userAgentData?: { platform?: string } };
  return kbdOs(nav.userAgentData?.platform || nav.platform || nav.userAgent);
};
/** The server cannot know the platform: it and the hydrating client render `other`, then Apple devices switch. */
const serverOs = (): KbdOs => 'other';

/**
 * A keyboard shortcut that adapts to the platform, as a hook that hands back a component.
 *
 *   const Search = useKbd({ keys: ['mod', 'k'] });
 *   return <Search />;          // ⌘K on a Mac, Ctrl + K elsewhere
 *
 * Precedence: this config, then `defaults.kbd`, then the provider (size), then the library default.
 */
export function useKbd(input: KbdConfig): KbdComponent {
  const ctx = usePinfold();
  const config = ctx.defaults.kbd ? mergeConfig<KbdConfig>(ctx.defaults.kbd, input) : input;
  const os = React.useSyncExternalStore(subscribe, clientOs, serverOs);

  if (process.env.NODE_ENV !== 'production') {
    void import('@pinfold/core/meta').then(({ kbdMeta, validateConfig }) => {
      for (const problem of validateConfig(kbdMeta, input)) warnOnce(true, problem.message);
    });
    // Only the platform-independent case warns: with `auto`, the separator is right for non-Apple users.
    if (config.display === 'symbols') {
      const inactive = inactiveKbdOptions({ display: 'symbols' });
      warnOnce(input.separator !== undefined, `Kbd: \`separator\` has no visible effect here. ${inactive.separator}`);
    }
  }

  const display = config.display ?? 'auto';
  const symbols = display === 'symbols' || (display === 'auto' && os === 'apple');
  const state: KbdState = { variant: config.variant ?? 'outline', size: config.size ?? ctx.size, os, symbols };

  const getRootProps = (props?: PropsBag): PropsBag =>
    mergeProps(
      {
        'data-variant': state.variant,
        'data-size': state.size,
        'data-os': os,
        'data-symbols': symbols ? '' : undefined,
        'data-unstyled': config.unstyled ? '' : undefined,
      },
      props,
    );

  const render = (rootProps?: KbdRootProps): React.ReactElement => {
    const cls = (name: string) => (config.unstyled ? undefined : name);
    const vars = dimensionVars('kbd', config.dimensions);
    const root = slotProps(
      config,
      'root',
      getRootProps(mergeProps({ className: config.unstyled ? config.className : cn('pinfold pinfold-kbd', config.className), style: vars || config.style ? { ...vars, ...config.style } : undefined }, rootProps)),
    );
    const keys = formatKeys(Array.isArray(config.keys) ? config.keys : [], os, display);
    const separator = config.separator ?? '+';
    const content = keys.map((key, i) => (
      <React.Fragment key={i}>
        {i > 0 && !symbols && separator
          ? renderSlot(config, 'separator', slotProps(config, 'separator', { className: cls('pinfold-kbd__separator'), 'aria-hidden': true }), state, separator, (p, c) => <span {...p}>{c}</span>)
          : null}
        {renderSlot(
          config,
          'key',
          slotProps(config, 'key', { className: cls('pinfold-kbd__key') }),
          state,
          key.display === key.spoken ? (
            key.display
          ) : (
            <>
              <span aria-hidden="true">{key.display}</span>
              <span style={SPOKEN}>{key.spoken}</span>
            </>
          ),
          (p, c) => <kbd {...p}>{c}</kbd>,
        )}
      </React.Fragment>
    ));
    // A combination is a <kbd> holding one <kbd> per key (HTML spec).
    return renderSlot(config, 'root', root, state, content, (p, c) => <kbd {...p}>{c}</kbd>) as React.ReactElement;
  };

  const api: KbdApi = { getRootProps, render };
  return usePinfoldComponent<KbdApi, KbdRootProps>('Kbd', api, (props) => render(props));
}
