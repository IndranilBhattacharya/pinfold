// @vitest-environment node
/**
 * Tags and presets split their props into config (known keys) and root attributes. The key lists
 * must equal the meta, or a new option would silently land on the DOM element instead of the hook.
 */
import { describe, expect, it } from 'vitest';
import { accordionMeta, datepickerMeta, calendarMeta, commandMeta, tagsMeta, comboboxMeta, selectMeta, stepperMeta, paginationMeta, breadcrumbMeta, tabsMeta, otpMeta, numberMeta, sliderMeta, toolbarMeta, toggleMeta, switchMeta, radioMeta, checkboxMeta, inputMeta, toastMeta, menuMeta, dialogMeta, popoverMeta, tooltipMeta, progressMeta, cardMeta, avatarMeta, alertMeta, badgeMeta, buttonMeta, kbdMeta, separatorMeta, skeletonMeta, spinnerMeta } from '@pinfold/core/meta';
import { ACCORDION_KEYS } from './accordion/keys';
import { BUTTON_KEYS } from './button/keys';
import { SPINNER_KEYS } from './spinner/keys';
import { SEPARATOR_KEYS } from './separator/keys';
import { KBD_KEYS } from './kbd/keys';
import { SKELETON_KEYS } from './skeleton/keys';
import { BADGE_KEYS } from './badge/keys';
import { DATEPICKER_KEYS } from './datepicker/keys';
import { CALENDAR_KEYS } from './calendar/keys';
import { COMMAND_KEYS } from './command/keys';
import { TAGS_KEYS } from './tags/keys';
import { COMBOBOX_KEYS } from './combobox/keys';
import { SELECT_KEYS } from './select/keys';
import { STEPPER_KEYS } from './stepper/keys';
import { PAGINATION_KEYS } from './pagination/keys';
import { BREADCRUMB_KEYS } from './breadcrumb/keys';
import { TABS_KEYS } from './tabs/keys';
import { OTP_KEYS } from './otp/keys';
import { NUMBER_KEYS } from './number/keys';
import { SLIDER_KEYS } from './slider/keys';
import { TOOLBAR_KEYS } from './toolbar/keys';
import { TOGGLE_KEYS } from './toggle/keys';
import { SWITCH_KEYS } from './switch/keys';
import { RADIO_KEYS } from './radio/keys';
import { CHECKBOX_KEYS } from './checkbox/keys';
import { INPUT_KEYS } from './input/keys';
import { TOAST_KEYS } from './toast/keys';
import { MENU_KEYS } from './menu/keys';
import { DIALOG_KEYS } from './dialog/keys';
import { POPOVER_KEYS } from './popover/keys';
import { TOOLTIP_KEYS } from './tooltip/keys';
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
    [datepickerMeta, DATEPICKER_KEYS],
    [calendarMeta, CALENDAR_KEYS],
    [commandMeta, COMMAND_KEYS],
    [tagsMeta, TAGS_KEYS],
    [comboboxMeta, COMBOBOX_KEYS],
    [selectMeta, SELECT_KEYS],
    [stepperMeta, STEPPER_KEYS],
    [paginationMeta, PAGINATION_KEYS],
    [breadcrumbMeta, BREADCRUMB_KEYS],
    [tabsMeta, TABS_KEYS],
    [otpMeta, OTP_KEYS],
    [numberMeta, NUMBER_KEYS],
    [sliderMeta, SLIDER_KEYS],
    [toolbarMeta, TOOLBAR_KEYS],
    [toggleMeta, TOGGLE_KEYS],
    [switchMeta, SWITCH_KEYS],
    [radioMeta, RADIO_KEYS],
    [checkboxMeta, CHECKBOX_KEYS],
    [inputMeta, INPUT_KEYS],
    [toastMeta, TOAST_KEYS],
    [menuMeta, MENU_KEYS],
    [dialogMeta, DIALOG_KEYS],
    [popoverMeta, POPOVER_KEYS],
    [tooltipMeta, TOOLTIP_KEYS],
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
