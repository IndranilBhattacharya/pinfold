import * as React from 'react';
import { describe, expect, it } from 'vitest';
import { render, screen } from '@testing-library/react';
import { renderToString } from 'react-dom/server';
import { describePinfoldConformance } from '@pinfold/testing';
import { separatorMeta } from '@pinfold/core/meta';
import { Separator } from './Separator';
import { useSeparator } from './useSeparator';
import { defineSeparator } from './define';

describe('Separator', () => {
  it('is decorative by default, and a real separator when asked', () => {
    const { container, rerender } = render(<Separator />);
    const root = container.firstElementChild!;
    expect(root.getAttribute('role')).toBe('none');
    expect(root.getAttribute('data-orientation')).toBe('horizontal');
    rerender(<Separator decorative={false} orientation="vertical" />);
    expect(screen.getByRole('separator').getAttribute('aria-orientation')).toBe('vertical');
  });

  it('reads a label as text, with decorative lines either side', () => {
    const { container } = render(<Separator label="or" decorative={false} />);
    const root = container.firstElementChild!;
    expect(root.getAttribute('role')).toBe('none');
    expect(root.textContent).toBe('or');
    expect(container.querySelectorAll('.pinfold-separator__line[aria-hidden="true"]')).toHaveLength(2);
  });

  it('drops the label on a vertical separator', () => {
    const { container } = render(<Separator label="or" orientation="vertical" />);
    expect(container.querySelector('.pinfold-separator__label')).toBeNull();
  });

  it('maps dimensions onto its variables', () => {
    const { container } = render(<Separator dimensions={{ thickness: 2, spacing: '1rem', length: '60%' }} />);
    const root = container.firstElementChild as HTMLElement;
    expect(root.style.getPropertyValue('--pinfold-separator-thickness')).toBe('2px');
    expect(root.style.getPropertyValue('--pinfold-separator-spacing')).toBe('1rem');
    expect(root.style.getPropertyValue('--pinfold-separator-length')).toBe('60%');
  });

  it('a preset renders on the server', () => {
    const Or = defineSeparator({ label: 'or', spacing: 'lg' });
    const html = renderToString(<Or />);
    expect(html).toContain('data-spacing="lg"');
    expect(html).toContain('>or<');
  });
});

describePinfoldConformance({
  name: 'separator',
  inherits: [],
  slots: ['root', 'line', 'label'],
  optionalSlots: ['label'],
  dimension: { key: 'thickness', value: 2 },
  cssFile: 'packages/css/src/separator.css',
  meta: separatorMeta,
  preset: { define: defineSeparator as any, props: { label: 'or' }, probe: { key: 'variant', values: ['dashed', 'dotted', 'solid'] } },
  hook: { use: useSeparator as any, config: {} },
  render: (config) => <Separator label="or" {...config} />,
});
