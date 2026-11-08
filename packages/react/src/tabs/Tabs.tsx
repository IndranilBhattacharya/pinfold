import type * as React from 'react';
import { splitProps } from '../preset';
import { TABS_KEYS } from './keys';
import { useTabs } from './useTabs';
import type { TabsConfig, TabsTagProps } from './types';

/** The tabs as a tag: the config as props, plus any attribute of the element. */
export function Tabs<Id extends string = string>(props: TabsTagProps<Id>): React.ReactElement {
  const [config, root] = splitProps<TabsConfig>(props as unknown as Record<string, unknown>, TABS_KEYS);
  return useTabs(config).render(root);
}
