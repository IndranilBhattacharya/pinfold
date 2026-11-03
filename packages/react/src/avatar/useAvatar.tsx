import * as React from 'react';
import { avatarInitials, avatarOverflow, avatarTone, cn, dimensionVars, inactiveAvatarOptions, mergeProps, warnOnce, type PropsBag } from '@pinfold/core';
import { usePinfold } from '../provider';
import { useIsomorphicLayoutEffect } from '../hooks';
import { usePinfoldComponent } from '../component';
import { mergeConfig } from '../preset';
import { renderSlot, slotProps } from '../slots';
import type { AvatarApi, AvatarComponent, AvatarConfig, AvatarPerson, AvatarRootProps, AvatarSlot, AvatarState } from './types';

type Load = 'loading' | 'loaded' | 'error';

interface FaceProps {
  person: AvatarPerson;
  config: AvatarConfig;
  state: AvatarState;
  slot: 'root' | 'item';
  props: PropsBag;
}

/** One avatar: the picture over its initials, named once for assistive tech. */
function Face({ person, config, state, slot, props }: FaceProps): React.ReactElement {
  const [load, setLoad] = React.useState<Load>('loading');
  const img = React.useRef<HTMLImageElement | null>(null);
  // An image that settled before hydration fires no event: read its state once mounted.
  useIsomorphicLayoutEffect(() => {
    const el = img.current;
    if (el && el.complete) setLoad(el.naturalWidth > 0 ? 'loaded' : 'error');
  }, []);

  const cls = (name: string) => (config.unstyled ? undefined : name);
  const part = (name: AvatarSlot, content: React.ReactNode, base: PropsBag, tag = 'span') =>
    renderSlot(config, name, slotProps(config, name, base), state, content, (p, c) => React.createElement(tag, p, c));
  const name = person.alt ?? person.name;
  const spoken = name ? (person.status ? `${name}, ${person.status}` : name) : undefined;
  const tone = config.tone && config.tone !== 'auto' ? config.tone : avatarTone(person.name ?? person.alt);
  const showImage = person.src && load !== 'error';

  const own = mergeProps(
    {
      role: spoken ? 'img' : undefined,
      'aria-label': spoken,
      'aria-hidden': spoken ? undefined : true,
      'data-tone': tone,
      'data-loaded': load === 'loaded' && person.src ? '' : undefined,
    },
    props,
  );
  const content = (
    <>
      {part('fallback', person.initials ?? avatarInitials(person.name ?? person.alt), { className: cls('pinfold-avatar__fallback'), 'aria-hidden': true })}
      {showImage
        ? part('image', null, {
            ref: img,
            className: cls('pinfold-avatar__image'),
            src: person.src,
            alt: '',
            loading: 'lazy',
            decoding: 'async',
            onLoad: () => setLoad('loaded'),
            onError: () => setLoad('error'),
          }, 'img')
        : null}
      {person.status ? part('status', null, { className: cls('pinfold-avatar__status'), 'data-status': person.status, 'aria-hidden': true }) : null}
    </>
  );
  return renderSlot(config, slot, slot === 'root' ? own : slotProps(config, 'item', own), state, content, (p, c) => <span {...p}>{c}</span>) as React.ReactElement;
}

/**
 * A person's picture with initials as the fallback, or a stacked group, as a hook that hands
 * back a component.
 *
 *   const Me = useAvatar({ name: 'Ada Lovelace', src: photo, status: 'online' });
 *   const Team = useAvatar({ items: members, max: 3, label: 'Project members' });
 *
 * Precedence: this config, then `defaults.avatar`, then the provider (size), then the library default.
 */
export function useAvatar(input: AvatarConfig = {}): AvatarComponent {
  const ctx = usePinfold();
  const config = ctx.defaults.avatar ? mergeConfig<AvatarConfig>(ctx.defaults.avatar, input) : input;
  const group = Array.isArray(config.items);

  if (process.env.NODE_ENV !== 'production') {
    void import('@pinfold/core/meta').then(({ avatarMeta, validateConfig }) => {
      for (const problem of validateConfig(avatarMeta, input)) warnOnce(true, problem.message);
    });
    const inactive = inactiveAvatarOptions(config);
    for (const key in inactive) warnOnce((input as Record<string, unknown>)[key] !== undefined, `Avatar: \`${key}\` has no visible effect here. ${inactive[key]}`);
    warnOnce(!group && !config.name && !config.alt, 'Avatar: without a `name` (or `alt`) it is hidden from screen readers. Give it the person\'s name.');
  }

  const state: AvatarState = { size: config.size ?? ctx.size, shape: config.shape ?? 'circle', group };

  const getRootProps = (props?: PropsBag): PropsBag =>
    mergeProps(
      {
        // A single avatar's role and name come from its face; only a group names itself here.
        ...(group ? { role: 'group', 'aria-label': config.label } : null),
        'data-size': state.size,
        'data-shape': state.shape,
        'data-group': group ? '' : undefined,
        'data-unstyled': config.unstyled ? '' : undefined,
      },
      props,
    );

  const render = (rootProps?: AvatarRootProps): React.ReactElement => {
    const cls = (name: string) => (config.unstyled ? undefined : name);
    const vars = dimensionVars('avatar', config.dimensions);
    const root = slotProps(
      config,
      'root',
      getRootProps(mergeProps({ className: config.unstyled ? config.className : cn('pinfold pinfold-avatar', config.className), style: vars || config.style ? { ...vars, ...config.style } : undefined }, rootProps)),
    );
    // Keyed by the picture: a new src remounts the face, resetting its load state.
    if (!group) return <Face key={config.src ?? ''} person={config} config={config} state={state} slot="root" props={root} />;

    const items = config.items as readonly AvatarPerson[];
    const { shown, rest } = avatarOverflow(items.length, config.max);
    const hidden = items.slice(shown).map((p) => p.alt ?? p.name).filter(Boolean).join(', ');
    const content = (
      <>
        {items.slice(0, shown).map((person, i) => (
          // Keyed by position and picture: a new src remounts the face, resetting its load state.
          <Face key={`${i}:${person.src ?? ''}`} person={person} config={config} state={state} slot="item" props={{ className: cls('pinfold-avatar__item') }} />
        ))}
        {rest > 0
          ? renderSlot(
              config,
              'overflow',
              slotProps(config, 'overflow', { className: cls('pinfold-avatar__item pinfold-avatar__overflow'), role: 'img', 'aria-label': `${rest} more`, title: hidden || undefined, 'data-tone': 'neutral' }),
              state,
              `+${rest}`,
              (p, c) => <span {...p}>{c}</span>,
            )
          : null}
      </>
    );
    return renderSlot(config, 'root', root, state, content, (p, c) => <div {...p}>{c}</div>) as React.ReactElement;
  };

  const api: AvatarApi = { getRootProps, render };
  return usePinfoldComponent<AvatarApi, AvatarRootProps>('Avatar', api, (props) => render(props));
}
