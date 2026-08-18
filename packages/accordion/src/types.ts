import type * as React from 'react';
import type {
  KnotDir,
  Length,
  KnotOrientation,
  KnotRadius,
  KnotSize,
  KnotTone,
  PropsBag,
  SlotOverrides,
} from '@knotui/core';

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

export type AccordionVariant = 'solid' | 'outline' | 'separated' | 'ghost' | 'filled';
export type AccordionIndicator = 'chevron' | 'plus' | 'caret' | 'none';

/** One row of the accordion. This is the JSON a consumer (or an LLM) writes. */
export interface AccordionItemConfig {
  /** Stable key. Falls back to the array index when omitted. */
  id?: string;
  title: React.ReactNode;
  content?: React.ReactNode;
  /** Secondary line under the title. */
  description?: React.ReactNode;
  /** Leading visual — icon, avatar, anything. */
  icon?: React.ReactNode;
  /** Trailing chip rendered before the indicator. */
  badge?: React.ReactNode;
  disabled?: boolean;
  /** Open on first render (uncontrolled only). */
  defaultOpen?: boolean;
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
  orientation?: KnotOrientation;
  dir?: KnotDir;
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
  size?: KnotSize;
  tone?: KnotTone;
  radius?: KnotRadius;
  /** Built-in indicator glyph, or your own node. Default `chevron`. */
  indicator?: AccordionIndicator | React.ReactNode;
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
  className?: string;
  style?: React.CSSProperties;
}

export interface AccordionConfig
  extends AccordionBehaviourConfig,
    AccordionAppearanceConfig,
    SlotOverrides<AccordionSlot, AccordionItemState> {}

/** Runtime state of a single row, handed to slot renderers. */
export interface AccordionItemState {
  id: string;
  index: number;
  open: boolean;
  disabled: boolean;
  config: AccordionItemConfig;
  triggerId: string;
  panelId: string;
}

/** Appearance after provider defaults are folded in. Internal, but typed. */
export interface ResolvedAppearance {
  variant: AccordionVariant;
  size: KnotSize;
  tone: KnotTone;
  radius: KnotRadius;
  indicator: AccordionIndicator | React.ReactNode;
  indicatorPosition: 'start' | 'end';
  headingLevel: number;
  animate: boolean;
  dividers: boolean;
  unmountClosed: boolean;
}

export interface AccordionApi {
  /**
   * The finished, accessible accordion. Call it and return it — this is the
   * hook-first path, where you write no component markup at all.
   */
  render: () => React.ReactElement;
  items: AccordionItemState[];
  value: string[];
  isOpen: (id: string) => boolean;
  open: (id: string) => void;
  close: (id: string) => void;
  toggle: (id: string) => void;
  openAll: () => void;
  closeAll: () => void;
  /** Move DOM focus to a header by index (used by keyboard nav, exposed for tests). */
  focusItem: (index: number) => void;
  getRootProps: (props?: PropsBag) => PropsBag;
  getItemProps: (item: AccordionItemState, props?: PropsBag) => PropsBag;
  getHeaderProps: (item: AccordionItemState, props?: PropsBag) => PropsBag;
  getTriggerProps: (item: AccordionItemState, props?: PropsBag) => PropsBag;
  getPanelProps: (item: AccordionItemState, props?: PropsBag) => PropsBag;
}
