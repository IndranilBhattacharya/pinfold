import { existsSync, readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';
import { fireEvent, render as rtlRender, type RenderResult } from '@testing-library/react';
import * as React from 'react';
import { PinfoldProvider } from '@pinfold/react';
import type { ComponentMeta } from '@pinfold/core/meta';

export interface ConformanceOptions {
  /** Component name in kebab-case, e.g. `accordion`. Drives the expected classes. */
  name: string;
  /**
   * The component's meta. Every enum option the root reflects as `data-<option>` is checked
   * against it: the meta default appears when unset, and every listed value reaches the DOM.
   */
  meta?: ComponentMeta;
  /**
   * The component's preset factory (`define<Name>`) and the props a use site must add (e.g. a
   * button's `label`). The suite proves use-site props beat the preset, which beats
   * `defaults.<name>` and the provider, and that nested and class props merge.
   */
  preset?: {
    define: (preset: Record<string, unknown>) => React.ComponentType<any>;
    props: Record<string, unknown>;
    /** The option the precedence is proven on, and three of its values. Default the first inherited setting, else `variant`. */
    probe?: { key: string; values: readonly [string, string, string] };
  };
  /**
   * Provider settings the component follows. Default both. A separator or a skeleton has no
   * tone, so a provider tone must not reach it.
   */
  inherits?: ReadonlyArray<'size' | 'tone'>;
  /** `false` for a component with no `variant` option (e.g. spinner). */
  variants?: boolean;
  /** Every slot the component documents. */
  slots: readonly string[];
  /**
   * Render the component with extra config merged in. Must go through the
   * component's public API, exactly as a consumer would.
   */
  render: (config: Record<string, unknown>) => React.ReactElement;
  /** A dimension key the component supports, plus the px value to assert. */
  dimension?: { key: string; value: number };
  /**
   * Stylesheet path, relative to the repo root, checked for hard-coded colours
   * and stray class names. e.g. `packages/tabs/src/tabs.css`.
   */
  cssFile?: string;
  /**
   * Slots that are conditional on config (a badge only exists if an item has
   * one). Listed here so their absence is not treated as a failure.
   */
  optionalSlots?: readonly string[];
  /**
   * The component's hook, plus a minimal config. When given, the suite proves
   * the hook returns a renderable component whose identity survives re-renders.
   */
  hook?: {
    use: (config: Record<string, unknown>) => unknown;
    config: Record<string, unknown>;
  };
}

const BLOCK = (name: string) => `pinfold-${name}`;

/**
 * The contract every Pinfold component must satisfy, asserted mechanically.
 *
 * Written for scale: components arrive faster than anyone can review them by
 * hand, so the invariants that make the library feel like one library —
 * class naming, the four escape hatches, dimension plumbing, token-only CSS,
 * focusable disabled controls — are tests, not documentation.
 */
export function describePinfoldConformance(options: ConformanceOptions): void {
  const { name, meta, preset, inherits = ['size', 'tone'], variants = true, slots, render, dimension, cssFile, hook, optionalSlots = [] } = options;
  const block = BLOCK(name);

  describe(`${name} — Pinfold conformance`, () => {
    it('roots itself with the scoped reset class and its own block class', () => {
      const root = mount(render({}), block);
      expect(root.classList.contains('pinfold')).toBe(true);
      expect(root.classList.contains(block)).toBe(true);
    });

    it('exposes appearance as data attributes, not classes', () => {
      const root = mount(render({}), block);
      // CSS keys off these, so headless consumers can reuse the stylesheet.
      if (variants) expect(root.getAttribute('data-variant')).toBeTruthy();
      for (const key of inherits) expect(root.getAttribute(`data-${key}`)).toBeTruthy();
      expect(root.className).not.toMatch(/\bis-[a-z]/);
    });

    // One precedence for every component and every option:
    // component config > `defaults.<name>` in the global config > provider > library default.
    // Values per setting: [library default, provider, defaults.<name>, component config].
    const LADDER = {"size":["md","sm","lg","md"],"tone":["primary","danger","success","info"]} as const;
    it('resolves inherited settings as config > defaults.<name> > provider > library default', () => {
      const key = name.replace(/-([a-z])/g, (_, c: string) => c.toUpperCase());
      const provider = { size: LADDER.size[1], tone: LADDER.tone[1] };
      const defaults = { [key]: Object.fromEntries(inherits.map((k) => [k, LADDER[k][2]])) } as never;
      const own = Object.fromEntries(inherits.map((k) => [k, LADDER[k][3]]));
      const at = (element: React.ReactElement) => {
        const root = mount(element, block);
        return Object.fromEntries((['size', 'tone'] as const).map((k) => [k, root.getAttribute(`data-${k}`)]));
      };
      const pick = (i: number) => Object.fromEntries(inherits.map((k) => [k, LADDER[k][i]]));
      const expectAt = (got: Record<string, string | null>, i: number) => {
        for (const k of inherits) expect(`${k}=${got[k]}`).toBe(`${k}=${pick(i)[k]}`);
        // A setting the component does not follow must never leak from the provider.
        for (const k of ['size', 'tone'] as const) if (!inherits.includes(k)) expect(got[k]).not.toBe(provider[k]);
      };
      expectAt(at(render({})), 0);
      expectAt(at(<PinfoldProvider {...provider}>{render({})}</PinfoldProvider>), 1);
      if (inherits.length) {
        expectAt(at(<PinfoldProvider {...provider} defaults={defaults}>{render({})}</PinfoldProvider>), 2);
        expectAt(at(<PinfoldProvider {...provider} defaults={defaults}>{render(own)}</PinfoldProvider>), 3);
      }
    });

    it("honours the provider's disableAnimation (no data-animate on the root)", () => {
      const root = mount(<PinfoldProvider disableAnimation>{render({})}</PinfoldProvider>, block);
      expect(root.hasAttribute('data-animate')).toBe(false);
    });

    if (preset) {
      it('resolves presets as use-site props > preset > defaults.<name> > provider', () => {
        const key = name.replace(/-([a-z])/g, (_, c: string) => c.toUpperCase());
        const probe = preset.probe ?? (inherits.length ? { key: inherits[0], values: inherits[0] === 'size' ? (['lg', 'sm', 'md'] as const) : (['success', 'danger', 'info'] as const) } : { key: 'variant', values: ['', '', ''] as const });
        const [fromPresetValue, defaultsValue, ownValue] = probe.values;
        const Preset = preset.define({ [probe.key]: fromPresetValue, className: 'from-preset', classNames: { root: 'preset-root' } });
        const defaults = { [key]: { [probe.key]: defaultsValue } } as never;
        const inside = (el: React.ReactElement) => mount(<PinfoldProvider size="sm" tone="warning" defaults={defaults}>{el}</PinfoldProvider>, block);
        const attr = `data-${probe.key.replace(/[A-Z]/g, (m) => '-' + m.toLowerCase())}`;

        expect(inside(<Preset {...preset.props} />).getAttribute(attr)).toBe(fromPresetValue);
        const own = inside(<Preset {...preset.props} {...{ [probe.key]: ownValue }} className="from-use" classNames={{ root: 'use-root' }} />);
        expect(own.getAttribute(attr)).toBe(ownValue);
        // Classes add up instead of replacing each other; per-slot maps merge.
        for (const cls of ['from-preset', 'from-use', 'use-root']) expect(`${cls}:${own.classList.contains(cls)}`).toBe(`${cls}:true`);
      });
    }

    if (meta) {
      it('keeps meta, defaults and the DOM in sync for every reflected option', () => {
        const kebabKey = (k: string) => k.replace(/[A-Z]/g, (m) => '-' + m.toLowerCase());
        for (const [key, prop] of Object.entries(meta.props)) {
          if (prop.type !== 'enum' || !prop.values) continue;
          const attr = `data-${kebabKey(key)}`;
          const plain = mount(render({}), block);
          if (!plain.hasAttribute(attr)) continue; // not reflected on the root
          // `auto` resolves to a concrete value (an avatar's tone comes from the name), so only real values must round-trip.
          if (prop.default !== undefined && prop.default !== 'auto') expect(`${key}=${plain.getAttribute(attr)}`).toBe(`${key}=${prop.default}`);
          for (const value of prop.values) {
            if (value === 'auto') continue;
            const root = mount(render({ [key]: value }), block);
            expect(`${key}=${root.getAttribute(attr)}`).toBe(`${key}=${value}`);
          }
        }
      });
    }

    it('applies classNames to every slot it renders', () => {
      const classNames = Object.fromEntries(slots.map((s) => [s, `probe-${s}`]));
      const { container } = rtlRender(render({ classNames }));

      for (const slot of slots) {
        const el = container.querySelector(`.${block}__${slot}`) ?? rootOf(container, block, slot);
        if (!el) {
          expect(optionalSlots).toContain(slot);
          continue;
        }
        expect(`${slot}:${el.classList.contains(`probe-${slot}`)}`).toBe(`${slot}:true`);
      }
    });

    it('applies per-slot inline styles', () => {
      const styles = Object.fromEntries(slots.map((s) => [s, { outlineStyle: 'dotted' }]));
      const { container } = rtlRender(render({ styles }));
      const styled = container.querySelectorAll('[style*="outline-style: dotted"]');
      expect(styled.length).toBeGreaterThan(0);
    });

    it('merges slotProps onto the root without dropping its own attributes', () => {
      const { container } = rtlRender(
        render({ slotProps: { root: { 'data-probe': 'yes', id: 'probe-root' } } }),
      );
      const root = container.querySelector('#probe-root')!;
      expect(root).toBeTruthy();
      expect(root.getAttribute('data-probe')).toBe('yes');
      expect(root.classList.contains(block)).toBe(true);
    });

    if (dimension) {
      it('maps dimensions onto namespaced custom properties', () => {
        const root = mount(render({ dimensions: { [dimension.key]: dimension.value } }), block);
        const prop = `--pinfold-${name}-${kebab(dimension.key)}`;
        expect((root as HTMLElement).style.getPropertyValue(prop)).toBe(`${dimension.value}px`);
      });
    }

    it('never uses the disabled attribute — disabled controls stay focusable', () => {
      const { container } = rtlRender(render({}));
      // WAI-ARIA: a `disabled` button leaves the tab order and becomes
      // undiscoverable to screen-reader users. `aria-disabled` does not.
      expect(container.querySelectorAll('button[disabled]')).toHaveLength(0);
      expect(container.querySelectorAll('[tabindex="-1"][aria-disabled="true"]')).toHaveLength(0);
    });

    it('drops its own classes in unstyled mode, keeping behaviour and state', () => {
      // The Tailwind path: no bundled CSS, but ARIA and `data-*` intact so
      // utilities can key off state.
      const { container } = rtlRender(
        render({ unstyled: true, className: 'probe-layout' }),
      );
      const root = container.querySelector('.probe-layout') as HTMLElement | null;

      expect(root).toBeTruthy();
      expect(root!.className).not.toContain(block);
      if (variants) expect(root!.getAttribute('data-variant')).toBeTruthy();
      expect(root!.hasAttribute('data-unstyled')).toBe(true);
    });

    if (hook) {
      const { use, config: hookConfig } = hook;

      it('returns a component from its hook whose identity is stable', () => {
        // A new component type per render remounts the subtree, discarding
        // focus, scroll position and in-flight transitions.
        const seen: unknown[] = [];

        function Harness() {
          const [, force] = React.useState(0);
          const Component = use(hookConfig) as React.ComponentType<any>;
          seen.push(Component);
          return (
            <div>
              <button data-testid="pinfold-conformance-rerender" onClick={() => force((n) => n + 1)}>
                rerender
              </button>
              <Component />
            </div>
          );
        }

        const { getByTestId, container } = rtlRender(<Harness />);
        expect(typeof seen[0]).toBe('function');
        expect(container.querySelector(`.${block}`)).toBeTruthy();

        fireEvent.click(getByTestId('pinfold-conformance-rerender'));
        expect(new Set(seen).size).toBe(1);
      });
    }

    it('gives every interactive control an accessible name', () => {
      const { container } = rtlRender(render({}));
      for (const el of Array.from(container.querySelectorAll('button, [role="button"]'))) {
        const named =
          (el.textContent ?? '').trim().length > 0 ||
          el.hasAttribute('aria-label') ||
          el.hasAttribute('aria-labelledby');
        expect(named).toBe(true);
      }
    });

    if (cssFile) {
      const cssPath = resolve(process.cwd(), cssFile);

      it('styles itself only through tokens — no hard-coded colours', () => {
        expect(existsSync(cssPath)).toBe(true);
        const css = readFileSync(cssPath, 'utf8');
        const offenders = findRawColors(css);
        expect(offenders).toEqual([]);
      });

      // The browser floor is Baseline 2023 (COMPATIBILITY.md). Newer CSS fails silently there,
      // e.g. light-dark() made every status tone fall back to the primary colour.
      it('uses no CSS newer than the Baseline 2023 floor', () => {
        const css = stripComments(readFileSync(cssPath, 'utf8'));
        const tooNew = ['light-dark(', ':has(', '@scope', 'anchor-name', 'position-anchor', 'field-sizing', '@starting-style', 'interpolate-size', 'calc-size('];
        expect(tooNew.filter((feature) => css.includes(feature))).toEqual([]);
      });

      it('namespaces every class it defines', () => {
        // `@layer pinfold.components` is a layer path, not a class selector.
        const css = stripComments(readFileSync(cssPath, 'utf8')).replace(/@layer[^;{]*/g, '');
        const classes = [...css.matchAll(/\.([a-zA-Z][\w-]*)/g)].map((m) => m[1]);
        const stray = [...new Set(classes)].filter((cl) => cl !== 'pinfold' && !cl.startsWith(block));
        expect(stray).toEqual([]);
      });
    }
  });
}

/**
 * Raw colours defeat theming: a hex in a component stylesheet cannot follow the
 * palette, dark mode, or a consumer's overrides. `color-mix` over a token is
 * fine, `currentColor`/`transparent` are fine, `#7c5cf0` is not.
 */
function findRawColors(css: string): string[] {
  const stripped = stripComments(css);
  const patterns = [
    /#[0-9a-fA-F]{3,8}\b/g,
    /\brgba?\(/g,
    /\bhsla?\(/g,
    /\boklch\(/g,
    /\boklab\(/g,
  ];
  const hits: string[] = [];
  for (const pattern of patterns) {
    for (const match of stripped.matchAll(pattern)) {
      // `oklch()` inside a @supports probe is a feature test, not a colour.
      if (match[0] === 'oklch(' && stripped.slice(match.index! - 40, match.index!).includes('@supports')) continue;
      hits.push(match[0]);
    }
  }
  return [...new Set(hits)];
}

function mount(element: React.ReactElement, block: string): Element {
  const { container } = rtlRender(element);
  const root = container.querySelector(`.${block}`);
  if (!root) throw new Error(`Expected a .${block} root element`);
  return root;
}

function rootOf(container: Element, block: string, slot: string): Element | null {
  return slot === 'root' ? container.querySelector(`.${block}`) : null;
}

/** Comments carry prose — `dimensions.maxHeight` is not a class named `.maxHeight`. */
const stripComments = (css: string) => css.replace(/\/\*[\s\S]*?\*\//g, '');

const kebab = (s: string) => s.replace(/[A-Z]/g, (m) => '-' + m.toLowerCase());

export type { RenderResult };
