import type * as React from 'react';
import { splitProps } from '../preset';
import { RESIZABLE_KEYS } from './keys';
import { useResizable } from './useResizable';
import type { ResizableConfig, ResizableTagProps } from './types';

/** The resizable group as a tag: the config as props, plus any attribute of the element. */
export function Resizable(props: ResizableTagProps): React.ReactElement {
  const [config, root] = splitProps<ResizableConfig>(props as unknown as Record<string, unknown>, RESIZABLE_KEYS);
  return useResizable(config).render(root);
}
