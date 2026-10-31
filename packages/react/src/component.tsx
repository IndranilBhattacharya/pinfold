import * as React from 'react';

/**
 * A component that is also its own controller.
 *
 *   const Accordion = useAccordion(config);
 *   return <Accordion className="mt-6" />;   // renders
 *   Accordion.toggle('faq-1');               // controls
 *   <Accordion.Panel id="faq-1" />           // composes
 */
export type LumaeComponent<Api, Props> = ((props: Props) => React.ReactElement | null) &
  Api & { displayName?: string };

/**
 * Turn a render function plus an API object into a stable component.
 *
 * Identity stability is the whole point. A component created fresh on every
 * render is a *new element type* to React, which unmounts and remounts the
 * entire subtree on each parent update — losing focus, selection, scroll
 * position and every running transition. So the function is created once and
 * reads the current render through a ref; only the attached API is refreshed.
 */
export function useLumaeComponent<Api extends object, Props extends object>(
  displayName: string,
  api: Api,
  render: (props: Props) => React.ReactElement | null,
): LumaeComponent<Api, Props> {
  const renderRef = React.useRef(render);
  renderRef.current = render;

  const ref = React.useRef<LumaeComponent<Api, Props> | null>(null);
  if (ref.current === null) {
    const Component = ((props: Props) => renderRef.current(props)) as LumaeComponent<Api, Props>;
    Component.displayName = displayName;
    ref.current = Component;
  }

  // Mutating the same function object keeps identity while the API stays live.
  return Object.assign(ref.current, api, { displayName });
}

/**
 * Create the sub-components a compound API exposes, once.
 *
 * Same reasoning as above: `<Accordion.Panel />` must be the same type on every
 * render or React tears the panel down mid-animation.
 */
export function useStableParts<T extends Record<string, unknown>>(build: () => T): T {
  const ref = React.useRef<T | null>(null);
  if (ref.current === null) ref.current = build();
  return ref.current;
}
