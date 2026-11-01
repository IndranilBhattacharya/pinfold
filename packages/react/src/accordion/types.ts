import type * as React from 'react';
import type {
  AccordionChangeDetails,
  AccordionFieldMap,
  AccordionMountPanels,
  PinfoldDir,
  PinfoldLazy,
  PinfoldOrientation,
  PinfoldRadius,
  PinfoldSize,
  PinfoldTone,
  Length,
  PropsBag,
} from '@pinfold/core';
import type { PinfoldComponent } from '../component';
import type { NoInfer, SlotOverrides, Slottable } from '../types';

/*
 * Typing rules (CONTRIBUTING.md, "Typed API"):
 * - Row ids are a type parameter inferred from `items`, so a wrong id in `defaultValue`,
 *   `value`, `disabledIds` or `Faq.open()` is a compile error. Ids from data (`string`) stay
 *   `string`; nothing gets stricter for them.
 * - Every option with a default carries `@default`, checked against the component meta.
 * - Nothing here needs more than TypeScript 4.7 (the published floor).
 */

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
  | 'endIcon'
  | 'indicator'
  | 'panel'
  | 'content';

export type AccordionVariant = 'solid' | 'outline' | 'separated' | 'filled' | 'ghost';
export type AccordionIndicator = 'chevron' | 'plus' | 'caret' | 'arrow' | 'none';
/** A radius preset (the theme scale) or a length: `20` is px, strings pass through. */
export type AccordionRadius = PinfoldRadius | number | (string & {});
/** A spacing preset or a length: `12` is px, strings pass through. */
export type AccordionGap = 'none' | 'sm' | 'md' | 'lg' | number | (string & {});

/**
 * The ids of a list of rows, e.g. for typed controlled state:
 * `useState<AccordionItemId<typeof items>[]>([])`.
 */
export type AccordionItemId<Items extends ReadonlyArray<{ id?: string }>> = NonNullable<Items[number]['id']>;

/** Runtime state of a single row. Passed to every function-valued config field. */
export interface AccordionItemState<Id extends string = string> {
  id: Id;
  index: number;
  open: boolean;
  disabled: boolean;
  config: AccordionItemConfig<Id>;
  triggerId: string;
  panelId: string;
}

/** Anything renderable in a row: a node, or a function of the row's live state. */
export type AccordionNode<Id extends string = string> = Slottable<AccordionItemState<Id>>;

/** One row of the accordion. This is the JSON a consumer — or a model — writes. */
export interface AccordionItemConfig<Id extends string = string> {
  /** Stable key. Falls back to the array index when omitted. Give every row one to get typed ids. */
  id?: Id;
  title: AccordionNode<Id>;
  content?: AccordionNode<Id>;
  /** Secondary line under the title. */
  description?: AccordionNode<Id>;
  /** Leading visual: a node, or a string (an emoji, or an icon-font name with `classNames.icon`). Overrides the accordion-wide `icon`. */
  icon?: AccordionNode<Id>;
  /** Trailing chip rendered before the indicator. */
  badge?: AccordionNode<Id>;
  /** Trailing visual just before the indicator. Overrides the accordion-wide `endIcon`. */
  endIcon?: AccordionNode<Id>;
  /** Overrides the accordion-wide indicator for this row only. */
  indicator?: AccordionIndicator | AccordionNode<Id>;
  disabled?: boolean;
  /** Open on first render (uncontrolled only). */
  defaultOpen?: boolean;
  /** Per-row class and style overrides, same slot names as the root config. */
  classNames?: Partial<Record<AccordionSlot, string>>;
  styles?: Partial<Record<AccordionSlot, React.CSSProperties>>;
}

/** Text overflow for one slot: wrap, one line with an ellipsis, or clamp to n lines. */
export type AccordionOverflow = 'wrap' | 'truncate' | { lines: number };

export type AccordionValueDetails<Id extends string = string> = Omit<
  AccordionChangeDetails<Event | React.SyntheticEvent>,
  'id'
> & {
  /** The row that triggered the change. Absent for `openAll` / `closeAll`. */
  id?: Id;
};

