import type * as React from 'react';
import { splitProps } from '../preset';
import { CURSOR_KEYS } from './keys';
import { useCursor } from './useCursor';
import type { CursorConfig, CursorTagProps } from './types';

/** The cursor as a tag: the config as props. Children are the area it belongs to; without them it covers the page. */
export function Cursor(props: CursorTagProps): React.ReactElement {
  const [config, root] = splitProps<CursorConfig>(props as unknown as Record<string, unknown>, CURSOR_KEYS);
  return useCursor(config).render(root);
}
