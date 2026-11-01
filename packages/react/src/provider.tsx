import * as React from 'react';
import { useIsomorphicLayoutEffect } from './hooks';
import type { PinfoldDir, PinfoldRadius, PinfoldSize, PinfoldTheme, PinfoldTone } from '@pinfold/core';

export interface PinfoldContextValue {
  theme: PinfoldTheme;
  radius: PinfoldRadius;
  dir: PinfoldDir;
  size: PinfoldSize;
  tone: PinfoldTone;
  /** Disable every component transition, e.g. in tests or on low-power devices. */
  disableAnimation: boolean;
}

const DEFAULTS: PinfoldContextValue = {
  theme: 'system',
  radius: 'md',
  dir: 'ltr',
  size: 'md',
  tone: 'primary',
  disableAnimation: false,
};

const PinfoldContext = React.createContext<PinfoldContextValue>(DEFAULTS);

/** Component-level defaults. Every component calls this; the provider is optional. */
export function usePinfold(): PinfoldContextValue {
  return React.useContext(PinfoldContext);
}

export interface PinfoldProviderProps extends Partial<PinfoldContextValue> {
  children?: React.ReactNode;
  /**
   * Write `data-pinfold-theme` / `data-pinfold-radius` onto `<html>` instead of a
   * wrapper element. Use this when portals (dialogs, tooltips) must inherit
   * the theme. Default: false.
   */
  applyToDocument?: boolean;
  className?: string;
}

export function PinfoldProvider(props: PinfoldProviderProps): React.ReactElement {
  const { children, applyToDocument = false, className, ...overrides } = props;
  const parent = React.useContext(PinfoldContext);

  const value = React.useMemo<PinfoldContextValue>(
    () => ({ ...parent, ...stripUndefined(overrides) }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [parent, overrides.theme, overrides.radius, overrides.dir, overrides.size, overrides.tone, overrides.disableAnimation],
  );

  useIsomorphicLayoutEffect(() => {
    if (!applyToDocument) return;
    const el = document.documentElement;
    const prevTheme = el.getAttribute('data-pinfold-theme');
    const prevRadius = el.getAttribute('data-pinfold-radius');
    if (value.theme === 'system') el.removeAttribute('data-pinfold-theme');
    else el.setAttribute('data-pinfold-theme', value.theme);
    el.setAttribute('data-pinfold-radius', value.radius);
    return () => {
      restore(el, 'data-pinfold-theme', prevTheme);
      restore(el, 'data-pinfold-radius', prevRadius);
    };
  }, [applyToDocument, value.theme, value.radius]);

  const body = applyToDocument ? (
    children
  ) : (
    <div
      className={className ? 'pinfold ' + className : 'pinfold'}
      dir={value.dir}
      data-pinfold-theme={value.theme === 'system' ? undefined : value.theme}
      data-pinfold-radius={value.radius}
    >
      {children}
    </div>
  );

  return <PinfoldContext.Provider value={value}>{body}</PinfoldContext.Provider>;
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
