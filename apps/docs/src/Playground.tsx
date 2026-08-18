import * as React from 'react';
import { useAccordion } from '@knotui/accordion';
import type { AccordionConfig, AccordionDimensions, AccordionItemConfig } from '@knotui/accordion';

const START = `[
  {
    "id": "plan",
    "title": "Choose a plan",
    "description": "Monthly or yearly, cancel anytime",
    "badge": "Step 1",
    "content": "Yearly saves two months. Both plans include every component."
  },
  {
    "id": "theme",
    "title": "Pick your palette",
    "badge": "Step 2",
    "content": "npx knotui theme --preset emerald --radius lg"
  },
  {
    "id": "ship",
    "title": "Ship it",
    "content": "One import, one config object, done."
  }
]`;

type Options = Pick<
  AccordionConfig,
  | 'variant'
  | 'size'
  | 'tone'
  | 'mode'
  | 'indicator'
  | 'indicatorPosition'
  | 'collapsible'
  | 'animate'
  | 'dividers'
>;

const SELECTS: Array<{ key: keyof Options; values: readonly string[] }> = [
  { key: 'variant', values: ['solid', 'outline', 'separated', 'filled', 'ghost'] },
  { key: 'size', values: ['sm', 'md', 'lg'] },
  { key: 'tone', values: ['primary', 'neutral', 'success', 'warning', 'danger', 'info'] },
  { key: 'mode', values: ['single', 'multiple'] },
  { key: 'indicator', values: ['chevron', 'plus', 'caret', 'none'] },
  { key: 'indicatorPosition', values: ['end', 'start'] },
];

const TOGGLES: Array<keyof Options> = ['collapsible', 'animate', 'dividers'];

/** `0` means "leave it to the size preset" — the slider is opt-in per dimension. */
const DIMS: Array<{ key: keyof AccordionDimensions; max: number; label: string }> = [
  { key: 'paddingX', max: 48, label: 'padding X' },
  { key: 'paddingY', max: 40, label: 'padding Y' },
  { key: 'gap', max: 32, label: 'gap' },
  { key: 'radius', max: 32, label: 'radius' },
  { key: 'fontSize', max: 28, label: 'font size' },
  { key: 'indicatorSize', max: 32, label: 'indicator' },
  { key: 'maxWidth', max: 900, label: 'max width' },
  { key: 'panelMaxHeight', max: 300, label: 'panel max h' },
];

export function Playground() {
  const [source, setSource] = React.useState(START);
  const [triggerClass, setTriggerClass] = React.useState('');
  const [options, setOptions] = React.useState<Options>({
    variant: 'separated',
    size: 'md',
    tone: 'primary',
    mode: 'single',
    indicator: 'chevron',
    indicatorPosition: 'end',
    collapsible: true,
    animate: true,
    dividers: true,
  });
  const [dims, setDims] = React.useState<Record<string, number>>({});
  const [value, setValue] = React.useState<string[]>(['plan']);

  const parsed = React.useMemo(() => {
    try {
      const items = JSON.parse(source) as AccordionItemConfig[];
      if (!Array.isArray(items)) throw new Error('Config must be an array of items.');
      return { items, error: null as string | null };
    } catch (e) {
      return { items: null as AccordionItemConfig[] | null, error: (e as Error).message };
    }
  }, [source]);

  const dimensions = React.useMemo(() => {
    const out: Record<string, number> = {};
    for (const [k, v] of Object.entries(dims)) if (v > 0) out[k] = v;
    return out as AccordionDimensions;
  }, [dims]);

  // The whole preview, from a hook. No <Accordion> tag anywhere in this file.
  const accordion = useAccordion({
    ...options,
    items: parsed.items ?? [],
    dimensions,
    classNames: triggerClass ? { trigger: triggerClass } : undefined,
    value: options.mode === 'single' ? value.slice(0, 1) : value,
    onValueChange: setValue,
  });

  const set = <K extends keyof Options>(key: K, v: Options[K]) =>
    setOptions((o) => ({ ...o, [key]: v }));

  return (
    <div className="dx-play">
      <div className="dx-play__editor">
        <label className="dx-label" htmlFor="cfg">
          items
        </label>
        <textarea
          id="cfg"
          className={`dx-textarea${parsed.error ? ' is-invalid' : ''}`}
          spellCheck={false}
          rows={16}
          value={source}
          onChange={(e) => setSource(e.target.value)}
          aria-describedby={parsed.error ? 'cfg-error' : undefined}
          aria-invalid={!!parsed.error}
        />
        {parsed.error ? (
          <p className="dx-error" id="cfg-error" role="alert">
            {parsed.error}
          </p>
        ) : null}

        <div className="dx-opts">
          {SELECTS.map(({ key, values }) => (
            <label key={key} className="dx-opt">
              <span>{key}</span>
              <select
                className="dx-select"
                value={String(options[key])}
                onChange={(e) => set(key, e.target.value as never)}
              >
                {values.map((v) => (
                  <option key={v} value={v}>
                    {v}
                  </option>
                ))}
              </select>
            </label>
          ))}
          {TOGGLES.map((key) => (
            <label key={key} className="dx-opt dx-opt--check">
              <input
                type="checkbox"
                checked={!!options[key]}
                onChange={(e) => set(key, e.target.checked as never)}
              />
              <span>{key}</span>
            </label>
          ))}
        </div>

        <p className="dx-label dx-label--spaced">
          dimensions <span className="dx-hint">0 = keep the size preset</span>
        </p>
        <div className="dx-dims">
          {DIMS.map(({ key, max, label }) => (
            <label key={key} className="dx-dim">
              <span>
                {label}
                <b>{dims[key] ? `${dims[key]}px` : 'auto'}</b>
              </span>
              <input
                type="range"
                min={0}
                max={max}
                value={dims[key] ?? 0}
                onChange={(e) => setDims((d) => ({ ...d, [key]: +e.target.value }))}
              />
            </label>
          ))}
        </div>

        <label className="dx-opt dx-opt--wide">
          <span>classNames.trigger</span>
          <input
            className="dx-input"
            placeholder="e.g. my-trigger uppercase"
            value={triggerClass}
            onChange={(e) => setTriggerClass(e.target.value)}
          />
        </label>
      </div>

      <div className="dx-play__preview">
        <div className="dx-stage">
          {parsed.items ? accordion.render() : <p className="dx-error">Fix the JSON to see the preview.</p>}
        </div>

        <div className="dx-code dx-code--accent">
          <span className="dx-code__label">your code</span>
          <pre>
            <code>{snippet(options, dimensions, triggerClass)}</code>
          </pre>
        </div>
      </div>
    </div>
  );
}

function snippet(options: Options, dimensions: AccordionDimensions, triggerClass: string) {
  const lines = Object.entries(options).map(([k, v]) =>
    typeof v === 'boolean' ? `  ${k}: ${v},` : `  ${k}: '${v}',`,
  );
  const dimEntries = Object.entries(dimensions);
  if (dimEntries.length) {
    lines.push('  dimensions: {');
    for (const [k, v] of dimEntries) lines.push(`    ${k}: ${v},`);
    lines.push('  },');
  }
  if (triggerClass) lines.push(`  classNames: { trigger: '${triggerClass}' },`);

  return `const faq = useAccordion({\n  items,\n${lines.join('\n')}\n});\n\nreturn faq.render();`;
}
