import * as React from 'react';
import { cn, dataAttr, inactiveTagsOptions, mergeProps, nextIndexFromKey, warnOnce, type PinfoldTone, type PropsBag } from '@pinfold/core';
import { useControllableState, useId } from '../hooks';
import { usePinfold } from '../provider';
import { usePinfoldComponent } from '../component';
import { mergeConfig } from '../preset';
import { renderSlot, slotProps } from '../slots';
import { followLink } from '../link';
import { VISUALLY_HIDDEN } from '../a11y';
import { CLOSE_ICON } from '../nav-icons';
import type { TagsApi, TagsComponent, TagsConfig, TagsItem, TagsRootProps, TagsSlot, TagsState } from './types';

interface Tag {
  value: string;
  label: React.ReactNode;
  text: string;
  icon?: React.ReactNode;
  tone?: PinfoldTone;
  href?: string;
  removable?: boolean;
  disabled: boolean;
}

/**
 * Tags (chips): labels to show, filters to remove, or choices to pick, as a hook that hands back a
 * component.
 *
 *   const Filters = useTags({ label: 'Filters', items: filters, onRemove: remove });
 *   return <Filters />;
 *
 * Precedence: this config, then `defaults.tags`, then the provider (size), then the library default.
 * The tone never comes from the provider: tags are quiet unless asked.
 */
