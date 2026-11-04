import type { PinfoldDir, PinfoldLazy, PinfoldRadius, PinfoldSize, PinfoldStylePack, PinfoldTheme, PinfoldTone } from '@pinfold/core';
import type { AccordionOptions } from './accordion/types';
import type { ButtonConfig } from './button/types';
import type { SpinnerConfig } from './spinner/types';
import type { SeparatorConfig } from './separator/types';
import type { KbdConfig } from './kbd/types';
import type { SkeletonConfig } from './skeleton/types';
import type { BadgeConfig } from './badge/types';
import type { SwitchConfig } from './switch/types';
import type { RadioConfig } from './radio/types';
import type { CheckboxConfig } from './checkbox/types';
import type { InputConfig } from './input/types';
import type { ToastConfig } from './toast/types';
import type { MenuConfig } from './menu/types';
import type { DialogConfig } from './dialog/types';
import type { PopoverConfig } from './popover/types';
import type { TooltipConfig } from './tooltip/types';
import type { ProgressConfig } from './progress/types';
import type { CardConfig } from './card/types';
import type { AvatarConfig } from './avatar/types';
import type { AlertConfig } from './alert/types';

/** Per-component defaults. Data, state and ids never belong here, only how components look and behave. */
export interface PinfoldComponentDefaults {
  accordion?: Omit<AccordionOptions, 'value' | 'defaultValue' | 'disabledIds' | 'id'>;
  button?: Omit<ButtonConfig, 'label' | 'onClick' | 'href' | 'target' | 'rel' | 'loading' | 'loadingText' | 'disabled'>;
  spinner?: SpinnerConfig;
  separator?: Omit<SeparatorConfig, 'label'>;
  kbd?: Omit<KbdConfig, 'keys'>;
  skeleton?: Omit<SkeletonConfig, 'content' | 'loading'>;
  badge?: Omit<BadgeConfig, 'label' | 'count'>;
  switch?: Omit<SwitchConfig, 'label' | 'description' | 'error' | 'invalid' | 'required' | 'disabled' | 'name' | 'id' | 'checked' | 'defaultChecked' | 'formValue' | 'onChange'>;
  radio?: Omit<RadioConfig, 'label' | 'description' | 'error' | 'invalid' | 'required' | 'disabled' | 'name' | 'id' | 'items' | 'value' | 'defaultValue' | 'onChange'>;
  checkbox?: Omit<CheckboxConfig, 'label' | 'description' | 'error' | 'invalid' | 'required' | 'disabled' | 'name' | 'id' | 'checked' | 'defaultChecked' | 'indeterminate' | 'formValue' | 'onChange' | 'items' | 'value' | 'defaultValue'>;
  input?: Omit<InputConfig, 'label' | 'description' | 'error' | 'invalid' | 'required' | 'disabled' | 'name' | 'id' | 'value' | 'defaultValue' | 'onChange' | 'placeholder'>;
  toast?: Omit<ToastConfig, 'store'>;
  menu?: Omit<MenuConfig, 'items' | 'trigger' | 'open' | 'defaultOpen' | 'onOpenChange' | 'label'>;
  dialog?: Omit<DialogConfig, 'title' | 'description' | 'content' | 'actions' | 'trigger' | 'open' | 'defaultOpen' | 'onOpenChange'>;
  popover?: Omit<PopoverConfig, 'title' | 'description' | 'content' | 'actions' | 'trigger' | 'open' | 'defaultOpen' | 'onOpenChange'>;
  tooltip?: Omit<TooltipConfig, 'content' | 'trigger' | 'open' | 'defaultOpen' | 'onOpenChange'>;
  progress?: Omit<ProgressConfig, 'value' | 'label'>;
  card?: Omit<CardConfig, 'title' | 'description' | 'content' | 'image' | 'actions' | 'href' | 'target' | 'rel'>;
  avatar?: Omit<AvatarConfig, 'name' | 'src' | 'alt' | 'initials' | 'status' | 'items' | 'label'>;
  alert?: Omit<AlertConfig, 'title' | 'description' | 'actions' | 'onDismiss'>;
}

/**
 * The global config, usually in `pinfold.config.ts` (or `.js`):
 *
 *   export default defineConfig({ theme: 'system', radius: 'lg', defaults: { accordion: { variant: 'separated' } } });
 *
 * and handed to the provider once: `<PinfoldProvider config={config}>`.
 * Precedence, highest first: component config, `defaults.<component>`, this
 * global theme, the library defaults. A nested provider overrides its section.
 */
export interface PinfoldConfig {
  theme?: PinfoldTheme;
  radius?: PinfoldRadius;
  dir?: PinfoldDir;
  size?: PinfoldSize;
  tone?: PinfoldTone;
  /** Visual style pack (needs `@pinfold/css/packs.css`). Default `'default'`. */
  stylePack?: PinfoldStylePack;
  /** Default code-loading strategy for `/lazy` entries. Default `'auto'`. */
  lazy?: PinfoldLazy;
  /** Disable every component transition, e.g. in tests or on low-power devices. */
  disableAnimation?: boolean;
  defaults?: PinfoldComponentDefaults;
}

/** Identity function that types a global config. Safe to call from Server Components. */
export function defineConfig<T extends PinfoldConfig>(config: T): T {
  return config;
}
