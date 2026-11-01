// @vitest-environment node
import { describe, expect, it } from 'vitest';
import {
  accordionFocusTarget,
  accordionPartIds,
  closeAllAccordion,
  initialAccordionValue,
  mapAccordionFields,
  openAllAccordion,
  setAccordionItem,
  shouldMountPanel,
} from './accordion.logic';

const rows = [{ id: 'a' }, { id: 'b' }, { id: 'c', disabled: true }];
const single = { mode: 'single' as const, collapsible: true };
const multiple = { mode: 'multiple' as const, collapsible: true };

describe('accordion logic (no DOM)', () => {
  it('derives the first open set', () => {
    expect(initialAccordionValue([{ defaultOpen: true }, { id: 'x', defaultOpen: true }], undefined, 'multiple')).toEqual(['0', 'x']);
    expect(initialAccordionValue([], ['a', 'b'], 'single')).toEqual(['a']);
  });

  it('single mode replaces, multiple mode adds', () => {
    expect(setAccordionItem(['a'], rows, 'b', true, single)).toEqual(['b']);
    expect(setAccordionItem(['a'], rows, 'b', true, multiple)).toEqual(['a', 'b']);
    expect(setAccordionItem(['a', 'b'], rows, 'a', false, multiple)).toEqual(['b']);
  });

  it('refuses no-ops, unknown and disabled rows, and the non-collapsible close', () => {
    expect(setAccordionItem(['a'], rows, 'a', true, single)).toBeNull();
    expect(setAccordionItem([], rows, 'zz', true, single)).toBeNull();
    expect(setAccordionItem([], rows, 'c', true, multiple)).toBeNull();
    expect(setAccordionItem(['a'], rows, 'a', false, { ...single, collapsible: false })).toBeNull();
    expect(setAccordionItem([], rows, 'a', true, { ...multiple, disabled: true })).toBeNull();
  });

  it('keeps one row open in multiple mode when not collapsible', () => {
    const locked = { ...multiple, collapsible: false };
    expect(setAccordionItem(['a', 'b'], rows, 'a', false, locked)).toEqual(['b']);
    expect(setAccordionItem(['b'], rows, 'b', false, locked)).toBeNull();
    expect(closeAllAccordion(['a', 'b'], rows, locked)).toBeNull();
  });

  it('openAll and closeAll respect mode and disabled rows', () => {
    expect(openAllAccordion([], rows, multiple)).toEqual(['a', 'b']);
    expect(openAllAccordion([], rows, single)).toBeNull();
    expect(closeAllAccordion(['a', 'c'], rows, multiple)).toEqual(['c']);
    expect(closeAllAccordion(['a'], rows, { ...single, collapsible: false })).toBeNull();
    expect(closeAllAccordion([], rows, multiple)).toBeNull();
  });

  it('resolves the keyboard map, flipped in RTL', () => {
    expect(accordionFocusTarget('ArrowDown', 2, 3)).toBe(0);
    expect(accordionFocusTarget('ArrowDown', 2, 3, { loop: false })).toBe(2);
    expect(accordionFocusTarget('End', 0, 3)).toBe(2);
    expect(accordionFocusTarget('ArrowLeft', 0, 3, { orientation: 'horizontal', dir: 'rtl' })).toBe(1);
    expect(accordionFocusTarget('a', 0, 3)).toBeNull();
  });

  it('maps raw records through fields', () => {
    const out = mapAccordionFields<any>([{ slug: 7, question: 'Q', answer: 'A' }], { id: 'slug', title: 'question', content: 'answer' });
    expect(out[0]).toMatchObject({ id: '7', title: 'Q', content: 'A' });
  });

  it('decides when panels mount', () => {
    expect(shouldMountPanel('always', false, false)).toBe(true);
    expect(shouldMountPanel('open', false, true)).toBe(false);
    expect(shouldMountPanel('first-open', false, true)).toBe(true);
    expect(shouldMountPanel('first-open', false, false)).toBe(false);
  });

  it('derives part ids', () => {
    expect(accordionPartIds('x', 'a')).toEqual({ triggerId: 'x-trigger-a', panelId: 'x-panel-a' });
  });
});
