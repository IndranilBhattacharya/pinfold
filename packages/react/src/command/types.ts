import type * as React from 'react';
import type { Length, ListFilter, PinfoldSize, PinfoldTone, PropsBag } from '@pinfold/core';
import type { PinfoldComponent } from '../component';
import type { SlotOverrides } from '../types';

export type CommandSlot = 'root' | 'panel' | 'search' | 'searchIcon' | 'input' | 'list' | 'group' | 'groupLabel' | 'option' | 'icon' | 'detail' | 'shortcut' | 'empty' | 'footer';

/** One command. A string is a command whose value and label are that string. */
export interface CommandItem {
  /** What `onSelect` receives. Default the label when it is a string. */
  value?: string;
  label: React.ReactNode;
  /** The text to match on, when `label` is not a string. */
  textValue?: string;
  /** Other words that find it: "settings" finds "Preferences". */
  keywords?: readonly string[];
  /** A second line. */
  description?: React.ReactNode;
  icon?: React.ReactNode;
  /** A hint at the end, e.g. "⌘N". It does not bind the key. */
  shortcut?: React.ReactNode;
  /** Commands with the same group sit together under its name. */
  group?: string;
  /** Go there, through the provider's `navigate`. */
  href?: string;
  /** Shown, never run. */
  disabled?: boolean;
  /** Runs when chosen (click or Enter). */
  onSelect?: (event: React.SyntheticEvent) => void;
}

/** Passed to slot `render` overrides. */
export interface CommandState {
  mode: 'inline' | 'dialog';
  size: PinfoldSize;
  tone: PinfoldTone;
  open: boolean;
  loading: boolean;
  /** What is typed. */
  query: string;
}

export interface CommandDimensions {
  width?: Length;
  maxHeight?: Length;
}

/**
 *   const Palette = defineCommand({ mode: 'dialog' });   // ⌘K / Ctrl+K opens it
 *   <Palette label="Commands" items={[
 *     { label: 'New file', shortcut: '⌘N', group: 'File', onSelect: newFile },
 *     { label: 'Settings', keywords: ['preferences'], href: '/settings', group: 'Go to' },
 *   ]} />
 */
export interface CommandConfig extends SlotOverrides<CommandSlot, CommandState> {
  /** Names the palette, e.g. "Commands". */
  label: string;
  /** The commands. */
  items: ReadonlyArray<CommandItem | string>;
  /** Any command was chosen: `(value, event)`. */
  onSelect?: (value: string, event: React.SyntheticEvent) => void;
  /** @default 'Type a command or search…' */
  placeholder?: string;
  /** @default 'No results' */
  emptyText?: React.ReactNode;
  /** @default 'contains' */
  filter?: ListFilter;
  inputValue?: string;
  /** @default '' */
  defaultInputValue?: string;
  /** Every keystroke: fetch matching `items` here (with `filter: 'none'`). */
  onInputChange?: (text: string) => void;
  /** Commands being fetched. @default false */
  loading?: boolean;
  /** `inline`: on the page. `dialog`: a modal palette that a hotkey opens. @default 'inline' */
  mode?: 'inline' | 'dialog';
  /** Dialog: open, controlled. */
  open?: boolean;
  /** @default false */
  defaultOpen?: boolean;
  onOpenChange?: (open: boolean) => void;
  /** Dialog: the key that opens it from anywhere (`mod` is ⌘ on Apple, Ctrl elsewhere); `''` for none. @default 'mod+k' */
  hotkey?: string;
  /** Dialog: close after a command runs. @default true */
  closeOnSelect?: boolean;
  /** Key hints under the list. @default true */
  footer?: boolean;
  /** @default 'md' */
  size?: PinfoldSize;
  /** @default 'primary' */
  tone?: PinfoldTone;
  dimensions?: CommandDimensions;
  /** @default false */
  unstyled?: boolean;
  className?: string;
  style?: React.CSSProperties;
}

export type CommandRootProps = Omit<React.HTMLAttributes<HTMLElement>, 'children' | 'onSelect'> & { [key: `data-${string}`]: unknown };
export type CommandTagProps = CommandConfig & Omit<CommandRootProps, keyof CommandConfig>;

export interface CommandApi {
  isOpen: boolean;
  open: () => void;
  close: () => void;
  /** What is typed. */
  inputValue: string;
  focus: () => void;
  getRootProps: (props?: PropsBag) => PropsBag;
  render: (props?: CommandRootProps) => React.ReactElement;
}
export type CommandComponent = PinfoldComponent<CommandApi, CommandRootProps>;
