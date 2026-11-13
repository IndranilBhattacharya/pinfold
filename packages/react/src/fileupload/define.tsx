import * as React from 'react';
import { mergeConfig } from '../preset';
import { FileUpload } from './client';
import type { FileUploadConfig, FileUploadTagProps } from './types';

/** Props of a preset: any part of the config, plus element attributes. */
export type FileUploadPresetProps<P> = FileUploadTagProps;

/** What `defineFileUpload` returns: a component with the preset baked in. */
export type DefinedFileUpload<P extends Partial<FileUploadConfig> = Partial<FileUploadConfig>> = ((props: FileUploadPresetProps<P>) => React.ReactElement) & { config: P; displayName?: string };

/**
 * A reusable file upload, defined once at module scope and used in one line, in loops and in
 * Server Components. Every use is its own instance: nothing is shared between them but the preset.
 *
 * Props win over the preset, then `defaults.fileupload`, the provider and the library defaults.
 */
export function defineFileUpload<P extends Partial<FileUploadConfig>>(preset: P = {} as P): DefinedFileUpload<P> {
  const Defined = ((props: FileUploadPresetProps<P>) =>
    React.createElement(FileUpload, mergeConfig<FileUploadTagProps>(preset as unknown as Partial<FileUploadTagProps>, props as unknown as Partial<FileUploadTagProps>))) as DefinedFileUpload<P>;
  Defined.config = preset;
  Defined.displayName = 'DefinedFileUpload';
  return Defined;
}
