import type * as React from 'react';
import { splitProps } from '../preset';
import { TAGS_KEYS } from './keys';
import { useTags } from './useTags';
import type { TagsConfig, TagsTagProps } from './types';

/** The tag group as a tag: the config as props, plus any attribute of the element. */
export function Tags<V extends string = string>(props: TagsTagProps<V>): React.ReactElement {
  const [config, root] = splitProps<TagsConfig>(props as unknown as Record<string, unknown>, TAGS_KEYS);
  return useTags(config).render(root);
}
