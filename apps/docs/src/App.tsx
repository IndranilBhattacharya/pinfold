import * as React from 'react';
import { DEFAULT_PALETTE, KnotProvider, useLiveTheme, type Palette } from './theme';
import { PaletteStudio } from './PaletteStudio';
import { useAccordion } from '@knotui/accordion';
import type { AccordionConfig, AccordionVariant } from '@knotui/accordion';
import { Playground } from './Playground';

const FAQ = [
  {
    id: 'what',
    title: 'What actually ships in the bundle?',
    description: 'Core is ~2 kB gzipped',
    content:
      'The core package is tokens plus six primitives. Each component is its own package with its own CSS file, so importing the accordion never pulls in the data grid.',
    badge: 'Core',
  },
  {
    id: 'config',
    title: 'Why configuration instead of JSX?',
    content:
      'A twelve-row accordion is 12 lines of data, not 60 lines of nested markup. Data is diffable, serialisable, storable in a CMS, and an LLM can emit it reliably. When you need markup, the same config object takes render overrides per slot.',
    badge: 'Design',
  },
  {
    id: 'escape',
    title: 'What if I need to change one tiny part?',
    content:
      'Every slot takes classNames, slotProps and render. Below that, useAccordion() hands you the same state and prop getters with no markup at all.',
  },
  {
    id: 'a11y',
    title: 'How accessible is it, really?',
    content:
      'Buttons inside real headings, aria-expanded and aria-controls, panels as labelled regions, Arrow/Home/End roving focus, aria-disabled instead of unfocusable disabled buttons, closed panels removed from the accessibility tree, and prefers-reduced-motion honoured.',
    badge: 'WCAG 2.2 AA',
  },
  {
    id: 'react',
    title: 'Which React versions work?',
    content: 'React 16.8 and up. No new hooks, no automatic JSX runtime requirement, no react-dom import.',
    disabled: false,
  },
];

const JSX_WAY = `<Accordion type="single" collapsible>
  <AccordionItem value="a">
    <AccordionTrigger>
      <ChevronIcon />
      Shipping
    </AccordionTrigger>
    <AccordionContent>
      Ships in 2 days.
    </AccordionContent>
  </AccordionItem>
  <AccordionItem value="b">
    ...repeat forever
  </AccordionItem>
</Accordion>`;

const KNOT_WAY = `const faq = useAccordion({
  items: [
    { title: 'Shipping', content: 'Ships in 2 days.' },
    { title: 'Returns', content: '30 days, no questions.' },
  ],
  variant: 'separated',
});

return faq.render();`;

const WAYS: Array<[string, string]> = [
  [
    'hook — the default',
    `const faq = useAccordion({ items });

return faq.render();`,
  ],
  [
    'hook + your own dimensions and classes',
    `const faq = useAccordion({
  items,
  variant: 'separated',
  dimensions: { paddingX: 24, gap: 12, radius: 16 },
  classNames: { trigger: 'font-semibold' },
  styles: { panel: { background: '#0000000a' } },
});

return faq.render();`,
  ],
  [
    'hook — control it from outside',
    `const faq = useAccordion({ items, mode: 'multiple' });

<button onClick={faq.openAll}>Expand all</button>
{faq.render()}
// faq.value · faq.toggle(id) · faq.isOpen(id)`,
  ],
  [
    'hook — your markup, our behaviour',
    `const faq = useAccordion({ items });

<dl {...faq.getRootProps()}>
  {faq.items.map((item) => (
    <div key={item.id} {...faq.getItemProps(item)}>
      <dt><button {...faq.getTriggerProps(item)}>{item.config.title}</button></dt>
      <dd {...faq.getPanelProps(item)}>{item.config.content}</dd>
    </div>
  ))}
</dl>`,
  ],
];

