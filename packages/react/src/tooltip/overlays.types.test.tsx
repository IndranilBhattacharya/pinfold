/**
 * Compile-time contract of Tooltip, Popover, Dialog, Menu and Toast. `npm run typecheck` fails if
 * an `@ts-expect-error` line stops being an error. The runtime part renders the valid cases.
 */
import * as React from 'react';
import { describe, expect, it } from 'vitest';
import { render } from '@testing-library/react';
import { defineConfig } from '../config';
import { defineTooltip } from './define';
import { useTooltip } from './useTooltip';
import { definePopover } from '../popover/define';
import { usePopover } from '../popover/usePopover';
import { defineDialog } from '../dialog/define';
import { useDialog } from '../dialog/useDialog';
import { defineMenu } from '../menu/define';
import { useMenu } from '../menu/useMenu';
import { defineToast } from '../toast/define';
import { useToast } from '../toast/useToast';

const Hint = defineTooltip({ placement: 'bottom' });
const Details = definePopover({ placement: 'bottom-start', openOn: 'hover' });
const Confirm = defineDialog({ role: 'alertdialog', size: 'sm' });
const Actions = defineMenu({ placement: 'bottom-end' });
const Toasts = defineToast({ placement: 'top' });

function Valid() {
  const Tip = useTooltip({ content: 'Hint', trigger: <a href="/x">x</a>, variant: 'surface', dimensions: { maxWidth: 200 } });
  const Share = usePopover({ title: 'Share', trigger: { label: 'Share', variant: 'outline' }, actions: [{ label: 'Done', onClick: () => false }] });
  const Sheet = useDialog({ title: 'Panel', placement: 'end', dimensions: { width: 400 } });
  const Row = useMenu({ items: [{ label: 'Edit', onSelect: () => {} }, { type: 'separator' }, { type: 'checkbox', label: 'Wrap', checked: true }, { type: 'group', label: 'Sort', items: [{ type: 'radio', label: 'Name' }] }, { label: 'Docs', href: '/docs', tone: 'danger' }] });
  const Local = useToast({ duration: 1000 });
  void Local.show;
  return (
    <>
      <Tip />
      <Share />
      <Sheet />
      <Row />
      <Local />
      <Hint content="Hint" trigger={{ label: 'A' }} className="x" />
      <Details title="Ada" trigger={{ label: 'B' }} />
      <Confirm title="Delete?" actions={[{ label: 'Cancel' }, { label: 'Delete', tone: 'danger' }]} />
      <Actions items={[{ label: 'Edit' }]} trigger={{ label: 'C' }} />
      <Toasts />
    </>
  );
}

defineConfig({ defaults: { tooltip: { delay: 200 }, popover: { arrow: true }, dialog: { size: 'lg' }, menu: { size: 'sm' }, toast: { max: 3 } } });

function Invalid() {
  // @ts-expect-error a tooltip needs content
  useTooltip({ trigger: { label: 'A' } });
  // @ts-expect-error a button trigger needs a label
  useTooltip({ content: 'x', trigger: { variant: 'solid' } });
  // @ts-expect-error not a placement
  usePopover({ placement: 'left' });
  // @ts-expect-error not a dialog role
  useDialog({ role: 'menu' });
  // @ts-expect-error a menu needs items
  useMenu({});
  // @ts-expect-error a row needs a label
  useMenu({ items: [{ onSelect: () => {} }] });
  // @ts-expect-error only checkbox and radio rows have `checked`
  useMenu({ items: [{ label: 'Edit', checked: true }] });
  // @ts-expect-error a group needs items
  useMenu({ items: [{ type: 'group', label: 'Sort' }] });
  // @ts-expect-error not a toast tone
  Toasts.show({ title: 'x', tone: 'loud' });
  // @ts-expect-error instance data does not belong in app-wide defaults
  defineConfig({ defaults: { menu: { items: [] } } });
  // @ts-expect-error instance data does not belong in app-wide defaults
  defineConfig({ defaults: { dialog: { title: 'x' } } });
  return null;
}

describe('Overlay types', () => {
  it('renders the valid cases', () => {
    const { container } = render(<Valid />);
    expect(container.querySelectorAll('dialog').length).toBe(2);
    expect(typeof Invalid).toBe('function');
  });
});
