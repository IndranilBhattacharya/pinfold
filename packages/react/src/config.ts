import type { PinfoldDir, PinfoldLazy, PinfoldRadius, PinfoldSize, PinfoldStylePack, PinfoldTheme, PinfoldTone } from '@pinfold/core';
import type { AccordionConfig } from './accordion/types';

/** Per-component defaults. Data, state and ids never belong here, only how components look and behave. */
export interface PinfoldComponentDefaults {
  accordion?: Partial<Omit<AccordionConfig, 'items' | 'fields' | 'value' | 'defaultValue' | 'id'>>;
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
