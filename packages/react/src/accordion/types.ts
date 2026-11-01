import type * as React from 'react';
import type {
  PinfoldDir,
  PinfoldOrientation,
  PinfoldRadius,
  PinfoldSize,
  PinfoldTone,
  Length,
  PropsBag,
} from '@pinfold/core';
import type { PinfoldComponent } from '../component';
import type { SlotOverrides, Slottable } from '../types';

export type AccordionSlot =
  | 'root'
  | 'item'
  | 'header'
  | 'trigger'
  | 'icon'
  | 'label'
  | 'title'
  | 'description'
  | 'badge'
  | 'indicator'
  | 'panel'
  | 'content';

export type AccordionVariant = 'solid' | 'outline' | 'separated' | 'filled' | 'ghost';
export type AccordionIndicator = 'chevron' | 'plus' | 'caret' | 'arrow' | 'none';

/** Runtime state of a single row. Passed to every function-valued config field. */
export interface AccordionItemState {
  id: string;
  index: number;
  open: boolean;
  disabled: boolean;
  config: AccordionItemConfig;
  triggerId: string;
  panelId: string;
}

/** Anything renderable in a row: a node, or a function of the row's live state. */
export type AccordionNode = Slottable<AccordionItemState>;

/** One row of the accordion. This is the JSON a consumer — or a model — writes. */
export interface AccordionItemConfig {
  /** Stable key. Falls back to the array index when omitted. */
  id?: string;
  title: AccordionNode;
  content?: AccordionNode;
  /** Secondary line under the title. */
  description?: AccordionNode;
  /** Leading visual — icon, avatar, anything. */
  icon?: AccordionNode;
  /** Trailing chip rendered before the indicator. */
  badge?: AccordionNode;
  /** Overrides the accordion-wide indicator for this row only. */
  indicator?: AccordionIndicator | AccordionNode;
  disabled?: boolean;
  /** Open on first render (uncontrolled only). */
  defaultOpen?: boolean;
  /** Per-row class and style overrides, same slot names as the root config. */
  classNames?: Partial<Record<AccordionSlot, string>>;
  styles?: Partial<Record<AccordionSlot, React.CSSProperties>>;
}

export interface AccordionBehaviourConfig {
  items: AccordionItemConfig[];
  /** `single` closes siblings on open. Default `single`. */
  mode?: 'single' | 'multiple';
  /** In `single` mode, allow closing the open item. Default true. */
  collapsible?: boolean;
  /** Controlled open ids. */
  value?: string[];
  defaultValue?: string[];
  onValueChange?: (value: string[]) => void;
  /** Fires for one item, after `onValueChange`. */
  onItemToggle?: (id: string, open: boolean) => void;
  /** Arrow-key axis for moving between headers. Default `vertical`. */
  orientation?: PinfoldOrientation;
  dir?: PinfoldDir;
  /** Wrap focus at the ends. Default true. */
  loop?: boolean;
  /** Prefix for generated ids — set it for deterministic SSR markup. */
  id?: string;
  /** Drop closed panel children from the DOM. Default false (keeps Ctrl+F and SEO). */
  unmountClosed?: boolean;
}

/**
 * Explicit sizing. Numbers are px, strings pass through (`'50%'`, `'18rem'`,
 * `'clamp(20rem, 40vw, 32rem)'`). Each key overrides the value the `size`
 * preset would have chosen, so you can take one dimension and leave the rest.
 */
export interface AccordionDimensions {
  width?: Length;
  minWidth?: Length;
  maxWidth?: Length;
  height?: Length;
  maxHeight?: Length;
  /** Space between rows (outline / separated / filled variants). */
  gap?: Length;
  /** Trigger padding. */
  paddingX?: Length;
  paddingY?: Length;
  /** Panel padding. Defaults to the trigger padding. */
  panelPaddingX?: Length;
  panelPaddingY?: Length;
  /** Cap the open panel and let it scroll past that. */
  panelMaxHeight?: Length;
  fontSize?: Length;
  titleSize?: Length;
  descriptionSize?: Length;
  iconSize?: Length;
  indicatorSize?: Length;
  borderWidth?: Length;
  /** Corner radius as a length — overrides the `radius` token preset. */
  radius?: Length;
  /** Open/close transition duration, e.g. `'320ms'`. */
  duration?: Length;
}