export function App() {
  const [mode, setMode] = React.useState<'light' | 'dark'>('dark');
  const [palette, setPalette] = React.useState<Palette>(DEFAULT_PALETTE);
  const theme = useLiveTheme(palette, mode);
  const radius = (palette.radius ?? 'lg') as 'none' | 'sm' | 'md' | 'lg' | 'full';

  return (
    <KnotProvider theme={mode} radius={radius}>
      <header className="dx-header">
        <div className="dx-wrap dx-header__inner">
          <a className="dx-logo" href="#top">
            <KnotMark />
            <span>Knot<b>UI</b></span>
          </a>
          <nav className="dx-nav">
            <a href="#playground">Playground</a>
            <a href="#palette">Palette</a>
            <a href="#variants">Variants</a>
            <a href="#headless">Headless</a>
            <a href="#api">API</a>
          </nav>
          <div className="dx-controls">
            <a className="dx-btn" href="#palette">
              Palette studio
            </a>
            <button
              className="dx-icon-btn"
              onClick={() => setMode((t) => (t === 'dark' ? 'light' : 'dark'))}
              aria-label={`Switch to ${mode === 'dark' ? 'light' : 'dark'} theme`}
            >
              {mode === 'dark' ? '☾' : '☀'}
            </button>
          </div>
        </div>
      </header>

      <main className="dx-wrap" id="top">
        <section className="dx-hero">
          <p className="dx-eyebrow">v0.1.0 · accordion shipped · 12 components planned</p>
          <h1>
            Build UI from <em>configuration</em>,<br /> not from markup.
          </h1>
          <p className="dx-lede">
            An entire accessible accordion, data grid or calendar from one object — or one hook.
            Rich variants, per-component installs, and an escape hatch on every slot.
          </p>
          <div className="dx-cta">
            <code className="dx-cmd">npx knotui init</code>
            <code className="dx-cmd">npx knotui add accordion</code>
          </div>

          <div className="dx-compare">
            <Code label="Everyone else" tone="muted" code={JSX_WAY} />
            <Code label="Knot UI" tone="accent" code={KNOT_WAY} />
          </div>
        </section>

        <Section
          id="playground"
          title="Playground"
          lede="Edit the config. The component is the config — nothing else to learn."
        >
          <Playground />
        </Section>

        <Section
          id="palette"
          title="Palette studio"
          lede="Seven roles, eleven steps each, generated from hue angles in OKLCH. The sliders run the same createTheme() the CLI runs, so the command underneath reproduces exactly what you see — including the sRGB fallbacks for browsers without OKLCH."
        >
          <PaletteStudio palette={palette} onChange={setPalette} theme={theme} />
        </Section>

        <Section
          id="ways"
          title="One hook, four levels"
          lede="Start with render(). Reach further only when you need to — the config object never changes shape."
        >
          <div className="dx-compare">
            {WAYS.map(([label, code]) => (
              <Code key={label} label={label} tone={label.endsWith('default') ? 'accent' : 'muted'} code={code} />
            ))}
          </div>
        </Section>

        <Section
          id="variants"
          title="Variants"
          lede="Five surface treatments, three sizes, six tones, four indicators. Every combination is a valid, accessible accordion."
        >
          <div className="dx-grid">
            {(['solid', 'outline', 'separated', 'filled', 'ghost'] as const).map((variant) => (
              <figure key={variant} className="dx-card">
                <figcaption>{variant}</figcaption>
                <Demo
                  variant={variant}
                  items={FAQ.slice(0, 3)}
                  defaultValue={['what']}
                  indicator={variant === 'filled' ? 'plus' : 'chevron'}
                />
              </figure>
            ))}
            <figure className="dx-card">
              <figcaption>dimensions — nothing about size is locked</figcaption>
              <Demo
                variant="outline"
                items={FAQ.slice(0, 3)}
                defaultValue={['what']}
                dimensions={{ paddingX: 24, paddingY: 18, gap: 14, radius: 20, fontSize: 15, indicatorSize: 20 }}
              />
            </figure>
            <figure className="dx-card">
              <figcaption>rich rows — icons, badges, descriptions</figcaption>
              <Demo
                variant="separated"
                mode="multiple"
                tone="success"
                items={FAQ.map((item) => ({ ...item, icon: <Dot /> }))}
                defaultValue={['what', 'config']}
              />
            </figure>
          </div>
        </Section>

        <Section
          id="headless"
          title="Headless"
          lede="Same state, zero markup. useAccordion() returns prop getters that carry every ARIA attribute — bring your own elements."
        >
          <HeadlessDemo />
        </Section>

        <Section id="api" title="Config reference" lede="One flat object. No context gymnastics.">
          <ApiTable />
        </Section>

        <Section
          id="a11y"
          title="Accessibility"
          lede="Checked against the WAI-ARIA Authoring Practices accordion pattern."
        >
          <ul className="dx-checks">
            {[
              'Trigger is a real <button> inside a heading at a configurable level',
              'aria-expanded, aria-controls and aria-labelledby wired both directions',
              'Panels are role="region" labelled by their trigger',
              'Arrow Up/Down, Home and End move between headers, with optional looping',
              'Disabled rows use aria-disabled so they stay focusable and discoverable',
              'Closed panels leave the accessibility tree and the tab order',
              'prefers-reduced-motion and forced-colors both handled in CSS',
              'RTL supported through logical properties and dir-aware key handling',
            ].map((line) => (
              <li key={line}>{line}</li>
            ))}
          </ul>
        </Section>

        <footer className="dx-footer">
          MIT · built with Knot UI source, live-reloaded from <code>packages/</code>
        </footer>
      </main>
    </KnotProvider>
  );
}

