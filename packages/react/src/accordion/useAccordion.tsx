import * as React from 'react';
import { ariaAttr, dataAttr, mergeProps, nextIndexFromKey, warnOnce, __DEV__ } from '@lumae/core';
import { useControllableState, useEvent, useId } from '../hooks';
import { useLumae } from '../provider';
import { useLumaeComponent } from '../component';
import {
  renderHeader,
  renderIndicator,
  renderItem,
  renderPanel,
  renderRoot,
  type ViewContext,
} from './AccordionView';
import type {
  AccordionApi,
  AccordionConfig,
  AccordionItemState,
  AccordionParts,
  AccordionPartProps,
  AccordionRootProps,
  AccordionState,
  ResolvedAppearance,
} from './types';

/**
 * The accordion, as a hook that hands back a component.
 *
 *   const Faq = useAccordion({ items });
 *   return <Faq className="mt-8" />;
 *
 * The same value is the controller (`Faq.toggle(id)`, `Faq.value`) and carries
 * its own parts (`<Faq.Trigger id="a" />`) for layouts the config cannot
 * express. One object, three levels of commitment.
 *
 * Implements the WAI-ARIA Accordion pattern: button triggers inside headings,
 * `aria-expanded` / `aria-controls`, panels as labelled regions, and
 * Arrow/Home/End navigation between headers.
 */
export function useAccordion(config: AccordionConfig): AccordionApi {
  const ctx = useLumae();
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
  } = config;

  // Appearance falls back to the provider, then to the framework default.
  const appearance: ResolvedAppearance = {
    variant: config.variant ?? 'solid',
    size: config.size ?? ctx.size,
    tone: config.tone ?? ctx.tone,
    radius: config.radius ?? ctx.radius,
    indicator: config.indicator ?? 'chevron',
    indicatorPosition: config.indicatorPosition ?? 'end',
    headingLevel: config.headingLevel ?? 3,
    animate: config.animate ?? !ctx.disableAnimation,
    dividers: config.dividers ?? true,
    unmountClosed: config.unmountClosed ?? false,
    unstyled: config.unstyled ?? false,
  };
  const headingLevel = appearance.headingLevel;

  const baseId = useId(idProp);
  const triggerRefs = React.useRef<Array<HTMLElement | null>>([]);

  if (__DEV__) validate(config);

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

  // Rendering reads through this ref so the returned component keeps a stable
  // identity while always seeing the current config and state.
  const viewRef = React.useRef<ViewContext>(null as unknown as ViewContext);

  const accordionState: AccordionState = {
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
    render: (props?: AccordionRootProps) => renderRoot(viewRef.current, props),

    getRootProps: (props) =>
      mergeProps(
        {
          'data-lumae': 'accordion',
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

  // Sub-components are built once (inside useLumaeComponent): a fresh identity
  // each render would make React tear down and rebuild every panel mid-animation.
  const buildParts = () => {
    const pick = (props: AccordionPartProps): AccordionItemState | undefined => {
      const rows = viewRef.current.api.items;
      const found =
        props.index != null
          ? rows[props.index]
          : props.id != null
            ? rows.find((row) => row.id === props.id)
            : rows[0];
      warnOnce(
        __DEV__ && !found,
        `Accordion: no row matches ${JSON.stringify(props.id ?? props.index)}. ` +
          'Sub-components address a row by `id` or `index`.',
      );
      return found;
    };

    const box = (props: AccordionPartProps) => ({ className: props.className, style: props.style });

    return {
      Item: (props: AccordionPartProps) => {
        const item = pick(props);
        return item ? renderItem(viewRef.current, item, box(props)) : null;
      },
      Trigger: (props: AccordionPartProps) => {
        const item = pick(props);
        return item ? renderHeader(viewRef.current, item, box(props), props.children) : null;
      },
      Panel: (props: AccordionPartProps) => {
        const item = pick(props);
        return item ? <>{renderPanel(viewRef.current, item, box(props), props.children)}</> : null;
      },
      Indicator: (props: AccordionPartProps) => {
        const item = pick(props);
        return item ? <>{renderIndicator(viewRef.current, item, box(props))}</> : null;
      },
    };
  };

  const api = useLumaeComponent<AccordionState, AccordionRootProps, AccordionParts>(
    'Accordion',
    accordionState,
    (props) => renderRoot(viewRef.current, props),
    buildParts,
  );

  viewRef.current = { api, config, a: appearance };

  return api;
}

/**
 * Dev-only config sanity checks. Every one of these is a mistake that would
 * otherwise show up as odd behaviour rather than an error.
 */
function validate(config: AccordionConfig): void {
  const { items, mode = 'single', value, defaultValue, collapsible = true } = config;

  warnOnce(!Array.isArray(items), 'Accordion: `items` must be an array.');
  if (!Array.isArray(items)) return;

  const ids = items.map((item, i) => item.id ?? String(i));
  const duplicates = ids.filter((id, i) => ids.indexOf(id) !== i);
  warnOnce(
    duplicates.length > 0,
    `Accordion: duplicate item id ${JSON.stringify(duplicates[0])}. ` +
      'Ids must be unique — panels and triggers are wired together by id.',
  );

  warnOnce(
    mode === 'single' && (value?.length ?? 0) > 1,
    'Accordion: `mode: "single"` was given more than one open id in `value`. ' +
      'Only the first will be honoured.',
  );

  warnOnce(
    mode === 'single' && !collapsible && (value ?? defaultValue ?? []).length === 0,
    'Accordion: `collapsible: false` with nothing open means the user can never ' +
      'open a row by keyboard from a closed state. Provide a `defaultValue`.',
  );

  warnOnce(
    value !== undefined && config.onValueChange === undefined,
    'Accordion: `value` was passed without `onValueChange`, so the accordion is ' +
      'frozen. Use `defaultValue` for uncontrolled behaviour.',
  );
}
