import { inactiveButtonOptions, warnOnce } from '@pinfold/core';
import { buttonMeta, validateConfig } from '@pinfold/core/meta';
import type { ButtonConfig } from './types';

/** Dev-only checks: the meta-driven shape check, plus options the rest of the config makes pointless. */
export function validateButton(input: ButtonConfig, config: ButtonConfig): void {
  for (const problem of validateConfig(buttonMeta, input)) warnOnce(true, problem.message);
  const inactive = inactiveButtonOptions(config);
  for (const key in inactive) {
    // `loadingText` is normally set up front and only used while loading, so it never warns.
    if (key === 'loadingText') continue;
    warnOnce((input as unknown as Record<string, unknown>)[key] !== undefined, `Button: \`${key}\` has no visible effect here. ${inactive[key]}`);
  }
}
