import type * as React from 'react';
import { splitProps } from '../preset';
import { FILEUPLOAD_KEYS } from './keys';
import { useFileUpload } from './useFileUpload';
import type { FileUploadConfig, FileUploadTagProps } from './types';

/** The file upload as a tag: the config as props, plus any attribute of the element. */
export function FileUpload(props: FileUploadTagProps): React.ReactElement {
  const [config, root] = splitProps<FileUploadConfig>(props as unknown as Record<string, unknown>, FILEUPLOAD_KEYS);
  return useFileUpload(config).render(root);
}
