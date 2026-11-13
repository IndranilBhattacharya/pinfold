import * as React from 'react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { act, fireEvent, render, screen } from '@testing-library/react';
import { describePinfoldConformance } from '@pinfold/testing';
import { fileuploadMeta } from '@pinfold/core/meta';
import { FileUpload } from './FileUpload';
import { useFileUpload } from './useFileUpload';
import { defineFileUpload } from './define';

const file = (name: string, size = 1200, type = 'image/png') => new File([new Uint8Array(size)], name, { type });
const pick = (container: HTMLElement, files: File[]) => fireEvent.change(container.querySelector('input[type="file"]')!, { target: { files } });
const dropOn = (el: Element, files: File[]) => fireEvent.drop(el, { dataTransfer: { files, types: ['Files'], items: files.map((f) => ({ kind: 'file', type: f.type })) } });

let created: string[] = [];
let revoked: string[] = [];
beforeEach(() => {
  created = [];
  revoked = [];
  URL.createObjectURL = vi.fn(() => {
    const url = `blob:${created.length}`;
    created.push(url);
    return url;
  });
  URL.revokeObjectURL = vi.fn((url: string) => void revoked.push(url));
});
afterEach(() => {
  delete (URL as unknown as Record<string, unknown>).createObjectURL;
  delete (URL as unknown as Record<string, unknown>).revokeObjectURL;
});

