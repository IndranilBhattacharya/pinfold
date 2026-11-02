import * as React from 'react';
import { Button } from './client';
import type { ButtonConfig, ButtonRootProps } from './types';

/** What `defineButton` returns: a component with the config baked in. */
export type DefinedButton = ((props: ButtonRootProps) => React.ReactElement) & { config: ButtonConfig; displayName?: string };

/**
 * The non-hook twin of `useButton`, for Server Components. Same config, same tag:
 *
 *   const Docs = defineButton({ label: 'Read the docs', href: '/docs', variant: 'soft' });
 *   return <Docs />;
 *
 * From a Server Component the config must be serialisable: no `onClick` (use `href`, or
 * `type: 'submit'` inside a form with a server action). For the controller use `useButton`.
 */
export function defineButton(config: ButtonConfig): DefinedButton {
  const Tag = Button as unknown as (props: ButtonConfig & ButtonRootProps) => React.ReactElement;
  const Defined = ((props: ButtonRootProps) => React.createElement(Tag, { ...config, ...props })) as unknown as DefinedButton;
  Defined.config = config;
  Defined.displayName = 'DefinedButton';
  return Defined;
}
