import * as React from 'react';
import { useIsomorphicLayoutEffect } from './hooks';
import type { LumaeDir, LumaeRadius, LumaeSize, LumaeTheme, LumaeTone } from './types';

export interface LumaeContextValue {
  theme: LumaeTheme;
  radius: LumaeRadius;
  dir: LumaeDir;
  size: LumaeSize;
  tone: LumaeTone;
  /** Disable every component transition, e.g. in tests or on low-power devices. */
  disableAnimation: boolean;
}

const DEFAULTS: LumaeContextValue = {
  theme: 'system',
  radius: 'md',
  dir: 'ltr',
  size: 'md',
  tone: 'primary',
  disableAnimation: false,
};

const LumaeContext = React.createContext<LumaeContextValue>(DEFAULTS);

/** Component-level defaults. Every component calls this; the provider is optional. */
export function useLumae(): LumaeContextValue {
  return React.useContext(LumaeContext);
}

export interface LumaeProviderProps extends Partial<LumaeContextValue> {
  children?: React.ReactNode;
  /**
   * Write `data-lumae-theme` / `data-lumae-radius` onto `<html>` instead of a
   * wrapper element. Use this when portals (dialogs, tooltips) must inherit
   * the theme. Default: false.
   */
  applyToDocument?: boolean;
  className?: string;
}

export function LumaeProvider(props: LumaeProviderProps): React.ReactElement {
  const { children, applyToDocument = false, className, ...overrides } = props;
  const parent = React.useContext(LumaeContext);

  const value = React.useMemo<LumaeContextValue>(
    () => ({ ...parent, ...stripUndefined(overrides) }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [parent, overrides.theme, overrides.radius, overrides.dir, overrides.size, overrides.tone, overrides.disableAnimation],
  );

  useIsomorphicLayoutEffect(() => {
    if (!applyToDocument) return;
    const el = document.documentElement;
    const prevTheme = el.getAttribute('data-lumae-theme');
    const prevRadius = el.getAttribute('data-lumae-radius');
    if (value.theme === 'system') el.removeAttribute('data-lumae-theme');
    else el.setAttribute('data-lumae-theme', value.theme);
    el.setAttribute('data-lumae-radius', value.radius);
    return () => {
      restore(el, 'data-lumae-theme', prevTheme);
      restore(el, 'data-lumae-radius', prevRadius);
    };
  }, [applyToDocument, value.theme, value.radius]);

  const body = applyToDocument ? (
    children
  ) : (
    <div
      className={className ? 'lumae ' + className : 'lumae'}
      dir={value.dir}
      data-lumae-theme={value.theme === 'system' ? undefined : value.theme}
      data-lumae-radius={value.radius}
    >
      {children}
    </div>
  );

  return <LumaeContext.Provider value={value}>{body}</LumaeContext.Provider>;
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
