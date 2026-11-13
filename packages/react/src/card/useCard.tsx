import * as React from 'react';
import {
  buttonRel,
  cardHoverEffect,
  cardInteraction,
  cardMediaPosition,
  cn,
  dataAttr,
  dimensionVars,
  inactiveCardOptions,
  mergeProps,
  radiusProps,
  resolveNode,
  warnOnce,
  type PropsBag,
} from '@pinfold/core';
import { usePinfold } from '../provider';
import { followLink } from '../link';
import { useId } from '../hooks';
import { usePinfoldComponent } from '../component';
import { mergeConfig } from '../preset';
import { renderSlot, slotProps } from '../slots';
import { Button } from '../button/Button';
import type { ButtonConfig } from '../button/types';
import type { CardApi, CardComponent, CardConfig, CardRootProps, CardSlot, CardState } from './types';

const filled = (node: unknown) => node != null && node !== false && node !== '';
const LEVELS = [2, 3, 4, 5, 6];
const ratio = (value: string | number | undefined) => (value === undefined || value === '' ? undefined : String(value));

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
  const id = useId();

  if (process.env.NODE_ENV !== 'production') {
    void import('@pinfold/core/meta').then(({ cardMeta, validateConfig }) => {
      for (const problem of validateConfig(cardMeta, input)) warnOnce(true, problem.message);
    });
    const inactive = inactiveCardOptions(config);
    for (const key in inactive) warnOnce((input as Record<string, unknown>)[key] !== undefined, `Card: \`${key}\` has no visible effect here. ${inactive[key]}`);
    warnOnce(!!config.selectable && !filled(config.title) && !config.label, 'Card: a selectable card needs a `title` or a `label` to name its checkbox.');
  }

  const interaction = cardInteraction(config);
  const disabled = !!config.disabled;
  const loading = !!config.loading;
  const selectable = interaction === 'checkbox' || interaction === 'radio' ? interaction : false;
  const [ownSelected, setOwnSelected] = React.useState(!!config.defaultSelected);
  const controlled = config.selected !== undefined;
  const selected = controlled ? !!config.selected : ownSelected;
  const setSelected = (next: boolean, event?: React.ChangeEvent<HTMLInputElement>) => {
    if (!controlled) setOwnSelected(next);
    if (event) config.onSelectedChange?.(next, event);
  };
  // An uncontrolled radio card is unchecked natively when another card in its group is chosen, and that
  // fires no event on it: re-read its own state on any change in the group, so `selected` and
  // `data-selected` never go stale.
  const box = React.useRef<HTMLInputElement | null>(null);
  const watchGroup = selectable === 'radio' && !controlled && !!config.name;
  React.useEffect(() => {
    if (!watchGroup) return;
    const onChange = (event: Event) => {
      const own = box.current;
      const other = event.target as HTMLInputElement | null;
      if (!own || !other || other === own || other.type !== 'radio' || other.name !== own.name || other.form !== own.form) return;
      setOwnSelected(own.checked);
    };
    document.addEventListener('change', onChange, true);
    return () => document.removeEventListener('change', onChange, true);
  }, [watchGroup]);

  const hasMedia = !!config.image || filled(config.media);
  const mediaPosition = cardMediaPosition(config);
  const state: CardState = {
    variant: config.variant ?? 'outline',
    orientation: hasMedia && (mediaPosition === 'start' || mediaPosition === 'end') ? 'horizontal' : 'vertical',
    mediaPosition,
    linked: interaction === 'link',
    pressable: interaction === 'button',
    selectable,
    selected,
    disabled,
    loading,
  };

  const getRootProps = (props?: PropsBag): PropsBag =>
    mergeProps(
      {
        ...radiusProps(config.radius),
        'aria-busy': loading ? true : undefined,
        'data-variant': state.variant,
        'data-tone': config.tone ?? 'primary',
        'data-padding': config.padding ?? 'md',
        'data-orientation': state.orientation,
        'data-media-position': hasMedia ? mediaPosition : undefined,
        'data-hover-effect': disabled || loading ? 'none' : cardHoverEffect(config),
        'data-link': dataAttr(state.linked),
        'data-pressable': dataAttr(state.pressable),
        'data-selectable': selectable || undefined,
        'data-selected': dataAttr(selectable && selected),
        'data-disabled': dataAttr(disabled),
        'data-loading': dataAttr(loading),
        'data-dividers': dataAttr(config.dividers),
        'data-actions-align': config.actionsAlign ?? 'start',
        'data-scrim': hasMedia && mediaPosition === 'cover' ? config.scrim ?? 'gradient' : undefined,
        'data-animate': ctx.disableAnimation ? undefined : '',
        'data-unstyled': config.unstyled ? '' : undefined,
      },
      props,
    );

  const render = (rootProps?: CardRootProps): React.ReactElement => {
    const { children, ...rest } = rootProps ?? {};
    const cls = (name: string) => (config.unstyled ? undefined : name);
    const slot = (name: CardSlot, content: React.ReactNode, tag: string, base: PropsBag = {}) =>
      renderSlot(config, name, slotProps(config, name, { className: cls(`pinfold-card__${name}`), ...base }), state, content, (p, c) => React.createElement(tag, p, c));
    const vars = { ...dimensionVars('card', config.dimensions), ...(ratio(config.mediaRatio as string | number | undefined) ? { '--pinfold-crd-ratio': ratio(config.mediaRatio as string | number) } : null) };
    const hasVars = Object.keys(vars).length > 0;
    const root = slotProps(
      config,
      'root',
      getRootProps(mergeProps({ className: config.unstyled ? config.className : cn('pinfold pinfold-card', config.className), style: hasVars || config.style ? { ...vars, ...config.style } : undefined }, rest as PropsBag)),
    );
    const level = LEVELS.indexOf(Number(config.headingLevel)) === -1 ? 3 : Number(config.headingLevel);
    const titleText = resolveNode(config.title, state) as React.ReactNode;
    const description = resolveNode(config.description, state) as React.ReactNode;
    const hasTitle = filled(titleText);
    const titleId = `${id}-title`;
    const descriptionId = `${id}-description`;

    // The card's one control. The title is the link or button; its ::after stretches the hit area
    // over the card (CSS), so the card is read as its title, not as every word inside it.
    const blocked = (event: React.SyntheticEvent) => {
      event.preventDefault();
      event.stopPropagation();
    };
    const control = (text: React.ReactNode, named: boolean): React.ReactNode => {
      const labelled = named ? {} : { 'aria-label': config.label };
      if (state.linked)
        return (
          <a
            className={cls('pinfold-card__link')}
            href={disabled ? undefined : config.href}
            role={disabled ? 'link' : undefined}
            aria-disabled={disabled || undefined}
            tabIndex={disabled ? 0 : undefined}
            target={config.target}
            rel={buttonRel(config.target, config.rel)}
            onClick={(event) => (disabled ? blocked(event) : followLink(event, config.href, ctx.navigate, config.target))}
            {...labelled}
          >
            {text}
          </a>
        );
      if (state.pressable)
        return (
          <button
            type="button"
            className={cls('pinfold-card__link')}
            aria-disabled={disabled || undefined}
            onClick={(event) => (disabled ? blocked(event) : config.onPress?.(event))}
            {...labelled}
          >
            {text}
          </button>
        );
      return text;
    };
    const title = hasTitle ? control(titleText, true) : null;
    // No title: a stretched control named by `label` carries the press or the link.
    const untitled = !hasTitle && (state.linked || state.pressable) ? control(null, false) : null;

    const actions = config.actions ?? [];
    const button = (action: ButtonConfig, i: number) => (
      <Button
        key={i}
        size="sm"
        variant={i === 0 ? 'solid' : 'outline'}
        fullWidth={config.actionsAlign === 'stretch' || undefined}
        {...action}
        disabled={action.disabled ?? (disabled || undefined)}
        onClick={(event) => {
          const result = action.onClick?.(event);
          config.onAction?.(action, i, event);
          return result;
        }}
      />
    );

    const bar = (width: string, key?: number) => <span key={key} className={cls('pinfold-card__bar')} style={{ inlineSize: width }} />;
    const media = (() => {
      if (!hasMedia) return null;
      const node = loading ? null : filled(config.media) ? (resolveNode(config.media, state) as React.ReactNode) : config.image ? slot('image', null, 'img', { src: config.image.src, alt: config.image.alt ?? '', loading: 'lazy', decoding: 'async' }) : null;
      return slot('media', node, 'div', { 'data-placeholder': dataAttr(loading) });
    })();

    const eyebrow = filled(config.eyebrow) ? slot('eyebrow', config.eyebrow, 'div') : null;
    const subtitle = filled(config.subtitle) ? slot('subtitle', config.subtitle, 'div') : null;
    const heading = hasTitle ? slot('title', title, `h${level}`, { id: titleId }) : null;
    const hasHeader = filled(config.avatar) || filled(config.headerAction) || !!eyebrow || !!subtitle || hasTitle;
    const header = loading
      ? slot('placeholder', [bar('35%', 0), bar('70%', 1), bar('50%', 2)], 'div', { 'aria-hidden': true })
      : hasHeader
        ? slot(
            'header',
            <>
              {filled(config.avatar) ? slot('avatar', config.avatar, 'div') : null}
              <div className={cls('pinfold-card__heading')}>
                {eyebrow}
                {heading}
                {subtitle}
              </div>
              {filled(config.headerAction) ? slot('headerAction', config.headerAction, 'div') : null}
            </>,
            'div',
          )
        : null;
    const content = config.content ?? children;
    const hasFooter = filled(config.footer) || actions.length > 0;

    const body = slot(
      'body',
      <>
        {header}
        {!loading && filled(description) ? slot('description', description, 'p', { id: descriptionId }) : null}
        {!loading && filled(content) ? slot('content', content, 'div') : null}
        {!loading && hasFooter
          ? slot(
              'footer',
              <>
                {filled(config.footer) ? <div className={cls('pinfold-card__note')}>{config.footer}</div> : null}
                {actions.length ? slot('actions', actions.map(button), 'div') : null}
              </>,
              'div',
            )
          : null}
      </>,
      'div',
    );

    const select = selectable
      ? slot('select', null, 'input', {
          ref: box,
          type: selectable,
          name: config.name,
          value: config.value,
          disabled: disabled || undefined,
          'aria-label': hasTitle ? undefined : config.label,
          'aria-labelledby': hasTitle ? titleId : undefined,
          'aria-describedby': filled(description) && !loading ? descriptionId : undefined,
          // A radio left uncontrolled stays the DOM's: choosing another radio in the group unchecks it natively.
          ...(controlled || selectable === 'checkbox' ? { checked: selected } : { defaultChecked: !!config.defaultSelected }),
          onChange: (event: React.ChangeEvent<HTMLInputElement>) => setSelected(event.target.checked, event),
        })
      : null;

    const parts = (
      <>
        {select}
        {filled(config.ribbon) ? slot('ribbon', <span className={cls('pinfold-card__ribbonText')}>{config.ribbon}</span>, 'div', { 'aria-hidden': undefined }) : null}
        {mediaPosition === 'bottom' || mediaPosition === 'end' ? null : media}
        {body}
        {mediaPosition === 'bottom' || mediaPosition === 'end' ? media : null}
        {untitled}
        {filled(config.badge) ? slot('badge', config.badge, 'div') : null}
        {selectable ? slot('indicator', null, 'span', { 'aria-hidden': true, 'data-type': selectable }) : null}
      </>
    );
    return renderSlot(config, 'root', root, state, parts, (p, c) => React.createElement(config.as ?? 'div', p, c)) as React.ReactElement;
  };

  const api: CardApi = { selected, setSelected: (next: boolean) => setSelected(next), getRootProps, render };
  return usePinfoldComponent<CardApi, CardRootProps>('Card', api, (props) => render(props));
}
