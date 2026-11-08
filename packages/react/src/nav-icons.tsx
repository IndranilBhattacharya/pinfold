import * as React from 'react';

const icon = (d: string, width = 2): React.ReactElement => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={width} strokeLinecap="round" strokeLinejoin="round" focusable="false" aria-hidden="true">
    <path d={d} />
  </svg>
);
/** Pointing to the inline end; CSS mirrors it in right-to-left text. */
export const CHEVRON_ICON = icon('m9 6 6 6-6 6');
export const CHEVRONS_ICON = icon('m7 6 6 6-6 6M13 6l6 6-6 6');
export const CHEVRON_DOWN_ICON = icon('m6 9 6 6 6-6');
export const CHECK_ICON = icon('M5 12.5 10 17.5 19 7', 2.5);
export const MORE_ICON = icon('M5 12h.01M12 12h.01M19 12h.01', 3);
export const CLOSE_ICON = icon('M7 7l10 10M17 7 7 17');
export const PLUS_ICON = icon('M12 5v14M5 12h14');
export const ALERT_ICON = icon('M12 7v6M12 17h.01', 2.75);
export const ARROW_ICON = icon('M5 12h14m-5-5 5 5-5 5');
