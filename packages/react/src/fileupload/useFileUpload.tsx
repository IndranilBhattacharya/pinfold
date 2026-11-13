import * as React from 'react';
import { acceptsFile, cn, dataAttr, dimensionVars, fileRulesHint, formatBytes, inactiveFileUploadOptions, mergeProps, radiusProps, sortFiles, warnOnce, type PropsBag } from '@pinfold/core';
import { usePinfold } from '../provider';
import { usePinfoldComponent } from '../component';
import { useControllableState, useEvent, useId } from '../hooks';
import { mergeConfig } from '../preset';
import { ITEM, renderSlot, slotProps } from '../slots';
import { VISUALLY_HIDDEN } from '../a11y';
import type { FileUploadApi, FileUploadComponent, FileUploadConfig, FileUploadItemContext, FileUploadRejection, FileUploadRootProps, FileUploadSlot, FileUploadState, FileUploadStatus } from './types';

/** What the component knows about one held file. Kept per instance, keyed by the File itself. */
interface Entry {
  id: string;
  status: FileUploadStatus;
  progress: number;
  error: unknown;
  response: unknown;
  controller: AbortController | null;
  preview: string | null;
  /** The browser could not draw it: no preview again. */
  broken?: boolean;
}

const svg = (d: React.ReactNode, width = 1.75) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={width} strokeLinecap="round" strokeLinejoin="round" focusable="false" aria-hidden="true">
    {d}
  </svg>
);
const UPLOAD = svg(
  <>
    <path d="M7 16.5a4.5 4.5 0 0 1-.6-8.96A6 6 0 0 1 18 8.4a4 4 0 0 1-.5 8.1" />
    <path d="m9 13 3-3 3 3M12 10v9.5" />
  </>,
);
const FILE = svg(
  <>
    <path d="M6 2.75h8.25L19 7.5v13.75H6z" />
    <path d="M14 2.75V7.5h5" />
  </>,
  1.5,
);
const CLOSE = svg(<path d="M6.5 6.5l11 11m0-11-11 11" />, 2);
const RETRY = svg(<path d="M4.5 12a7.5 7.5 0 1 0 2.2-5.3M4.5 4.5v3.75h3.75" />, 2);
const DONE = svg(<path d="m6 12.5 4 4 8-9" />, 2.25);
const ALERT = svg(<path d="M12 8v5m0 3.25v.01M12 3.5 21.5 20h-19z" />, 2);

const supportsUrls = () => typeof URL !== 'undefined' && typeof URL.createObjectURL === 'function';

/**
 * Picking and dropping files, as a hook that hands back a component. The zone is a button that opens the
 * file dialog; drag and drop and paste are extras. Files are checked against the rules (rejections listed
 * with reasons), shown with image previews, and, given an `upload` function, uploaded with progress, abort
 * and retry.
 *
 *   const Photos = useFileUpload({ accept: 'image/*', upload });
 *   return <Photos />;   // Photos.files, Photos.open(), Photos.clear()
 *
 * Precedence: this config, then `defaults.fileupload`, then the provider (size, tone), then the library default.
 */
