import * as React from 'react';
import { describe, expect, it, vi } from 'vitest';
import { act, fireEvent, render, screen } from '@testing-library/react';
import { describePinfoldConformance } from '@pinfold/testing';
import { Accordion } from './Accordion';
import { useAccordion } from './useAccordion';

const items = [
  { id: 'a', title: 'First', content: 'One' },
  { id: 'b', title: 'Second', content: 'Two' },
  { id: 'c', title: 'Third', content: 'Three', disabled: true },
];

const triggers = () => screen.getAllByRole('button');

describe('Accordion', () => {
  it('wires the ARIA accordion pattern', () => {
    render(<Accordion items={items} defaultValue={['a']} headingLevel={2} />);
    const [first] = triggers();

    expect(first).toHaveAttribute('aria-expanded', 'true');
    expect(screen.getAllByRole('heading', { level: 2 })).toHaveLength(3);

    const panel = document.getElementById(first.getAttribute('aria-controls')!)!;
    expect(panel).toHaveAttribute('role', 'region');
    expect(panel).toHaveAttribute('aria-labelledby', first.id);
    expect(panel).toHaveAttribute('data-state', 'open');
  });

  it('closes siblings in single mode and reopens on demand', () => {
    const onValueChange = vi.fn();
    render(<Accordion items={items} defaultValue={['a']} onValueChange={onValueChange} />);
    const [first, second] = triggers();

    fireEvent.click(second);
    expect(first).toHaveAttribute('aria-expanded', 'false');
    expect(second).toHaveAttribute('aria-expanded', 'true');
    expect(onValueChange).toHaveBeenLastCalledWith(['b'], expect.objectContaining({ id: 'b', open: true }));
  });

  it('keeps several rows open in multiple mode', () => {
    render(<Accordion items={items} mode="multiple" />);
    const [first, second] = triggers();

    fireEvent.click(first);
    fireEvent.click(second);
    expect(first).toHaveAttribute('aria-expanded', 'true');
    expect(second).toHaveAttribute('aria-expanded', 'true');
  });

  it('refuses to close the last row when collapsible is false', () => {
    render(<Accordion items={items} defaultValue={['a']} collapsible={false} />);
    const [first] = triggers();

    fireEvent.click(first);
    expect(first).toHaveAttribute('aria-expanded', 'true');
  });

  it('ignores disabled rows but keeps them focusable', () => {
    render(<Accordion items={items} />);
    const third = triggers()[2];

    expect(third).toHaveAttribute('aria-disabled', 'true');
    expect(third).not.toHaveAttribute('disabled');
    fireEvent.click(third);
    expect(third).toHaveAttribute('aria-expanded', 'false');
  });

  it('moves focus with Arrow, Home and End keys', () => {
    render(<Accordion items={items} />);
    const [first, second, third] = triggers();

    first.focus();
    fireEvent.keyDown(first, { key: 'ArrowDown' });
    expect(document.activeElement).toBe(second);

    fireEvent.keyDown(second, { key: 'End' });
    expect(document.activeElement).toBe(third);

    fireEvent.keyDown(third, { key: 'ArrowDown' }); // loops
    expect(document.activeElement).toBe(first);

    fireEvent.keyDown(first, { key: 'ArrowUp' });
    expect(document.activeElement).toBe(third);

    fireEvent.keyDown(third, { key: 'Home' });
    expect(document.activeElement).toBe(first);
  });

  it('renders straight from the hook, with no component in the tree', () => {
    function Faq() {
      const faq = useAccordion({ items, defaultValue: ['a'] });
      return faq.render();
    }
    render(<Faq />);
    expect(triggers()[0]).toHaveAttribute('aria-expanded', 'true');
    expect(screen.getByText('First')).toBeTruthy();
  });

  it('maps dimensions onto CSS custom properties', () => {
    render(
      <Accordion
        items={items}
        slotProps={{ root: { 'data-testid': 'root' } }}
        dimensions={{ paddingX: 24, maxWidth: '32rem', panelMaxHeight: 200 }}
      />,
    );
    const root = screen.getByTestId('root');

    expect(root.style.getPropertyValue('--pinfold-accordion-padding-x')).toBe('24px');
    expect(root.style.getPropertyValue('--pinfold-accordion-max-width')).toBe('32rem');
    expect(root.style.getPropertyValue('--pinfold-accordion-panel-max-height')).toBe('200px');
    // panelMaxHeight opts the panel into scrolling
    expect(root).toHaveAttribute('data-scroll');
  });

  it('applies per-slot inline styles', () => {
    render(<Accordion items={items} styles={{ trigger: { letterSpacing: '2px' } }} />);
    expect(triggers()[0].style.letterSpacing).toBe('2px');
  });

  it('honours controlled value and slot overrides', () => {
    const { rerender } = render(
      <Accordion
        items={items}
        value={[]}
        classNames={{ trigger: 'my-trigger' }}
        slotProps={{ root: { 'data-testid': 'root' } }}
      />,
    );
    expect(triggers()[0]).toHaveAttribute('aria-expanded', 'false');
    expect(triggers()[0].className).toContain('my-trigger');
    expect(screen.getByTestId('root')).toBeTruthy();

    // Controlled: clicking cannot change state without a prop update.
    fireEvent.click(triggers()[0]);
    expect(triggers()[0]).toHaveAttribute('aria-expanded', 'false');

    rerender(<Accordion items={items} value={['b']} />);
    expect(triggers()[1]).toHaveAttribute('aria-expanded', 'true');
  });
});


