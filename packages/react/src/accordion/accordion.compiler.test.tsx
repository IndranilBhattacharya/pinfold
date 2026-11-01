import * as React from 'react';
import { describe, expect, it } from 'vitest';
import { fireEvent, render, screen } from '@testing-library/react';
import { Consumer, ControlledConsumer, PartsConsumer } from './fixtures/Consumer.compiled.jsx';

/**
 * D-06: Pinfold must work in apps that enable the React Compiler. The compiler
 * memoises JSX whose inputs look unchanged; a hook-returned component with a
 * stable identity is exactly such an input, so it must re-render on its own.
 */
describe('React Compiler', () => {
  it('actually compiled the fixture (guards against a vacuous pass)', () => {
    expect(Consumer.toString()).toMatch(/\$\[\d+\]/);
  });

  it('uncontrolled: clicking a row updates the UI', () => {
    render(<Consumer />);
    const trigger = screen.getByRole('button', { name: 'Alpha' });
    expect(trigger).toHaveAttribute('aria-expanded', 'false');
    fireEvent.click(trigger);
    expect(trigger).toHaveAttribute('aria-expanded', 'true');
    fireEvent.click(screen.getByRole('button', { name: 'Beta' }));
    expect(trigger).toHaveAttribute('aria-expanded', 'false');
    expect(screen.getByRole('button', { name: 'Beta' })).toHaveAttribute('aria-expanded', 'true');
  });

  it('controlled: state lifted into the consumer flows back into the accordion', () => {
    render(<ControlledConsumer />);
    fireEvent.click(screen.getByRole('button', { name: 'Alpha' }));
    expect(screen.getByTestId('value')).toHaveTextContent('a');
    expect(screen.getByRole('button', { name: 'Alpha' })).toHaveAttribute('aria-expanded', 'true');
    fireEvent.click(screen.getByRole('button', { name: 'Beta' }));
    expect(screen.getByTestId('value')).toHaveTextContent('a,b');
    expect(screen.getByRole('button', { name: 'Beta' })).toHaveAttribute('aria-expanded', 'true');
  });

  it('parts: <Faq.Trigger> and <Faq.Panel> stay live in a custom layout', () => {
    const { container } = render(<PartsConsumer />);
    const trigger = screen.getByRole('button', { name: 'Alpha' });
    fireEvent.click(trigger);
    expect(trigger).toHaveAttribute('aria-expanded', 'true');
    expect(container.querySelector('[role="region"]')).toHaveAttribute('data-state', 'open');
  });
});
