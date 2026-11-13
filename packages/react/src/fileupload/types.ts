import type * as React from 'react';
import type { FileRejection, Length, PinfoldSize, PinfoldTone, PropsBag, RadiusOption } from '@pinfold/core';
import type { PinfoldComponent } from '../component';
import type { SlotOverrides } from '../types';

export type FileUploadSlot =
  | 'root' | 'zone' | 'icon' | 'title' | 'description' | 'browse' | 'input' | 'list' | 'item' | 'thumb' | 'info' | 'name' | 'meta' | 'progress' | 'actions' | 'retry' | 'remove' | 'rejections' | 'rejection';
/** `idle`: held, with no `upload` function to run. */
export type FileUploadStatus = 'idle' | 'queued' | 'uploading' | 'done' | 'error';
export type FileUploadRejection = FileRejection<File>;

/** A file row's live state: passed to `renderItem` and file row slot overrides as `item`. */
export interface FileUploadItemContext {
  /** Unique in this upload. */
  id: string;
  file: File;
  name: string;
  size: number;
  type: string;
  status: FileUploadStatus;
  /** 0 to 1 while uploading. */
  progress: number;
  error: unknown;
  /** What `upload` resolved with. */
  response: unknown;
  /** An object URL of an image, while previews are on. */
  preview: string | null;
  index: number;
  remove: () => void;
  retry: () => void;
}

/** Passed to slot `render` overrides. */
export interface FileUploadState {
  variant: 'dropzone' | 'button' | 'compact';
  size: PinfoldSize;
  tone: PinfoldTone;
  /** Files are being dragged over. */
  dragging: boolean;
  disabled: boolean;
  files: File[];
}

export interface FileUploadDimensions {
  /** Least height of the drop zone. */
  minHeight?: Length;
  thumbSize?: Length;
}

export interface FileUploadLabels {
  title?: string;
  browse?: string;
  drop?: string;
  remove?: string;
  retry?: string;
  dismiss?: string;
  queued?: string;
  uploading?: string;
  done?: string;
  error?: string;
  type?: string;
  size?: string;
  count?: string;
}

export interface FileUploadOptions {
  /** Aborted when the file is removed or the component unmounts. */
  signal: AbortSignal;
  /** Report progress, 0 to 1. */
  onProgress: (fraction: number) => void;
}

/**
 *   const Images = defineFileUpload({ accept: 'image/*', maxSize: 5_000_000 });
 *   <Images name="photos" upload={(file, { signal, onProgress }) => send(file, { signal, onProgress })} />
 */
export interface FileUploadConfig extends SlotOverrides<FileUploadSlot, FileUploadState, FileUploadItemContext> {
  /** The zone's title. */
  label?: React.ReactNode;
  /** A line under the title. Default a hint from the rules. */
  description?: React.ReactNode;
  /** Your own icon in the zone (`null` for none). */
  icon?: React.ReactNode;
  /** Name of the hidden file input, for a native form. */
  name?: string;
  /** The files held, controlled. */
  value?: readonly File[];
  defaultValue?: readonly File[];
  /** Accepted types, as for a file input: `.pdf,image/*`. */
  accept?: string;
  /** @default true */
  multiple?: boolean;
  /** Largest file in bytes. */
  maxSize?: number;
  /** Most files held at once. */
  maxFiles?: number;
  /** A reason to reject a file, or null to keep it. */
  validate?: (file: File) => string | null | undefined;
  /** Uploads one file; run by the component for every file added. */
  upload?: (file: File, options: FileUploadOptions) => Promise<unknown>;
  /** Uploads at once. @default 3 */
  concurrency?: number;
  /** Pasting files while the upload has focus adds them. @default false */
  paste?: boolean;
  /** @default false */
  disabled?: boolean;
  /** The list of files under the zone. @default true */
  list?: boolean;
  /** Image thumbnails in the list. @default true */
  previews?: boolean;
  /** @default 'dropzone' */
  variant?: 'dropzone' | 'button' | 'compact';
  /** The content of each file row. */
  renderItem?: (args: { item: FileUploadItemContext; props: PropsBag; children: React.ReactNode }) => React.ReactNode;
  onChange?: (files: File[]) => void;
  onReject?: (rejections: FileUploadRejection[]) => void;
  onUploadComplete?: (file: File, response: unknown) => void;
  onUploadError?: (file: File, error: unknown) => void;
  labels?: FileUploadLabels;
  dimensions?: FileUploadDimensions;
  /** Corner radius: a preset rescales every corner inside; a length sets the zone's. Default the theme radius. */
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

export type FileUploadRootProps = React.HTMLAttributes<HTMLDivElement> & { [key: `data-${string}`]: unknown };
export type FileUploadTagProps = FileUploadConfig & Omit<FileUploadRootProps, keyof FileUploadConfig | 'children'>;

export interface FileUploadApi {
  files: File[];
  items: FileUploadItemContext[];
  rejections: FileUploadRejection[];
  dragging: boolean;
  /** Open the file dialog. */
  open: () => void;
  /** Add files as if picked (rules apply). */
  add: (files: readonly File[]) => void;
  remove: (file: File) => void;
  retry: (file: File) => void;
  clear: () => void;
  clearRejections: () => void;
  getRootProps: (props?: PropsBag) => PropsBag;
  getZoneProps: (props?: PropsBag) => PropsBag;
  getInputProps: (props?: PropsBag) => PropsBag;
  render: (props?: FileUploadRootProps) => React.ReactElement;
}
export type FileUploadComponent = PinfoldComponent<FileUploadApi, FileUploadRootProps>;
