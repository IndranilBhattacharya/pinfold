import { accordionRowId, inactiveAccordionOptions, mapAccordionFields, warnOnce } from '@pinfold/core';
import { accordionMeta, validateConfig } from '@pinfold/core/meta';
import type { AccordionItemConfig, AnyAccordionConfig } from './types';

/**
 * Dev-only config checks: the meta-driven shape check (unknown keys, wrong
 * types, bad enum values, missing `items`) gives plain-JS users what
 * TypeScript gives everyone else, plus behaviour mistakes that would
 * otherwise only show up as odd UI.
 */
export function validateAccordion(input: AnyAccordionConfig, config: AnyAccordionConfig): void {
  // Field-mapped records are arbitrary shapes; check the rows only when unmapped.
  const shape = input.fields ? { ...input, items: [] } : input;
  for (const problem of validateConfig(accordionMeta, shape)) warnOnce(true, problem.message);

  const { items, mode = 'single', value, defaultValue, collapsible = true } = config;
  if (!Array.isArray(items)) return;

  const ids = mapAccordionFields<AccordionItemConfig>(items, config.fields).map((item, i) => accordionRowId(item, i));
  const duplicates = ids.filter((id, i) => ids.indexOf(id) !== i);
  warnOnce(
    duplicates.length > 0,
    `Accordion: duplicate item id ${JSON.stringify(duplicates[0])}. ` +
      'Ids must be unique — panels and triggers are wired together by id.',
  );

  warnOnce(
    mode === 'single' && (value?.length ?? 0) > 1,
    'Accordion: `mode: "single"` was given more than one open id in `value`. ' +
      'Only the first will be honoured.',
  );

  warnOnce(
    mode === 'single' && !collapsible && (value ?? defaultValue ?? []).length === 0,
    'Accordion: `collapsible: false` with nothing open means the user can never ' +
      'open a row by keyboard from a closed state. Provide a `defaultValue`.',
  );

  warnOnce(
    value !== undefined && config.onValueChange === undefined,
    'Accordion: `value` was passed without `onValueChange`, so the accordion is ' +
      'frozen. Use `defaultValue` for uncontrolled behaviour.',
  );

  // Options the user set that the rest of the config makes invisible.
  const inactive = inactiveAccordionOptions({ ...config, gap: config.dimensions?.gap ?? config.gap });
  for (const key in inactive) {
    warnOnce(key in input && (input as unknown as Record<string, unknown>)[key] !== undefined, `Accordion: \`${key}\` has no visible effect here. ${inactive[key]}`);
  }

  warnOnce(
    config.unmountClosed !== undefined,
    'Accordion: `unmountClosed` is deprecated. Use `mountPanels: "open"`.',
  );
}

