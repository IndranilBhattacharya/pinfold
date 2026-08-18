import type * as React from 'react';
import type {
  KnotDir,
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

export interface AccordionApi {
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
