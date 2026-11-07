import * as React from 'react';
import { buttonRel, cn, dimensionVars, inactiveCardOptions, mergeProps, warnOnce, type PropsBag } from '@pinfold/core';
import { usePinfold } from '../provider';
import { usePinfoldComponent } from '../component';
import { mergeConfig } from '../preset';
import { renderSlot, slotProps } from '../slots';
import { Button } from '../button/Button';
import type { ButtonConfig } from '../button/types';
import type { CardApi, CardComponent, CardConfig, CardRootProps, CardSlot, CardState } from './types';

const filled = (node: React.ReactNode) => node != null && node !== false && node !== '';
const LEVELS = [2, 3, 4, 5, 6];

/**
 * A content surface, as a hook that hands back a component.
 *
 *   const Pro = useCard({ title: 'Pro', description: 'For growing teams', actions: [{ label: 'Upgrade', onClick: upgrade }] });
 *   return <Pro />;
 *
 * Precedence: this config, then `defaults.card`, then the library default.
 */
export function useCard(input: CardConfig = {}): CardComponent {
  const ctx = usePinfold();
  const config = ctx.defaults.card ? mergeConfig<CardConfig>(ctx.defaults.card, input) : input;

  if (process.env.NODE_ENV !== 'production') {
    void import('@pinfold/core/meta').then(({ cardMeta, validateConfig }) => {
      for (const problem of validateConfig(cardMeta, input)) warnOnce(true, problem.message);
    });
    const inactive = inactiveCardOptions(config);
    for (const key in inactive) warnOnce((input as Record<string, unknown>)[key] !== undefined, `Card: \`${key}\` has no visible effect here. ${inactive[key]}`);
  }

  const linked = !!config.href && filled(config.title);
  const state: CardState = { variant: config.variant ?? 'outline', orientation: config.image ? config.orientation ?? 'vertical' : 'vertical', linked };

  const getRootProps = (props?: PropsBag): PropsBag =>
    mergeProps(
      {
        'data-variant': state.variant,
        'data-padding': config.padding ?? 'md',
        'data-orientation': state.orientation,
        'data-link': linked ? '' : undefined,
        'data-animate': ctx.disableAnimation ? undefined : '',
        'data-unstyled': config.unstyled ? '' : undefined,
      },
      props,
    );

  const render = (rootProps?: CardRootProps): React.ReactElement => {
    const cls = (name: string) => (config.unstyled ? undefined : name);
    const slot = (name: CardSlot, content: React.ReactNode, tag: string, base: PropsBag = {}) =>
      renderSlot(config, name, slotProps(config, name, { className: cls(`pinfold-card__${name}`), ...base }), state, content, (p, c) => React.createElement(tag, p, c));
    const vars = dimensionVars('card', config.dimensions);
    const root = slotProps(
      config,
      'root',
      getRootProps(mergeProps({ className: config.unstyled ? config.className : cn('pinfold pinfold-card', config.className), style: vars || config.style ? { ...vars, ...config.style } : undefined }, rootProps)),
    );
    const level = LEVELS.indexOf(Number(config.headingLevel)) === -1 ? 3 : Number(config.headingLevel);
    // The title is the link; its ::after stretches the hit area over the card (CSS), so the card is
    // read as its title, not as every word inside it.
    const title = linked ? (
      <a className={cls('pinfold-card__link')} href={config.href} target={config.target} rel={buttonRel(config.target, config.rel)}>
        {config.title}
      </a>
    ) : (
      config.title
    );
    const actions = config.actions ?? [];
    const button = (action: ButtonConfig, i: number) => <Button key={i} size="sm" variant={i === 0 ? 'solid' : 'outline'} {...action} />;
    const content = (
      <>
        {config.image ? slot('media', null, 'img', { src: config.image.src, alt: config.image.alt ?? '', loading: 'lazy', decoding: 'async' }) : null}
        {slot(
          'body',
          <>
            {filled(config.title) ? slot('title', title, `h${level}`) : null}
            {filled(config.description) ? slot('description', config.description, 'p') : null}
            {filled(config.content) ? slot('content', config.content, 'div') : null}
            {actions.length ? slot('actions', actions.map(button), 'div') : null}
          </>,
          'div',
        )}
      </>
    );
    return renderSlot(config, 'root', root, state, content, (p, c) => React.createElement(config.as ?? 'div', p, c)) as React.ReactElement;
  };

  const api: CardApi = { getRootProps, render };
  return usePinfoldComponent<CardApi, CardRootProps>('Card', api, (props) => render(props));
}
