import type * as React from 'react';
import type { Length, PinfoldSize, PinfoldTone, PropsBag, RadiusOption } from '@pinfold/core';
import type { PinfoldComponent } from '../component';
import type { SlotOverrides } from '../types';

export type TreeViewSlot = 'root' | 'search' | 'tree' | 'item' | 'guide' | 'toggle' | 'checkbox' | 'icon' | 'label' | 'match' | 'badge' | 'handle' | 'status' | 'empty';
export type TreeViewSelectionMode = 'none' | 'single' | 'multiple';
export type TreeViewCheckState = boolean | 'mixed';

/** A node as you write it. A plain string is a leaf with that label. Extra fields are kept and handed back. */
export interface TreeViewItem {
  /** Unique in the tree. Default the path of labels (`src/index.ts`). */
  id?: string;
  label: React.ReactNode;
  /** The text typeahead and search match, when `label` is not a string. */
  textValue?: string;
  icon?: React.ReactNode;
  /** After the label: a count, a status. */
  badge?: React.ReactNode;
  /** Nested nodes. An empty array is a folder with nothing in it. */
  children?: ReadonlyArray<TreeViewItem | string>;
  /** With `loadChildren`: the node has children, loaded when it first opens. */
  hasChildren?: boolean;
  /** Focusable and openable, but cannot be selected, checked or moved. */
  disabled?: boolean;
  [key: string]: unknown;
}
export type TreeViewItemInput = TreeViewItem | string;

/** A row's live state: passed to `renderItem`, `rowProps` and row slot overrides as `item`. */
export interface TreeViewItemContext {
  id: string;
  /** The node as you wrote it (a string becomes `{ label }`). */
  data: TreeViewItem;
  label: React.ReactNode;
  /** The text typeahead and search use. */
  text: string;
  /** 0 at the top. */
  depth: number;
  parentId: string | null;
  /** Position among its siblings, from 0. */
  index: number;
  expanded: boolean;
  selected: boolean;
  checked: TreeViewCheckState;
  focused: boolean;
  disabled: boolean;
  /** Its children are being loaded. */
  loading: boolean;
  /** Loading its children failed. */
  error: unknown;
  /** It is a parent: it has children, or children to load. */
  hasChildren: boolean;
  /** Matches the search text. */
  match: boolean;
  toggle: () => void;
  select: () => void;
}

/** Passed to slot `render` overrides. */
export interface TreeViewState {
  variant: 'soft' | 'solid' | 'ghost';
  size: PinfoldSize;
  tone: PinfoldTone;
  selectionMode: TreeViewSelectionMode;
  checkable: boolean;
  /** The search text. */
  filter: string;
  /** An id is being dragged. */
  dragging: string | null;
}

export interface TreeViewMove {
  id: string;
  /** `null` at the top level. */
  parentId: string | null;
  /** Among the new siblings, after the node left its old place. */
  index: number;
  /** The whole tree after the move. */
  items: TreeViewItem[];
}

export interface TreeViewDimensions {
  /** Indent per level. */
  indent?: Length;
  rowHeight?: Length;
  /** A fixed height: the tree scrolls inside it. */
  height?: Length;
}

export interface TreeViewLabels {
  search?: string;
  empty?: string;
  loading?: string;
  error?: string;
  retry?: string;
  handle?: string;
  moved?: (info: { label: string; index: number; count: number; parent: string | null }) => string;
}

/**
 *   const Files = defineTreeView({ searchable: true });
 *   <Files label="Files" items={[{ label: 'src', children: ['index.ts'] }, 'package.json']} onAction={open} />
 */
