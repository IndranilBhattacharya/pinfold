/**
 * Compile-time contract of Avatar. `npm run typecheck` fails if an `@ts-expect-error` line
 * stops being an error. The runtime part renders the valid cases.
 */
import * as React from 'react';
import { describe, expect, it } from 'vitest';
import { render } from '@testing-library/react';
import { defineConfig } from '../config';
import { defineAvatar } from './define';
import { useAvatar } from './useAvatar';

const Team = defineAvatar({ max: 3, label: 'Project members' });
const members = [{ name: 'Ada', status: 'online' as const }, { name: 'Grace', src: '/g.png' }] as const;

function Valid() {
  const Me = useAvatar({ name: 'Ada Lovelace', src: '/a.png', status: 'busy', shape: 'square', tone: 'auto', dimensions: { size: 44 } });
  return (
    <>
      <Me />
      <Team items={members} className="x" />
    </>
  );
}

defineConfig({ defaults: { avatar: { shape: 'square', max: 5 } } });

function Invalid() {
  // @ts-expect-error not a status
  useAvatar({ name: 'Ada', status: 'idle' });
  // @ts-expect-error items are people, not strings
  useAvatar({ items: ['Ada'] });
  // @ts-expect-error instance data does not belong in app-wide defaults
  defineConfig({ defaults: { avatar: { src: '/a.png' } } });
  return null;
}

describe('Avatar types', () => {
  it('renders the valid cases', () => {
    const { container } = render(<Valid />);
    expect(container.querySelectorAll('[data-shape]').length).toBe(2);
    expect(typeof Invalid).toBe('function');
  });
});