export function useFileUpload(input: FileUploadConfig = {}): FileUploadComponent {
  const ctx = usePinfold();
  const config = ctx.defaults.fileupload ? mergeConfig<FileUploadConfig>(ctx.defaults.fileupload, input) : input;
  const base = useId();

  if (process.env.NODE_ENV !== 'production') {
    void import('@pinfold/core/meta').then(({ fileuploadMeta, validateConfig }) => {
      for (const problem of validateConfig(fileuploadMeta, input)) warnOnce(true, problem.message);
      const inactive = inactiveFileUploadOptions(config);
      for (const key in inactive) warnOnce((input as unknown as Record<string, unknown>)[key] !== undefined, `FileUpload: \`${key}\` has no visible effect here. ${inactive[key]}`);
    });
  }

  const labels = config.labels ?? {};
  const variant = config.variant ?? 'dropzone';
  const multiple = config.multiple !== false;
  const disabled = !!config.disabled;
  const previews = config.previews !== false;
  const [files, setFilesState] = useControllableState<readonly File[]>({ value: config.value, defaultValue: config.defaultValue ?? [] });
  const [rejections, setRejections] = React.useState<FileUploadRejection[]>([]);
  const [dragging, setDragging] = React.useState<false | 'ok' | 'invalid'>(false);
  const [announcement, setAnnouncement] = React.useState('');
  const [, bump] = React.useReducer((n: number) => n + 1, 0);
  const entries = React.useRef(new Map<File, Entry>());
  const serial = React.useRef(0);
  const depth = React.useRef(0);
  const inputRef = React.useRef<HTMLInputElement | null>(null);
  const filesRef = React.useRef(files);
  filesRef.current = files;

  const entryOf = (file: File): Entry => {
    let entry = entries.current.get(file);
    if (!entry) {
      entry = { id: `${base}-f${++serial.current}`, status: config.upload ? 'queued' : 'idle', progress: 0, error: undefined, response: undefined, controller: null, preview: null };
      entries.current.set(file, entry);
    }
    return entry;
  };
  const drop = (file: File) => {
    const entry = entries.current.get(file);
    if (!entry) return;
    entry.controller?.abort();
    if (entry.preview && supportsUrls()) URL.revokeObjectURL(entry.preview);
    entries.current.delete(file);
  };

  const setFiles = useEvent((next: readonly File[]) => {
    setFilesState(next);
    config.onChange?.([...next]);
  });

  const add = useEvent((picked: readonly File[]) => {
    if (disabled || !picked.length) return;
    const { accepted, rejected } = sortFiles(
      picked,
      { accept: config.accept, maxSize: config.maxSize, maxFiles: config.maxFiles, multiple, current: filesRef.current.length, validate: config.validate, messages: { type: labels.type, size: labels.size, count: labels.count } },
    );
    setRejections(rejected);
    if (rejected.length) config.onReject?.(rejected);
    if (accepted.length) {
      const next = multiple ? [...filesRef.current, ...accepted] : accepted.slice(0, 1);
      setFiles(next);
      setAnnouncement(`${accepted.map((f) => f.name).join(', ')} added`);
    } else if (rejected.length) setAnnouncement(`${rejected.length} ${rejected.length === 1 ? 'file' : 'files'} not added`);
  });
  const remove = useEvent((file: File) => {
    drop(file);
    setFiles(filesRef.current.filter((f) => f !== file));
    bump();
  });
  const retry = useEvent((file: File) => {
    const entry = entries.current.get(file);
    if (!entry || !config.upload || entry.status !== 'error') return;
    entry.status = 'queued';
    entry.error = undefined;
    entry.progress = 0;
    bump();
  });

  // Files that left (removed, or a controlled value without them): stop their upload, release their preview.
  React.useEffect(() => {
    const held = new Set(files);
    let changed = false;
    for (const file of [...entries.current.keys()]) {
      if (!held.has(file)) {
        drop(file);
        changed = true;
      }
    }
    // Previews: object URLs of images only. This is the one place a file's contents are touched.
    if (previews && supportsUrls()) {
      for (const file of files) {
        const entry = entryOf(file);
        if (!entry.preview && !entry.broken && file.type.startsWith('image/')) {
          entry.preview = URL.createObjectURL(file);
          changed = true;
        }
      }
    }
    if (changed) bump();
  });

  // Run the queue.
  const start = useEvent((file: File, entry: Entry) => {
    const upload = config.upload;
    if (!upload) return;
    const controller = new AbortController();
    entry.controller = controller;
    entry.status = 'uploading';
    entry.progress = 0;
    let pending: Promise<unknown>;
    try {
      pending = Promise.resolve(
        upload(file, {
          signal: controller.signal,
          onProgress: (fraction) => {
            if (controller.signal.aborted) return;
            entry.progress = Math.max(0, Math.min(1, fraction > 1 ? fraction / 100 : fraction));
            bump();
          },
        }),
      );
    } catch (error) {
      pending = Promise.reject(error);
    }
    pending.then(
      (response) => {
        if (controller.signal.aborted) return;
        entry.controller = null;
        entry.status = 'done';
        entry.progress = 1;
        entry.response = response;
        setAnnouncement(`${file.name} ${labels.done ?? 'uploaded'}`);
        bump();
        config.onUploadComplete?.(file, response);
      },
      (error: unknown) => {
        if (controller.signal.aborted) return;
        entry.controller = null;
        entry.status = 'error';
        entry.error = error;
        setAnnouncement(`${file.name}: ${labels.error ?? 'upload failed'}`);
        bump();
        config.onUploadError?.(file, error);
      },
    );
  });
  React.useEffect(() => {
    if (!config.upload) return;
    const limit = Math.max(1, config.concurrency ?? 3);
    let running = files.filter((f) => entries.current.get(f)?.status === 'uploading').length;
    let started = false;
    for (const file of files) {
      if (running >= limit) break;
      const entry = entryOf(file);
      if (entry.status === 'idle') entry.status = 'queued';
      if (entry.status !== 'queued') continue;
      start(file, entry);
      running++;
      started = true;
    }
    if (started) bump();
  });
  // Unmount: every upload stops and every preview is released.
  React.useEffect(() => {
    const map = entries.current;
    return () => {
      for (const entry of map.values()) {
        entry.controller?.abort();
        if (entry.preview && supportsUrls()) URL.revokeObjectURL(entry.preview);
      }
      map.clear();
    };
  }, []);

  // The hidden input carries the held files for a native form.
  React.useEffect(() => {
    const el = inputRef.current;
    if (!el || typeof DataTransfer !== 'function') return;
    try {
      const transfer = new DataTransfer();
      for (const file of files) transfer.items.add(file);
      el.files = transfer.files;
    } catch {
      // A browser that cannot set files: the form gets none, the component still works.
    }
  }, [files]);

  const open = useEvent(() => {
    if (!disabled) inputRef.current?.click();
  });
  const draggedTypes = (event: React.DragEvent): boolean => {
    const list = event.dataTransfer?.items;
    if (!list || !config.accept) return true;
    for (let i = 0; i < list.length; i++) {
      const item = list[i];
      if (item.kind === 'file' && item.type && !acceptsFile({ name: '', type: item.type, size: 0 }, config.accept.split(',').filter((r) => !r.trim().startsWith('.')).join(',') || undefined)) return false;
    }
    return true;
  };
  const hasFiles = (event: React.DragEvent) => Array.from(event.dataTransfer?.types ?? []).includes('Files');
  const dropProps: PropsBag = {
    onDragEnter: (event: React.DragEvent) => {
      if (disabled || !hasFiles(event)) return;
      event.preventDefault();
      depth.current++;
      setDragging(draggedTypes(event) ? 'ok' : 'invalid');
    },
    onDragOver: (event: React.DragEvent) => {
      if (disabled || !hasFiles(event)) return;
      event.preventDefault();
      if (event.dataTransfer) event.dataTransfer.dropEffect = 'copy';
    },
    onDragLeave: (event: React.DragEvent) => {
      if (disabled || !hasFiles(event)) return;
      depth.current = Math.max(0, depth.current - 1);
      if (depth.current === 0) setDragging(false);
    },
    onDrop: (event: React.DragEvent) => {
      if (disabled) return;
      event.preventDefault();
      depth.current = 0;
      setDragging(false);
      add(Array.from(event.dataTransfer?.files ?? []));
    },
  };

  const items: FileUploadItemContext[] = files.map((file, index) => {
    const entry = entryOf(file);
    return {
      id: entry.id,
      file,
      name: file.name,
      size: file.size,
      type: file.type,
      status: entry.status,
      progress: entry.progress,
      error: entry.error,
      response: entry.response,
      preview: previews ? entry.preview : null,
      index,
      remove: () => remove(file),
      retry: () => retry(file),
    };
  });
  const state: FileUploadState = { variant, size: config.size ?? ctx.size, tone: config.tone ?? ctx.tone, dragging: !!dragging, disabled, files: [...files] };
  const hint = config.description !== undefined ? config.description : fileRulesHint({ accept: config.accept, maxSize: config.maxSize, maxFiles: config.maxFiles, multiple }) || null;

  const getRootProps = (props?: PropsBag): PropsBag =>
    mergeProps(
      {
        'data-variant': variant,
        'data-size': state.size,
        'data-tone': state.tone,
        'data-dragging': dataAttr(dragging),
        'data-invalid': dataAttr(dragging === 'invalid'),
        'data-disabled': dataAttr(disabled),
        'data-has-files': dataAttr(files.length > 0),
        'data-animate': dataAttr(!ctx.disableAnimation),
        'data-unstyled': dataAttr(config.unstyled),
        ...radiusProps(config.radius),
        onPaste: (event: React.ClipboardEvent) => {
          if (!config.paste || disabled) return;
          const pasted = Array.from(event.clipboardData?.files ?? []);
          if (!pasted.length) return;
          event.preventDefault();
          add(pasted);
        },
      },
      props,
    );
  const getZoneProps = (props?: PropsBag): PropsBag =>
    mergeProps(
      {
        type: 'button',
        'aria-describedby': hint != null && hint !== '' ? `${base}-hint` : undefined,
        'aria-disabled': disabled || undefined,
        'data-dragging': dataAttr(dragging),
        'data-invalid': dataAttr(dragging === 'invalid'),
        onClick: open,
        ...dropProps,
      },
      props,
    );
  const getInputProps = (props?: PropsBag): PropsBag =>
    mergeProps(
      {
        ref: inputRef,
        id: `${base}-input`,
        type: 'file',
        name: config.name,
        accept: config.accept,
        multiple,
        tabIndex: -1,
        'aria-hidden': true,
        style: VISUALLY_HIDDEN,
        onChange: (event: React.ChangeEvent<HTMLInputElement>) => {
          const picked = Array.from(event.target.files ?? []);
          add(picked);
        },
        // The dialog was opened from the zone: a click here must not bubble back to it.
        onClick: (event: React.MouseEvent) => event.stopPropagation(),
      },
      props,
    );

  const cls = (name: string) => (config.unstyled ? undefined : name);
  const render = (rootProps?: FileUploadRootProps): React.ReactElement => {
    const slot = (name: FileUploadSlot, content: React.ReactNode, tag: string, own: PropsBag = {}, item?: FileUploadItemContext) =>
      renderSlot(config, name, slotProps(config, name, { className: cls(`pinfold-fileupload__${name}`), ...own, ...(item ? { [ITEM]: item } : null) }), state, content, (p, c) => React.createElement(tag, p, c));
    const vars = dimensionVars('fileupload', config.dimensions);
    const rootBag = slotProps(
      config,
      'root',
      getRootProps(mergeProps({ className: config.unstyled ? config.className : cn('pinfold pinfold-fileupload', config.className), style: vars || config.style ? { ...vars, ...config.style } : undefined }, rootProps as PropsBag)),
    );
    const button = variant === 'button';
    const browse = labels.browse ?? (button ? (multiple ? 'Choose files' : 'Choose a file') : 'browse');
    const title = dragging ? labels.drop ?? 'Drop to add' : config.label ?? (button ? null : labels.title ?? (multiple ? 'Drop files here or' : 'Drop a file here or'));
    const icon = config.icon === undefined ? UPLOAD : config.icon;
    const zone = slot(
      'zone',
      <>
        {icon != null ? slot('icon', icon, 'span', { 'aria-hidden': true }) : null}
        <span className={cls('pinfold-fileupload__text')}>
          {button ? (
            slot('browse', dragging ? labels.drop ?? 'Drop to add' : config.label ?? browse, 'span')
          ) : (
            <>
              {slot('title', <>{title}{!dragging && config.label == null ? <> {slot('browse', browse, 'span')}</> : null}</>, 'span')}
              {variant === 'dropzone' && hint != null && hint !== '' ? slot('description', hint, 'span', { id: `${base}-hint` }) : null}
            </>
          )}
        </span>
      </>,
      'button',
      getZoneProps(),
    );
    const outsideHint = variant !== 'dropzone' && hint != null && hint !== '' ? slot('description', hint, 'span', { id: `${base}-hint` }) : null;

    const statusText = (item: FileUploadItemContext): React.ReactNode => {
      if (item.status === 'uploading') return `${labels.uploading ?? 'Uploading'} ${Math.round(item.progress * 100)}%`;
      if (item.status === 'queued') return labels.queued ?? 'Waiting';
      if (item.status === 'done') return labels.done ?? 'Uploaded';
      if (item.status === 'error') return item.error instanceof Error && item.error.message ? item.error.message : labels.error ?? 'Upload failed';
      return null;
    };
    const fileRows = items.map((item) => {
      const status = statusText(item);
      const content = (
        <>
          {slot('thumb', item.preview ? (
              <img
                src={item.preview}
                alt=""
                onError={() => {
                  const entry = entries.current.get(item.file);
                  if (!entry?.preview) return;
                  URL.revokeObjectURL(entry.preview);
                  entry.preview = null;
                  entry.broken = true;
                  bump();
                }}
              />
            ) : (
              FILE
            ), 'span', { 'aria-hidden': true, 'data-image': dataAttr(item.preview) }, item)}
          {slot(
            'info',
            <>
              {slot('name', item.name, 'span', { title: item.name }, item)}
              {slot(
                'meta',
                <>
                  <span>{formatBytes(item.size)}</span>
                  {status != null ? (
                    <span className={cls('pinfold-fileupload__status')}>
                      {item.status === 'done' ? DONE : item.status === 'error' ? ALERT : null}
                      {status}
                    </span>
                  ) : null}
                </>,
                'span',
                {},
                item,
              )}
              {item.status === 'uploading' || item.status === 'queued'
                ? slot('progress', <span className={cls('pinfold-fileupload__bar')} style={{ inlineSize: `${Math.round(item.progress * 100)}%` }} />, 'span', {
                    role: 'progressbar',
                    'aria-label': item.name,
                    'aria-valuemin': 0,
                    'aria-valuemax': 100,
                    'aria-valuenow': Math.round(item.progress * 100),
                  }, item)
                : null}
            </>,
            'span',
            {},
            item,
          )}
          {slot(
            'actions',
            <>
              {item.status === 'error' && config.upload ? slot('retry', RETRY, 'button', { type: 'button', 'aria-label': `${labels.retry ?? 'Retry'} ${item.name}`, title: labels.retry ?? 'Retry', onClick: item.retry }, item) : null}
              {slot('remove', CLOSE, 'button', { type: 'button', 'aria-label': `${labels.remove ?? 'Remove'} ${item.name}`, title: labels.remove ?? 'Remove', 'aria-disabled': disabled || undefined, onClick: disabled ? undefined : item.remove }, item)}
            </>,
            'span',
            {},
            item,
          )}
        </>
      );
      const props: PropsBag = { 'data-status': item.status, 'aria-busy': item.status === 'uploading' || undefined };
      return <React.Fragment key={item.id}>{slot('item', config.renderItem ? config.renderItem({ item, props, children: content }) : content, 'li', props, item)}</React.Fragment>;
    });
    const body = (
      <>
        {slot('input', null, 'input', getInputProps())}
        {variant === 'button' ? <span className={cls('pinfold-fileupload__row')}>{zone}{outsideHint}</span> : <>{zone}{outsideHint}</>}
        {rejections.length
          ? slot(
              'rejections',
              <>
                <ul>
                  {rejections.map((r, i) => (
                    <React.Fragment key={i}>
                      {slot(
                        'rejection',
                        <>
                          {ALERT}
                          <span>
                            <strong>{r.file.name}</strong> {r.reasons.join('. ')}
                          </span>
                        </>,
                        'li',
                      )}
                    </React.Fragment>
                  ))}
                </ul>
                <button type="button" className={cls('pinfold-fileupload__dismiss')} onClick={() => setRejections([])}>
                  {labels.dismiss ?? 'Dismiss'}
                </button>
              </>,
              'div',
              { role: 'status' },
            )
          : null}
        {config.list !== false && items.length ? slot('list', fileRows, 'ul', { 'aria-label': 'Files' }) : null}
        <span aria-live="polite" style={VISUALLY_HIDDEN}>
          {announcement}
        </span>
      </>
    );
    return renderSlot(config, 'root', rootBag, state, body, (p, c) => <div {...p}>{c}</div>) as React.ReactElement;
  };

  const api: FileUploadApi = {
    files: [...files],
    items,
    rejections,
    dragging: !!dragging,
    open,
    add,
    remove,
    retry,
    clear: () => {
      for (const f of files) drop(f);
      setFiles([]);
    },
    clearRejections: () => setRejections([]),
    getRootProps,
    getZoneProps,
    getInputProps,
    render,
  };
  return usePinfoldComponent<FileUploadApi, FileUploadRootProps>('FileUpload', api, (props) => render(props));
}
