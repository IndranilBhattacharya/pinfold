import * as React from 'react';
import { describe, expect, it, vi } from 'vitest';
import { act, fireEvent, render, screen } from '@testing-library/react';
import { Stepper } from './Stepper';
import { useStepper } from './useStepper';

const wizard = [
  { label: 'Cart', content: <p>Cart content</p> },
  { label: 'Shipping', content: <p>Shipping form</p> },
  { label: 'Payment', content: <p>Payment form</p> },
];

describe('Stepper customisation', () => {
  it('icons: a step\'s own icon (node or function of its status) wins over the icons per status, which win over ours', () => {
    const { container } = render(
      <Stepper
        defaultValue={1}
        icons={{ complete: 'C', upcoming: 'U' }}
        items={[{ label: 'A' }, { label: 'B', icon: (s) => `B-${s.status}` }, { label: 'D', icon: 'D!' }, { label: 'E' }]}
      />,
    );
    const marks = [...container.querySelectorAll('.pinfold-stepper__indicator')].map((m) => m.textContent);
    expect(marks).toEqual(['C', 'B-current', 'D!', 'U']);
  });

  it('reflects connector and responsive on the root; text variant puts names beside the numbers', () => {
    const { container, rerender } = render(<Stepper items={['a', 'b']} />);
    const root = container.firstElementChild!;
    expect(root.getAttribute('data-connector')).toBe('gap');
    expect(root.hasAttribute('data-responsive')).toBe(true);
    rerender(<Stepper items={['a', 'b']} connector="joined" variant="text" orientation="vertical" />);
    expect(root.getAttribute('data-connector')).toBe('joined');
    expect(root.getAttribute('data-label-placement')).toBe('end');
    expect(root.hasAttribute('data-responsive')).toBe(false);
  });

  it('the narrow summary reads "Step 2 of 3" and the current name, hidden from screen readers', () => {
    const { container } = render(<Stepper items={['Cart', 'Ship', 'Pay']} defaultValue={1} labels={{ progress: (n, t) => `${n}/${t}` }} />);
    const summary = container.querySelector('.pinfold-stepper__summary')!;
    expect(summary.getAttribute('aria-hidden')).toBe('true');
    expect(summary.textContent).toBe('2/3Ship');
  });

  it('beforeChange can block Next, Back and a click on a step; it gets from and to', () => {
    const beforeChange = vi.fn((from: number, to: number) => !(from === 1 && to === 0));
    const onChange = vi.fn();
    render(<Stepper items={wizard} beforeChange={beforeChange} onChange={onChange} />);
    fireEvent.click(screen.getByRole('button', { name: 'Next' }));
    expect(beforeChange).toHaveBeenLastCalledWith(0, 1);
    expect(screen.getByRole('group', { name: 'Shipping' })).toBeTruthy();
    fireEvent.click(screen.getByRole('button', { name: 'Back' }));
    expect(beforeChange).toHaveBeenLastCalledWith(1, 0);
    expect(screen.getByRole('group', { name: 'Shipping' })).toBeTruthy();
    // The done step is a button; the guard blocks it too.
    fireEvent.click(screen.getByRole('button', { name: /Cart/ }));
    expect(screen.getByRole('group', { name: 'Shipping' })).toBeTruthy();
    expect(onChange).toHaveBeenCalledTimes(1);
  });

  it('an async beforeChange waits; resolving false stays, true moves; Finish runs it before onComplete', async () => {
    let allow = false;
    const onComplete = vi.fn();
    render(<Stepper items={wizard.slice(0, 2)} beforeChange={() => Promise.resolve(allow)} onComplete={onComplete} />);
    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: 'Next' }));
    });
    expect(screen.getByRole('group', { name: 'Cart' })).toBeTruthy();
    allow = true;
    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: 'Next' }));
    });
    expect(screen.getByRole('group', { name: 'Shipping' })).toBeTruthy();
    allow = false;
    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: 'Finish' }));
    });
    expect(onComplete).not.toHaveBeenCalled();
    allow = true;
    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: 'Finish' }));
    });
    expect(onComplete).toHaveBeenCalledTimes(1);
  });

  it('goTo goes through beforeChange; setValue does not', async () => {
    let api: ReturnType<typeof useStepper> | null = null;
    const beforeChange = vi.fn(() => false);
    function Probe() {
      const S = useStepper({ items: ['a', 'b', 'c'], beforeChange });
      api = S;
      return <S />;
    }
    render(<Probe />);
    await act(async () => {
      await api!.goTo(2);
    });
    expect(api!.value).toBe(0);
    act(() => api!.setValue(2));
    expect(api!.value).toBe(2);
    expect(beforeChange).toHaveBeenCalledTimes(1);
  });
});
