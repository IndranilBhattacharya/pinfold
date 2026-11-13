import * as React from 'react';
import { cn, dataAttr, inactiveTagsOptions, mergeProps, moveItem, nextIndexFromKey, warnOnce, type PinfoldTone, type PropsBag } from '@pinfold/core';
import { useControllableState, useId } from '../hooks';
import { usePinfold } from '../provider';
import { usePinfoldComponent } from '../component';
import { mergeConfig } from '../preset';
import { ITEM, renderSlot, slotProps } from '../slots';
import { followLink } from '../link';
import { VISUALLY_HIDDEN } from '../a11y';
import { CLOSE_ICON } from '../nav-icons';
import type { TagsApi, TagsComponent, TagsConfig, TagsItem, TagsItemContext, TagsRootProps, TagsSlot, TagsState } from './types';

interface Tag {
  value: string;
  label: React.ReactNode;
  text: string;
  icon?: React.ReactNode;
  tone?: PinfoldTone;
  href?: string;
  removable?: boolean;
  editable?: boolean;
  disabled: boolean;
}

/** Which part of a tag had focus, so it can have it again after the tag moves or is renamed. */
type FocusPart = 'option' | 'remove' | 'edit' | 'link';
const PART_SELECTOR: Record<FocusPart, string> = { option: '[role="option"]', remove: '[data-tag-remove]', edit: '[data-tag-edit]', link: '[data-tag-link]' };

