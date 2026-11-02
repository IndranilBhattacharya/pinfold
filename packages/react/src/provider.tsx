import * as React from 'react';
import { useIsomorphicLayoutEffect } from './hooks';
import type { PinfoldDir, PinfoldLazy, PinfoldRadius, PinfoldSize, PinfoldStylePack, PinfoldTheme, PinfoldTone } from '@pinfold/core';
import type { PinfoldComponentDefaults, PinfoldConfig } from './config';

export interface PinfoldContextValue {
  theme: PinfoldTheme;
  radius: PinfoldRadius;
  dir: PinfoldDir;
  size: PinfoldSize;
  tone: PinfoldTone;
  stylePack: PinfoldStylePack;
  lazy: PinfoldLazy;
  /** Disable every component transition, e.g. in tests or on low-power devices. */
  disableAnimation: boolean;
  defaults: PinfoldComponentDefaults;
}

const DEFAULTS: PinfoldContextValue = {
  theme: 'system',
  radius: 'md',
  dir: 'ltr',
  size: 'md',
  tone: 'primary',
  stylePack: 'default',
  lazy: 'auto',
  disableAnimation: false,
  defaults: {},
};

const PinfoldContext = React.createContext<PinfoldContextValue>(DEFAULTS);

/** Component-level defaults. Every component calls this; the provider is optional. */
export function usePinfold(): PinfoldContextValue {
  return React.useContext(PinfoldContext);
}

export interface PinfoldProviderProps extends PinfoldConfig {
  children?: React.ReactNode;
  /** A whole config from `defineConfig()`. Individual props override it. */
  config?: PinfoldConfig;
  /**
   * Write `data-pinfold-theme` / `-radius` / `-style` / `-size` / `-tone`
   * onto `<html>` instead of a wrapper element. Use this when portals
   * (dialogs, tooltips) must inherit the theme. Default: false.
   */
  applyToDocument?: boolean;
  className?: string;
}

export function PinfoldProvider(props: PinfoldProviderProps): React.ReactElement {
  const { children, applyToDocument = false, className, config, ...own } = props;
  const parent = React.useContext(PinfoldContext);
  const overrides = { ...stripUndefined(config ?? {}), ...stripUndefined(own) };

  const value = React.useMemo<PinfoldContextValue>(
    () => ({ ...parent, ...overrides, defaults: mergeDefaults(parent.defaults, overrides.defaults) }),
    // Keyed on the serialised overrides: configs are plain data, and inline objects must not bust the memo.
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [parent, stableKey(overrides)],
  );

  useIsomorphicLayoutEffect(() => {
    if (!applyToDocument) return;
    const el = document.documentElement;
    const attrs: Array<[string, string | null]> = [
      ['data-pinfold-theme', value.theme === 'system' ? null : value.theme],
      ['data-pinfold-radius', value.radius],
      ['data-pinfold-style', value.stylePack === 'default' ? null : value.stylePack],
      ['data-pinfold-size', value.size],
      ['data-pinfold-tone', value.tone],
    ];
    const previous = attrs.map(([name]) => el.getAttribute(name));
    attrs.forEach(([name, v]) => restore(el, name, v));
    return () => attrs.forEach(([name], i) => restore(el, name, previous[i]));
  }, [applyToDocument, value.theme, value.radius, value.stylePack, value.size, value.tone]);

  const body = applyToDocument ? (
    children
  ) : (
    <div
      className={className ? 'pinfold ' + className : 'pinfold'}
      dir={value.dir}
      data-pinfold-theme={value.theme === 'system' ? undefined : value.theme}
      data-pinfold-radius={value.radius}
      data-pinfold-style={value.stylePack === 'default' ? undefined : value.stylePack}
      // Atoms read size and tone through CSS, so they work in Server Components too.
      data-pinfold-size={value.size}
      data-pinfold-tone={value.tone}
    >
      {children}
    </div>
  );

  return <PinfoldContext.Provider value={value}>{body}</PinfoldContext.Provider>;
}

function mergeDefaults(parent: PinfoldComponentDefaults, own: PinfoldComponentDefaults | undefined): PinfoldComponentDefaults {
  if (!own) return parent;
  const out: Record<string, object> = { ...parent };
  for (const key in own) out[key] = { ...(parent as any)[key], ...(own as any)[key] };
  return out;
}

/** Functions (e.g. a default `indicator` renderer) are keyed by position, not source text. */
function stableKey(obj: object): string {
  let fn = 0;
  return JSON.stringify(obj, (_, v) => (typeof v === 'function' ? `fn${fn++}` : v));
}

function restore(el: Element, attr: string, v: string | null) {
  if (v == null) el.removeAttribute(attr);
  else el.setAttribute(attr, v);
}

function stripUndefined<T extends object>(obj: T): Partial<T> {
  const out: Partial<T> = {};
  for (const k in obj) if (obj[k] !== undefined) out[k] = obj[k];
  return out;
}