export function useTags<V extends string = string>(input: TagsConfig<V>): TagsComponent {
  const ctx = usePinfold();
  const own = input as unknown as TagsConfig;
  const config = ctx.defaults.tags ? mergeConfig<TagsConfig>(ctx.defaults.tags, own) : own;
  const base = useId();
  const list = React.useRef<HTMLElement | null>(null);
  const tags: Tag[] = (config.items ?? []).map((item) =>
    typeof item === 'string'
      ? { value: item, label: item, text: item, disabled: false }
      : { ...(item as TagsItem), label: item.label ?? item.value, text: typeof item.label === 'string' ? item.label : item.value, disabled: !!item.disabled },
  );
  const selection = config.selection ?? 'none';
  const choosing = selection !== 'none';
  const [value, setValue] = useControllableState<readonly string[]>({ value: config.value, defaultValue: config.defaultValue ?? [] });
  const [expanded, setExpanded] = React.useState(false);
  const [focused, setFocused] = React.useState<number | null>(null);
  // After a removal, focus the tag that took the removed one's place.
  const refocus = React.useRef<number | null>(null);

  if (process.env.NODE_ENV !== 'production') {
    void import('@pinfold/core/meta').then(({ tagsMeta, validateConfig }) => {
      for (const problem of validateConfig(tagsMeta, input)) warnOnce(true, problem.message);
      const inactive = inactiveTagsOptions(config);
      for (const key in inactive) warnOnce((input as unknown as Record<string, unknown>)[key] !== undefined, `Tags: \`${key}\` has no visible effect here. ${inactive[key]}`);
    });
    warnOnce(new Set(tags.map((t) => t.value)).size !== tags.length, 'Tags: every tag needs its own `value`.');
  }

  const state: TagsState = { variant: config.variant ?? 'soft', size: config.size ?? ctx.size, tone: config.tone ?? 'neutral', selection, value };
  const max = config.maxVisible;
  const shown = !expanded && max !== undefined && tags.length > max ? tags.slice(0, max) : tags;
  const hidden = tags.length - shown.length;

  React.useEffect(() => {
    if (refocus.current === null) return;
    const all = list.current?.querySelectorAll<HTMLElement>(choosing ? '[role="option"]' : '[data-tag-remove], [data-tag-link]');
    if (all?.length) all[Math.min(refocus.current, all.length - 1)]?.focus();
    refocus.current = null;
  });

  const removable = (t: Tag) => !!config.onRemove && t.removable !== false && !t.disabled;
  const remove = (i: number, event: React.SyntheticEvent) => {
    const t = shown[i];
    if (!t || !removable(t)) return;
    refocus.current = i;
    if (value.includes(t.value)) setValue(value.filter((v) => v !== t.value));
    config.onRemove!(t.value as V & string, event);
  };
  const choose = (t: Tag, event: React.SyntheticEvent) => {
    if (t.disabled) return;
    const on = value.includes(t.value);
    const next = selection === 'single' ? (on ? [] : [t.value]) : on ? value.filter((v) => v !== t.value) : [...value, t.value];
    setValue(next);
    config.onChange?.(next as Array<V & string>, event);
  };

  const onKeyDown = (event: React.KeyboardEvent) => {
    const all = Array.from(list.current?.querySelectorAll<HTMLElement>('[role="option"]') ?? []);
    const current = all.indexOf(document.activeElement as HTMLElement);
    if (current === -1) return;
    if (event.key === 'Delete' || event.key === 'Backspace') {
      event.preventDefault();
      remove(current, event);
      return;
    }
    if (event.key === ' ' || event.key === 'Enter') {
      event.preventDefault();
      choose(shown[current], event);
      return;
    }
    const next = nextIndexFromKey(event.key, current, all.length, { orientation: 'horizontal', dir: ctx.dir, loop: true });
    if (next === null) return;
    event.preventDefault();
    all[next].focus();
  };

  const getRootProps = (props?: PropsBag): PropsBag =>
    mergeProps(
      {
        'data-variant': state.variant,
        'data-radius': config.radius ?? 'full',
        'data-size': state.size,
        'data-tone': state.tone,
        'data-selection': choosing ? selection : undefined,
        'data-animate': dataAttr(!ctx.disableAnimation),
        'data-unstyled': dataAttr(config.unstyled),
      },
      props,
    );

  const render = (rootProps?: TagsRootProps): React.ReactElement => {
    const cls = (name: string) => (config.unstyled ? undefined : name);
    const slot = (name: TagsSlot, content: React.ReactNode, tag: string, own: PropsBag = {}) =>
      renderSlot(config, name, slotProps(config, name, { className: cls(`pinfold-tags__${name}`), ...own }), state, content, (p, c) => React.createElement(tag, p, c));
    const root = slotProps(config, 'root', getRootProps(mergeProps({ className: config.unstyled ? config.className : cn('pinfold pinfold-tags', config.className), style: config.style }, rootProps)));
    const labelId = `${base}-label`;
    const hint = `${base}-hint`;
    const removeLabel = config.removeLabel ?? 'Remove';
    const stop = focused ?? Math.max(0, shown.findIndex((t) => !t.disabled));
    const body = (t: Tag) => (
      <>
        {t.icon != null ? slot('icon', t.icon, 'span', { 'aria-hidden': true }) : null}
        {slot('text', t.label, 'span', { title: t.text })}
      </>
    );
    const items = shown.map((t, i) => {
      const on = value.includes(t.value);
      const common = { 'data-tone': t.tone, 'data-disabled': dataAttr(t.disabled), 'data-selected': dataAttr(on) };
      if (choosing) {
        return (
          <React.Fragment key={t.value}>
            {slot(
              'tag',
              <>
                {body(t)}
                {/* Pointer only: Delete removes the focused tag (a button inside an option is not allowed). */}
                {removable(t)
                  ? slot('remove', CLOSE_ICON, 'span', {
                      'aria-hidden': true,
                      title: `${removeLabel} ${t.text}`,
                      onClick: (event: React.MouseEvent) => {
                        event.stopPropagation();
                        remove(i, event);
                      },
                    })
                  : null}
              </>,
              'div',
              {
                ...common,
                role: 'option',
                'aria-selected': on,
                'aria-disabled': t.disabled || undefined,
                'aria-keyshortcuts': removable(t) ? 'Delete' : undefined,
                'aria-describedby': removable(t) ? hint : undefined,
                tabIndex: i === stop ? 0 : -1,
                onClick: (event: React.MouseEvent) => choose(t, event),
                onFocus: () => setFocused(i),
                onBlur: () => setFocused(null),
              },
            )}
          </React.Fragment>
        );
      }
      const content = t.href && !t.disabled ? (
        <a href={t.href} className={cls('pinfold-tags__link')} data-tag-link="" onClick={(event) => followLink(event, t.href, ctx.navigate)}>
          {body(t)}
        </a>
      ) : (
        body(t)
      );
      return (
        <React.Fragment key={t.value}>
          {slot(
            'tag',
            <>
              {content}
              {removable(t)
                ? slot('remove', CLOSE_ICON, 'button', {
                    type: 'button',
                    'aria-label': `${removeLabel} ${t.text}`,
                    title: `${removeLabel} ${t.text}`,
                    'data-tag-remove': '',
                    onClick: (event: React.MouseEvent) => remove(i, event),
                    onKeyDown: (event: React.KeyboardEvent) => {
                      if (event.key === 'Delete' || event.key === 'Backspace') remove(i, event);
                    },
                  })
                : null}
            </>,
            'li',
            common,
          )}
        </React.Fragment>
      );
    });
    // Named by what it shows ("+3") and what it does, so speech input can say what is seen.
    const more = hidden > 0 ? slot('more', <>{`+${hidden}`}<span style={VISUALLY_HIDDEN}>{` ${config.moreLabel ?? 'Show all'}`}</span></>, 'button', { type: 'button', title: config.moreLabel ?? 'Show all', onClick: () => setExpanded(true) }) : null;
    const content = (
      <>
        {slot('label', config.label, 'span', { id: labelId, ...(config.hideLabel ? { style: VISUALLY_HIDDEN } : {}) })}
        {tags.length === 0 && config.emptyText != null
          ? slot('empty', config.emptyText, 'span')
          : choosing
            ? (
                <>
                  {slot('list', items, 'div', { ref: list, role: 'listbox', 'aria-labelledby': labelId, 'aria-multiselectable': selection === 'multiple' || undefined, 'aria-orientation': 'horizontal', onKeyDown })}
                  {more}
                </>
              )
            : slot('list', <>{items}{more ? <li className={cls('pinfold-tags__cell')}>{more}</li> : null}</>, 'ul', { ref: list, 'aria-labelledby': labelId })}
        {config.onRemove && choosing ? (
          <span id={hint} style={VISUALLY_HIDDEN}>
            {config.removeHint ?? 'Press Delete to remove'}
          </span>
        ) : null}
      </>
    );
    return renderSlot(config, 'root', root, state, content, (p, c) => <div {...p}>{c}</div>) as React.ReactElement;
  };

  const api: TagsApi = { value, setValue: (v) => setValue([...v]), expand: () => setExpanded(true), getRootProps, render };
  return usePinfoldComponent<TagsApi, TagsRootProps>('Tags', api, (props) => render(props));
}
