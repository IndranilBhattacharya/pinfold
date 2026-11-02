/**
 * The button's client module. The build prefixes it with 'use client', so a Server Component
 * that imports `@pinfold/react/button` gets client references, while `defineButton` (in the
 * barrel) runs on the server.
 */
export { Button } from './Button';
export { useButton } from './useButton';
export type { ButtonApi, ButtonConfig } from './types';
