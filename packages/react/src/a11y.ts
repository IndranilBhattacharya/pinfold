import type * as React from 'react';

/** Visually hidden but read. Inline, so it holds in unstyled mode too. */
export const VISUALLY_HIDDEN: React.CSSProperties = { position: 'absolute', width: 1, height: 1, padding: 0, margin: -1, overflow: 'hidden', clip: 'rect(0 0 0 0)', whiteSpace: 'nowrap', border: 0 };
