#!/usr/bin/env node
/**
 * Accessibility evidence for every built component, from the *built*
 * packages in a real browser (Chromium via Playwright). Run `npm run build` first.
 *
 *   node scripts/a11y-report.mjs            writes a11y-report/ (report.md, report.json, PNGs)
 *
 * - axe-core (WCAG 2.0/2.1/2.2 A and AA, best practices) in light and dark mode, across variants,
 *   disabled rows, RTL, unstyled and a style pack
 * - the keyboard map from the meta, pressed for real
 * - Tab skips the content of closed panels
 * - reduced motion: transitions collapse; forced colours: the focus outline stays visible
 * - snapshots of each mode
 *
 * Exits 1 on any axe violation or failed check. CI uploads the folder per run.
 */
import { mkdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import { join, resolve } from 'node:path';
import { pathToFileURL } from 'node:url';
import { build } from 'esbuild';
import { chromium } from 'playwright';

const root = resolve(import.meta.dirname, '..');
const outDir = join(root, 'a11y-report');
const require = createRequire(import.meta.url);
const { accordionMeta, buttonMeta, spinnerMeta, separatorMeta, kbdMeta, skeletonMeta, badgeMeta, alertMeta, avatarMeta, cardMeta, progressMeta, tooltipMeta, popoverMeta, dialogMeta, menuMeta, toastMeta } = await import(pathToFileURL(join(root, 'packages/core/dist/meta.js')).href);

rmSync(outDir, { recursive: true, force: true });
mkdirSync(outDir);

// One page, many accordions: every configuration axe should see.
const app = await build({
  stdin: {
    resolveDir: root,
    contents: `
      import * as React from 'react';
      import { createRoot } from 'react-dom/client';
      import { PinfoldProvider } from '@pinfold/react';
      import { useAccordion } from '@pinfold/react/accordion';
      import { createToastStore } from '@pinfold/core';
      import { Button } from '@pinfold/react/button';
      import { Spinner } from '@pinfold/react/spinner';
      import { Separator } from '@pinfold/react/separator';
      import { Kbd } from '@pinfold/react/kbd';
      import { Skeleton } from '@pinfold/react/skeleton';
      import { Badge } from '@pinfold/react/badge';
      import { Alert } from '@pinfold/react/alert';
      import { Avatar } from '@pinfold/react/avatar';
      import { Card } from '@pinfold/react/card';
      import { Progress } from '@pinfold/react/progress';
      import { Tooltip } from '@pinfold/react/tooltip';
      import { Popover } from '@pinfold/react/popover';
      import { Dialog } from '@pinfold/react/dialog';
      import { Menu } from '@pinfold/react/menu';
      import { Toast } from '@pinfold/react/toast';
      // Overlays sit in the page flow here, not the top layer, so axe can measure their contrast.
      delete HTMLElement.prototype.showPopover;
      const toastStores = {};
      function toastStore(pack) {
        if (toastStores[pack]) return toastStores[pack];
        const store = createToastStore();
        for (const tone of ['neutral', 'success', 'warning', 'danger', 'info', 'primary']) store.show({ id: tone, title: 'Toast ' + tone, description: 'A description.', tone, duration: 0, action: { label: 'Undo ' + tone } });
        store.configure({ max: 6 });
        return (toastStores[pack] = store);
      }
      // Buttons: every variant x tone (contrast), plus disabled, loading, icon-only, link, sizes.
      function Buttons({ pack = 'default' }) {
        const first = pack === 'default';
        const e = React.createElement;
        const tones = ['primary', 'neutral', 'success', 'warning', 'danger', 'info'];
        const icon = e('svg', { viewBox: '0 0 16 16', width: 16, height: 16 }, e('path', { d: 'M3 8h10M8 3v10', stroke: 'currentColor' }));
        return e('section', { 'aria-label': 'buttons, ' + pack + ' pack' }, e('h2', null, 'Buttons (' + pack + ')'),
          ...['solid', 'soft', 'outline', 'ghost', 'link'].map((variant) =>
            e('p', { key: variant }, ...tones.map((tone) => e(Button, { key: tone, variant, tone, label: variant + ' ' + tone })))),
          e('p', null,
            e(Button, { label: 'Disabled', disabled: true, slotProps: { root: { id: first ? 'button-disabled' : undefined } } }),
            e(Button, { label: 'Focus probe', slotProps: { root: { id: first ? 'button-solid' : undefined } } }),
            e(Button, { label: 'Save', loading: true, loadingText: 'Saving' }),
            e(Button, { label: 'Add', icon, iconOnly: true }),
            e(Button, { label: 'Add more', icon, iconOnly: true, variant: 'ghost' }),
            e(Button, { label: 'Docs', href: '#top', target: '_blank' }),
            e(Button, { label: 'Small', size: 'sm' }),
            e(Button, { label: 'Large', size: 'lg', endIcon: icon }),
            ...['soft', 'outline'].map((variant) => e(Button, { key: variant, label: 'Saving ' + variant, variant, loading: true }))),
          e('p', null, ...['ring', 'arc', 'dots', 'bars', 'pulse', 'orbit'].map((variant) => e(Spinner, { key: variant, variant, label: 'Loading ' + variant })), e(Spinner, { tone: 'success', label: 'Uploading' }), e(Spinner, { label: '', tone: 'current' }), ' Loading text'),
          e(Separator, { label: 'or', spacing: 'md' }),
          e(Separator, { decorative: false, variant: 'dashed' }),
          e('p', null, 'Search ', ...['outline', 'solid', 'ghost'].map((variant) => e(Kbd, { key: variant, variant, keys: ['mod', 'shift', 'k'] })), ' ', e(Kbd, { keys: ['mod', 'k'], display: 'symbols' })),
          e(Skeleton, { lines: 3, label: 'Loading ' + pack }),
          e('div', { style: { display: 'flex', gap: 12 } }, e(Skeleton, { variant: 'circle' }), e(Skeleton, { variant: 'rect', animation: 'wave' })),
          ...['solid', 'soft', 'outline'].map((variant) => e('p', { key: 'badge-' + variant }, ...tones.map((tone) => e(Badge, { key: tone, variant, tone, label: variant + ' ' + tone })))),
          e('p', null, e(Badge, { count: 120, label: 'unread messages' }), e(Badge, { count: 0 }), e(Badge, { dot: true, tone: 'success', label: 'Online' }), e(Badge, { size: 'sm', label: 'Small' }), e(Badge, { size: 'lg', label: 'Large', icon })),
          e('p', null, e('span', { style: { position: 'relative', display: 'inline-flex' } }, e(Button, { label: 'Inbox', icon, iconOnly: true, variant: 'ghost' }), e(Badge, { count: 3, tone: 'danger', placement: 'top-end', label: 'unread' }))),
          ...['soft', 'outline', 'accent'].flatMap((variant) => tones.map((tone) => e(Alert, { key: variant + tone, variant, tone, title: variant + ' ' + tone + ' (' + pack + ')', description: 'Details for this message.', actions: [{ label: 'Retry' }, { label: 'Details' }], dismissible: true }))),
          e(Alert, { tone: 'danger', live: 'assertive', title: 'Live alert ' + pack }),
          e('p', null, e(Avatar, { name: 'Ada Lovelace', status: 'online' }), e(Avatar, { name: 'Grace Hopper', size: 'lg', shape: 'square', status: 'offline' }), e(Avatar, { name: 'Alan Turing', tone: 'danger', size: 'sm' }), e(Avatar, { items: ['Ada Lovelace', 'Grace Hopper', 'Alan Turing', 'Katherine Johnson', 'Edsger Dijkstra', 'Barbara Liskov'].map((name) => ({ name })), max: 3, label: 'Members ' + pack })),
          ...['outline', 'elevated', 'filled', 'ghost'].map((variant) => e(Card, { key: variant, variant, title: 'Card ' + variant + ' ' + pack, description: 'A short description.', content: 'Body text.', actions: [{ label: 'Open' }, { label: 'Share' }] })),
          e(Card, { title: 'Linked card ' + pack, description: 'Whole card is a link.', href: '#top', orientation: 'horizontal', image: { src: 'data:image/gif;base64,R0lGODlhAQABAAAAACw=', alt: '' } }),
          ...tones.map((tone) => e(Progress, { key: tone, tone, label: 'Upload ' + tone + ' ' + pack, value: 40, showValue: true })),
          e(Progress, { label: 'Loading ' + pack }), e(Progress, { shape: 'circle', label: 'Ring ' + pack, value: 70, showValue: true }), e(Progress, { kind: 'meter', label: 'Storage ' + pack, value: 16, max: 64 }),
          ...['inverse', 'surface'].map((variant) => e(Tooltip, { key: variant, variant, defaultOpen: true, content: 'Tooltip ' + variant, trigger: { label: 'Hint ' + variant + ' ' + pack, variant: 'outline' } })),
          e(Popover, { defaultOpen: true, arrow: true, title: 'Popover ' + pack, description: 'A description.', content: 'Body text.', actions: [{ label: 'Save' }, { label: 'Close' }], trigger: { label: 'Open popover ' + pack } }),
          e(Menu, { defaultOpen: true, label: 'Menu ' + pack, trigger: { label: 'Open menu ' + pack }, items: [{ label: 'Edit', shortcut: 'E' }, { label: 'Off', disabled: true }, { type: 'separator' }, { type: 'checkbox', label: 'Wrap', checked: true }, { type: 'group', label: 'Sort', items: [{ type: 'radio', label: 'Name', checked: true }] }, ...['danger', 'success', 'warning', 'info'].map((tone) => ({ label: 'Row ' + tone, tone }))] }),
          e(Dialog, { defaultOpen: true, modal: false, title: 'Dialog ' + pack, description: 'A description.', content: 'Body text.', actions: [{ label: 'Cancel' }, { label: 'Delete', tone: 'danger' }] }),
          e(Toast, { label: 'Notifications ' + pack, store: toastStore(pack) }),
        );
      }
      const items = [
        { id: 'a', title: 'Shipping', description: 'Rates and times', badge: 'New', content: React.createElement('p', null, 'Ships in 2 days. ', React.createElement('a', { href: '#a' }, 'Rates')) },
        { id: 'b', title: 'Returns', content: React.createElement('p', null, '30 days. ', React.createElement('a', { href: '#b', id: 'closed-link' }, 'Policy')) },
        { id: 'c', title: 'Warranty', content: 'Two years.', disabled: true },
      ];
      function Faq(props) {
        // Titles are unique per instance, as on a real page: each open panel is a named region.
        const own = items.map((item) => ({ ...item, title: item.title + ' (' + props.label + ')' }));
        const F = useAccordion({ items: own, defaultValue: ['a'], ...props });
        return React.createElement('section', { 'aria-label': props.label }, React.createElement('h2', null, props.label), React.createElement(F));
      }
      const cases = [
        { label: 'solid', id: 'main' },
        ...['outline', 'separated', 'filled', 'ghost'].map((variant) => ({ label: variant, variant })),
        { label: 'all disabled', disabled: true },
        { label: 'multiple, plus indicator at start', mode: 'multiple', indicator: 'plus', indicatorPosition: 'start' },
        { label: 'unstyled', unstyled: true },
        ...['primary', 'neutral', 'success', 'warning', 'danger', 'info'].map((tone) => ({ label: 'filled ' + tone, variant: 'filled', tone })),
      ];
      function App() {
        return React.createElement('main', null,
          React.createElement('h1', null, 'Pinfold accordion: accessibility fixture'),
          ...cases.map((c) => React.createElement(Faq, { key: c.label, ...c })),
          React.createElement(PinfoldProvider, { dir: 'rtl', stylePack: 'glass' }, React.createElement(Faq, { label: 'rtl glass', dir: 'rtl' })),
          React.createElement(Buttons),
          ...['glass', 'material', 'noise', 'brutalist'].map((pack) => React.createElement(PinfoldProvider, { key: pack, stylePack: pack }, React.createElement(Buttons, { pack }))),
        );
      }
      createRoot(document.getElementById('root')).render(React.createElement(App));
    `,
  },
  bundle: true,
  write: false,
  format: 'iife',
  define: { 'process.env.NODE_ENV': '"production"' },
  alias: {
    '@pinfold/core': './packages/core/dist/index.js',
    '@pinfold/react': './packages/react/dist/index.js',
    '@pinfold/react/accordion': './packages/react/dist/accordion/index.js',
    '@pinfold/react/button': './packages/react/dist/button/index.js',
    '@pinfold/react/spinner': './packages/react/dist/spinner/index.js',
    '@pinfold/react/separator': './packages/react/dist/separator/index.js',
    '@pinfold/react/kbd': './packages/react/dist/kbd/index.js',
    '@pinfold/react/skeleton': './packages/react/dist/skeleton/index.js',
    '@pinfold/react/badge': './packages/react/dist/badge/index.js',
    '@pinfold/react/alert': './packages/react/dist/alert/index.js',
    '@pinfold/react/avatar': './packages/react/dist/avatar/index.js',
    '@pinfold/react/card': './packages/react/dist/card/index.js',
    '@pinfold/react/progress': './packages/react/dist/progress/index.js',
    '@pinfold/react/tooltip': './packages/react/dist/tooltip/index.js',
    '@pinfold/react/popover': './packages/react/dist/popover/index.js',
    '@pinfold/react/dialog': './packages/react/dist/dialog/index.js',
    '@pinfold/react/menu': './packages/react/dist/menu/index.js',
    '@pinfold/react/toast': './packages/react/dist/toast/index.js',
  },
  logLevel: 'silent',
});

const css = ['all.css'].map((f) => readFileSync(join(root, 'packages/css/dist', f), 'utf8')).join('\n');
const html = `<!doctype html><html lang="en"><head><meta charset="utf-8"><title>Pinfold a11y fixture</title>
<style>${css}</style><style>.pinfold-tooltip,.pinfold-popover,.pinfold-menu,.pinfold-dialog,.pinfold-toast{position:static!important;inline-size:auto!important;max-inline-size:100%!important} body{margin:0;padding:24px;max-width:720px;font-family:system-ui;background:var(--pinfold-color-bg);color:var(--pinfold-color-text)} section{margin:24px 0}</style>
</head><body><div id="root"></div><script>${app.outputFiles[0].text}</script></body></html>`;

const browser = await chromium.launch();
const results = { axe: {}, checks: [], snapshots: [] };
const check = (name, pass, detail = '') => {
  results.checks.push({ name, pass, detail });
  console.log(`  ${pass ? 'pass' : 'FAIL'}  ${name}${detail ? ` (${detail})` : ''}`);
};

async function open(options = {}) {
  const page = await browser.newPage({ viewport: { width: 900, height: 900 }, ...options });
  await page.setContent(html, { waitUntil: 'load' });
  await page.waitForSelector('[data-pinfold="accordion"]');
  await page.waitForTimeout(400); // transitions settle; hidden="until-found" applied
  return page;
}

// 1. axe, light and dark.
const axeSource = readFileSync(require.resolve('axe-core/axe.min.js'), 'utf8');
for (const scheme of ['light', 'dark']) {
  const page = await open({ colorScheme: scheme });
  await page.addScriptTag({ content: axeSource });
  const res = await page.evaluate(() =>
    window.axe.run(document, { runOnly: { type: 'tag', values: ['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa', 'best-practice'] } }),
  );
  results.axe[scheme] = {
    passes: res.passes.length,
    violations: res.violations.map((v) => ({
      id: v.id,
      impact: v.impact,
      help: v.help,
      nodes: v.nodes.length,
      sample: v.nodes[0]?.target,
      why: v.nodes[0]?.failureSummary,
    })),
    incomplete: res.incomplete.map((v) => v.id),
  };
  check(`axe WCAG 2.2 AA + best practices, ${scheme} mode`, res.violations.length === 0, `${res.passes.length} rules pass, ${res.violations.length} violations`);
  await page.screenshot({ path: join(outDir, `${scheme}.png`), fullPage: true });
  results.snapshots.push(`${scheme}.png`);
  await page.close();
}

// Button: a disabled button stays in the tab order and swallows activation.
{
  const page = await open();
  await page.focus('#button-disabled');
  const focused = await page.evaluate(() => document.activeElement?.id);
  check('Button: disabled stays focusable (aria-disabled, no disabled attribute)', focused === 'button-disabled');
  // Keyboard focus (Tab), so :focus-visible applies; a variant shadow must never replace the ring.
  await page.focus('#button-disabled');
  await page.keyboard.press('Tab');
  await page.waitForTimeout(400); // let the box-shadow transition finish
  const ring = await page.evaluate(() => ({ id: document.activeElement?.id, shadow: getComputedStyle(document.activeElement).boxShadow }));
  check('Button: a focused solid button shows the focus ring', ring.id === 'button-solid' && /0px 0px 0px [1-9]/.test(ring.shadow), ring.shadow);
  await page.close();
}

// 2. Keyboard map, from the meta, on the first accordion.
{
  const page = await open();
  const triggers = page.locator('[aria-label="solid"] button[aria-controls]');
  const focused = (i) => triggers.nth(i).evaluate((el) => el === document.activeElement);
  const expanded = (i) => triggers.nth(i).getAttribute('aria-expanded');
  await triggers.nth(0).focus();
  await page.keyboard.press('ArrowDown');
  check('ArrowDown moves to the next header', await focused(1));
  await page.keyboard.press('ArrowUp');
  check('ArrowUp moves to the previous header', await focused(0));
  await page.keyboard.press('End');
  check('End moves to the last header', await focused(2));
  await page.keyboard.press('ArrowDown');
  check('ArrowDown wraps to the first header (loop)', await focused(0));
  await page.keyboard.press('Home');
  check('Home moves to the first header', await focused(0));
  await page.keyboard.press('ArrowDown');
  await page.keyboard.press('Enter');
  check('Enter toggles the focused row', (await expanded(1)) === 'true');
  await page.keyboard.press('Space');
  check('Space toggles the focused row', (await expanded(1)) === 'false');
  await page.keyboard.press('End');
  await page.keyboard.press('Enter');
  check('A disabled row stays focusable and does not open', (await focused(2)) && (await expanded(2)) === 'false');

  // Tab from the last header must skip the closed panels' links.
  await page.waitForTimeout(400);
  await triggers.nth(1).focus();
  await page.keyboard.press('Tab');
  const landed = await page.evaluate(() => document.activeElement?.id ?? document.activeElement?.textContent);
  check('Tab skips the content of a closed panel', landed !== 'closed-link', `focus landed on ${JSON.stringify(landed)}`);

  const hidden = await page.locator('[aria-label="solid"] [role=region][data-state=closed] > div').first().getAttribute('hidden');
  check('Closed panels carry hidden="until-found" (find-in-page)', hidden === 'until-found');

  const roles = await page.evaluate(() => {
    const t = document.querySelector('[aria-label="solid"] button[aria-controls]');
    const panel = document.getElementById(t.getAttribute('aria-controls'));
    return { heading: t.parentElement.tagName, labelled: panel.getAttribute('aria-labelledby') === t.id, role: panel.getAttribute('role') };
  });
  check('Trigger sits in a heading; panel is a region labelled by its trigger', roles.heading === 'H3' && roles.labelled && roles.role === 'region');
  await page.close();
}

// 3. Reduced motion.
{
  const page = await open({ reducedMotion: 'reduce' });
  const duration = await page.locator('[aria-label="solid"] [role=region]').first().evaluate((el) => getComputedStyle(el).transitionDuration);
  const ms = Math.max(...duration.split(',').map((d) => parseFloat(d) * (d.trim().endsWith('ms') ? 1 : 1000)));
  check('prefers-reduced-motion collapses transitions', ms <= 1, `transition-duration ${duration}`);
  await page.screenshot({ path: join(outDir, 'reduced-motion.png') });
  results.snapshots.push('reduced-motion.png');
  await page.close();
}

// 4. Forced colours.
{
  const page = await open({ forcedColors: 'active' });
  const trigger = page.locator('[aria-label="solid"] button[aria-controls]').nth(1);
  await trigger.focus();
  await page.keyboard.press('ArrowUp');
  await page.keyboard.press('ArrowDown');
  const outline = await trigger.evaluate((el) => {
    const s = getComputedStyle(el);
    return { style: s.outlineStyle, width: parseFloat(s.outlineWidth), color: s.outlineColor };
  });
  check('forced-colors: the focused trigger shows a solid outline', outline.style === 'solid' && outline.width >= 2, `${outline.style} ${outline.width}px ${outline.color}`);
  await page.screenshot({ path: join(outDir, 'forced-colors.png') });
  results.snapshots.push('forced-colors.png');
  await page.close();
}

await browser.close();

// Report.
const failed = results.checks.filter((c) => !c.pass);
const violations = Object.values(results.axe).flatMap((r) => r.violations);
const md = [
  '# Accessibility report: accordion, button, spinner, separator, kbd, skeleton, badge, alert, avatar, card, progress, tooltip, popover, dialog, menu, toast',
  '',
  `Generated ${new Date().toISOString()} by \`scripts/a11y-report.mjs\` on the built packages, in Chromium.`,
  `Pattern: ${accordionMeta.pattern}`,
  '',
  '## Automated checks',
  '',
  '| Check | Result |',
  '|---|---|',
  ...results.checks.map((c) => `| ${c.name}${c.detail ? ` (${c.detail})` : ''} | ${c.pass ? 'pass' : '**fail**'} |`),
  '',
  '## axe-core',
  '',
  ...Object.entries(results.axe).map(
    ([scheme, r]) =>
      `- ${scheme}: ${r.passes} rules pass, ${r.violations.length} violations${r.violations.length ? ': ' + r.violations.map((v) => `${v.id} (${v.nodes})`).join(', ') : ''}; needs review: ${r.incomplete.join(', ') || 'none'}`,
  ),
  '',
  '## APG checklist (from meta)',
  '',
  ...accordionMeta.aria.map((a) => `- ${a}`),
  '',
  '## Keyboard map (from meta, pressed above)',
  '',
  ...accordionMeta.keyboard.map((k) => `- **${k.keys}**: ${k.action}`),
  '',
  ...[buttonMeta, spinnerMeta, separatorMeta, kbdMeta, skeletonMeta, badgeMeta, alertMeta, avatarMeta, cardMeta, progressMeta, tooltipMeta, popoverMeta, dialogMeta, menuMeta, toastMeta].flatMap((m) => [`## ${m.displayName} (from meta)`, '', `Pattern: ${m.pattern}`, '', ...m.aria.map((a) => `- ${a}`), '']),
  '## Snapshots',
  '',
  ...results.snapshots.map((s) => `- ![${s}](${s})`),
  '',
  'Screen readers are tested by hand: see docs/a11y/screen-readers.md.',
  '',
].join('\n');
writeFileSync(join(outDir, 'report.md'), md);
writeFileSync(join(outDir, 'report.json'), JSON.stringify(results, null, 2));
console.log(`\n  report: ${join('a11y-report', 'report.md')}`);
if (failed.length || violations.length) process.exit(1);
