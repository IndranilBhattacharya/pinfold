import type { LumaeDir, LumaeOrientation } from './types';

export interface ListNavOptions {
  orientation?: LumaeOrientation;
  dir?: LumaeDir;
  /** Wrap from last to first. Default true. */
  loop?: boolean;
}

/**
 * WAI-ARIA roving-focus key resolution, shared by every list-like component
 * (accordion, tabs, menu, listbox, toolbar…).
 *
 * Returns the index to move focus to, or `null` when the key is not ours —
 * callers must not `preventDefault()` on `null`.
 */
export function nextIndexFromKey(
  key: string,
  current: number,
  count: number,
  { orientation = 'vertical', dir = 'ltr', loop = true }: ListNavOptions = {},
): number | null {
  if (count === 0) return null;

  const forward = orientation === 'vertical' ? 'ArrowDown' : dir === 'rtl' ? 'ArrowLeft' : 'ArrowRight';
  const backward = orientation === 'vertical' ? 'ArrowUp' : dir === 'rtl' ? 'ArrowRight' : 'ArrowLeft';

  switch (key) {
    case forward: {
      const next = current + 1;
      return next < count ? next : loop ? 0 : current;
    }
    case backward: {
      const prev = current - 1;
      return prev >= 0 ? prev : loop ? count - 1 : current;
    }
    case 'Home':
      return 0;
    case 'End':
      return count - 1;
    default:
      return null;
  }
}
