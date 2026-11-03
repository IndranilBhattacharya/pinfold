// @vitest-environment node
/**
 * Tags and presets split their props into config (known keys) and root attributes. The key lists
 * must equal the meta, or a new option would silently land on the DOM element instead of the hook.
 */
import { describe, expect, it } from 'vitest';
import { accordionMeta, progressMeta, cardMeta, avatarMeta, alertMeta, badgeMeta, buttonMeta, kbdMeta, separatorMeta, skeletonMeta, spinnerMeta } from '@pinfold/core/meta';
import { ACCORDION_KEYS } from './accordion/keys';
import { BUTTON_KEYS } from './button/keys';
import { SPINNER_KEYS } from './spinner/keys';
import { SEPARATOR_KEYS } from './separator/keys';
import { KBD_KEYS } from './kbd/keys';
import { SKELETON_KEYS } from './skeleton/keys';
import { BADGE_KEYS } from './badge/keys';
import { PROGRESS_KEYS } from './progress/keys';
import { CARD_KEYS } from './card/keys';
import { AVATAR_KEYS } from './avatar/keys';
import { ALERT_KEYS } from './alert/keys';

describe('config key lists match the meta', () => {
  for (const [meta, keys] of [
    [accordionMeta, ACCORDION_KEYS],
    [buttonMeta, BUTTON_KEYS],
    [spinnerMeta, SPINNER_KEYS],
    [separatorMeta, SEPARATOR_KEYS],
    [kbdMeta, KBD_KEYS],
    [skeletonMeta, SKELETON_KEYS],
    [badgeMeta, BADGE_KEYS],
    [progressMeta, PROGRESS_KEYS],
    [cardMeta, CARD_KEYS],
    [avatarMeta, AVATAR_KEYS],
    [alertMeta, ALERT_KEYS],
  ] as const) {
    it(meta.displayName, () => {
      expect([...keys].sort()).toEqual(Object.keys(meta.props).sort());
    });
  }
});