describe('FileUpload', () => {
  it('the zone is a button that opens the file dialog, described by a hint from the rules; the input is hidden and named', () => {
    const { container } = render(<FileUpload accept=".png,.pdf" maxSize={5_000_000} maxFiles={3} name="docs" />);
    const zone = screen.getByRole('button', { name: /Drop files here or browse/ });
    expect(document.getElementById(zone.getAttribute('aria-describedby')!)!.textContent).toBe('PNG or PDF · up to 5 MB · 3 files at most');
    const input = container.querySelector('input[type="file"]') as HTMLInputElement;
    expect(input.name).toBe('docs');
    expect(input.accept).toBe('.png,.pdf');
    expect(input.multiple).toBe(true);
    expect(input.getAttribute('aria-hidden')).toBe('true');
    expect(input.tabIndex).toBe(-1);
    const click = vi.spyOn(input, 'click');
    fireEvent.click(zone);
    expect(click).toHaveBeenCalled();
  });

  it('keeps files that pass, lists the rest with reasons, and calls onChange and onReject', () => {
    const onChange = vi.fn();
    const onReject = vi.fn();
    const { container } = render(<FileUpload accept="image/*" maxSize={2000} maxFiles={2} validate={(f) => (f.name.startsWith('x') ? 'No x files' : null)} onChange={onChange} onReject={onReject} />);
    pick(container, [file('a.png'), file('big.png', 5000), file('doc.pdf', 10, 'application/pdf'), file('x.png'), file('b.png'), file('c.png')]);
    expect(onChange).toHaveBeenLastCalledWith([expect.objectContaining({ name: 'a.png' }), expect.objectContaining({ name: 'b.png' })]);
    expect(onReject.mock.lastCall![0].map((r: { file: File; codes: string[] }) => [r.file.name, r.codes])).toEqual([
      ['big.png', ['size']],
      ['doc.pdf', ['type']],
      ['x.png', ['invalid']],
      ['c.png', ['count']],
    ]);
    const status = screen.getByRole('status');
    expect(status.textContent).toContain('big.png Larger than 2 KB');
    expect(status.textContent).toContain('x.png No x files');
    fireEvent.click(screen.getByRole('button', { name: 'Dismiss' }));
    expect(screen.queryByRole('status')).toBeNull();
    expect(screen.getAllByRole('listitem').map((li) => li.querySelector('.pinfold-fileupload__name')!.textContent)).toEqual(['a.png', 'b.png']);
  });

  it('drag and drop: shows the drag state, flags types that break accept, adds dropped files', () => {
    const onChange = vi.fn();
    const { container } = render(<FileUpload accept="image/*" onChange={onChange} />);
    const zone = screen.getByRole('button', { name: /Drop files/ });
    const root = container.querySelector('.pinfold-fileupload')!;
    fireEvent.dragEnter(zone, { dataTransfer: { types: ['Files'], items: [{ kind: 'file', type: 'application/pdf' }] } });
    expect(root.hasAttribute('data-dragging')).toBe(true);
    expect(root.hasAttribute('data-invalid')).toBe(true);
    expect(zone.textContent).toContain('Drop to add');
    fireEvent.dragLeave(zone, { dataTransfer: { types: ['Files'] } });
    expect(root.hasAttribute('data-dragging')).toBe(false);
    fireEvent.dragEnter(zone, { dataTransfer: { types: ['Files'], items: [{ kind: 'file', type: 'image/png' }] } });
    expect(root.hasAttribute('data-invalid')).toBe(false);
    dropOn(zone, [file('drop.png')]);
    expect(root.hasAttribute('data-dragging')).toBe(false);
    expect(onChange).toHaveBeenLastCalledWith([expect.objectContaining({ name: 'drop.png' })]);
  });

  it('makes image previews and releases them on remove and unmount', () => {
    const { container, unmount } = render(<FileUpload />);
    pick(container, [file('a.png'), file('b.png'), file('c.txt', 10, 'text/plain')]);
    expect(created).toEqual(['blob:0', 'blob:1']);
    expect(container.querySelectorAll('.pinfold-fileupload__thumb img')).toHaveLength(2);
    fireEvent.click(screen.getByRole('button', { name: 'Remove a.png' }));
    expect(revoked).toEqual(['blob:0']);
    unmount();
    expect(revoked).toEqual(['blob:0', 'blob:1']);
  });

  it('uploads with progress, aborts on remove, retries on error, and reports completion', async () => {
    const calls: Array<{ file: File; signal: AbortSignal; progress: (n: number) => void; resolve: (v: unknown) => void; reject: (e: unknown) => void }> = [];
    const upload = vi.fn((f: File, o: { signal: AbortSignal; onProgress: (n: number) => void }) => new Promise((resolve, reject) => calls.push({ file: f, signal: o.signal, progress: o.onProgress, resolve, reject })));
    const onUploadComplete = vi.fn();
    const onUploadError = vi.fn();
    const { container } = render(<FileUpload upload={upload} concurrency={1} onUploadComplete={onUploadComplete} onUploadError={onUploadError} />);
    pick(container, [file('a.png'), file('b.png')]);
    expect(upload).toHaveBeenCalledTimes(1);
    const [a, b] = screen.getAllByRole('listitem');
    expect(a.getAttribute('data-status')).toBe('uploading');
    expect(b.getAttribute('data-status')).toBe('queued');
    act(() => calls[0].progress(0.4));
    expect(screen.getByRole('progressbar', { name: 'a.png' }).getAttribute('aria-valuenow')).toBe('40');
    await act(async () => calls[0].reject(new Error('Network down')));
    expect(onUploadError).toHaveBeenCalledWith(expect.objectContaining({ name: 'a.png' }), expect.any(Error));
    expect(screen.getAllByRole('listitem')[0].getAttribute('data-status')).toBe('error');
    expect(screen.getAllByRole('listitem')[0].textContent).toContain('Network down');
    // The queue moved on to b.
    expect(calls[1].file.name).toBe('b.png');
    fireEvent.click(screen.getByRole('button', { name: 'Remove b.png' }));
    expect(calls[1].signal.aborted).toBe(true);
    fireEvent.click(screen.getByRole('button', { name: 'Retry a.png' }));
    expect(calls[2].file.name).toBe('a.png');
    await act(async () => calls[2].resolve({ url: '/a' }));
    expect(onUploadComplete).toHaveBeenCalledWith(expect.objectContaining({ name: 'a.png' }), { url: '/a' });
    expect(screen.getAllByRole('listitem')[0].getAttribute('data-status')).toBe('done');
  });

  it('aborts running uploads on unmount', () => {
    let signal: AbortSignal | undefined;
    const { container, unmount } = render(<FileUpload upload={(_, o) => ((signal = o.signal), new Promise(() => {}))} />);
    pick(container, [file('a.png')]);
    unmount();
    expect(signal!.aborted).toBe(true);
  });

  it('single file: a new pick replaces it; paste adds files when on; controlled value wins', () => {
    const onChange = vi.fn();
    const { container, rerender } = render(<FileUpload multiple={false} paste onChange={onChange} />);
    pick(container, [file('a.png')]);
    pick(container, [file('b.png')]);
    expect(onChange).toHaveBeenLastCalledWith([expect.objectContaining({ name: 'b.png' })]);
    fireEvent.paste(container.querySelector('.pinfold-fileupload')!, { clipboardData: { files: [file('pasted.png')] } });
    expect(onChange).toHaveBeenLastCalledWith([expect.objectContaining({ name: 'pasted.png' })]);
    const held = [file('held.png')];
    rerender(<FileUpload value={held} onChange={onChange} />);
    pick(container, [file('c.png')]);
    expect(onChange).toHaveBeenLastCalledWith([held[0], expect.objectContaining({ name: 'c.png' })]);
    expect(screen.getAllByRole('listitem')).toHaveLength(1);
  });

  it('disabled adds nothing but stays focusable; renderItem and the controller', () => {
    let api: ReturnType<typeof useFileUpload> | undefined;
    function App({ disabled }: { disabled?: boolean }) {
      api = useFileUpload({ disabled, renderItem: ({ item, children }) => <>{children}<em>{item.status}</em></> });
      const Up = api;
      return <Up />;
    }
    const { rerender } = render(<App disabled />);
    const zone = screen.getByRole('button', { name: /Drop files/ });
    expect(zone.getAttribute('aria-disabled')).toBe('true');
    act(() => api!.add([file('a.png')]));
    expect(api!.files).toEqual([]);
    rerender(<App />);
    act(() => api!.add([file('a.png')]));
    expect(api!.files.map((f) => f.name)).toEqual(['a.png']);
    expect(screen.getByRole('listitem').querySelector('em')!.textContent).toBe('idle');
    act(() => api!.clear());
    expect(api!.files).toEqual([]);
  });

  it('button and compact variants keep the hint beside the control', () => {
    render(<FileUpload variant="button" accept=".pdf" multiple={false} />);
    const button = screen.getByRole('button', { name: 'Choose a file' });
    expect(document.getElementById(button.getAttribute('aria-describedby')!)!.textContent).toBe('PDF');
  });
});

describePinfoldConformance({
  name: 'fileupload',
  slots: ['root', 'zone', 'icon', 'title', 'browse', 'description', 'input'],
  optionalSlots: ['list', 'item', 'thumb', 'info', 'name', 'meta', 'progress', 'actions', 'retry', 'remove', 'rejections', 'rejection'],
  dimension: { key: 'minHeight', value: 200 },
  cssFile: 'packages/css/src/fileupload.css',
  meta: fileuploadMeta,
  preset: { define: defineFileUpload as any, props: { name: 'files' } },
  hook: { use: useFileUpload as any, config: {} },
  render: (config) => <FileUpload accept="image/*" maxSize={1_000_000} {...config} />,
});
