import type * as React from 'react';

/** The app's router, from the provider: `navigate={router.push}`. */
export type PinfoldNavigate = (href: string) => void;

/**
 * Hand a link click to the app's router instead of the browser: only a plain click (no modifier
 * key, main button, same tab) and only when a router was given. A new-tab click stays the browser's.
 */
export function followLink(event: React.MouseEvent, href: string | undefined, navigate: PinfoldNavigate | undefined, target?: string): void {
  if (!navigate || href === undefined || event.defaultPrevented) return;
  if (event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
  if (target && target !== '_self') return;
  event.preventDefault();
  navigate(href);
}
