import * as React from 'react';
import {
  ariaAttr,
  dataAttr,
  mergeProps,
  nextIndexFromKey,
  useControllableState,
  useEvent,
  useId,
  useKnot,
} from '@knotui/core';
import type { AccordionApi, AccordionConfig, AccordionItemState } from './types';

/**
 * The whole accordion, as data. Render it yourself with the `getXProps`
 * getters, or hand the same config to `<Accordion />` and render nothing.
 *
 * Implements the WAI-ARIA Accordion pattern: button triggers inside headings,
 * `aria-expanded` / `aria-controls`, panels as labelled regions, and
 * Arrow/Home/End navigation between headers.
 */
export function useAccordion(config: AccordionConfig): AccordionApi {
  const ctx = useKnot();
  const {
    items: itemConfigs,
    mode = 'single',
    collapsible = true,
    value: controlled,
    defaultValue,
    onValueChange,
    onItemToggle,
    orientation = 'vertical',
    dir = ctx.dir,
    loop = true,
    id: idProp,
    headingLevel = 3,
  } = config;

  const baseId = useId(idProp);
  const triggerRefs = React.useRef<Array<HTMLElement | null>>([]);

  const items = React.useMemo<Omit<AccordionItemState, 'open'>[]>(
    () =>
      itemConfigs.map((item, index) => {
        const id = item.id ?? String(index);
        return {
          id,
          index,
          disabled: !!item.disabled,
          config: item,
          triggerId: `${baseId}-trigger-${id}`,
          panelId: `${baseId}-panel-${id}`,
        };
      }),
    [itemConfigs, baseId],
  );

  const [value, setValue] = useControllableState<string[]>({
    value: controlled,
    defaultValue: () => {
      if (defaultValue) return mode === 'single' ? defaultValue.slice(0, 1) : defaultValue;
      const open = itemConfigs
        .map((item, i) => (item.defaultOpen ? item.id ?? String(i) : null))
        .filter((v): v is string => v !== null);
      return mode === 'single' ? open.slice(0, 1) : open;
    },
    onChange: onValueChange,
  });

  const isOpen = React.useCallback((id: string) => value.indexOf(id) !== -1, [value]);

  const setOpen = useEvent((id: string, next: boolean) => {
    const item = items.find((i) => i.id === id);
    if (!item || item.disabled) return;
    const currentlyOpen = value.indexOf(id) !== -1;
    if (currentlyOpen === next) return;
    // `single` + `collapsible: false` means the open row cannot be closed.
    if (!next && mode === 'single' && !collapsible) return;

    setValue((prev) => {
      if (next) return mode === 'single' ? [id] : prev.concat(id);
      return prev.filter((v) => v !== id);
    });
    onItemToggle?.(id, next);
  });

  const focusItem = useEvent((index: number) => {
    triggerRefs.current[index]?.focus();
  });

  const state = React.useMemo<AccordionItemState[]>(
    () => items.map((item) => ({ ...item, open: isOpen(item.id) })),
    [items, isOpen],
  );

  const onTriggerKeyDown = useEvent((event: React.KeyboardEvent, index: number) => {
    const next = nextIndexFromKey(event.key, index, items.length, { orientation, dir, loop });
    if (next === null) return;
    event.preventDefault();
    focusItem(next);
  });

  const api: AccordionApi = {
    items: state,
    value,
    isOpen,
    open: useEvent((id: string) => setOpen(id, true)),
    close: useEvent((id: string) => setOpen(id, false)),
    toggle: useEvent((id: string) => setOpen(id, !isOpen(id))),
    openAll: useEvent(() => {
      if (mode === 'single') return;
      setValue(items.filter((i) => !i.disabled).map((i) => i.id));
    }),
    closeAll: useEvent(() => {
      if (mode === 'single' && !collapsible) return;
      setValue([]);
    }),
    focusItem,

    getRootProps: (props) =>
      mergeProps(
        {
          'data-knot': 'accordion',
          'data-orientation': orientation,
          'data-mode': mode,
          dir,
        },
        props,
      ),

    getItemProps: (item, props) =>
      mergeProps(
        {
          'data-state': item.open ? 'open' : 'closed',
          'data-disabled': dataAttr(item.disabled),
          'data-index': item.index,
        },
        props,
      ),

    getHeaderProps: (item, props) =>
      mergeProps(
        {
          role: 'heading',
          'aria-level': headingLevel,
          'data-state': item.open ? 'open' : 'closed',
        },
        props,
      ),

    getTriggerProps: (item, props) =>
      mergeProps(
        {
          type: 'button',
          id: item.triggerId,
          'aria-expanded': item.open,
          'aria-controls': item.panelId,
          'aria-disabled': ariaAttr(item.disabled),
          'data-state': item.open ? 'open' : 'closed',
          'data-disabled': dataAttr(item.disabled),
          ref: (node: HTMLElement | null) => {
            triggerRefs.current[item.index] = node;
          },
          onClick: (event: React.MouseEvent) => {
            if (item.disabled) {
              event.preventDefault();
              return;
            }
            api.toggle(item.id);
          },
          onKeyDown: (event: React.KeyboardEvent) => onTriggerKeyDown(event, item.index),
        },
        props,
      ),

    getPanelProps: (item, props) =>
      mergeProps(
        {
          id: item.panelId,
          role: 'region',
          'aria-labelledby': item.triggerId,
          'data-state': item.open ? 'open' : 'closed',
        },
        props,
      ),
  };

  return api;
}
