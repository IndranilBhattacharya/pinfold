/** The toast queue, framework-free: an external store any adapter can subscribe to. */

export interface ToastInput {
  /** Showing an id again updates that toast in place and restarts its timer. */
  id?: string;
  /** Milliseconds; 0 stays until dismissed. */
  duration?: number;
  tone?: string;
  action?: unknown;
  onDismiss?: () => void;
}

export interface ToastStoreOptions {
  /** @default 5000 */
  duration?: number;
  /** How many show at once; the rest wait their turn. @default 5 */
  max?: number;
}

export interface ToastStore<T extends ToastInput> {
  /** Returns the toast's id. */
  show: (toast: T) => string;
  dismiss: (id: string) => void;
  clear: () => void;
  /** Timers stop while the user reads (hover, focus) and while the tab is hidden. */
  pause: () => void;
  resume: () => void;
  configure: (options: ToastStoreOptions) => void;
  subscribe: (listener: () => void) => () => void;
  /** The toasts showing now. A new array only when they change. */
  getVisible: () => ReadonlyArray<T & { id: string }>;
}

interface Timer {
  remaining: number;
  startedAt: number;
  handle?: ReturnType<typeof setTimeout>;
}

/**
 * An error, or a toast with something to do, stays until dismissed unless it says otherwise: a
 * message that vanishes before it is read or acted on fails WCAG 2.2.1 (timing adjustable).
 */
export function toastDuration(toast: ToastInput, fallback: number): number {
  if (typeof toast.duration === 'number') return toast.duration;
  return toast.tone === 'danger' || toast.action ? 0 : fallback;
}

export function createToastStore<T extends ToastInput>(initial: ToastStoreOptions = {}): ToastStore<T> {
  let options = { duration: 5000, max: 5, ...initial };
  let items: Array<T & { id: string }> = [];
  let visible: ReadonlyArray<T & { id: string }> = [];
  let paused = false;
  let counter = 0;
  const timers = new Map<string, Timer>();
  const listeners = new Set<() => void>();

  const stop = (timer: Timer) => {
    if (timer.handle !== undefined) clearTimeout(timer.handle);
    timer.handle = undefined;
  };
  const start = (id: string, timer: Timer) => {
    timer.startedAt = Date.now();
    timer.handle = setTimeout(() => dismiss(id), timer.remaining);
  };
  const sync = () => {
    visible = items.slice(0, Math.max(1, options.max));
    // Only toasts on screen count down: one waiting in the queue has not been seen yet.
    for (const toast of visible) {
      if (timers.has(toast.id)) continue;
      const remaining = toastDuration(toast, options.duration);
      if (remaining <= 0) continue;
      const timer: Timer = { remaining, startedAt: 0 };
      timers.set(toast.id, timer);
      if (!paused) start(toast.id, timer);
    }
    listeners.forEach((l) => l());
  };
  const forget = (id: string) => {
    const timer = timers.get(id);
    if (timer) stop(timer);
    timers.delete(id);
  };

  function dismiss(id: string) {
    const toast = items.find((t) => t.id === id);
    if (!toast) return;
    forget(id);
    items = items.filter((t) => t.id !== id);
    sync();
    toast.onDismiss?.();
  }

  return {
    show(toast) {
      const id = toast.id ?? `toast-${++counter}`;
      const next = { ...toast, id };
      forget(id);
      const at = items.findIndex((t) => t.id === id);
      items = at === -1 ? [...items, next] : items.map((t, i) => (i === at ? next : t));
      sync();
      return id;
    },
    dismiss,
    clear() {
      timers.forEach(stop);
      timers.clear();
      items = [];
      sync();
    },
    pause() {
      if (paused) return;
      paused = true;
      const now = Date.now();
      timers.forEach((timer) => {
        stop(timer);
        timer.remaining = Math.max(0, timer.remaining - (now - timer.startedAt));
      });
    },
    resume() {
      if (!paused) return;
      paused = false;
      timers.forEach((timer, id) => start(id, timer));
    },
    configure(next) {
      const changed = (next.max !== undefined && next.max !== options.max) || (next.duration !== undefined && next.duration !== options.duration);
      if (next.max !== undefined) options.max = next.max;
      if (next.duration !== undefined) options.duration = next.duration;
      if (changed) sync();
    },
    subscribe(listener) {
      listeners.add(listener);
      return () => {
        listeners.delete(listener);
      };
    },
    getVisible: () => visible,
  };
}
