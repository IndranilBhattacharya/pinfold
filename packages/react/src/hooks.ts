import * as React from 'react';

/** SSR-safe layout effect. */
export const useIsomorphicLayoutEffect =
  typeof document !== 'undefined' ? React.useLayoutEffect : React.useEffect;

/**
 * Stable, SSR-safe id (React 18+ `useId`). The characters React wraps ids in
 * (`:` in 18, `«»` in 19) are stripped so the id is also a valid CSS selector.
 */
export function useId(provided?: string): string {
  const generated = React.useId();
  return provided || 'pinfold-' + generated.replace(/[^\w-]/g, '');
}

/**
 * A callback whose identity never changes but which always sees fresh props.
 * Lets us hand stable handlers to consumers without re-render churn.
 */
export function useEvent<T extends (...args: any[]) => any>(fn: T): T {
  const ref = React.useRef(fn);
  useIsomorphicLayoutEffect(() => {
    ref.current = fn;
  });
  return React.useCallback(((...args: any[]) => ref.current(...args)) as T, []);
}

export interface ControllableStateOptions<T> {
  value?: T;
  defaultValue: T | (() => T);
  onChange?: (value: T) => void;
}

/** One state hook that is controlled, uncontrolled, or both. */
export function useControllableState<T>({
  value,
  defaultValue,
  onChange,
}: ControllableStateOptions<T>): [T, (next: T | ((prev: T) => T)) => void] {
  const [uncontrolled, setUncontrolled] = React.useState<T>(defaultValue);
  const isControlled = value !== undefined;
  const current = isControlled ? (value as T) : uncontrolled;

  const currentRef = React.useRef(current);
  currentRef.current = current;

  const setValue = useEvent((next: T | ((prev: T) => T)) => {
    const resolved =
      typeof next === 'function' ? (next as (prev: T) => T)(currentRef.current) : next;
    if (Object.is(resolved, currentRef.current)) return;
    if (!isControlled) setUncontrolled(resolved);
    onChange?.(resolved);
  });

  return [current, setValue];
}
