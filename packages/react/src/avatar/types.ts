import type * as React from 'react';
import type { Length, PinfoldSize, PinfoldTone, PropsBag, RadiusOption } from '@pinfold/core';
import type { PinfoldComponent } from '../component';
import type { SlotOverrides, Slottable } from '../types';

export type AvatarSlot = 'root' | 'image' | 'fallback' | 'status' | 'item' | 'overflow';
export type AvatarShape = 'circle' | 'rounded' | 'square';
export type AvatarSize = 'xs' | 'sm' | 'md' | 'lg' | 'xl' | number | (string & {});
export type AvatarTone = 'auto' | PinfoldTone;
export type AvatarStatusPlacement = 'bottom-end' | 'top-end' | 'bottom-start' | 'top-start';
export type AvatarLoadingStatus = 'loading' | 'loaded' | 'error';
export type AvatarStatus = 'online' | 'away' | 'busy' | 'offline';

/** One person: the single avatar's own fields, or an entry of `items`. */
export interface AvatarPerson {
  /** Gives the accessible name, the initials and the `auto` colour. */
  name?: string;
  /** Image URL; the initials show while it loads or if it fails. */
  src?: string;
  /** Accessible name when it should differ from `name`. */
  alt?: string;
  /** Overrides the initials made from `name`. */
  initials?: string;
  /** A presence dot, also read: "Ada Lovelace, online". */
  status?: AvatarStatus;
  /** What the `auto` colour is worked out from when it should not be the name (a user id). */
  colorFrom?: string;
  /** Makes the face a link. */
  href?: string;
  /** Makes the face a button. */
  onClick?: (event: React.MouseEvent<HTMLElement>) => void;
}

/** Passed to slot `render` overrides. */
export interface AvatarState {
  /** The size preset, or `custom` for a length. */
  size: PinfoldSize | 'xs' | 'xl' | 'custom';
  shape: AvatarShape;
  group: boolean;
  /** The picture's state; `error` also when there is none to load. */
  loading: AvatarLoadingStatus;
}

/** What a custom "+N" receives. */
export interface AvatarSurplus {
  /** How many people are folded. */
  count: number;
  /** The folded people. */
  hidden: AvatarPerson[];
}

export interface AvatarDimensions {
  size?: Length;
  fontSize?: Length;
  overlap?: Length;
  statusSize?: Length;
  ringWidth?: Length;
}

/**
 *   const Person = defineAvatar();
 *   <Person name="Ada Lovelace" src={photo} status="online" />
 *
 *   const Team = defineAvatar({ max: 3, label: 'Project members' });
 *   <Team items={members} />
 */
export interface AvatarConfig extends AvatarPerson, SlotOverrides<AvatarSlot, AvatarState> {
  /** A group: one entry per person, stacked, with "+N" past `max`. */
  items?: readonly AvatarPerson[];
  /** A tooltip with the name and status. On in a group, off on its own. */
  tooltip?: boolean;
  /** @default 4 */
  max?: number;
  /** Group: your own "+N" content. */
  surplus?: (info: AvatarSurplus) => React.ReactNode;
  /**
   * Group: the faces spread apart while the pointer or focus is on the group.
   * @default false
   */
  expandOnHover?: boolean;
  /** Your own fallback (a node, or a function of the live state); replaces the initials and the icon. */
  fallback?: Slottable<AvatarState>;
  /** Shown when there is no picture and no initials. A person glyph by default. */
  icon?: React.ReactNode;
  /** Called as the picture goes `loading` → `loaded` or `error`. */
  onLoadingStatusChange?: (status: AvatarLoadingStatus) => void;
  /**
   * A ring with a gap in the page colour: `true`/`'auto'` in the face's colour, or a tone.
   * @default false
   */
  ring?: boolean | AvatarTone;
  /** @default 'bottom-end' */
  statusPlacement?: AvatarStatusPlacement;
  /** Group: accessible name of the group. */
  label?: string;
  /** Corner radius: a preset rescales every corner inside like the theme presets; a length (`12` is px) sets the frame. Default the theme radius. */
  radius?: RadiusOption;
  /**
   * A preset, or a length (`48` is px).
   * @default 'md'
   */
  size?: AvatarSize;
  /** @default 'circle' */
  shape?: AvatarShape;
  /**
   * Colour behind the initials; `auto` picks one from the name.
   * @default 'auto'
   */
  tone?: AvatarTone;
  dimensions?: AvatarDimensions;
  /** @default false */
  unstyled?: boolean;
  className?: string;
  style?: React.CSSProperties;
}

export type AvatarRootProps = Omit<React.HTMLAttributes<HTMLElement>, 'children'> & { [key: `data-${string}`]: unknown };
export type AvatarTagProps = AvatarConfig & Omit<AvatarRootProps, keyof AvatarConfig>;

export interface AvatarApi {
  getRootProps: (props?: PropsBag) => PropsBag;
  render: (props?: AvatarRootProps) => React.ReactElement;
}
export type AvatarComponent = PinfoldComponent<AvatarApi, AvatarRootProps>;
