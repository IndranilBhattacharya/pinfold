import * as React from 'react';
import { describe, expect, it } from 'vitest';
import { Tags } from './Tags';
import { useTags } from './useTags';
import { Command } from '../command/Command';

const topics = [{ value: 'design' }, { value: 'code' }] as const;

// Compile-time checks: these lines are type-checked by `npm run typecheck`, and each
// `@ts-expect-error` fails the build if the mistake stops being caught.
export function Checks(): React.ReactElement {
  const Own = useTags({ label: 'Topics', items: topics, selection: 'multiple', defaultValue: ['code'] });
  // @ts-expect-error: not one of the tags
  useTags({ label: 'Topics', items: topics, defaultValue: ['ops'] });
  // @ts-expect-error: a group needs a label
  useTags({ items: topics });
  return (
    <>
      <Own />
      <Tags label="T" items={topics} onRemove={(v) => v satisfies 'design' | 'code'} onChange={(v) => v satisfies Array<'design' | 'code'>} />
      {/* @ts-expect-error: no such selection */}
      <Tags label="T" items={topics} selection="many" />
      <Command label="C" mode="dialog" hotkey="mod+j" items={['A', { label: 'B', keywords: ['bee'], shortcut: '⌘B', onSelect: () => {} }]} onSelect={(v) => v satisfies string} />
      {/* @ts-expect-error: no such mode */}
      <Command label="C" mode="popover" items={['A']} />
    </>
  );
}

describe('tags and command types', () => {
  it('compiles (the checks run in typecheck)', () => {
    expect(typeof Checks).toBe('function');
  });
});
