import * as React from 'react';

export interface LazyOptions {
  /** Rendered while the chunk downloads. Default: nothing. */
  fallback?: React.ReactNode;
  /** Name shown in React DevTools. */
  displayName?: string;
}

/**
 * Wrap a dynamic import into a drop-in component with its own Suspense
 * boundary, so consumers get code-splitting without touching their tree:
 *
 *   const Accordion = createLazyComponent(() => import('@knotui/accordion'));
 */
export function createLazyComponent<P extends object>(
  loader: () => Promise<{ default: React.ComponentType<P> }>,
  options: LazyOptions = {},
): React.ComponentType<P> {
  const Lazy = React.lazy(loader);
  const Wrapped = (props: P) =>
    React.createElement(
      React.Suspense,
      { fallback: options.fallback ?? null },
      React.createElement(Lazy, props as any),
    );
  Wrapped.displayName = options.displayName ?? 'KnotLazy';
  return Wrapped as React.ComponentType<P>;
}
