import * as React from 'react';

/** What scrolls under a bar that reacts to scrolling: the window, an element by ref, or a function that finds it. */
export type ScrollTarget = 'window' | React.RefObject<HTMLElement | null> | (() => HTMLElement | null);

/**
 * The scrolling region a layout gives the parts inside it: an AppShell with `scroll: 'content'`
 * scrolls its page region, not the window, so a Navbar in its bar listens there with no setting.
 */
export const ScrollRegion = React.createContext<React.RefObject<HTMLElement | null> | null>(null);

/** The element to listen on, or null for the window. */
export function resolveScrollTarget(target: ScrollTarget | undefined, region: React.RefObject<HTMLElement | null> | null): HTMLElement | null {
  const chosen = target ?? region ?? 'window';
  if (chosen === 'window') return null;
  if (typeof chosen === 'function') return chosen();
  return chosen.current;
}
