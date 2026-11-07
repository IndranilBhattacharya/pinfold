import type * as React from 'react';
import type { Length, PinfoldSize, PinfoldTone, PropsBag } from '@pinfold/core';
import type { PinfoldComponent } from '../component';
import type { SlotOverrides } from '../types';

export type AvatarSlot = 'root' | 'image' | 'fallback' | 'status' | 'item' | 'overflow';
export type AvatarShape = 'circle' | 'square';
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
}

/** Passed to slot `render` overrides. */
export interface AvatarState {
  size: PinfoldSize;
  shape: AvatarShape;
  group: boolean;
}

export interface AvatarDimensions {
  size?: Length;
  fontSize?: Length;
  overlap?: Length;
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
  /** Group: accessible name of the group. */
  label?: string;
  /** @default 'md' */
  size?: PinfoldSize;
  /** @default 'circle' */
  shape?: AvatarShape;
  /**
   * Colour behind the initials; `auto` picks one from the name.
   * @default 'auto'
   */
  tone?: 'auto' | PinfoldTone;
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
