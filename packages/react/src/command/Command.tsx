import type * as React from 'react';
import { splitProps } from '../preset';
import { COMMAND_KEYS } from './keys';
import { useCommand } from './useCommand';
import type { CommandConfig, CommandTagProps } from './types';

/** The command palette as a tag: the config as props, plus any attribute of the element. */
export function Command(props: CommandTagProps): React.ReactElement {
  const [config, root] = splitProps<CommandConfig>(props as unknown as Record<string, unknown>, COMMAND_KEYS);
  return useCommand(config).render(root);
}
