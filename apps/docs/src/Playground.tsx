import * as React from 'react';
import { Accordion } from '@knotui/accordion';
import type { AccordionConfig, AccordionItemConfig } from '@knotui/accordion';

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

export function Playground() {
  const [source, setSource] = React.useState(START);
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
  const [value, setValue] = React.useState<string[]>(['plan']);

  const parsed = React.useMemo(() => {
    try {
      const items = JSON.parse(source) as AccordionItemConfig[];
      if (!Array.isArray(items)) throw new Error('Config must be an array of items.');
      return { items, error: null as string | null };
    } catch (e) {
      return { items: null, error: (e as Error).message };
    }
  }, [source]);

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
          rows={18}
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
      </div>

      <div className="dx-play__preview">
        <div className="dx-stage">
          {parsed.items ? (
            <Accordion
              {...options}
              items={parsed.items}
              value={options.mode === 'single' ? value.slice(0, 1) : value}
              onValueChange={setValue}
            />
          ) : (
            <p className="dx-error">Fix the JSON to see the preview.</p>
          )}
        </div>

        <div className="dx-code dx-code--accent">
          <span className="dx-code__label">your code</span>
          <pre>
            <code>{snippet(options)}</code>
          </pre>
        </div>
      </div>
    </div>
  );
}

function snippet(options: Options) {
  const props = Object.entries(options)
    .filter(([, v]) => v !== undefined)
    .map(([k, v]) => (typeof v === 'boolean' ? (v ? `  ${k}` : `  ${k}={false}`) : `  ${k}="${v}"`))
    .join('\n');
  return `<Accordion\n  items={items}\n${props}\n/>`;
}
