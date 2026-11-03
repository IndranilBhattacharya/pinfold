import type * as React from 'react';
import { splitProps } from '../preset';
import { AVATAR_KEYS } from './keys';
import { useAvatar } from './useAvatar';
import type { AvatarConfig, AvatarTagProps } from './types';

/** The avatar as a tag: the config as props, plus any attribute of the element. */
export function Avatar(props: AvatarTagProps): React.ReactElement {
  const [config, root] = splitProps<AvatarConfig>(props as unknown as Record<string, unknown>, AVATAR_KEYS);
  return useAvatar(config).render(root);
}
