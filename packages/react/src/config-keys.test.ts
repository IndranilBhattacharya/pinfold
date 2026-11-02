// @vitest-environment node
/**
 * Tags and presets split their props into config (known keys) and root attributes. The key lists
 * must equal the meta, or a new option would silently land on the DOM element instead of the hook.
 */
import { describe, expect, it } from 'vitest';
import { accordionMeta, buttonMeta, spinnerMeta } from '@pinfold/core/meta';
import { ACCORDION_KEYS } from './accordion/keys';
import { BUTTON_KEYS } from './button/keys';
import { SPINNER_KEYS } from './spinner/keys';

describe('config key lists match the meta', () => {
  for (const [meta, keys] of [
    [accordionMeta, ACCORDION_KEYS],
    [buttonMeta, BUTTON_KEYS],
    [spinnerMeta, SPINNER_KEYS],
  ] as const) {
    it(meta.displayName, () => {
      expect([...keys].sort()).toEqual(Object.keys(meta.props).sort());
    });
  }
});