/**
 * Tags (chips): labels to show, filters to remove, choices to pick, a tag input (`onAdd`) whose tags
 * can be renamed (`onEdit`) and reordered (`onReorder`), as a hook that hands back a component.
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
  const addField = React.useRef<HTMLInputElement | null>(null);
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
  const [editing, setEditing] = React.useState<string | null>(null);
  const [draft, setDraft] = React.useState('');
  const [adding, setAdding] = React.useState('');
  const [drag, setDrag] = React.useState<{ from: number; over: number | null } | null>(null);
  const [said, setSaid] = React.useState('');
  // After a removal, focus the tag that took the removed one's place.
  const refocus = React.useRef<number | null>(null);
  // After a move or a rename, focus the same part of the same tag.
  const follow = React.useRef<{ index: number; part: FocusPart } | null>(null);

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
    const root = list.current;
    if (follow.current && root) {
      const { index, part } = follow.current;
      follow.current = null;
      // By place: a renamed tag may have a new value.
      const tag = root.querySelectorAll<HTMLElement>('[data-tag-value]')[index];
      const target = tag && (tag.matches(PART_SELECTOR[part]) ? tag : tag.querySelector<HTMLElement>(PART_SELECTOR[part]));
      target?.focus();
      return;
    }
    if (refocus.current === null) return;
    const all = root?.querySelectorAll<HTMLElement>(choosing ? '[role="option"]' : '[data-tag-remove], [data-tag-link], [data-tag-edit]');
    if (all?.length) all[Math.min(refocus.current, all.length - 1)]?.focus();
    else addField.current?.focus();
    refocus.current = null;
  });

  const removable = (t: Tag) => !!config.onRemove && t.removable !== false && !t.disabled;
  const editable = (t: Tag) => !!config.onEdit && t.editable !== false && !t.disabled && !(t.href && !choosing);
  const movable = (t: Tag) => !!config.onReorder && !t.disabled;
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
  const startEdit = (t: Tag) => {
    if (!editable(t)) return;
    setEditing(t.value);
    setDraft(t.text);
  };
  const finishEdit = (t: Tag, keep: boolean, event: React.SyntheticEvent) => {
    if (editing !== t.value) return;
    setEditing(null);
    follow.current = { index: tags.indexOf(t), part: choosing ? 'option' : 'edit' };
    const text = draft.trim();
    if (keep && text && text !== t.text) config.onEdit!(t.value as V & string, text, event);
  };
  /** Move a tag `by` places; `part` keeps focus on the same control of it. */
  const move = (from: number, to: number, event: React.SyntheticEvent, part?: FocusPart) => {
    const t = tags[from];
    if (!t || !movable(t) || to < 0 || to >= tags.length || to === from) return;
    const next = moveItem(tags.map((x) => x.value), from, to);
    if (part) follow.current = { index: to, part };
    setSaid(`${t.text}: ${to + 1} of ${tags.length}`);
    config.onReorder!(next as Array<V & string>, event);
  };
  const add = (raw: string, event: React.SyntheticEvent) => {
    const text = raw.trim();
    if (text) config.onAdd?.(text, event);
  };
  /** Alt + arrow moves the tag, in the reading direction. */
  const reorderKey = (event: React.KeyboardEvent, i: number, part: FocusPart): boolean => {
    if (!config.onReorder || !event.altKey || (event.key !== 'ArrowLeft' && event.key !== 'ArrowRight')) return false;
    const forward = (event.key === 'ArrowRight') !== (ctx.dir === 'rtl');
    event.preventDefault();
    move(i, i + (forward ? 1 : -1), event, part);
    return true;
  };

  const onKeyDown = (event: React.KeyboardEvent) => {
    const all = Array.from(list.current?.querySelectorAll<HTMLElement>('[role="option"]') ?? []);
    const current = all.indexOf(document.activeElement as HTMLElement);
    if (current === -1) return;
    if (reorderKey(event, current, 'option')) return;
    if (event.key === 'F2') {
      event.preventDefault();
      startEdit(shown[current]);
      return;
    }
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
        'data-reorderable': dataAttr(!!config.onReorder),
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
    const editLabel = config.editLabel ?? 'Rename';
    const stop = focused ?? Math.max(0, shown.findIndex((t) => !t.disabled));
    const text = (t: Tag) => {
      if (editing === t.value)
        return slot('editInput', null, 'input', {
          type: 'text',
          value: draft,
          autoFocus: true,
          size: Math.max(4, draft.length + 1),
          'aria-label': `${editLabel} ${t.text}`,
          onChange: (event: React.ChangeEvent<HTMLInputElement>) => setDraft(event.target.value),
          onKeyDown: (event: React.KeyboardEvent) => {
            // The field's keys are its own, not the group's.
            event.stopPropagation();
            if (event.key === 'Enter') {
              event.preventDefault();
              finishEdit(t, true, event);
            } else if (event.key === 'Escape') {
              event.preventDefault();
              finishEdit(t, false, event);
            }
          },
          onBlur: (event: React.FocusEvent) => finishEdit(t, true, event),
          onClick: (event: React.MouseEvent) => event.stopPropagation(),
        });
      // Tags to read: the text is the rename button. Tags to pick rename with F2 or a double-click.
      if (editable(t) && !choosing) return slot('text', t.label, 'button', { type: 'button', title: `${editLabel} ${t.text}`, 'aria-label': `${editLabel} ${t.text}`, 'data-tag-edit': '', onClick: () => startEdit(t) });
      return slot('text', t.label, 'span', { title: t.text });
    };
    const body = (t: Tag) => (
      <>
        {t.icon != null ? slot('icon', t.icon, 'span', { 'aria-hidden': true }) : null}
        {text(t)}
      </>
    );
    const dragProps = (t: Tag, i: number): PropsBag =>
      movable(t) && editing !== t.value
        ? {
            draggable: true,
            'data-dragging': dataAttr(drag?.from === i),
            'data-drop': dataAttr(!!drag && drag.over === i && drag.from !== i),
            onDragStart: (event: React.DragEvent) => {
              event.dataTransfer?.setData('text/plain', t.text);
              if (event.dataTransfer) event.dataTransfer.effectAllowed = 'move';
              setDrag({ from: i, over: null });
            },
            onDragOver: (event: React.DragEvent) => {
              if (!drag) return;
              event.preventDefault();
              if (drag.over !== i) setDrag({ ...drag, over: i });
            },
            onDrop: (event: React.DragEvent) => {
              if (!drag) return;
              event.preventDefault();
              move(drag.from, i, event);
              setDrag(null);
            },
            onDragEnd: () => setDrag(null),
          }
        : {};
    const items = shown.map((t, i) => {
      const on = value.includes(t.value);
      const context: TagsItemContext = { ...t, index: i, selected: on, editing: editing === t.value, remove: removable(t) ? (event: React.SyntheticEvent) => remove(i, event) : undefined, edit: editable(t) ? () => startEdit(t) : undefined };
      const common = { [ITEM]: context, 'data-tag-value': t.value, 'data-tone': t.tone, 'data-disabled': dataAttr(t.disabled), 'data-selected': dataAttr(on), 'data-editing': dataAttr(editing === t.value), ...dragProps(t, i) };
      if (choosing) {
        return (
          <React.Fragment key={t.value}>
            {slot(
              'tag',
              <>
                {body(t)}
                {/* Pointer only: Delete removes the focused tag (a button inside an option is not allowed). */}
                {removable(t) && editing !== t.value
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
                'aria-keyshortcuts': [removable(t) && 'Delete', editable(t) && 'F2', movable(t) && 'Alt+ArrowLeft Alt+ArrowRight'].filter(Boolean).join(' ') || undefined,
                'aria-describedby': removable(t) || editable(t) || movable(t) ? hint : undefined,
                tabIndex: i === stop ? 0 : -1,
                onClick: (event: React.MouseEvent) => {
                  if (editing !== t.value) choose(t, event);
                },
                onDoubleClick: () => startEdit(t),
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
              {removable(t) && editing !== t.value
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
            {
              ...common,
              // Alt + arrow on any control of the tag moves it.
              onKeyDown: (event: React.KeyboardEvent) => {
                const from = event.target as HTMLElement;
                reorderKey(event, i, from.hasAttribute('data-tag-remove') ? 'remove' : from.hasAttribute('data-tag-link') ? 'link' : 'edit');
              },
            },
          )}
        </React.Fragment>
      );
    });
    // Named by what it shows ("+3") and what it does, so speech input can say what is seen.
    const more = hidden > 0 ? slot('more', <>{`+${hidden}`}<span style={VISUALLY_HIDDEN}>{` ${config.moreLabel ?? 'Show all'}`}</span></>, 'button', { type: 'button', title: config.moreLabel ?? 'Show all', onClick: () => setExpanded(true) }) : null;
    const addLabel = config.addLabel ?? 'Add tag';
    const delimiters = config.delimiters ?? [];
    const addInput = config.onAdd
      ? slot('add', null, 'input', {
          ref: addField,
          type: 'text',
          value: adding,
          placeholder: addLabel,
          'aria-label': addLabel,
          enterKeyHint: 'done',
          onChange: (event: React.ChangeEvent<HTMLInputElement>) => setAdding(event.target.value),
          onKeyDown: (event: React.KeyboardEvent<HTMLInputElement>) => {
            if (event.nativeEvent.isComposing) return;
            if (event.key === 'Enter' || delimiters.includes(event.key)) {
              // Enter adds instead of submitting the form; an empty field lets it submit.
              if (event.key !== 'Enter' || adding.trim()) event.preventDefault();
              add(adding, event);
              setAdding('');
            } else if (event.key === 'Backspace' && !adding) {
              // Back into the tags: the last one, where Delete removes it.
              const all = list.current?.querySelectorAll<HTMLElement>(choosing ? '[role="option"]' : '[data-tag-remove], [data-tag-edit], [data-tag-link]');
              const last = all?.[all.length - 1];
              if (last) {
                event.preventDefault();
                last.focus();
              }
            }
          },
          onPaste: (event: React.ClipboardEvent<HTMLInputElement>) => {
            const pasted = event.clipboardData?.getData('text') ?? '';
            if (!delimiters.length || !delimiters.some((d) => pasted.includes(d))) return;
            event.preventDefault();
            let parts = [adding + pasted];
            for (const d of delimiters) parts = parts.flatMap((p) => p.split(d));
            parts.forEach((p) => add(p, event));
            setAdding('');
          },
        })
      : null;
    const empty = tags.length === 0 && config.emptyText != null && !config.onAdd;
    const content = (
      <>
        {slot('label', config.label, 'span', { id: labelId, ...(config.hideLabel ? { style: VISUALLY_HIDDEN } : {}) })}
        {empty
          ? slot('empty', config.emptyText, 'span')
          : choosing
            ? slot(
                'body',
                <>
                  {slot('list', items, 'div', { ref: list, role: 'listbox', 'aria-labelledby': labelId, 'aria-multiselectable': selection === 'multiple' || undefined, 'aria-orientation': 'horizontal', onKeyDown })}
                  {more}
                  {addInput}
                </>,
                'div',
              )
            : slot(
                'list',
                <>
                  {items}
                  {more ? <li className={cls('pinfold-tags__cell')}>{more}</li> : null}
                  {addInput ? <li className={cls('pinfold-tags__cell')} data-grow="">{addInput}</li> : null}
                </>,
                'ul',
                { ref: list, 'aria-labelledby': labelId },
              )}
        {(config.onRemove || config.onEdit || config.onReorder) && choosing ? (
          <span id={hint} style={VISUALLY_HIDDEN}>
            {config.removeHint ?? [config.onRemove && 'Press Delete to remove', config.onEdit && 'F2 to rename', config.onReorder && 'Alt and an arrow key to move'].filter(Boolean).join(', ')}
          </span>
        ) : null}
        {config.onReorder ? (
          <span role="status" style={VISUALLY_HIDDEN}>
            {said}
          </span>
        ) : null}
      </>
    );
    return renderSlot(config, 'root', root, state, content, (p, c) => <div {...p}>{c}</div>) as React.ReactElement;
  };

  const api: TagsApi = {
    value,
    setValue: (v) => setValue([...v]),
    expand: () => setExpanded(true),
    edit: (v) => {
      const t = tags.find((x) => x.value === v);
      if (t) startEdit(t);
    },
    focusAdd: () => addField.current?.focus(),
    getRootProps,
    render,
  };
  return usePinfoldComponent<TagsApi, TagsRootProps>('Tags', api, (props) => render(props));
}
