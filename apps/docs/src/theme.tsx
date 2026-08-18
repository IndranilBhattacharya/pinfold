import * as React from 'react';
import { KnotProvider as CoreProvider, type KnotProviderProps } from '@knotui/core';

/** Docs wrapper: themes the whole document so the page chrome follows too. */
export function KnotProvider(props: KnotProviderProps) {
  return <CoreProvider applyToDocument {...props} />;
}

// Same ramp the CLI writes into knot-theme.css — the hue slider here is a live
// preview of `npx knotui theme --hue N`.
const RAMP: Array<[number, number, number]> = [
  [50, 0.977, 0.014],
  [100, 0.946, 0.033],
  [200, 0.902, 0.063],
  [300, 0.828, 0.111],
  [400, 0.714, 0.163],
  [500, 0.606, 0.201],
  [600, 0.541, 0.223],
  [700, 0.491, 0.216],
  [800, 0.432, 0.181],
  [900, 0.38, 0.146],
  [950, 0.283, 0.101],
];

export function useAccordionRamp(hue: number, theme: string, radius: string) {
  React.useLayoutEffect(() => {
    const root = document.documentElement;
    for (const [step, l, c] of RAMP) root.style.setProperty(`--knot-primary-${step}`, `oklch(${l} ${c} ${hue})`);
    root.setAttribute('data-knot-theme', theme);
    root.setAttribute('data-knot-radius', radius);
  }, [hue, theme, radius]);
}
