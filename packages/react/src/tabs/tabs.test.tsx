import * as React from 'react';
import { describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen } from '@testing-library/react';
import { PinfoldProvider } from '../provider';
import { Tabs } from './Tabs';

const items = [
  { id: 'a', label: 'Alpha', content: <p>Alpha panel</p> },
  { id: 'b', label: 'Beta', content: <p>Beta panel</p> },
  { id: 'c', label: 'Gamma', content: <p>Gamma panel</p> },
];

describe('Tabs layouts and rendering', () => {
  it('panelVariant: auto is a card for enclosed and plain otherwise; plain and card can be chosen', () => {
    const { container, rerender } = render(<Tabs label="T" items={items} />);
    const root = container.firstElementChild!;
    expect(root.getAttribute('data-panel-variant')).toBe('plain');
    rerender(<Tabs label="T" items={items} variant="enclosed" />);
    expect(root.getAttribute('data-panel-variant')).toBe('card');
    rerender(<Tabs label="T" items={items} variant="enclosed" panelVariant="plain" />);
    expect(root.getAttribute('data-panel-variant')).toBe('plain');
    rerender(<Tabs label="T" items={items} variant="pills" panelVariant="card" />);
    expect(root.getAttribute('data-panel-variant')).toBe('card');
  });

  it('lazy: a panel mounts when first selected, then stays (hidden)', () => {
    const { container } = render(<Tabs label="T" items={items} lazy />);
    expect(container.querySelectorAll('[role="tabpanel"]')).toHaveLength(1);
    fireEvent.click(screen.getByRole('tab', { name: 'Gamma' }));
    expect(container.querySelectorAll('[role="tabpanel"]')).toHaveLength(2);
    fireEvent.click(screen.getByRole('tab', { name: 'Alpha' }));
    const panels = container.querySelectorAll('[role="tabpanel"]');
    expect(panels).toHaveLength(2);
    expect(screen.getByText('Gamma panel').closest('[role="tabpanel"]')!.hasAttribute('hidden')).toBe(true);
    // A tab whose panel is mounted controls it.
    expect(screen.getByRole('tab', { name: 'Gamma' }).getAttribute('aria-controls')).toBe(screen.getByText('Gamma panel').closest('[role="tabpanel"]')!.id);
    expect(screen.getByRole('tab', { name: 'Beta' }).hasAttribute('aria-controls')).toBe(false);
  });

  it('renderTab draws the inside of each tab; renderPanel draws each panel from the item', () => {
    render(
      <Tabs
        label="Views"
        items={['Board', 'List']}
        renderTab={(t) => <em>{`${t.id}${t.selected ? '*' : ''}`}</em>}
        renderPanel={(t) => <p>{`View ${t.id} #${t.index}`}</p>}
      />,
    );
    expect(screen.getAllByRole('tab').map((t) => t.textContent)).toEqual(['Board*', 'List']);
    expect(screen.getByRole('tabpanel').textContent).toBe('View Board #0');
    fireEvent.click(screen.getByRole('tab', { name: 'List' }));
    expect(screen.getByRole('tabpanel').textContent).toBe('View List #1');
  });

  it('mode nav: links in a named nav, the current one aria-current="page", no tab roles or panels; the router follows', () => {
    const navigate = vi.fn();
    const onChange = vi.fn();
    const { container } = render(
      <PinfoldProvider navigate={navigate}>
        <Tabs label="Project" mode="nav" value="/b" onChange={onChange} items={[{ id: '/a', label: 'A', href: '/a' }, { id: '/b', label: 'B', href: '/b' }]} />
      </PinfoldProvider>,
    );
    const nav = screen.getByRole('navigation', { name: 'Project' });
    expect(screen.queryByRole('tablist')).toBeNull();
    expect(screen.queryByRole('tab')).toBeNull();
    expect(container.querySelector('[role="tabpanel"]')).toBeNull();
    const links = nav.querySelectorAll('a');
    expect(links[1].getAttribute('aria-current')).toBe('page');
    expect(links[0].hasAttribute('aria-current')).toBe(false);
    expect(links[0].hasAttribute('tabindex')).toBe(false);
    fireEvent.click(links[0]);
    expect(navigate).toHaveBeenCalledWith('/a');
    expect(onChange).toHaveBeenCalledWith('/a', expect.anything());
  });

  it('scroll buttons: pointer-only, outside the tab list, and can be turned off', () => {
    const { container, rerender } = render(<Tabs label="T" items={items} />);
    const buttons = container.querySelectorAll('.pinfold-tabs__scrollButton');
    expect(buttons).toHaveLength(2);
    expect(buttons[0].getAttribute('aria-hidden')).toBe('true');
    expect(buttons[0].getAttribute('tabindex')).toBe('-1');
    expect(buttons[0].closest('[role="tablist"]')).toBeNull();
    fireEvent.click(buttons[1]);
    rerender(<Tabs label="T" items={items} scrollButtons={false} />);
    expect(container.querySelectorAll('.pinfold-tabs__scrollButton')).toHaveLength(0);
  });

  it('marks the edges that hide tabs on the header', () => {
    const { container } = render(<Tabs label="T" items={items} />);
    const list = container.querySelector('[role="tablist"]') as HTMLElement;
    Object.defineProperties(list, { scrollWidth: { value: 600, configurable: true }, clientWidth: { value: 300, configurable: true }, scrollLeft: { value: 100, configurable: true, writable: true } });
    fireEvent.scroll(list);
    return vi.waitFor(() => {
      const header = container.querySelector('.pinfold-tabs__header')!;
      expect(header.hasAttribute('data-overflow-start')).toBe(true);
      expect(header.hasAttribute('data-overflow-end')).toBe(true);
    });
  });
});
