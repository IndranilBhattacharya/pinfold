import * as React from 'react';

/** SSR-safe layout effect. */
export const useIsomorphicLayoutEffect =
  typeof document !== 'undefined' ? React.useLayoutEffect : React.useEffect;

let uid = 0;
// React 18 ships `useId`; on 16.8–17 we fall back to a mount-stable counter.
// Read off the namespace so bundlers targeting older React never see a missing export.
const nativeUseId: (() => string) | undefined = (React as any).useId;

/** Stable, SSR-tolerant id. Works on React 16.8 through 19+. */
export function useId(provided?: string): string {
  if (nativeUseId) {
    // eslint-disable-next-line react-hooks/rules-of-hooks -- branch is constant per build
    const generated = nativeUseId();
    return provided || 'lumae-' + generated.replace(/:/g, '');
  }
  // eslint-disable-next-line react-hooks/rules-of-hooks -- branch is constant per build
  const [fallback] = React.useState(() => 'lumae-' + ++uid);
  return provided || fallback;
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
