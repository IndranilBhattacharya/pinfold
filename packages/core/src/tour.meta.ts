import type { ComponentMeta, PropMeta } from './meta';
import { RADIUS_PROP } from './meta-shared';

const SLOTS = ['root', 'overlay', 'spotlight', 'card', 'arrow', 'header', 'counter', 'title', 'content', 'footer', 'progress', 'dot', 'actions'] as const;
const perSlot = (description: string, type: PropMeta['type']): PropMeta => ({
  type: 'object',
  description,
  group: 'escape-hatch',
  keys: Object.fromEntries(SLOTS.map((s) => [s, { type, description: `The \`${s}\` slot.`, group: 'escape-hatch' }])),
});
const TONES = ['primary', 'neutral', 'success', 'warning', 'danger', 'info'];
const PLACEMENTS = ['top', 'top-start', 'top-end', 'bottom', 'bottom-start', 'bottom-end', 'start', 'start-top', 'start-bottom', 'end', 'end-top', 'end-bottom'];
const len = (description: string): PropMeta => ({ type: 'length', description, group: 'appearance' });

export const tourMeta: ComponentMeta = {
  name: 'tour',
  displayName: 'Tour',
  description:
    'A guided walk over the real interface: a spotlight cuts a rounded hole in a dimmed (or blurred) page around each target and glides from one to the next, while a card beside it explains the step. Next, Back and Skip, a step counter and progress dots, arrow keys, Escape to skip; it scrolls each target into view and follows it through scrolling and resizing; a guard can hold a step; a step without a target, or whose target is missing, sits in the middle.',
  pattern: 'https://www.w3.org/WAI/ARIA/apg/patterns/dialog-modal/',
  importPath: '@pinfold/react/tour',
  slots: SLOTS,
  requires: ['button'],
  props: {
    steps: {
      type: 'array',
      required: true,
      description: 'The stops, in order.',
      group: 'data',
      items: {
        id: { type: 'string', description: 'Names the step (handed back in events).', group: 'data' },
        target: { type: 'string', description: 'What to point at: a CSS selector, a ref, or `() => Element`. None: the card sits in the middle.', group: 'data' },
        title: { type: 'node', description: 'The card\'s heading.', group: 'data' },
        content: { type: 'node', description: 'The card\'s text, or anything.', group: 'data' },
        placement: { type: 'enum', values: PLACEMENTS, description: 'This step\'s side of the target.', group: 'appearance' },
        spotlightPadding: { type: 'number', description: 'This step\'s space around the target.', group: 'appearance' },
        spotlightRadius: { type: 'number', description: 'This step\'s corner radius of the hole.', group: 'appearance' },
        interactive: { type: 'boolean', description: 'This step\'s target can be used.', group: 'behaviour' },
        actions: { type: 'array', description: 'Extra buttons (button configs) before Back and Next.', group: 'data' },
      },
    },
    open: { type: 'boolean', description: 'Running, controlled.', group: 'data' },
    defaultOpen: { type: 'boolean', default: false, description: 'Running from the start.', group: 'behaviour' },
    step: { type: 'number', description: 'The current step (from 0), controlled.', group: 'data' },
    defaultStep: { type: 'number', default: 0, description: 'The step it starts on.', group: 'behaviour' },
    beforeStep: { type: 'function', description: '`(from, to) => boolean | Promise<boolean>`: return false (or resolve false) to stay. The buttons wait while it runs.', group: 'behaviour' },
    placement: { type: 'enum', values: PLACEMENTS, default: 'bottom', description: 'The card\'s side of the target. `start` and `end` swap in RTL; it flips when there is no room.', group: 'appearance', control: true },
    mask: { type: 'enum', values: ['dim', 'blur', 'none'], default: 'dim', description: 'What covers the rest of the page: a dim, a blur, or nothing (the page stays usable).', group: 'appearance', control: true },
    spotlightPadding: { type: 'number', default: 8, description: 'Space between the target and the edge of the hole, in px.', group: 'appearance' },
    spotlightRadius: { type: 'number', default: 12, description: 'Corner radius of the hole, in px.', group: 'appearance' },
    interactive: { type: 'boolean', default: false, description: 'The spotlighted target can be clicked and typed into.', group: 'behaviour', control: true },
    arrow: { type: 'boolean', default: true, description: 'A small arrow on the card pointing at the target.', group: 'appearance', control: true },
    progress: { type: 'enum', values: ['both', 'dots', 'counter', 'none'], default: 'both', description: 'Progress dots in the footer, a "2 of 5" counter in the header, both, or neither.', group: 'appearance', control: true },
    showSkip: { type: 'boolean', default: true, description: 'A Skip button (not on the last step).', group: 'appearance', control: true },
    closeOnEscape: { type: 'boolean', default: true, description: 'Escape skips the tour.', group: 'behaviour', control: true },
    scroll: { type: 'boolean', default: true, description: 'Scroll each target into view.', group: 'behaviour' },
    missingTarget: { type: 'enum', values: ['center', 'skip'], default: 'center', description: 'A step whose target is not on the page: the card in the middle, or the step is passed over. Either way a warning shows in development.', group: 'behaviour', control: true },
    onOpenChange: { type: 'function', description: '`(open) => void`.', group: 'events' },
    onStepChange: { type: 'function', description: '`(index, step) => void` when the step changes.', group: 'events' },
    onComplete: { type: 'function', description: '`() => void`: Done on the last step.', group: 'events' },
    onSkip: { type: 'function', description: '`(index, step) => void`: Skip, or Escape.', group: 'events' },
    labels: {
      type: 'object',
      description: 'Text read or shown, for translation.',
      group: 'data',
      keys: {
        next: { type: 'string', description: 'Default "Next".', group: 'data' },
        back: { type: 'string', description: 'Default "Back".', group: 'data' },
        skip: { type: 'string', description: 'Default "Skip".', group: 'data' },
        done: { type: 'string', description: 'Default "Done".', group: 'data' },
        counter: { type: 'function', description: '`(step, total) => string`. Default "2 of 5".', group: 'data' },
        tour: { type: 'string', description: 'Names the card when a step has no title. Default "Tour".', group: 'data' },
      },
    },
    dimensions: { type: 'object', description: 'Exact measurements. Numbers are px.', group: 'appearance', keys: { width: len('The card\'s width.') } },
    radius: RADIUS_PROP,
    size: { type: 'enum', values: ['sm', 'md', 'lg'], default: 'md', description: 'Precedence: this config, `defaults.tour`, the provider, then md.', group: 'appearance', control: true },
    tone: { type: 'enum', values: TONES, default: 'primary', description: 'Buttons, dots and the spotlight ring. Precedence: this config, `defaults.tour`, the provider, then primary.', group: 'appearance', control: true },
    unstyled: { type: 'boolean', default: false, description: 'Drop Pinfold classes; keep the behaviour, roles and data attributes.', group: 'appearance' },
    className: { type: 'string', description: 'Class on the root.', group: 'appearance' },
    style: { type: 'object', description: 'Inline style on the root.', group: 'appearance' },
    classNames: perSlot('Classes per slot.', 'string'),
    styles: perSlot('Inline styles per slot.', 'object'),
    slotProps: perSlot('Any DOM props per slot.', 'object'),
    render: perSlot('Replace a slot element: `({ props, state, children, item }) => node`. A dot gets `item`.', 'function'),
  },
  keyboard: [
    { keys: 'ArrowRight / Enter', action: 'Next step (Done on the last); ArrowRight is ArrowLeft in RTL' },
    { keys: 'ArrowLeft', action: 'Back' },
    { keys: 'Escape', action: 'Skip the tour (`closeOnEscape`)' },
    { keys: 'Tab', action: 'Stays inside the card while the page is covered' },
  ],
  aria: [
    'The card is a `dialog` named by the step title and described by its content; modal (`aria-modal`) while the page is covered.',
    'Opening moves the focus into the card, each step keeps it there, and closing returns it to where it was.',
    'The overlay and the spotlight are decoration (`aria-hidden`).',
    'The progress dots are hidden from assistive technology; the counter is read with the title.',
  ],
  dataAttributes: [
    { name: 'data-mask / data-size / data-tone / data-state', on: 'root', values: 'the options; "open" | "closed"' },
    { name: 'data-centered', on: 'root, card', values: 'present when the step has no target on the page' },
    { name: 'data-pending', on: 'root', values: 'present while `beforeStep` runs' },
    { name: 'data-side', on: 'card', values: 'the side of the target it landed on' },
    { name: 'data-current / data-done', on: 'dot', values: 'present for the current step / the steps before it' },
  ],
  cssVariables: ['--pinfold-tour-width'],
  examples: [
    { title: 'A first-run tour', code: "import { defineTour } from '@pinfold/react/tour';\n\nexport const Onboarding = defineTour({ mask: 'dim' });\n\n<Onboarding defaultOpen steps={[\n  { target: '#search', title: 'Search anything', content: 'Press / from anywhere.' },\n  { target: () => document.querySelector('[data-tour=new]'), title: 'Create', content: 'Start a project here.', placement: 'end' },\n  { title: 'You are set', content: 'Find this tour again under Help.' },\n]} onComplete={markSeen} />" },
    { title: 'Started from a button', code: "const Tour = useTour({ steps });\n<button onClick={() => Tour.start()}>Take the tour</button>\n<Tour />" },
  ],
};
