/**
 * File upload rules: which files an `accept` list takes, sizes in words, and which files of a pick are
 * kept or rejected and why. Only names, types and sizes are read; never contents.
 */

/** The least of a file these rules read. */
export interface FileLike {
  name: string;
  type: string;
  size: number;
}

/** Whether a file matches an `accept` list (`.png,image/*,application/pdf`), as the file dialog would. */
export function acceptsFile(file: FileLike, accept: string | undefined): boolean {
  if (!accept || !accept.trim()) return true;
  const name = file.name.toLowerCase();
  const type = (file.type || '').toLowerCase();
  return accept
    .split(',')
    .map((s) => s.trim().toLowerCase())
    .filter(Boolean)
    .some((rule) => {
      if (rule.startsWith('.')) return name.endsWith(rule);
      if (rule.endsWith('/*')) return type.startsWith(rule.slice(0, -1));
      return type === rule;
    });
}

/** `1.2 MB`, `340 KB`, `12 B`: decimal units, one decimal under ten. */
export function formatBytes(bytes: number, locale?: string): string {
  const units = ['B', 'KB', 'MB', 'GB', 'TB'];
  let value = Math.max(0, bytes);
  let unit = 0;
  while (value >= 1000 && unit < units.length - 1) {
    value /= 1000;
    unit++;
  }
  const digits = unit > 0 && value < 10 ? 1 : 0;
  return `${value.toLocaleString(locale, { maximumFractionDigits: digits, minimumFractionDigits: 0 })} ${units[unit]}`;
}

/** A hint built from the rules: `PNG, JPG or PDF · up to 5 MB · 3 files at most`. */
export function fileRulesHint(options: { accept?: string; maxSize?: number; maxFiles?: number; multiple?: boolean }, locale?: string): string {
  const parts: string[] = [];
  if (options.accept) {
    const kinds = options.accept
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean)
      .map((rule) => (rule.startsWith('.') ? rule.slice(1).toUpperCase() : rule.endsWith('/*') ? `${rule.slice(0, -2)}s` : (rule.split('/')[1] ?? rule).toUpperCase()));
    if (kinds.length) parts.push(kinds.length > 1 ? `${kinds.slice(0, -1).join(', ')} or ${kinds[kinds.length - 1]}` : kinds[0]);
  }
  if (options.maxSize) parts.push(`up to ${formatBytes(options.maxSize, locale)}`);
  if (options.maxFiles && options.multiple !== false) parts.push(`${options.maxFiles} ${options.maxFiles === 1 ? 'file' : 'files'} at most`);
  return parts.join(' · ');
}

export type FileRejectionReason = 'type' | 'size' | 'count' | 'invalid';

export interface FileRejection<F extends FileLike = FileLike> {
  file: F;
  /** Why, in words (from `messages`, or the message `validate` returned). */
  reasons: string[];
  codes: FileRejectionReason[];
}

/**
 * Split picked files into the ones kept and the ones rejected, with every reason. `current` is how many
 * files are already held; with `multiple: false` a new pick replaces them, so it counts as none.
 */
export function sortFiles<F extends FileLike>(
  files: readonly F[],
  options: {
    accept?: string;
    maxSize?: number;
    maxFiles?: number;
    multiple?: boolean;
    current?: number;
    validate?: (file: F) => string | null | undefined;
    messages?: { type?: string; size?: string; count?: string };
  },
  locale?: string,
): { accepted: F[]; rejected: FileRejection<F>[] } {
  const accepted: F[] = [];
  const rejected: FileRejection<F>[] = [];
  const single = options.multiple === false;
  const limit = single ? 1 : options.maxFiles ?? Infinity;
  let held = single ? 0 : options.current ?? 0;
  for (const file of files) {
    const codes: FileRejectionReason[] = [];
    const reasons: string[] = [];
    if (!acceptsFile(file, options.accept)) {
      codes.push('type');
      reasons.push(options.messages?.type ?? 'This file type is not accepted');
    }
    if (options.maxSize !== undefined && file.size > options.maxSize) {
      codes.push('size');
      reasons.push(options.messages?.size ?? `Larger than ${formatBytes(options.maxSize, locale)}`);
    }
    const own = codes.length ? null : options.validate?.(file);
    if (own) {
      codes.push('invalid');
      reasons.push(own);
    }
    if (!codes.length && held >= limit) {
      codes.push('count');
      reasons.push(options.messages?.count ?? (single ? 'Only one file' : `No more than ${limit} files`));
    }
    if (codes.length) rejected.push({ file, reasons, codes });
    else {
      accepted.push(file);
      held++;
    }
  }
  return { accepted, rejected };
}

/** Options with no visible effect in the current config. */
export function inactiveFileUploadOptions(config: { upload?: unknown; multiple?: boolean; variant?: string; list?: boolean; previews?: boolean }): Record<string, string> {
  const out: Record<string, string> = {};
  if (!config.upload) {
    out.concurrency = 'only used with `upload`.';
    out.onUploadComplete = 'only called with `upload`.';
    out.onUploadError = 'only called with `upload`.';
  }
  if (config.multiple === false) out.maxFiles = 'one file at a time with `multiple: false`.';
  if (config.list === false) {
    out.previews = 'the file list is hidden (`list: false`).';
    out.renderItem = 'the file list is hidden (`list: false`).';
  }
  return out;
}
