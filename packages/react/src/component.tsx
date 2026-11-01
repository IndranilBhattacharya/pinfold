import * as React from 'react';
import { useIsomorphicLayoutEffect } from './hooks';

/**
 * A component that is also its own controller.
 *
 *   const Accordion = useAccordion(config);
 *   return <Accordion className="mt-6" />;   // renders
 *   Accordion.toggle('faq-1');               // controls
 *   <Accordion.Panel id="faq-1" />           // composes
 */
export type PinfoldComponent<Api, Props> = ((props: Props) => React.ReactElement | null) &
  Api & { displayName?: string };

type Part = (props: any) => React.ReactElement | null;

/** Per-instance render counter the returned component and its parts subscribe to. */
interface RenderStore {
  version: number;
  listeners: Set<() => void>;
}

/**
 * Turn a render function plus an API object (and optional parts) into a
 * stable component.
 *
 * Identity stability: a component created fresh on every render is a *new
 * element type* to React, which remounts the whole subtree on each parent
 * update, losing focus, selection, scroll position and running transitions.
 * So the component and its parts are created once and read the current
 * render through a ref.
 *
 * Freshness: because the identity never changes, a memoising parent (the
 * React Compiler, `React.memo`, a cached element) may skip re-rendering it.
 * So every hook render bumps a version, and after commit the component and
 * each part re-render through `useSyncExternalStore` if they have not yet
 * seen it. In the ordinary case they already rendered with the parent, the
 * snapshot matches, and React does no extra work.
 */
export function usePinfoldComponent<
  Api extends object,
  Props extends object,
  Parts extends { [K in keyof Parts]: Part } = {},
>(
  displayName: string,
  api: Api,
  render: (props: Props) => React.ReactElement | null,
  buildParts?: () => Parts,
): PinfoldComponent<Api & Parts, Props> {
  const renderRef = React.useRef(render);
  renderRef.current = render;

  const ref = React.useRef<{ store: RenderStore; Component: PinfoldComponent<Api & Parts, Props> } | null>(null);
  if (ref.current === null) {
    const store: RenderStore = { version: 0, listeners: new Set() };
    const subscribe = (listener: () => void) => {
      store.listeners.add(listener);
      return () => {
        store.listeners.delete(listener);
      };
    };
    const snapshot = () => store.version;
    const useFresh = () => React.useSyncExternalStore(subscribe, snapshot, snapshot);

    const Component = ((props: Props) => {
      useFresh();
      return renderRef.current(props);
    }) as PinfoldComponent<Api & Parts, Props>;
    Component.displayName = displayName;

    const parts = buildParts ? buildParts() : ({} as Parts);
    for (const key of Object.keys(parts)) {
      const part = parts[key as keyof Parts] as Part;
      const Live: Part = (props) => {
        useFresh();
        return part(props);
      };
      (Live as { displayName?: string }).displayName = `${displayName}.${key}`;
      (Component as unknown as Record<string, Part>)[key] = Live;
    }
    ref.current = { store, Component };
  }

  const { store, Component } = ref.current;
  // This render's state is newer than anything a subscriber has rendered.
  store.version++;
  useIsomorphicLayoutEffect(() => {
    store.listeners.forEach((listener) => listener());
  });

  // Mutating the same function object keeps identity while the API stays live.
  return Object.assign(Component, api, { displayName });
}
