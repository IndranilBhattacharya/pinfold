import * as React from 'react';
import { describe, expect, it } from 'vitest';
import { defineCursor } from './define';
import { useCursor } from './useCursor';
import { Cursor } from './Cursor';
import type { CursorBuiltInState } from './types';

export function Checks(): React.ReactElement {
  const Pointer = defineCursor({
    attribute: 'data-cursor',
    states: {
      zoom: { scale: 2 },
      drag: { label: 'Hold' },
    },
    onStateChange: (state) => {
      // state is typed as 'zoom' | 'drag' | CursorBuiltInState
      const _s: 'zoom' | 'drag' | CursorBuiltInState = state;
    },
  });

  const a1 = Pointer.attrs('zoom');
  const a2 = Pointer.attrs('drag');
  const a3 = Pointer.attrs('pointer');
  // @ts-expect-error invalid state name
  const a4 = Pointer.attrs('invalid');

  const Plain = defineCursor();
  const b1 = Plain.attrs('default');
  // @ts-expect-error no custom states defined on Plain
  const b2 = Plain.attrs('zoom');

  const Own = useCursor({
    states: {
      inspect: { variant: 'crosshair' },
    },
    onStateChange: (state) => {
      const _s: 'inspect' | CursorBuiltInState = state;
    },
  });

  return (
    <>
      <Pointer />
      <Plain />
      <Own />
      <div {...a1} />
      <div {...b1} />
      {/* @ts-expect-error invalid variant */}
      <Cursor variant="unknown" />
    </>
  );
}

describe('cursor types', () => {
  it('compiles (the checks run in typecheck)', () => {
    expect(typeof Checks).toBe('function');
  });
});
