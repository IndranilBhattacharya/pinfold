import * as React from 'react';
import {
  avatarClickable,
  avatarInitials,
  avatarOverflow,
  avatarTone,
  buttonRel,
  cn,
  dataAttr,
  dimensionVars,
  inactiveAvatarOptions,
  mergeProps,
  radiusProps,
  resolveNode,
  warnOnce,
  type PropsBag,
} from '@pinfold/core';
import { usePinfold } from '../provider';
import { useEvent, useIsomorphicLayoutEffect } from '../hooks';
import { usePinfoldComponent } from '../component';
import { followLink } from '../link';
import { mergeConfig } from '../preset';
import { renderSlot, slotProps } from '../slots';
import { Tooltip } from '../tooltip/Tooltip';
import type { AvatarApi, AvatarComponent, AvatarConfig, AvatarLoadingStatus, AvatarPerson, AvatarRootProps, AvatarSlot, AvatarState } from './types';

const SIZES = ['xs', 'sm', 'md', 'lg', 'xl'];
const filled = (node: unknown) => node != null && node !== false && node !== '';

/** A head-and-shoulders glyph: the last step of the fallback chain. */
const PERSON_ICON = (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" focusable="false">
    <circle cx="12" cy="9" r="3.6" />
    <path d="M5.5 19.5c1.2-3.2 3.7-4.8 6.5-4.8s5.3 1.6 6.5 4.8" />
  </svg>
);

interface FaceProps {
  person: AvatarPerson;
  config: AvatarConfig;
  state: AvatarState;
  slot: 'root' | 'item';
  props: PropsBag;
  /** Props a surrounding tooltip passes down. */
  [handler: string]: unknown;
}

/** One avatar: the picture over its fallback, named once for assistive tech. */
function Face({ person, config, state: shared, slot, props, ...fromTooltip }: FaceProps): React.ReactElement {
  const ctx = usePinfold();
  const [load, setLoad] = React.useState<AvatarLoadingStatus>(person.src ? 'loading' : 'error');
  const img = React.useRef<HTMLImageElement | null>(null);
  const report = useEvent((status: AvatarLoadingStatus) => config.onLoadingStatusChange?.(status));
  const settle = (status: AvatarLoadingStatus) => {
    setLoad(status);
    report(status);
  };
  // An image that settled before hydration fires no event: read its state once mounted.
  useIsomorphicLayoutEffect(() => {
    const el = img.current;
    if (person.src) report('loading');
    if (el && el.complete) settle(el.naturalWidth > 0 ? 'loaded' : 'error');
  }, []);

  const state: AvatarState = { ...shared, loading: load };
  const cls = (name: string) => (config.unstyled ? undefined : name);
  const part = (name: AvatarSlot, content: React.ReactNode, base: PropsBag, tag = 'span') =>
    renderSlot(config, name, slotProps(config, name, base), state, content, (p, c) => React.createElement(tag, p, c));
  const name = person.alt ?? person.name;
  const spoken = name ? (person.status ? `${name}, ${person.status}` : name) : undefined;
  const tone = config.tone && config.tone !== 'auto' ? config.tone : avatarTone(person.colorFrom ?? person.name ?? person.alt);
  const showImage = person.src && load !== 'error';
  const clickable = avatarClickable(person);

  // The chain: picture, then your fallback, then the initials, then the icon.
  const custom = resolveNode(config.fallback, state) as React.ReactNode;
  const initials = person.initials ?? avatarInitials(person.name ?? person.alt);
  const kind = filled(custom) ? 'custom' : initials ? 'initials' : 'icon';
  const fallback = kind === 'custom' ? custom : kind === 'initials' ? initials : config.icon ?? PERSON_ICON;

  const own = mergeProps(
    {
      role: spoken && !clickable ? 'img' : undefined,
      'aria-label': spoken,
      'aria-hidden': spoken ? undefined : true,
      'data-tone': tone,
      'data-loaded': load === 'loaded' && person.src ? '' : undefined,
      'data-clickable': dataAttr(clickable),
      ...(clickable
        ? person.href
          ? { href: person.href, rel: buttonRel(undefined, undefined), onClick: (e: React.MouseEvent<HTMLElement>) => { person.onClick?.(e); followLink(e, person.href, ctx.navigate); } }
          : { type: 'button', onClick: (e: React.MouseEvent<HTMLElement>) => person.onClick?.(e) }
        : null),
    },
    // Tooltip handlers chain with the face's own (a click still reaches `onClick`).
    mergeProps(fromTooltip as PropsBag, props),
  );
  const content = (
    <>
      {part('fallback', fallback, { className: cls('pinfold-avatar__fallback'), 'aria-hidden': true, 'data-fallback': kind })}
      {showImage
        ? part('image', null, {
            ref: img,
            className: cls('pinfold-avatar__image'),
            src: person.src,
            alt: '',
            loading: 'lazy',
            decoding: 'async',
            onLoad: () => settle('loaded'),
            onError: () => settle('error'),
          }, 'img')
        : null}
      {person.status ? part('status', null, { className: cls('pinfold-avatar__status'), 'data-status': person.status, 'aria-hidden': true }) : null}
    </>
  );
  const tag = clickable ? (person.href ? 'a' : 'button') : 'span';
  return renderSlot(config, slot, slot === 'root' ? own : slotProps(config, 'item', own), state, content, (p, c) => React.createElement(tag, p, c)) as React.ReactElement;
}

