import * as React from 'react';
import { cn, dimensionVars, inactiveSeparatorOptions, mergeProps, warnOnce, type PropsBag } from '@pinfold/core';
import { usePinfold } from '../provider';
import { usePinfoldComponent } from '../component';
import { mergeConfig } from '../preset';
import { renderSlot, slotProps } from '../slots';
import type { SeparatorApi, SeparatorComponent, SeparatorConfig, SeparatorRootProps, SeparatorState } from './types';

/**
 * A line between groups of content, as a hook that hands back a component.
 *
 *   const Or = useSeparator({ label: 'or', spacing: 'lg' });
 *   return <Or />;
 *
 * Decorative by default (`role="none"`). Precedence: this config, then `defaults.separator`,
 * then the library default (it follows no provider size or tone).
 */
export function useSeparator(input: SeparatorConfig = {}): SeparatorComponent {
  const ctx = usePinfold();
  const config = ctx.defaults.separator ? mergeConfig<SeparatorConfig>(ctx.defaults.separator, input) : input;

  if (process.env.NODE_ENV !== 'production') {
    void import('@pinfold/core/meta').then(({ separatorMeta, validateConfig }) => {
      for (const problem of validateConfig(separatorMeta, input)) warnOnce(true, problem.message);
      const inactive = inactiveSeparatorOptions(config);
      for (const key in inactive) warnOnce((input as Record<string, unknown>)[key] !== undefined, `Separator: \`${key}\` has no visible effect here. ${inactive[key]}`);
    });
  }

  const orientation = config.orientation ?? 'horizontal';
  const labelled = config.label != null && config.label !== false && config.label !== '';
  const decorative = config.decorative ?? true;
  const state: SeparatorState = { orientation, variant: config.variant ?? 'solid', contrast: config.contrast ?? 'normal', thickness: config.thickness ?? 'thin', labelled };

  const getRootProps = (props?: PropsBag): PropsBag =>
    mergeProps(
      {
        // A labelled separator is read as its text; the lines around it are decoration.
        role: decorative || labelled ? 'none' : 'separator',
        'aria-orientation': !decorative && !labelled && orientation === 'vertical' ? 'vertical' : undefined,
        'data-orientation': orientation,
        'data-variant': state.variant,
        'data-contrast': state.contrast,
        'data-thickness': state.thickness,
        'data-label-position': config.labelPosition ?? 'center',
        'data-spacing': config.spacing ?? 'none',
        'data-labelled': labelled ? '' : undefined,
        'data-unstyled': config.unstyled ? '' : undefined,
      },
      props,
    );

  const render = (rootProps?: SeparatorRootProps): React.ReactElement => {
    const cls = (name: string) => (config.unstyled ? undefined : name);
    const vars = dimensionVars('separator', config.dimensions);
    const root = slotProps(
      config,
      'root',
      getRootProps(
        mergeProps(
          { className: config.unstyled ? config.className : cn('pinfold pinfold-separator', config.className), style: vars || config.style ? { ...vars, ...config.style } : undefined },
          rootProps,
        ),
      ),
    );
    const line = () => renderSlot(config, 'line', slotProps(config, 'line', { className: cls('pinfold-separator__line'), 'aria-hidden': true }), state, null, (p) => <span {...p} />);
    const content = labelled ? (
      <>
        {line()}
        {renderSlot(config, 'label', slotProps(config, 'label', { className: cls('pinfold-separator__label') }), state, config.label, (p, c) => <span {...p}>{c}</span>)}
        {line()}
      </>
    ) : (
      line()
    );
    return renderSlot(config, 'root', root, state, content, (p, c) => <div {...p}>{c}</div>) as React.ReactElement;
  };

  const api: SeparatorApi = { getRootProps, render };
  return usePinfoldComponent<SeparatorApi, SeparatorRootProps>('Separator', api, (props) => render(props));
}
