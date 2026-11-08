import type * as React from 'react';
import type { PinfoldSize, PinfoldTone, PropsBag } from '@pinfold/core';
import type { PinfoldComponent } from '../component';
import type { ButtonConfig } from '../button/types';
import type { SlotOverrides } from '../types';

export type EmptySlot = 'root' | 'media' | 'title' | 'description' | 'actions';
export type EmptyVariant = 'plain' | 'dashed' | 'card';

/** Passed to slot `render` overrides. */
export interface EmptyState {
  variant: EmptyVariant;
  size: PinfoldSize;
  tone: PinfoldTone;
}

/**
 *   const NoResults = defineEmpty({ variant: 'dashed' });
 *   <NoResults title="No invoices yet" description="Create one to get paid." actions={[{ label: 'New invoice', onClick: create }]} />
 */
export interface EmptyConfig extends SlotOverrides<EmptySlot, EmptyState> {
  /** What is missing: "No invoices yet". */
  title: React.ReactNode;
  /** What to do about it. */
  description?: React.ReactNode;
  /** An icon or picture above the text (decorative). Default a tray icon. */
  media?: React.ReactNode;
  /** Buttons: the first is the main one. */
  actions?: readonly ButtonConfig[];
  /** @default 3 */
  headingLevel?: 2 | 3 | 4 | 5 | 6;
  /** @default 'plain' */
  variant?: EmptyVariant;
  /** @default 'md' */
  size?: PinfoldSize;
  /** @default 'primary' */
  tone?: PinfoldTone;
  /** @default false */
  unstyled?: boolean;
  className?: string;
  style?: React.CSSProperties;
}

export type EmptyRootProps = Omit<React.HTMLAttributes<HTMLDivElement>, 'children' | 'title'> & { [key: `data-${string}`]: unknown };
export type EmptyTagProps = EmptyConfig & Omit<EmptyRootProps, keyof EmptyConfig>;

export interface EmptyApi {
  getRootProps: (props?: PropsBag) => PropsBag;
  render: (props?: EmptyRootProps) => React.ReactElement;
}
export type EmptyComponent = PinfoldComponent<EmptyApi, EmptyRootProps>;