export interface AccordionBehaviourConfig<Id extends string = string> {
  /**
   * `single` closes siblings on open.
   * @default 'single'
   */
  mode?: 'single' | 'multiple';
  /**
   * Allow closing the last open row. `false` keeps at least one row open, in either mode.
   * @default true
   */
  collapsible?: boolean;
  /**
   * Controlled open ids. Any `string[]` state works (`useState<string[]>`); for typed state use
   * `useState<AccordionItemId<typeof items>[]>`.
   */
  value?: ReadonlyArray<string>;
  /** Initially open ids (uncontrolled). */
  defaultValue?: ReadonlyArray<NoInfer<Id>>;
  /** `details.reason`: 'click' | 'keyboard' | 'api' | 'find-in-page' | 'hash'. */
  onValueChange?: (value: Id[], details: AccordionValueDetails<Id>) => void;
  /** Return `false` to block a change (e.g. unsaved edits in the open panel). */
  onBeforeChange?: (details: AccordionValueDetails<Id>) => boolean | void;
  /** Fires for one item, after `onValueChange`. */
  onItemToggle?: (id: Id, open: boolean) => void;
  /**
   * Arrow-key axis for moving between headers.
   * @default 'vertical'
   */
  orientation?: PinfoldOrientation;
  /** Text direction. Defaults to the provider. */
  dir?: PinfoldDir;
  /**
   * Wrap focus at the ends.
   * @default true
   */
  loop?: boolean;
  /** Prefix for generated ids — set it for deterministic SSR markup. */
  id?: string;
  /**
   * Disables every row. Rows stay focusable.
   * @default false
   */
  disabled?: boolean;
  /** Disables these rows by id, for data you cannot annotate row by row. */
  disabledIds?: ReadonlyArray<NoInfer<Id>>;
  /**
   * Closed panels use `hidden="until-found"`, so the browser's find-in-page
   * searches them and opens the match.
   * @default true
   */
  hiddenUntilFound?: boolean;
  /**
   * When panel content is in the DOM. `always` keeps it searchable and indexable;
   * `open` mounts only open panels; `first-open` mounts on first open and keeps it.
   * @default 'always'
   */
  mountPanels?: AccordionMountPanels;
  /** @deprecated Use `mountPanels: 'open'`. */
  unmountClosed?: boolean;
  /**
   * `#id` in the URL opens that row and scrolls to it; opening a row updates the hash.
   * @default false
   */
  syncWithHash?: boolean;
  /**
   * Code loading for the `/lazy` entry. The accordion is light, so `auto` loads eagerly.
   * @default 'auto'
   */
  lazy?: PinfoldLazy;
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
  /** Space between rows. Overrides `gap`. */
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
  /** Container corner radius as a length. Overrides `radius`. */
  radius?: Length;
  /** Row corner radius as a length. Overrides `itemRadius`. */
  itemRadius?: Length;
  /** Open/close transition duration, e.g. `'320ms'`. */
  duration?: Length;
}

export interface AccordionAppearanceConfig<Id extends string = string> {
  /** @default 'solid' */
  variant?: AccordionVariant;
  /** @default 'md' */
  size?: PinfoldSize;
  /** @default 'primary' */
  tone?: PinfoldTone;
  /** Corner radius of the container (the element that holds the rows). Unset: the theme radius. */
  radius?: AccordionRadius;
  /** Corner radius of each row. Unset: follows `radius` (square rows inside a solid or outline card). */
  itemRadius?: AccordionRadius;
  /** Space between rows. Unset: none for solid, outline and ghost; `'sm'` for separated and filled. */
  gap?: AccordionGap;
  /** Leading visual for every row: a node, or `(state) => node` (e.g. per row, or open vs closed). */
  icon?: AccordionNode<Id>;
  /** Trailing visual for every row, just before the indicator. Same shape as `icon`. */
  endIcon?: AccordionNode<Id>;
  /**
   * Built-in glyph, your own node, or a function of the row's state.
   * @default 'chevron'
   */
  indicator?: AccordionIndicator | AccordionNode<Id>;
  /** @default 'end' */
  indicatorPosition?: 'start' | 'end';
  /**
   * Rotate (or morph) the indicator when a row opens.
   * @default true
   */
  animateIndicator?: boolean;
  /**
   * Heading level wrapping each trigger.
   * @default 3
   */
  headingLevel?: 1 | 2 | 3 | 4 | 5 | 6;
  /**
   * Animate open/close; `prefers-reduced-motion` always wins.
   * @default true
   */
  animate?: boolean;
  /**
   * Lines between rows that touch.
   * @default true
   */
  dividers?: boolean;
  /** Text overflow per slot. Unset: title `wrap`, description `{ lines: 2 }`. */
  overflow?: { title?: AccordionOverflow; description?: AccordionOverflow };
  /** Explicit sizing, per dimension. Overrides the `size` preset. */
  dimensions?: AccordionDimensions;
  /**
   * Drop every Pinfold class so no bundled CSS applies, keeping the behaviour,
   * ARIA and `data-*` state hooks. For Tailwind or your own stylesheet:
   * style entirely through `classNames`.
   * @default false
   */
  unstyled?: boolean;
  className?: string;
  style?: React.CSSProperties;
}

