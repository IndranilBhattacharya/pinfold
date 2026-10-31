/** Shared scale used by every Lumae component. */
export type LumaeSize = 'sm' | 'md' | 'lg';
export type LumaeRadius = 'none' | 'sm' | 'md' | 'lg' | 'full';
export type LumaeTone = 'neutral' | 'primary' | 'success' | 'warning' | 'danger' | 'info';
export type LumaeOrientation = 'horizontal' | 'vertical';
export type LumaeDir = 'ltr' | 'rtl';
export type LumaeTheme = 'light' | 'dark' | 'system';

/** Any DOM props bag a component hands back from a `getXProps()` call. */
export type PropsBag = Record<string, any>;

/** A CSS length. Numbers are px, strings pass through (`'50%'`, `'12rem'`, `calc()`). */
export type Length = number | string;

/** A callback ref or a `{ current }` object, the two shapes every framework's refs reduce to. */
export type Ref<T> = ((node: T | null) => void) | { current: T | null } | null;
