import * as React from 'react';
import { cn, dimensionVars, mergeProps, renderSlot, resolveNode, slotProps } from '@knotui/core';
import type {
  AccordionApi,
  AccordionConfig,
  AccordionIndicator,
  AccordionItemState,
  AccordionNode,
  AccordionRootProps,
  AccordionSlot,
  ResolvedAppearance,
} from './types';

const B = 'knot-accordion';

const GLYPHS: Record<Exclude<AccordionIndicator, 'none'>, React.ReactNode> = {
  chevron: <path d="M4 6.5 8 10.5 12 6.5" />,
  caret: <path d="M6 4l5 4-5 4z" fill="currentColor" stroke="none" />,
  arrow: <path d="M8 3.5v9M4.5 9 8 12.5 11.5 9" />,
  plus: (
    <>
      <path d="M8 3.5v9" className={`${B}__indicator-bar`} />
      <path d="M3.5 8h9" />
    </>
  ),
};

/**
 * Everything the markup needs, gathered once per render.
 *
 * These are plain functions rather than components on purpose: the hook owns
 * rendering, so `useAccordion()` can hand back a component instead of being
 * called by one.
 */
export interface ViewContext {
  api: AccordionApi;
  config: AccordionConfig;
  a: ResolvedAppearance;
}

/* ------------------------------------------------------------------ slots */

/**
 * Fold three layers of overrides into one props bag, in ascending priority:
 * the component's own class, the root config's slot overrides, then the row's
 * own overrides. Under `unstyled` the callers pass no base class (see `cls`),
 * so only the consumer's classes survive.
 */
function slot<S extends AccordionSlot>(
  ctx: ViewContext,
  name: S,
  base: Record<string, any>,
  item?: AccordionItemState,
): Record<string, any> {
  const merged = slotProps<AccordionSlot, AccordionItemState>(ctx.config, name, base);

  const perItem = item?.config;
  if (!perItem?.classNames?.[name] && !perItem?.styles?.[name]) return merged;

  return mergeProps(merged, {
    className: perItem.classNames?.[name],
    style: perItem.styles?.[name],
  });
}

/* ------------------------------------------------------------------- root */

export function renderRoot(ctx: ViewContext, rootProps?: AccordionRootProps): React.ReactElement {
  const { api, config, a } = ctx;

  const props = api.getRootProps(
    mergeProps(
      slot(ctx, 'root', {
        className: a.unstyled ? config.className : cn('knot', B, config.className),
        style: { ...dimensionVars('accordion', config.dimensions), ...config.style },
        'data-variant': a.variant,
        'data-size': a.size,
        'data-tone': a.tone,
        'data-knot-radius': a.radius,
        'data-indicator-position': a.indicatorPosition,
        'data-dividers': a.dividers ? '' : undefined,
        'data-animate': a.animate ? '' : undefined,
        'data-unstyled': a.unstyled ? '' : undefined,
        'data-scroll': config.dimensions?.panelMaxHeight != null ? '' : undefined,
        'data-clamp': config.dimensions?.maxHeight != null ? '' : undefined,
      }),
      rootProps as Record<string, any>,
    ),
  );

  return <div {...props}>{api.items.map((item) => renderItem(ctx, item))}</div>;
}

/* ------------------------------------------------------------------- item */

export function renderItem(
  ctx: ViewContext,
  item: AccordionItemState,
  extra?: Record<string, any>,
): React.ReactElement {
  const { api, config } = ctx;

  const props = api.getItemProps(
    item,
    mergeProps(slot(ctx, 'item', { className: cls(ctx, `${B}__item`) }, item), extra ?? {}),
  );

  const header = renderHeader(ctx, item);
  const panel = renderPanel(ctx, item);

  if (config.renderItem) {
    return (
      <React.Fragment key={item.id}>
        {config.renderItem({ state: item, props, header, panel })}
      </React.Fragment>
    );
  }

  return (
    <div key={item.id} {...props}>
      {header}
      {panel}
    </div>
  );
}

/* ----------------------------------------------------------------- header */

