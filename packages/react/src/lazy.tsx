import * as React from 'react';
import type { PinfoldLazy } from '@pinfold/core';
import { usePinfold } from './provider';

export interface LazyOptions {
  /** Rendered while the chunk downloads, and in the placeholder. Default: nothing. */
  fallback?: React.ReactNode;
  /** Name shown in React DevTools. */
  displayName?: string;
  /** What `lazy: 'auto'` means for this component: `eager` when light, `visible` when heavy. Default `eager`. */
  auto?: Exclude<PinfoldLazy, 'auto'>;
}

/**
 * Wrap a dynamic import into a drop-in component with its own Suspense
 * boundary, so consumers get code-splitting without touching their tree:
 *
 *   const Accordion = createLazyComponent(() => import('@pinfold/react/accordion'));
 *   <Accordion items={items} lazy="visible" />
 *
 * `lazy` (prop, else the provider): `eager` loads at once, `visible` when the
 * placeholder nears the viewport, `idle` when the browser is idle. Lazy entries
 * render on the client; for complete server HTML use the main entry.
 */
export function createLazyComponent<P extends object>(
  loader: () => Promise<{ default: React.ComponentType<P> }>,
  options: LazyOptions = {},
): React.ComponentType<P & { lazy?: PinfoldLazy }> {
  const Lazy = React.lazy(loader);
  const fallback = options.fallback ?? null;

  const Wrapped = (props: P & { lazy?: PinfoldLazy }) => {
    const ctx = usePinfold();
    const preferred = props.lazy ?? ctx.lazy;
    const strategy = preferred === 'auto' ? options.auto ?? 'eager' : preferred;
    const [ready, setReady] = React.useState(strategy === 'eager');
    const placeholder = React.useRef<HTMLDivElement>(null);

    React.useEffect(() => {
      if (ready) return;
      if (strategy === 'idle') {
        const w = window as Window & {
          requestIdleCallback?: (cb: () => void) => number;
          cancelIdleCallback?: (id: number) => void;
        };
        if (w.requestIdleCallback) {
          const id = w.requestIdleCallback(() => setReady(true));
          return () => w.cancelIdleCallback?.(id);
        }
        const id = setTimeout(() => setReady(true), 200);
        return () => clearTimeout(id);
      }
      const el = placeholder.current;
      if (!el || typeof IntersectionObserver === 'undefined') {
        setReady(true);
        return;
      }
      const observer = new IntersectionObserver(
        (entries) => {
          if (entries.some((e) => e.isIntersecting)) {
            setReady(true);
            observer.disconnect();
          }
        },
        { rootMargin: '200px' },
      );
      observer.observe(el);
      return () => observer.disconnect();
    }, [ready, strategy]);

    if (!ready) {
      return (
        <div ref={placeholder} data-pinfold-lazy="" style={{ minHeight: 1 }}>
          {fallback}
        </div>
      );
    }
    return (
      <React.Suspense fallback={fallback}>
        {React.createElement(Lazy as React.ComponentType<any>, props)}
      </React.Suspense>
    );
  };
  Wrapped.displayName = options.displayName ?? 'PinfoldLazy';
  return Wrapped;
}
