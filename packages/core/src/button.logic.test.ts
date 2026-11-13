// @vitest-environment node
import { describe, expect, it } from 'vitest';
import { buttonRel, inactiveButtonOptions } from './button.logic';

describe('button logic', () => {
  it('adds noopener noreferrer to new-tab links and keeps the caller rel', () => {
    expect(buttonRel('_blank', undefined)).toBe('noopener noreferrer');
    expect(buttonRel('_blank', 'external noopener')).toBe('external noopener noreferrer');
    expect(buttonRel('_self', 'external')).toBe('external');
    expect(buttonRel(undefined, undefined)).toBeUndefined();
  });

  it('names options with no visible effect', () => {
    expect(Object.keys(inactiveButtonOptions({})).sort()).toEqual(['loadingText', 'onNavigate', 'rel', 'target']);
    expect(Object.keys(inactiveButtonOptions({ loading: true, href: '/x' }))).toEqual(['type']);
    expect(Object.keys(inactiveButtonOptions({ loading: true, href: '/x', variant: 'link', iconOnly: true })).sort()).toEqual(['endContent', 'endIcon', 'radius', 'type']);
    expect(inactiveButtonOptions({ loading: true, href: '/x', shape: 'pill' }).radius).toContain('fully round');
    expect(inactiveButtonOptions({ loading: true, href: '/x', shape: 'square' }).radius).toBeUndefined();
  });
});
