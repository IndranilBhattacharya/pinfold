import * as React from 'react';
import {
  accordionFocusTarget,
  accordionPartIds,
  accordionRowId,
  ariaAttr,
  closeAllAccordion,
  dataAttr,
  initialAccordionValue,
  mapAccordionFields,
  mergeProps,
  openAllAccordion,
  setAccordionItem,
  warnOnce,
  __DEV__,
  type AccordionChangeReason,
} from '@pinfold/core';
import { useControllableState, useEvent, useId } from '../hooks';
import { usePinfold } from '../provider';
import { usePinfoldComponent } from '../component';
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
  AccordionMappedConfig,
  AnyAccordionConfig,
  AccordionItemConfig,
  AccordionItemState,
  AccordionParts,
  AccordionPartProps,
  AccordionRootProps,
  AccordionState,
  AccordionValueDetails,
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
 * Arrow/Home/End navigation between headers. Behaviour rules live in
 * `@pinfold/core` (accordion.logic.ts); this hook wires them to React.
 */
export function useAccordion<Id extends string = string>(config: AccordionConfig<Id>): AccordionApi<Id>;
/** Raw records, mapped onto rows by `fields`. Ids come from the data, so they are `string`. */
export function useAccordion<Row extends object>(config: AccordionMappedConfig<Row>): AccordionApi;
export function useAccordion(input: AnyAccordionConfig): AccordionApi {
  const ctx = usePinfold();
  // Precedence: component config, then `defaults.accordion`, then the provider, then library defaults.
  const config: AnyAccordionConfig = ctx.defaults.accordion ? ({ ...ctx.defaults.accordion, ...defined(input) } as AnyAccordionConfig) : input;
  const {
    mode = 'single',
    collapsible = true,
    disabled: allDisabled = false,
    value: controlled,
    defaultValue,
    onValueChange,
    onBeforeChange,
    onItemToggle,
    orientation = 'vertical',
    dir = ctx.dir,
    loop = true,
    syncWithHash = false,
    id: idProp,
  } = config;

  // Dev only. A literal NODE_ENV check plus a dynamic import, so bundlers drop
  // the branch and never reference the validator or the meta in production,
  // even through CommonJS where nothing can be tree-shaken.
  if (process.env.NODE_ENV !== 'production') {
    void import('./validate').then((m) => m.validateAccordion(input, config));
  }

  const appearance: ResolvedAppearance = {
    variant: config.variant ?? 'solid',
    size: config.size ?? ctx.size,
    tone: config.tone ?? ctx.tone,
    indicator: config.indicator ?? 'chevron',
    indicatorPosition: config.indicatorPosition ?? 'end',
    animateIndicator: config.animateIndicator ?? true,
    headingLevel: config.headingLevel ?? 3,
    animate: config.animate ?? !ctx.disableAnimation,
    dividers: config.dividers ?? true,
    mountPanels: config.mountPanels ?? (config.unmountClosed ? 'open' : 'always'),
    hiddenUntilFound: config.hiddenUntilFound ?? true,
    unstyled: config.unstyled ?? false,
  };
  const headingLevel = appearance.headingLevel;

  const baseId = useId(idProp);
  const triggerRefs = React.useRef<Array<HTMLElement | null>>([]);

  const itemConfigs = React.useMemo(
    () => mapAccordionFields<AccordionItemConfig>(Array.isArray(config.items) ? config.items : [], config.fields),
    // `fields` is plain data: key it by content so an inline object does not remap every render.
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [config.items, JSON.stringify(config.fields)],
  );

  const items = React.useMemo<Omit<AccordionItemState, 'open'>[]>(
    () =>
      itemConfigs.map((item, index) => {
        const id = accordionRowId(item, index);
        const disabled = allDisabled || !!item.disabled || (config.disabledIds?.indexOf(id) ?? -1) !== -1;
        return { id, index, disabled, config: item, ...accordionPartIds(baseId, id) };
      }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [itemConfigs, baseId, allDisabled, JSON.stringify(config.disabledIds)],
  );

  const [value, setValue] = useControllableState<string[]>({
    value: controlled as string[] | undefined,
    defaultValue: () => initialAccordionValue(itemConfigs, defaultValue, mode),
  });

  // Rows that have ever been open, for `mountPanels: 'first-open'`.
  const everOpened = React.useRef(new Set<string>());
  value.forEach((id) => everOpened.current.add(id));

  const isOpen = React.useCallback((id: string) => value.indexOf(id) !== -1, [value]);

  const rules = { mode, collapsible, disabled: allDisabled };

  /** Every change funnels through here: rules, then the veto, then state, then events. */
  const commit = useEvent((next: string[] | null, details: AccordionValueDetails) => {
    if (!next) return false;
    if (onBeforeChange?.(details) === false) return false;
    setValue(next);
    onValueChange?.(next, details);
    if (details.id != null) {
      onItemToggle?.(details.id, details.open);
      items.find((row) => row.id === details.id)?.config.onOpenChange?.(details.open, details);
    }
    if (syncWithHash && details.id != null && (details.reason === 'click' || details.reason === 'keyboard')) {
      writeHash(details.open ? details.id : null);
    }
    return true;
  });

  const change = useEvent((id: string, open: boolean, reason: AccordionChangeReason, event?: AccordionValueDetails['event']) =>
    commit(setAccordionItem(value, items, id, open, rules), { id, open, reason, event }),
  );

  const focusItem = useEvent((index: number) => {
    triggerRefs.current[index]?.focus();
  });

  // `#id` in the URL opens the row and scrolls to it, on load and on every hash change.
  React.useEffect(() => {
    if (!syncWithHash) return;
    const fromHash = () => {
      const id = readHash();
      const row = id != null ? items.find((i) => i.id === id) : undefined;
      if (!row) return;
      change(row.id, true, 'hash');
      triggerRefs.current[row.index]?.scrollIntoView?.({ block: 'start' });
    };
    fromHash();
    window.addEventListener('hashchange', fromHash);
    return () => window.removeEventListener('hashchange', fromHash);
  }, [syncWithHash, items, change]);

  const state = React.useMemo<AccordionItemState[]>(
    () => items.map((item) => ({ ...item, open: isOpen(item.id) })),
    [items, isOpen],
  );

  const onTriggerKeyDown = useEvent((event: React.KeyboardEvent, index: number) => {
    const next = accordionFocusTarget(event.key, index, items.length, { orientation, dir, loop });
    if (next === null) return;
    event.preventDefault();
    focusItem(next);
  });

  // Rendering reads through this ref so the returned component keeps a stable
  // identity while always seeing the current config and state.
  const viewRef = React.useRef<ViewContext>(null as unknown as ViewContext);
  const panels = React.useRef(new Map<string, PanelDom>());

  const accordionState: AccordionState = {
    items: state,
    value,
    isOpen,
    open: useEvent((id: string) => change(id, true, 'api')),
    close: useEvent((id: string) => change(id, false, 'api')),
    toggle: useEvent((id: string) => change(id, !isOpen(id), 'api')),
    openAll: useEvent(() => commit(openAllAccordion(value, items, rules), { open: true, reason: 'api' })),
    closeAll: useEvent(() => commit(closeAllAccordion(value, items, rules), { open: false, reason: 'api' })),
    focusItem,
    render: (props?: AccordionRootProps) => renderRoot(viewRef.current, props),

    getRootProps: (props) =>
      mergeProps(
        {
          'data-pinfold': 'accordion',
          'data-orientation': orientation,
          'data-mode': mode,
          'data-disabled': dataAttr(allDisabled),
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
            // Enter and Space on a <button> fire a click with `detail === 0`.
            change(item.id, !isOpen(item.id), event.detail === 0 ? 'keyboard' : 'click', event);
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
          ref: (node: HTMLElement | null) => trackPanel(panels.current, item, node, appearance.animate),
        },
        props,
      ),
  };

  // Sub-components are built once (inside usePinfoldComponent): a fresh identity
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

  const api = usePinfoldComponent<AccordionState, AccordionRootProps, AccordionParts>(
    'Accordion',
    accordionState,
    (props) => renderRoot(viewRef.current, props),
    buildParts,
  );

  // Find-in-page: a closed panel's inner box carries `hidden="until-found"`
  // (set on the DOM node because React 18 only renders boolean `hidden`), and
  // the browser fires `beforematch` on it before revealing a match.
  const onFound = useEvent((id: string) => change(id, true, 'find-in-page'));
  const findable = (item: AccordionItemState) => (node: HTMLElement | null) =>
    untilFound(node, appearance.hiddenUntilFound && !item.open, appearance.animate, () => onFound(item.id));

  viewRef.current = { api, config, a: appearance, everOpened: everOpened.current, findable };

  return api;
}

/* ----------------------------------------------------------- DOM helpers */

interface PanelDom {
  node: HTMLElement;
  open: boolean;
  timer?: ReturnType<typeof setTimeout>;
}

/**
 * `data-transition="opening|closing"` on the panel while it animates. Set on
 * the DOM node so the transition never costs a React render.
 */
function trackPanel(map: Map<string, PanelDom>, item: AccordionItemState, node: HTMLElement | null, animate: boolean) {
  if (!node) return;
  const prev = map.get(item.id);
  map.set(item.id, { node, open: item.open, timer: prev?.timer });
  if (!prev || prev.node !== node || prev.open === item.open || !animate) return;
  if (prev.timer) clearTimeout(prev.timer);
  node.setAttribute('data-transition', item.open ? 'opening' : 'closing');
  const done = () => node.removeAttribute('data-transition');
  map.get(item.id)!.timer = setTimeout(done, transitionMs(node));
}

const findable = new WeakMap<HTMLElement, { onFound: () => void; hide: boolean }>();

function untilFound(node: HTMLElement | null, hide: boolean, animate: boolean, onFound: () => void) {
  if (!node) return;
  const prev = findable.get(node);
  findable.set(node, { onFound, hide });
  if (!prev) node.addEventListener('beforematch', () => findable.get(node)?.onFound());
  if (!hide) {
    if (node.hasAttribute('hidden')) node.removeAttribute('hidden');
    node.parentElement?.removeAttribute('data-findable');
    return;
  }
  if (node.getAttribute('hidden') === 'until-found') return;
  const apply = () => {
    if (!findable.get(node)?.hide) return;
    node.setAttribute('hidden', 'until-found');
    // The panel stays visible for find-in-page; marked here so CSS needs no :has().
    node.parentElement?.setAttribute('data-findable', '');
  };
  // Closing a visible panel: hide after the collapse, so content does not vanish mid-animation.
  const wait = animate && prev && !prev.hide ? transitionMs(node.parentElement ?? node) : 0;
  if (wait) setTimeout(apply, wait);
  else apply();
}

/** Longest transition on the element, in ms. 0 when none (or no layout, as in tests). */
function transitionMs(node: Element): number {
  if (typeof getComputedStyle === 'undefined') return 0;
  const style = getComputedStyle(node);
  const parse = (list: string) => list.split(',').map((s) => (s.trim().endsWith('ms') ? parseFloat(s) : parseFloat(s) * 1000) || 0);
  const durations = parse(style.transitionDuration || '0s');
  const delays = parse(style.transitionDelay || '0s');
  return Math.max(0, ...durations.map((d, i) => d + (delays[i] ?? 0)));
}

function readHash(): string | null {
  const raw = typeof location !== 'undefined' ? location.hash.slice(1) : '';
  if (!raw) return null;
  try {
    return decodeURIComponent(raw);
  } catch {
    return raw;
  }
}

function writeHash(id: string | null) {
  if (typeof history === 'undefined') return;
  const url = location.pathname + location.search + (id != null ? '#' + encodeURIComponent(id) : '');
  history.replaceState(history.state, '', url);
}

function defined<T extends object>(obj: T): Partial<T> {
  const out: Partial<T> = {};
  for (const k in obj) if (obj[k] !== undefined) out[k] = obj[k];
  return out;
}
