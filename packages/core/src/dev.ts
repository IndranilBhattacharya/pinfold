/**
 * Development-only diagnostics.
 *
 * Config-driven APIs fail quietly: a duplicated `id` or a `value` array that
 * silently switches a component from uncontrolled to controlled produces
 * confusing behaviour rather than an error. These warnings turn that class of
 * mistake into a message, and vanish entirely from production builds because
 * bundlers fold the `NODE_ENV` check.
 */
export const __DEV__: boolean =
  typeof process !== 'undefined' && !!process.env && process.env.NODE_ENV !== 'production';

const seen = new Set<string>();

/** Warn at most once per distinct message, so a render loop cannot spam the console. */
export function warnOnce(condition: unknown, message: string): void {
  if (!__DEV__ || !condition || seen.has(message)) return;
  seen.add(message);
  // eslint-disable-next-line no-console
  console.warn(`[lumae] ${message}`);
}

/** Test hook — lets a suite assert the same warning twice. */
export function resetWarnings(): void {
  seen.clear();
}
