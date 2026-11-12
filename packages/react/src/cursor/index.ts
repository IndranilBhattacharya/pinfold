/* Styles ship separately: import '@pinfold/css/core.css'; import '@pinfold/css/cursor.css'.
   Server-safe barrel: `defineCursor` here, the client module re-exported. */

export { Cursor, useCursor } from './client';
export { Cursor as default } from './client';
export { defineCursor, type DefinedCursor, type CursorPresetProps } from './define';
export type { CursorApi, CursorComponent, CursorConfig, CursorRootProps, CursorTagProps, CursorSlot, CursorState, CursorVariant, CursorPointerState } from './types';
