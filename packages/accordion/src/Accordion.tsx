import * as React from 'react';
import { cn, renderSlot, slotProps, useKnot } from '@knotui/core';
import { useAccordion } from './useAccordion';
import type {
  AccordionConfig,
  AccordionIndicator,
  AccordionItemState,
  AccordionSlot,
} from './types';

const B = 'knot-accordion';

const GLYPHS: Record<Exclude<AccordionIndicator, 'none'>, React.ReactNode> = {
  chevron: <path d="M4 6.5 8 10.5 12 6.5" />,
  caret: <path d="M6 4l5 4-5 4z" fill="currentColor" />,
  plus: (
    <>
      <path d="M8 3.5v9" className={`${B}__indicator-bar`} />
      <path d="M3.5 8h9" />
    </>
  ),
};

/**
 * A complete, accessible accordion from one config object.
 *
 *   <Accordion items={[{ title: 'Shipping', content: 'Ships in 2 days.' }]} />
 *
 * Every part stays reachable: `classNames`, `slotProps` and `render` target
 * any slot by name, and `useAccordion` gives you the same state headlessly.
 */
export function Accordion(config: AccordionConfig): React.ReactElement {
  const ctx = useKnot();
  const api = useAccordion(config);

  const {
    variant = 'solid',
    size = ctx.size,
    tone = ctx.tone,
    radius = ctx.radius,
    indicator = 'chevron',
    indicatorPosition = 'end',
    headingLevel = 3,
    animate = !ctx.disableAnimation,
    dividers = true,
    unmountClosed = false,
    className,
    style,
  } = config;

  const slot = <S extends AccordionSlot>(name: S, base: Record<string, any>) =>
    slotProps<AccordionSlot, AccordionItemState>(config, name, base);

  const rootProps = api.getRootProps(
    slot('root', {
      className: cn('knot', B, className),
      style,
      'data-variant': variant,
      'data-size': size,
      'data-tone': tone,
      'data-knot-radius': radius,
      'data-indicator-position': indicatorPosition,
      'data-dividers': dividers ? '' : undefined,
      'data-animate': animate ? '' : undefined,
    }),
  );

  const Heading = ('h' + headingLevel) as 'h3';

  return (
    <div {...rootProps}>
      {api.items.map((item) => {
        const itemProps = api.getItemProps(item, slot('item', { className: `${B}__item` }));
        const headerProps = api.getHeaderProps(item, slot('header', { className: `${B}__header` }));
        const triggerProps = api.getTriggerProps(
          item,
          slot('trigger', { className: `${B}__trigger` }),
        );
        const panelProps = api.getPanelProps(item, slot('panel', { className: `${B}__panel` }));

        // `role="heading"` + `aria-level` already come from the getter; using the
        // matching native tag keeps the markup valid without doubling the role.
        delete headerProps.role;
        delete headerProps['aria-level'];

        return (
          <div key={item.id} {...itemProps}>
            <Heading {...headerProps}>
              {renderSlot<AccordionSlot, AccordionItemState>(
                config,
                'trigger',
                triggerProps,
                item,
                <TriggerContent
                  item={item}
                  indicator={indicator}
                  config={config}
                  slot={slot}
                />,
                (props, children) => <button {...props}>{children}</button>,
              )}
            </Heading>

            {renderSlot<AccordionSlot, AccordionItemState>(
              config,
              'panel',
              panelProps,
              item,
              <div {...slot('content', { className: `${B}__content` })}>
                {unmountClosed && !item.open ? null : item.config.content}
              </div>,
              (props, children) => (
                <div {...props}>
                  <div className={`${B}__panel-inner`}>{children}</div>
                </div>
              ),
            )}
          </div>
        );
      })}
    </div>
  );
}

Accordion.displayName = 'Accordion';

function TriggerContent({
  item,
  indicator,
  config,
  slot,
}: {
  item: AccordionItemState;
  indicator: AccordionConfig['indicator'];
  config: AccordionConfig;
  slot: <S extends AccordionSlot>(name: S, base: Record<string, any>) => Record<string, any>;
}): React.ReactElement {
  const { icon, title, description, badge } = item.config;

  return (
    <>
      {icon ? (
        <span {...slot('icon', { className: `${B}__icon`, 'aria-hidden': 'true' })}>{icon}</span>
      ) : null}

      <span {...slot('label', { className: `${B}__label` })}>
        <span {...slot('title', { className: `${B}__title` })}>{title}</span>
        {description ? (
          <span {...slot('description', { className: `${B}__description` })}>{description}</span>
        ) : null}
      </span>

      {badge ? <span {...slot('badge', { className: `${B}__badge` })}>{badge}</span> : null}

      {renderSlot<AccordionSlot, AccordionItemState>(
        config,
        'indicator',
        slot('indicator', { className: `${B}__indicator`, 'aria-hidden': 'true' }),
        item,
        null,
        (props) => <Indicator {...props} indicator={indicator} />,
      )}
    </>
  );
}

function Indicator({
  indicator,
  ...props
}: { indicator: AccordionConfig['indicator'] } & Record<string, any>) {
  if (indicator === 'none') return null;

  if (typeof indicator !== 'string' && indicator != null) {
    return <span {...props}>{indicator}</span>;
  }

  const glyph = GLYPHS[(indicator as 'chevron') ?? 'chevron'];
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
