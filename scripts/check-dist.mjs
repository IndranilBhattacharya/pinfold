#!/usr/bin/env node
/**
 * RSC boundary check on the built @pinfold/react: client modules and
 * their chunks start with 'use client'; the barrels (every `index`: they hold
 * defineConfig / defineAccordion, and atoms such as button are entirely their
 * barrel) must not, or Server Components could not call them.
 */
import { readFileSync, readdirSync } from 'node:fs';
import { join, sep } from 'node:path';

const dist = 'packages/react/dist';
const files = readdirSync(dist, { recursive: true })
  .map((f) => String(f).split(sep).join('/'))
  .filter((f) => /\.c?js$/.test(f));

let failed = false;
for (const file of files) {
  const client = /^['"]use client['"];/.test(readFileSync(join(dist, file), 'utf8'));
  const want = !/(^|\/)index\.c?js$/.test(file);
  if (client !== want) {
    failed = true;
    console.error(`  ${file}: expected ${want ? "a 'use client' directive" : "no 'use client' (server-safe barrel)"}`);
  }
}
if (failed) process.exit(1);
console.log(`  'use client' boundaries ok (${files.length} files)`);
