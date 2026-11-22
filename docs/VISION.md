# Vision

**Pinfold turns a plain config object into a complete, accessible, themed UI
component, while the JSX you return stays a single self-closing tag.**

```jsx
const Faq = useAccordion({ items });
return <Faq />;
```

The library does the heavy lifting, so developers and AI agents describe *what* they want
as data. The library owns markup, ARIA, keyboard behaviour, responsiveness, motion and theming.

## Audience

1. **React developers** at any scale, from solo apps to enterprise design systems,
   in TypeScript or plain JavaScript, on React 18 or newer, with or without SSR.
2. **AI coding agents.** Writing config costs fewer tokens and causes fewer structural bugs
   than writing nested JSX. Docs are dense, versioned and shipped inside the package.
3. **Design-system teams.** They define a palette, a style and per-component defaults once,
   and every component follows.

## Promises

1. **Hooks first, uncluttered JSX** — On both client (`use*`) and server (`define*`). One typed config object, clean tags, zero clutter.
2. **A design system in a box** — OKLCH palettes, style packs, and global config. Contrast reports for every style in light and dark modes.
3. **Accessibility with proof** — WCAG 2.2 AA compliant. Automated APG checks, keyboard navigation tests, and screen-reader test matrix.
4. **Runs everywhere in React 18+** — SSR, RSC, ISR, JavaScript or TypeScript, with or without the React Compiler.
5. **Built for AI coding agents** — `llms.txt`, full schemas, and rich metadata shipped in every package; local MCP server included.

Also guaranteed:
- You ship only what you import.
- Zero runtime dependencies.
- No runtime styling engine (no CSS-in-JS).
- Responsive by default.

## Non-goals

- Copying MUI, HeroUI or shadcn wholesale. Each component is filtered for real, modern use.
- A CSS-in-JS runtime or styling through `sx` props.
- Vue and Angular in this repo. The architecture supports them later.
- Lazy loading by default, at the expense of SEO or Core Web Vitals.
- Supporting React 16 or 17.

## Principles

- **Data over markup.** Config can be expressed as plain JSON. Functions are optional extras.
- **Defaults that need no thought.** Only the data is required, and every default meets enterprise standards.
- **A ladder, never a wall.** When config can't express something, the next rung down is always available.
- **Platform first.** CSS for motion, layout and theming. Native browser features before JavaScript.
- **Safety first.** Zero dependencies, provenance on every release, and accessibility as a hard gate.