export function renderHeader(
  ctx: ViewContext,
  item: AccordionItemState,
  extra?: Record<string, any>,
  children?: React.ReactNode,
): React.ReactElement {
  const { api, a } = ctx;

  const headerProps = api.getHeaderProps(
    item,
    slot(ctx, 'header', { className: cls(ctx, `${B}__header`) }, item),
  );
  const triggerProps = api.getTriggerProps(
    item,
    mergeProps(slot(ctx, 'trigger', { className: cls(ctx, `${B}__trigger`) }, item), extra ?? {}),
  );

  // `role="heading"` + `aria-level` come from the getter for headless users;
  // the native tag already carries them, so drop the duplicates.
  delete headerProps.role;
  delete headerProps['aria-level'];

  const Heading = ('h' + a.headingLevel) as 'h3';

  return (
    <Heading {...headerProps}>
      {renderSlot<AccordionSlot, AccordionItemState>(
        ctx.config,
        'trigger',
        triggerProps,
        item,
        children ?? <TriggerContent ctx={ctx} item={item} />,
        (props, kids) => <button {...props}>{kids}</button>,
      )}
    </Heading>
  );
}

function TriggerContent({ ctx, item }: { ctx: ViewContext; item: AccordionItemState }) {
  const { icon, title, description, badge } = item.config;

  const iconNode = resolveNode(icon as AccordionNode, item);
  const descriptionNode = resolveNode(description as AccordionNode, item);
  const badgeNode = resolveNode(badge as AccordionNode, item);

  return (
    <>
      {iconNode ? (
        <span {...slot(ctx, 'icon', { className: cls(ctx, `${B}__icon`), 'aria-hidden': 'true' }, item)}>
          {iconNode}
        </span>
      ) : null}

      <span {...slot(ctx, 'label', { className: cls(ctx, `${B}__label`) }, item)}>
        <span {...slot(ctx, 'title', { className: cls(ctx, `${B}__title`) }, item)}>
          {resolveNode(title as AccordionNode, item)}
        </span>
        {descriptionNode ? (
          <span {...slot(ctx, 'description', { className: cls(ctx, `${B}__description`) }, item)}>
            {descriptionNode}
          </span>
        ) : null}
      </span>

      {badgeNode ? (
        <span {...slot(ctx, 'badge', { className: cls(ctx, `${B}__badge`) }, item)}>{badgeNode}</span>
      ) : null}

      {renderIndicator(ctx, item)}
    </>
  );
}

/* -------------------------------------------------------------- indicator */

export function renderIndicator(
  ctx: ViewContext,
  item: AccordionItemState,
  extra?: Record<string, any>,
): React.ReactNode {
  // A row may override the accordion-wide indicator.
  const chosen = item.config.indicator ?? ctx.a.indicator;

  return renderSlot<AccordionSlot, AccordionItemState>(
    ctx.config,
    'indicator',
    mergeProps(
      slot(ctx, 'indicator', { className: cls(ctx, `${B}__indicator`), 'aria-hidden': 'true' }, item),
      extra ?? {},
    ),
    item,
    null,
    (props) => <Indicator {...props} indicator={chosen} state={item} />,
  );
}

function Indicator({
  indicator,
  state,
  ...props
}: { indicator: AccordionIndicator | AccordionNode; state: AccordionItemState } & Record<string, any>) {
  if (indicator === 'none') return null;

  // A built-in name renders the glyph; anything else is the consumer's node,
  // resolved against the row's state so it can react to `open`.
  if (typeof indicator !== 'string') {
    const node = resolveNode(indicator as AccordionNode, state);
    return node ? <span {...props}>{node}</span> : null;
  }

  const glyph = GLYPHS[(indicator as 'chevron') ?? 'chevron'] ?? GLYPHS.chevron;
  return (
    <span {...props}>
      <svg viewBox="0 0 16 16" width="1em" height="1em" fill="none" focusable="false">
        <g stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
          {glyph}
        </g>
      </svg>
    </span>
  );
}

/* ------------------------------------------------------------------ panel */

export function renderPanel(
  ctx: ViewContext,
  item: AccordionItemState,
  extra?: Record<string, any>,
  children?: React.ReactNode,
): React.ReactNode {
  const { api, a, config } = ctx;

  const panelProps = api.getPanelProps(
    item,
    mergeProps(slot(ctx, 'panel', { className: cls(ctx, `${B}__panel`) }, item), extra ?? {}),
  );

  const body =
    children ?? (a.unmountClosed && !item.open ? null : resolveNode(item.config.content as AccordionNode, item));

  return renderSlot<AccordionSlot, AccordionItemState>(
    config,
    'panel',
    panelProps,
    item,
    <div {...slot(ctx, 'content', { className: cls(ctx, `${B}__content`) }, item)}>{body}</div>,
    (props, kids) => (
      <div {...props}>
        <div className={cls(ctx, `${B}__panel-inner`)}>{kids}</div>
      </div>
    ),
  );
}

/** Component class, unless the consumer opted out of our stylesheet. */
const cls = (ctx: ViewContext, name: string) => (ctx.a.unstyled ? undefined : name);
