<div align="center">

# Lumae

**Config in, accessible UI out. Your JSX stays one tag.**

Hooks-first React components with a design system in a box, built-in responsiveness,
server rendering everywhere, and accessibility you can prove.

`React ≥ 18` · `TypeScript & JavaScript` · `MIT` · zero runtime dependencies

Created by **Indranil Bhattacharya**

</div>

> **Status: pre-release.** One component (accordion) is being hardened through
> milestones A1–A9 ([roadmap](docs/ROADMAP.md)). Package names below are the
> targets. The source still uses the working names `@knotui/*` until A1.
> Items marked *Planned* are specified but not yet built.

---

## The idea

Most React libraries make you hand-write the same tree, row after row:

```jsx
<Accordion type="single" collapsible>
  <AccordionItem value="a">
    <AccordionTrigger>Shipping</AccordionTrigger>
    <AccordionContent>Ships in 2 days.</AccordionContent>
  </AccordionItem>
  {/* …repeat forever */}
</Accordion>
```

Lumae takes data and gives you a component back:

```jsx
import { useAccordion } from '@lumae/react/accordion';

function Support({ items }) {
  const Faq = useAccordion({ items });   // state, keyboard, ARIA, theme, responsiveness
  return (
    <main>
      <h1>Support</h1>
      <Faq />
    </main>
  );
}
```

The value the hook returns is three things at once:

```jsx
<Faq className="mt-6" />        // 1. a component
Faq.toggle('shipping')          // 2. its controller: open, close, openAll, focusItem…
<Faq.Panel id="shipping" />     // 3. its parts, for layouts that config can't express
```

### On the server, too *(Planned)*

Server Components can't call hooks, so each component has a non-hook twin with the same config and the same tag:

```jsx
import { defineAccordion } from '@lumae/react/accordion';

export default async function Page() {
  const Faq = defineAccordion({
    items: await db.faq.findMany(),
    fields: { id: 'slug', title: 'question', content: 'answer' },
  });
  return <Faq />;   // full HTML on the server, hydrated on the client
}
```

### One global config *(Planned)*

```ts
// lumae.config.ts (or .js)
export default defineConfig({
  theme: { primary: 'emerald', style: 'glass', radius: 'lg', mode: 'system' },
  defaults: { accordion: { variant: 'separated' } },
});
```
Precedence, highest first: component config, `defaults.<component>`, the global theme, the library defaults.

## Install *(Planned CLI)*

```bash
npx lumae init              # interactive: language, components, theme, entry file, Tailwind merge
npx lumae add accordion     # writes components/ui/accordion.tsx (or .jsx)
npx shadcn add @lumae/accordion   # also works through the shadcn CLI
```

## What you get

- **A design system in a box.** OKLCH palettes, 7 roles × 11 steps, WCAG contrast reports, and style packs (glass, bauhaus, brutalist, noise, soft) that are token recipes, not forks of the components.
- **Responsive by default.** Container queries, fluid type, a wrap or truncate policy per slot, and 44px touch targets.
- **Tailwind wins without effort.** Lumae's CSS lives in cascade layers, so utilities override it with no `!important` and no `tailwind-merge`. `unstyled: true` makes a component fully headless.
- **SEO and Core Web Vitals safe.** Server HTML contains all content, layout shift stays at zero, and only a small amount of JS has to hydrate. `hiddenUntilFound` lets Ctrl+F find text inside closed panels.
- **Accessibility is a build gate.** WAI-ARIA APG patterns, a full keyboard map, `aria-disabled`, and handling for forced colours and reduced motion, plus a published report.
- **Small and safe.** You ship only what you import. Zero runtime dependencies, no install scripts, and npm provenance on every release.
- **Built for AI agents.** One JSON-safe config per component. Docs, schema and `llms.txt` ship inside the package. `npx lumae mcp` runs locally.

## Levels of control

| Level | You write | You get |
| --- | --- | --- |
| 1 | `<Faq />` | everything: styled, accessible, responsive |
| 2 | `dimensions`, `variant`, `size`… | exact look, keeping the preset for the rest |
| 3 | `classNames`, `styles`, `slotProps`, `render` | your classes or your markup for one part |
| 4 | `<Faq.Trigger id>`, `<Faq.Panel id>` | your layout, with our behaviour and ARIA |
| 5 | `getTriggerProps(item)` and the other getters | your elements, entirely |

The config never changes shape as you go deeper.

## Docs

| | |
|---|---|
| [docs/VISION.md](docs/VISION.md) | What Lumae is, and isn't |
| [docs/components/accordion.md](docs/components/accordion.md) | Accordion spec |
| [ARCHITECTURE.md](ARCHITECTURE.md) | The contract every component follows |
| [docs/COMPATIBILITY.md](docs/COMPATIBILITY.md) | React, TypeScript/JS, bundlers, SSR frameworks, browsers |
| [docs/CLI.md](docs/CLI.md) · [docs/DISTRIBUTION.md](docs/DISTRIBUTION.md) | Tooling and packages |
| [docs/DECISIONS.md](docs/DECISIONS.md) · [docs/ROADMAP.md](docs/ROADMAP.md) · [docs/STRATEGY.md](docs/STRATEGY.md) | Why, what's next, and the market |
| [AGENTS.md](AGENTS.md) | Binding rules for AI agents and contributors |

The website, playground and palette studio live in the sibling repo `lumae-site`, at `lumae.indranildev.in`.

## Develop

```bash
npm install
npm run verify    # typecheck, tests, build, gzip budget
npm run size      # gzip report per entry point
```

## License

[MIT](LICENSE) © 2026 Indranil Bhattacharya
