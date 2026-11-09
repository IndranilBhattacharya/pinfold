import type * as React from 'react';
import type { PinfoldSize, PinfoldTone, PropsBag, RadiusOption } from '@pinfold/core';
import type { PinfoldComponent } from '../component';
import type { SlotOverrides } from '../types';

export type ResizableSlot = 'root' | 'panel' | 'handle' | 'grip';

/** One panel. Sizes are percents of the group. */
export interface ResizablePanel {
  id: string;
  content: React.ReactNode;
  /** Names the panel, and its handle ("Resize Files"). */
  label?: string;
  /** Default an equal share of what is left. */
  defaultSize?: number;
  /** @default 10 */
  min?: number;
  /** @default 90 */
  max?: number;
}

/** Passed to slot `render` overrides. */
export interface ResizableState {
  orientation: 'horizontal' | 'vertical';
  size: PinfoldSize;
  tone: PinfoldTone;
  /** The panels' sizes, percents. */
  sizes: readonly number[];
}

/**
 *   const Workspace = defineResizable({ handle: 'grip' });
 *   <Workspace label="Editor" panels={[{ id: 'files', label: 'Files', defaultSize: 25, content: <Files /> }, { id: 'code', content: <Code /> }]} autoSaveId="editor" />
 */
export interface ResizableConfig extends SlotOverrides<ResizableSlot, ResizableState> {
  /** Names the group, e.g. "Editor". */
  label: string;
  panels: readonly ResizablePanel[];
  /** @default 'horizontal' */
  orientation?: 'horizontal' | 'vertical';
  /** The sizes (percents), controlled. */
  sizes?: readonly number[];
  /** `(sizes) => void` while a handle moves. */
  onResize?: (sizes: number[]) => void;
  /** Keep the sizes in this browser under this key, so they survive a reload. */
  autoSaveId?: string;
  /** The handle: a hairline, or a hairline with a grip. @default 'line' */
  handle?: 'line' | 'grip';
  /** Percent an arrow key moves a handle. @default 5 */
  step?: number;
  /** Corner radius: a preset rescales every corner inside like the theme presets; a length (`12` is px) sets the frame. Default the theme radius. */
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

export type ResizableRootProps = Omit<React.HTMLAttributes<HTMLDivElement>, 'children'> & { [key: `data-${string}`]: unknown };
export type ResizableTagProps = ResizableConfig & Omit<ResizableRootProps, keyof ResizableConfig>;

export interface ResizableApi {
  sizes: readonly number[];
  setSizes: (sizes: readonly number[]) => void;
  /** Back to the default sizes. */
  reset: () => void;
  getRootProps: (props?: PropsBag) => PropsBag;
  render: (props?: ResizableRootProps) => React.ReactElement;
}
export type ResizableComponent = PinfoldComponent<ResizableApi, ResizableRootProps>;
