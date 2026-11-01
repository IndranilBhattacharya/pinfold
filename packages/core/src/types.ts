/** Shared scale used by every Pinfold component. */
export type PinfoldSize = 'sm' | 'md' | 'lg';
export type PinfoldRadius = 'none' | 'sm' | 'md' | 'lg' | 'full';
export type PinfoldTone = 'neutral' | 'primary' | 'success' | 'warning' | 'danger' | 'info';
export type PinfoldOrientation = 'horizontal' | 'vertical';
export type PinfoldDir = 'ltr' | 'rtl';
export type PinfoldTheme = 'light' | 'dark' | 'system';
/** When a component's code loads. `auto`: light components eagerly, heavy ones when visible. */
export type PinfoldLazy = 'auto' | 'eager' | 'visible' | 'idle';
/** Visual style pack, applied through `data-pinfold-style`. */
export type PinfoldStylePack = 'default' | 'glass' | 'bauhaus' | 'brutalist' | 'noise' | 'soft';

/** Any DOM props bag a component hands back from a `getXProps()` call. */
export type PropsBag = Record<string, any>;

/** A CSS length. Numbers are px, strings pass through (`'50%'`, `'12rem'`, `calc()`). */
export type Length = number | string;

/** A callback ref or a `{ current }` object, the two shapes every framework's refs reduce to. */
export type Ref<T> = ((node: T | null) => void) | { current: T | null } | null;
