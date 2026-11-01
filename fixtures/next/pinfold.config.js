import { defineConfig } from '@pinfold/react';

// Called from a Server Component (the root layout): proves the root barrel is server-safe.
export default defineConfig({
  radius: 'lg',
  defaults: { accordion: { variant: 'separated' } },
});