describe('Accordion — component from hook', () => {
  function Harness({ config = {}, onApi }: any) {
    const [, force] = React.useState(0);
    const Faq = useAccordion({ items, defaultValue: ['a'], ...config });
    onApi?.(Faq);
    return (
      <div>
        <button data-testid="rerender" onClick={() => force((n) => n + 1)}>
          rerender
        </button>
        <Faq className="layout-class" data-testid="root" />
      </div>
    );
  }

  it('renders as a self-closing tag and takes layout props', () => {
    render(<Harness />);
    const root = screen.getByTestId('root');
    expect(root.classList.contains('layout-class')).toBe(true);
    expect(root.classList.contains('pinfold-accordion')).toBe(true);
  });

  it('keeps a stable component identity across parent re-renders', () => {
    // A fresh component type on each render would remount the subtree and
    // throw away focus, scroll position and any running transition.
    const seen: unknown[] = [];
    render(<Harness onApi={(api: unknown) => seen.push(api)} />);

    const first = triggers()[0];
    first.focus();
    fireEvent.click(screen.getByTestId('rerender'));

    expect(new Set(seen).size).toBe(1);
    expect(document.activeElement).toBe(triggers()[0]);
  });

  it('doubles as the controller', () => {
    let api: any;
    render(<Harness config={{ mode: 'multiple' }} onApi={(a: any) => (api = a)} />);

    expect(api.value).toEqual(['a']);
    act(() => api.toggle('b'));
    expect(api.value).toEqual(['a', 'b']);
    act(() => api.closeAll());
    expect(api.value).toEqual([]);
  });
});

describe('Accordion — composition and customisation', () => {
  it('lays out parts by hand while keeping the ARIA wiring', () => {
    function Custom() {
      const Faq = useAccordion({ items, defaultValue: ['a'] });
      return (
        <section>
          {Faq.items.map((item) => (
            <article key={item.id} className="my-card">
              <Faq.Trigger id={item.id}>Custom {item.id}</Faq.Trigger>
              <Faq.Panel id={item.id}>Body {item.id}</Faq.Panel>
            </article>
          ))}
        </section>
      );
    }
    render(<Custom />);

    const trigger = screen.getByRole('button', { name: 'Custom a' });
    const panel = document.getElementById(trigger.getAttribute('aria-controls')!)!;
    expect(trigger).toHaveAttribute('aria-expanded', 'true');
    expect(panel).toHaveAttribute('aria-labelledby', trigger.id);
    expect(panel.textContent).toContain('Body a');
  });

  it('accepts functions for every renderable field', () => {
    render(
      <Accordion
        items={[
          {
            id: 'a',
            title: (state) => (state.open ? 'Open title' : 'Closed title'),
            content: (state) => `body-${state.id}`,
            badge: (state) => (state.open ? 'now' : null),
          },
        ]}
        defaultValue={['a']}
      />,
    );
    expect(screen.getByText('Open title')).toBeTruthy();
    expect(screen.getByText('body-a')).toBeTruthy();
    expect(screen.getByText('now')).toBeTruthy();
  });

  it('takes a custom indicator that reacts to state', () => {
    render(
      <Accordion
        items={items}
        defaultValue={['a']}
        indicator={(state) => <em data-testid={`ind-${state.id}`}>{state.open ? 'v' : '>'}</em>}
      />,
    );
    expect(screen.getByTestId('ind-a').textContent).toBe('v');
    expect(screen.getByTestId('ind-b').textContent).toBe('>');
  });

  it('takes per-row classNames and a per-row indicator override', () => {
    render(
      <Accordion
        items={[
          { id: 'a', title: 'A', classNames: { trigger: 'row-a' }, indicator: 'plus' },
          { id: 'b', title: 'B' },
        ]}
      />,
    );
    expect(triggers()[0].className).toContain('row-a');
    expect(triggers()[1].className).not.toContain('row-a');
  });

  it('replaces a whole row with renderItem', () => {
    render(
      <Accordion
        items={items}
        renderItem={({ state, props, panel }) => (
          <div {...props} data-testid={`row-${state.id}`}>
            <button onClick={() => undefined}>{state.id}</button>
            {panel}
          </div>
        )}
      />,
    );
    expect(screen.getByTestId('row-a')).toHaveAttribute('data-state', 'closed');
  });

  it('drops every Pinfold class in unstyled mode but keeps behaviour', () => {
    render(
      <Accordion
        items={items}
        unstyled
        className="flex flex-col gap-2"
        classNames={{ trigger: 'w-full px-4 py-2' }}
        slotProps={{ root: { 'data-testid': 'root' } }}
      />,
    );
    const root = screen.getByTestId('root');

    expect(root.className).toBe('flex flex-col gap-2');
    expect(root).toHaveAttribute('data-unstyled');
    expect(triggers()[0].className).toBe('w-full px-4 py-2');
    // Behaviour and ARIA survive: only the styling opted out.
    expect(triggers()[0]).toHaveAttribute('aria-expanded', 'false');
    fireEvent.click(triggers()[0]);
    expect(triggers()[0]).toHaveAttribute('aria-expanded', 'true');
  });
});

describePinfoldConformance({
  name: 'accordion',
  slots: [
    'root', 'item', 'header', 'trigger', 'icon', 'label',
    'title', 'description', 'badge', 'indicator', 'panel', 'content',
  ],
  // These render only when an item supplies them.
  optionalSlots: ['icon', 'badge', 'description'],
  dimension: { key: 'paddingX', value: 24 },
  cssFile: 'packages/css/src/accordion.css',
  hook: { use: useAccordion as any, config: { items } },
  render: (config) => (
    <Accordion
      items={[
        { id: 'a', title: 'First', content: 'One', description: 'sub', badge: 'New', icon: <i /> },
        { id: 'b', title: 'Second', content: 'Two' },
      ]}
      defaultValue={['a']}
      {...config}
    />
  ),
});