/**
 * A person's picture with initials or an icon as the fallback, or a stacked group, as a hook that
 * hands back a component.
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

  const rawSize = config.size ?? ctx.size;
  const preset = typeof rawSize === 'string' && SIZES.indexOf(rawSize) !== -1;
  const state: AvatarState = { size: preset ? (rawSize as AvatarState['size']) : 'custom', shape: config.shape ?? 'circle', group, loading: 'error' };
  const ring = config.ring === true ? 'auto' : config.ring || undefined;

  const getRootProps = (props?: PropsBag): PropsBag =>
    mergeProps(
      {
        ...radiusProps(config.radius),
        // A single avatar's role and name come from its face; only a group names itself here.
        ...(group ? { role: 'group', 'aria-label': config.label } : null),
        'data-size': preset ? rawSize : undefined,
        'data-shape': state.shape,
        'data-ring': ring,
        'data-status-placement': config.statusPlacement ?? 'bottom-end',
        'data-group': dataAttr(group),
        'data-expand': dataAttr(group && config.expandOnHover),
        'data-animate': ctx.disableAnimation ? undefined : '',
        'data-unstyled': config.unstyled ? '' : undefined,
      },
      props,
    );

  const render = (rootProps?: AvatarRootProps): React.ReactElement => {
    const cls = (name: string) => (config.unstyled ? undefined : name);
    const vars = { ...dimensionVars('avatar', config.dimensions), ...(preset ? null : dimensionVars('avatar', { size: rawSize as string | number })) };
    const hasVars = Object.keys(vars).length > 0;
    const root = slotProps(
      config,
      'root',
      getRootProps(mergeProps({ className: config.unstyled ? config.className : cn('pinfold pinfold-avatar', config.className), style: hasVars || config.style ? { ...vars, ...config.style } : undefined }, rootProps)),
    );
    const tip = config.tooltip ?? group;
    // A tooltip must work from the keyboard too, so a face that is not already a control takes focus.
    const face = (element: React.ReactElement, person: AvatarPerson, key?: React.Key) => {
      const name = person.alt ?? person.name;
      if (!tip || !name) return element;
      const focus = avatarClickable(person) ? {} : { tabIndex: 0 };
      return <Tooltip key={key} content={person.status ? `${name}, ${person.status}` : name} delay={150} trigger={React.cloneElement(element, focus as object)} />;
    };
    // Keyed by the picture: a new src remounts the face, resetting its load state.
    if (!group) return face(<Face key={config.src ?? ''} person={config} config={config} state={state} slot="root" props={root} />, config) as React.ReactElement;

    const items = config.items as readonly AvatarPerson[];
    const { shown, rest } = avatarOverflow(items.length, config.max);
    const folded = items.slice(shown);
    const hidden = folded.map((p) => p.alt ?? p.name).filter(Boolean).join(', ');
    const label = config.surplus ? config.surplus({ count: rest, hidden: folded.slice() }) : `+${rest}`;
    const more = (props: PropsBag) => renderSlot(config, 'overflow', props, state, label, (p, c) => <span {...p}>{c}</span>) as React.ReactElement;
    const moreProps = slotProps(config, 'overflow', { className: cls('pinfold-avatar__item pinfold-avatar__overflow'), role: 'img', 'aria-label': `${rest} more`, 'data-tone': 'neutral', tabIndex: tip && hidden ? 0 : undefined });
    const content = (
      <>
        {items.slice(0, shown).map((person, i) => (
          // Keyed by position and picture: a new src remounts the face, resetting its load state.
          <React.Fragment key={`${i}:${person.src ?? ''}`}>{face(<Face person={person} config={config} state={state} slot="item" props={{ className: cls('pinfold-avatar__item') }} />, person)}</React.Fragment>
        ))}
        {rest > 0 ? (tip && hidden ? <Tooltip content={hidden} delay={150} trigger={more(moreProps)} /> : more(moreProps)) : null}
      </>
    );
    return renderSlot(config, 'root', root, state, content, (p, c) => <div {...p}>{c}</div>) as React.ReactElement;
  };

  const api: AvatarApi = { getRootProps, render };
  return usePinfoldComponent<AvatarApi, AvatarRootProps>('Avatar', api, (props) => render(props));
}
