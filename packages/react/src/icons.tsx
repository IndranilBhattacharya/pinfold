import * as React from 'react';

/** Tone icons: 24-unit strokes in currentColor, so they follow the tone and forced colours. */
const PATHS: Record<string, string> = {
  success: 'M8 12.5l2.5 2.5L16 9.5',
  warning: 'M12 9v4M12 16.5h.01',
  danger: 'M12 8v5M12 16h.01',
};
const INFO = 'M12 16v-5M12 8h.01';

export function ToneIcon({ tone }: { tone: string }): React.ReactElement {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" focusable="false">
      {tone === 'warning' ? <path d="M10.3 3.9 2.4 17.6A2 2 0 0 0 4.1 20.6h15.8a2 2 0 0 0 1.7-3L13.7 3.9a2 2 0 0 0-3.4 0z" /> : <circle cx="12" cy="12" r="9" />}
      <path d={PATHS[tone] ?? INFO} />
    </svg>
  );
}

export const CLOSE_ICON = (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" focusable="false">
    <path d="M6 6l12 12M18 6 6 18" />
  </svg>
);