/** Everything except the rows: shared by `AccordionConfig` and `AccordionMappedConfig`. */
export interface AccordionOptions<Id extends string = string>
  extends AccordionBehaviourConfig<Id>,
    AccordionAppearanceConfig<Id>,
    SlotOverrides<AccordionSlot, AccordionItemState<Id>> {
  /** Replace an entire row. The last resort before dropping to prop getters. */
  renderItem?: (args: {
    state: AccordionItemState<Id>;
    /** Root props for the row. Spread them or state styling breaks. */
    props: PropsBag;
    /** The default header, if you only want to swap the body around it. */
    header: React.ReactNode;
    /** The default panel. */
    panel: React.ReactNode;
  }) => React.ReactNode;
}

/** Config with rows written as `AccordionItemConfig`. Ids are inferred from them. */
export interface AccordionConfig<Id extends string = string> extends AccordionOptions<Id> {
  /** The rows. The only required option. */
  items: ReadonlyArray<AccordionItemConfig<Id>>;
  /** Raw records need `AccordionMappedConfig` (a `fields` map). */
  fields?: undefined;
}

/**
 * Config for raw records (a CMS or database result): `fields` maps their keys onto rows, and
 * every value must be a real key of the record, so a typo is a compile error.
 *
 *   useAccordion({ items: faqRows, fields: { id: 'slug', title: 'question', content: 'answer' } });
 */
export interface AccordionMappedConfig<Row extends object = Record<string, unknown>> extends AccordionOptions<string> {
  items: ReadonlyArray<Row>;
  fields: AccordionFieldMap<Row>;
}

/** Either config shape. What the implementation and the generic APIs accept. */
export type AnyAccordionConfig = AccordionConfig | AccordionMappedConfig;

/** Appearance after provider defaults are folded in. */
export interface ResolvedAppearance {
  variant: AccordionVariant;
  size: PinfoldSize;
  tone: PinfoldTone;
  indicator: AccordionIndicator | AccordionNode;
  indicatorPosition: 'start' | 'end';
  animateIndicator: boolean;
  headingLevel: number;
  animate: boolean;
  dividers: boolean;
  mountPanels: AccordionMountPanels;
  hiddenUntilFound: boolean;
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
export interface AccordionPartProps<Id extends string = string> {
  id?: Id;
  index?: number;
  className?: string;
  style?: React.CSSProperties;
  children?: React.ReactNode;
}

export interface AccordionState<Id extends string = string> {
  items: AccordionItemState<Id>[];
  value: Id[];
  isOpen: (id: Id) => boolean;
  open: (id: Id) => void;
  close: (id: Id) => void;
  toggle: (id: Id) => void;
  openAll: () => void;
  closeAll: () => void;
  /** Move DOM focus to a header by index. */
  focusItem: (index: number) => void;
  /** Equivalent to `<Accordion />`, for callers who prefer a call. */
  render: (props?: AccordionRootProps) => React.ReactElement;
  getRootProps: (props?: PropsBag) => PropsBag;
  getItemProps: (item: AccordionItemState<Id>, props?: PropsBag) => PropsBag;
  getHeaderProps: (item: AccordionItemState<Id>, props?: PropsBag) => PropsBag;
  getTriggerProps: (item: AccordionItemState<Id>, props?: PropsBag) => PropsBag;
  getPanelProps: (item: AccordionItemState<Id>, props?: PropsBag) => PropsBag;
}

/** The sub-components for hand-laid-out accordions. */
export interface AccordionParts<Id extends string = string> {
  /** One complete row: header plus panel. */
  Item: (props: AccordionPartProps<Id>) => React.ReactElement | null;
  /** Just the heading and its button. `children` replaces the default label. */
  Trigger: (props: AccordionPartProps<Id>) => React.ReactElement | null;
  /** Just the collapsible region. `children` replaces the configured content. */
  Panel: (props: AccordionPartProps<Id>) => React.ReactElement | null;
  /** Just the open/closed glyph. */
  Indicator: (props: AccordionPartProps<Id>) => React.ReactElement | null;
}

/**
 * What `useAccordion()` returns: a component you render, that is also the
 * controller, that also carries its parts.
 */
export type AccordionApi<Id extends string = string> = PinfoldComponent<AccordionState<Id> & AccordionParts<Id>, AccordionRootProps>;