export interface TreeViewConfig extends SlotOverrides<TreeViewSlot, TreeViewState, TreeViewItemContext> {
  /** Names the tree for assistive technology. */
  label?: string;
  /** The nodes. A string is a leaf with that label. */
  items?: ReadonlyArray<TreeViewItemInput>;
  /** The selected (with `checkable`, the checked) ids, controlled. */
  value?: readonly string[];
  defaultValue?: readonly string[];
  /** The open ids, controlled. */
  expanded?: readonly string[];
  defaultExpanded?: readonly string[];
  /** @default 'single' */
  selectionMode?: TreeViewSelectionMode;
  /** A tri-state checkbox on every row; a parent reflects its children. @default false */
  checkable?: boolean;
  /** Pressing a parent row also opens or closes it. @default true */
  expandOnClick?: boolean;
  /** Loads the children of a node with `hasChildren` the first time it opens. */
  loadChildren?: (item: TreeViewItem, options: { signal: AbortSignal }) => Promise<ReadonlyArray<TreeViewItemInput>>;
  /** A search field above the tree. @default false */
  searchable?: boolean;
  /** The search text, controlled. */
  filter?: string;
  /** Default: the label (or `textValue`) contains the text, ignoring case. */
  filterFn?: (item: TreeViewItem, query: string) => boolean;
  /** A drag handle on each row, and Alt + arrows. @default false */
  reorderable?: boolean;
  /** @default false */
  disabled?: boolean;
  /** How a selected row looks. @default 'soft' */
  variant?: 'soft' | 'solid' | 'ghost';
  /** @default 'comfortable' */
  density?: 'comfortable' | 'compact';
  /** Hairlines down each open level. @default true */
  guides?: boolean;
  /** The content of every row; the row element and its ARIA stay. */
  renderItem?: (args: { item: TreeViewItemContext; props: PropsBag; children: React.ReactNode }) => React.ReactNode;
  /** Extra props merged onto every row element (a drag-and-drop library's listeners). */
  rowProps?: (item: TreeViewItemContext) => PropsBag | undefined;
  onSelectionChange?: (ids: string[], item: TreeViewItemContext | null) => void;
  onExpandedChange?: (ids: string[], change: { id: string; expanded: boolean }) => void;
  onAction?: (id: string, item: TreeViewItemContext) => void;
  onMove?: (move: TreeViewMove) => void;
  onFilterChange?: (text: string) => void;
  onLoadError?: (item: TreeViewItem, error: unknown) => void;
  labels?: TreeViewLabels;
  dimensions?: TreeViewDimensions;
  /** Corner radius: a preset rescales every corner inside; a length sets the rows'. Default the theme radius. */
  radius?: RadiusOption;
  /** @default 'md' */
  size?: PinfoldSize;
  /** @default 'primary' */
  tone?: PinfoldTone;
  /** @default false */
  unstyled?: boolean;
  className?: string;
  style?: React.CSSProperties;
}

export type TreeViewRootProps = React.HTMLAttributes<HTMLDivElement> & { [key: `data-${string}`]: unknown };
export type TreeViewTagProps = TreeViewConfig & Omit<TreeViewRootProps, keyof TreeViewConfig | 'children'>;

export interface TreeViewApi {
  /** Selected (or checked) ids. */
  value: string[];
  expanded: string[];
  filter: string;
  focusedId: string | null;
  /** The rows on screen, in order. */
  visible: TreeViewItemContext[];
  getItem: (id: string) => TreeViewItemContext | null;
  expand: (id: string) => void;
  collapse: (id: string) => void;
  toggle: (id: string) => void;
  expandAll: () => void;
  collapseAll: () => void;
  select: (id: string) => void;
  setValue: (ids: readonly string[]) => void;
  setFilter: (text: string) => void;
  focusItem: (id: string) => void;
  /** Move a node, as a drag or Alt + arrows would. */
  move: (id: string, parentId: string | null, index: number) => void;
  /** Load a node's children again. */
  reload: (id: string) => void;
  getRootProps: (props?: PropsBag) => PropsBag;
  getTreeProps: (props?: PropsBag) => PropsBag;
  getItemProps: (id: string, props?: PropsBag) => PropsBag;
  getSearchProps: (props?: PropsBag) => PropsBag;
  render: (props?: TreeViewRootProps) => React.ReactElement;
}
export type TreeViewComponent = PinfoldComponent<TreeViewApi & { Search: (props: React.InputHTMLAttributes<HTMLInputElement>) => React.ReactElement }, TreeViewRootProps>;