export interface AccordionAppearanceConfig {
  variant?: AccordionVariant;
  size?: PinfoldSize;
  tone?: PinfoldTone;
  radius?: PinfoldRadius;
  /** Built-in glyph, your own node, or a function of the row's state. */
  indicator?: AccordionIndicator | AccordionNode;
  /** Which edge the indicator sits on. Default `end`. */
  indicatorPosition?: 'start' | 'end';
  /** Heading level wrapping each trigger. Default 3. */
  headingLevel?: 1 | 2 | 3 | 4 | 5 | 6;
  /** Animate open/close. Default true; honours prefers-reduced-motion regardless. */
  animate?: boolean;
  /** Full-width dividers between rows (solid/ghost variants). Default true. */
  dividers?: boolean;
  /** Explicit sizing, per dimension. Overrides the `size` preset. */
  dimensions?: AccordionDimensions;
  /**
   * Drop every Pinfold class so no bundled CSS applies, keeping the behaviour,
   * ARIA and `data-*` state hooks. For Tailwind or your own stylesheet:
   * style entirely through `classNames`.
   */
  unstyled?: boolean;
  className?: string;
  style?: React.CSSProperties;
}

export interface AccordionConfig
  extends AccordionBehaviourConfig,
    AccordionAppearanceConfig,
    SlotOverrides<AccordionSlot, AccordionItemState> {
  /** Replace an entire row. The last resort before dropping to prop getters. */
  renderItem?: (args: {
    state: AccordionItemState;
    /** Root props for the row. Spread them or state styling breaks. */
    props: PropsBag;
    /** The default header, if you only want to swap the body around it. */
    header: React.ReactNode;
    /** The default panel. */
    panel: React.ReactNode;
  }) => React.ReactNode;
}

/** Appearance after provider defaults are folded in. */
export interface ResolvedAppearance {
  variant: AccordionVariant;
  size: PinfoldSize;
  tone: PinfoldTone;
  radius: PinfoldRadius;
  indicator: AccordionIndicator | AccordionNode;
  indicatorPosition: 'start' | 'end';
  headingLevel: number;
  animate: boolean;
  dividers: boolean;
  unmountClosed: boolean;
  unstyled: boolean;
}

/** Props accepted by `<Accordion />` itself, merged onto the root element. */
export interface AccordionRootProps {
  className?: string;
  style?: React.CSSProperties;
  children?: never;
  [key: `data-${string}`]: unknown;
}

/** Addressing a single row from a sub-component. */
export interface AccordionPartProps {
  id?: string;
  index?: number;
  className?: string;
  style?: React.CSSProperties;
  children?: React.ReactNode;
}

export interface AccordionState {
  items: AccordionItemState[];
  value: string[];
  isOpen: (id: string) => boolean;
  open: (id: string) => void;
  close: (id: string) => void;
  toggle: (id: string) => void;
  openAll: () => void;
  closeAll: () => void;
  /** Move DOM focus to a header by index. */
  focusItem: (index: number) => void;
  /** Equivalent to `<Accordion />`, for callers who prefer a call. */
  render: (props?: AccordionRootProps) => React.ReactElement;
  getRootProps: (props?: PropsBag) => PropsBag;
  getItemProps: (item: AccordionItemState, props?: PropsBag) => PropsBag;
  getHeaderProps: (item: AccordionItemState, props?: PropsBag) => PropsBag;
  getTriggerProps: (item: AccordionItemState, props?: PropsBag) => PropsBag;
  getPanelProps: (item: AccordionItemState, props?: PropsBag) => PropsBag;
}

/** The sub-components for hand-laid-out accordions. */
export interface AccordionParts {
  /** One complete row: header plus panel. */
  Item: (props: AccordionPartProps) => React.ReactElement | null;
  /** Just the heading and its button. `children` replaces the default label. */
  Trigger: (props: AccordionPartProps) => React.ReactElement | null;
  /** Just the collapsible region. `children` replaces the configured content. */
  Panel: (props: AccordionPartProps) => React.ReactElement | null;
  /** Just the open/closed glyph. */
  Indicator: (props: AccordionPartProps) => React.ReactElement | null;
}

/**
 * What `useAccordion()` returns: a component you render, that is also the
 * controller, that also carries its parts.
 */
export type AccordionApi = PinfoldComponent<AccordionState & AccordionParts, AccordionRootProps>;
