import { existsSync, readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';
import { render as rtlRender, type RenderResult } from '@testing-library/react';
import type * as React from 'react';

export interface ConformanceOptions {
  /** Component name in kebab-case, e.g. `accordion`. Drives the expected classes. */
  name: string;
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
}

const BLOCK = (name: string) => `knot-${name}`;

/**
 * The contract every Knot UI component must satisfy, asserted mechanically.
 *
 * Written for scale: components arrive faster than anyone can review them by
 * hand, so the invariants that make the library feel like one library —
 * class naming, the four escape hatches, dimension plumbing, token-only CSS,
 * focusable disabled controls — are tests, not documentation.
 */
export function describeKnotConformance(options: ConformanceOptions): void {
  const { name, slots, render, dimension, cssFile, optionalSlots = [] } = options;
  const block = BLOCK(name);

  describe(`${name} — Knot UI conformance`, () => {
    it('roots itself with the scoped reset class and its own block class', () => {
      const root = mount(render({}), block);
      expect(root.classList.contains('knot')).toBe(true);
      expect(root.classList.contains(block)).toBe(true);
    });

    it('exposes appearance as data attributes, not classes', () => {
      const root = mount(render({}), block);
      // CSS keys off these, so headless consumers can reuse the stylesheet.
      expect(root.getAttribute('data-variant')).toBeTruthy();
      expect(root.getAttribute('data-size')).toBeTruthy();
      expect(root.getAttribute('data-tone')).toBeTruthy();
      expect(root.className).not.toMatch(/\bis-[a-z]/);
    });

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
      expect(root.getAttribute('data-variant')).toBeTruthy();
    });

    if (dimension) {
      it('maps dimensions onto namespaced custom properties', () => {
        const root = mount(render({ dimensions: { [dimension.key]: dimension.value } }), block);
        const prop = `--knot-${name}-${kebab(dimension.key)}`;
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

      it('namespaces every class it defines', () => {
        const css = stripComments(readFileSync(cssPath, 'utf8'));
        const classes = [...css.matchAll(/\.([a-zA-Z][\w-]*)/g)].map((m) => m[1]);
        const stray = [...new Set(classes)].filter((cl) => cl !== 'knot' && !cl.startsWith(block));
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