/** Every demo on this page renders from the hook — there is no <Accordion> tag. */
function Demo(config: AccordionConfig & { variant?: AccordionVariant }) {
  return useAccordion(config).render();
}

function Section({
  id,
  title,
  lede,
  children,
}: {
  id: string;
  title: string;
  lede: string;
  children: React.ReactNode;
}) {
  return (
    <section className="dx-section" id={id}>
      <h2>{title}</h2>
      <p className="dx-lede">{lede}</p>
      {children}
    </section>
  );
}

function Code({ label, code, tone }: { label: string; code: string; tone: 'muted' | 'accent' }) {
  return (
    <div className={`dx-code dx-code--${tone}`}>
      <span className="dx-code__label">{label}</span>
      <pre>
        <code>{code}</code>
      </pre>
    </div>
  );
}

/** Proves the hook is genuinely markup-free: this renders a definition list. */
function HeadlessDemo() {
  const api = useAccordion({ items: FAQ.slice(0, 3), mode: 'multiple', defaultValue: ['what'] });

  return (
    <div className="dx-split">
      <dl {...api.getRootProps({ className: 'dx-dl' })}>
        {api.items.map((item) => (
          <div key={item.id} {...api.getItemProps(item)}>
            <dt {...api.getHeaderProps(item, { className: 'dx-dt' })}>
              <button {...api.getTriggerProps(item, { className: 'dx-dt__btn' })}>
                <span>{item.open ? '−' : '+'}</span> {item.config.title}
              </button>
            </dt>
            <dd {...api.getPanelProps(item, { className: 'dx-dd' })} hidden={!item.open}>
              {item.config.content}
            </dd>
          </div>
        ))}
      </dl>
      <div className="dx-state">
        <div className="dx-state__row">
          <button className="dx-btn" onClick={api.openAll}>
            openAll()
          </button>
          <button className="dx-btn" onClick={api.closeAll}>
            closeAll()
          </button>
        </div>
        <pre>
          <code>{JSON.stringify({ value: api.value }, null, 2)}</code>
        </pre>
      </div>
    </div>
  );
}

const API_ROWS: Array<[string, string, string]> = [
  ['items', 'AccordionItemConfig[]', 'title, content, description, icon, badge, disabled, defaultOpen'],
  ['mode', "'single' | 'multiple'", 'single closes siblings. Default single'],
  ['collapsible', 'boolean', 'single mode: may the open row close. Default true'],
  ['value / defaultValue', 'string[]', 'controlled or uncontrolled open ids'],
  ['onValueChange', '(ids) => void', 'fires with the next open set'],
  ['variant', "'solid' | 'outline' | 'separated' | 'filled' | 'ghost'", 'surface treatment'],
  ['size / tone / radius', 'token scales', 'inherits from KnotProvider when omitted'],
  ['indicator', "'chevron' | 'plus' | 'caret' | 'none' | ReactNode", 'trailing glyph'],
  ['headingLevel', '1–6', 'heading level around each trigger. Default 3'],
  ['unmountClosed', 'boolean', 'drop closed content from the DOM. Default false'],
  [
    'dimensions',
    'AccordionDimensions',
    'width, minWidth, maxWidth, height, maxHeight, gap, paddingX/Y, panelPaddingX/Y, panelMaxHeight, fontSize, titleSize, descriptionSize, iconSize, indicatorSize, borderWidth, radius, duration. Numbers are px, strings pass through',
  ],
  ['classNames', 'Partial<Record<Slot, string>>', 'add your own class to any of the 12 slots'],
  ['styles', 'Partial<Record<Slot, CSSProperties>>', 'inline style per slot'],
  ['slotProps / render', 'per slot', 'merge DOM props, or replace a slot entirely'],
];

function ApiTable() {
  return (
    <div className="dx-table-wrap">
      <table className="dx-table">
        <thead>
          <tr>
            <th>Key</th>
            <th>Type</th>
            <th>Notes</th>
          </tr>
        </thead>
        <tbody>
          {API_ROWS.map(([key, type, note]) => (
            <tr key={key}>
              <td>
                <code>{key}</code>
              </td>
              <td>
                <code className="dx-type">{type}</code>
              </td>
              <td>{note}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function KnotMark() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path
        d="M6 18c6-2 6-10 12-12M6 6c6 2 6 10 12 12"
        stroke="currentColor"
        strokeWidth="2.2"
        strokeLinecap="round"
      />
    </svg>
  );
}

function Dot() {
  return <span className="dx-dot" />;
}
