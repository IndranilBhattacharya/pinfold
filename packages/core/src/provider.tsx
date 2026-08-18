import * as React from 'react';
import { useIsomorphicLayoutEffect } from './hooks';
import type { KnotDir, KnotRadius, KnotSize, KnotTheme, KnotTone } from './types';

export interface KnotContextValue {
  theme: KnotTheme;
  radius: KnotRadius;
  dir: KnotDir;
  size: KnotSize;
  tone: KnotTone;
  /** Disable every component transition, e.g. in tests or on low-power devices. */
  disableAnimation: boolean;
}

const DEFAULTS: KnotContextValue = {
  theme: 'system',
  radius: 'md',
  dir: 'ltr',
  size: 'md',
  tone: 'primary',
  disableAnimation: false,
};

const KnotContext = React.createContext<KnotContextValue>(DEFAULTS);

/** Component-level defaults. Every component calls this; the provider is optional. */
export function useKnot(): KnotContextValue {
  return React.useContext(KnotContext);
}

export interface KnotProviderProps extends Partial<KnotContextValue> {
  children?: React.ReactNode;
  /**
   * Write `data-knot-theme` / `data-knot-radius` onto `<html>` instead of a
   * wrapper element. Use this when portals (dialogs, tooltips) must inherit
   * the theme. Default: false.
   */
  applyToDocument?: boolean;
  className?: string;
}

export function KnotProvider(props: KnotProviderProps): React.ReactElement {
  const { children, applyToDocument = false, className, ...overrides } = props;
  const parent = React.useContext(KnotContext);

  const value = React.useMemo<KnotContextValue>(
    () => ({ ...parent, ...stripUndefined(overrides) }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [parent, overrides.theme, overrides.radius, overrides.dir, overrides.size, overrides.tone, overrides.disableAnimation],
  );

  useIsomorphicLayoutEffect(() => {
    if (!applyToDocument) return;
    const el = document.documentElement;
    const prevTheme = el.getAttribute('data-knot-theme');
    const prevRadius = el.getAttribute('data-knot-radius');
    if (value.theme === 'system') el.removeAttribute('data-knot-theme');
    else el.setAttribute('data-knot-theme', value.theme);
    el.setAttribute('data-knot-radius', value.radius);
    return () => {
      restore(el, 'data-knot-theme', prevTheme);
      restore(el, 'data-knot-radius', prevRadius);
    };
  }, [applyToDocument, value.theme, value.radius]);

  const body = applyToDocument ? (
    children
  ) : (
    <div
      className={className ? 'knot ' + className : 'knot'}
      dir={value.dir}
      data-knot-theme={value.theme === 'system' ? undefined : value.theme}
      data-knot-radius={value.radius}
    >
      {children}
    </div>
  );

  return <KnotContext.Provider value={value}>{body}</KnotContext.Provider>;
}

function restore(el: Element, attr: string, prev: string | null) {
  if (prev == null) el.removeAttribute(attr);
  else el.setAttribute(attr, prev);
}

function stripUndefined<T extends object>(obj: T): Partial<T> {
  const out: Partial<T> = {};
  for (const k in obj) if (obj[k] !== undefined) out[k] = obj[k];
  return out;
}
