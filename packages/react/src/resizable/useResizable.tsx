import * as React from 'react';
import { cn, dataAttr, inactiveResizableOptions, initialSizes, mergeProps, resizePanels, warnOnce, type PropsBag, radiusProps } from '@pinfold/core';
import { useControllableState, useId } from '../hooks';
import { usePinfold } from '../provider';
import { usePinfoldComponent } from '../component';
import { mergeConfig } from '../preset';
import { renderSlot, slotProps } from '../slots';
import type { ResizableApi, ResizableComponent, ResizableConfig, ResizableRootProps, ResizableSlot, ResizableState } from './types';

const read = (key: string | undefined, count: number): number[] | null => {
  if (!key || typeof localStorage === 'undefined') return null;
  try {
    const v = JSON.parse(localStorage.getItem(`pinfold-resizable:${key}`) ?? 'null');
    return Array.isArray(v) && v.length === count && v.every((n) => typeof n === 'number') ? v : null;
  } catch {
    return null;
  }
};

/**
 * Panels side by side (or stacked) with handles between them to drag, or move with arrow keys, as
 * a hook that hands back a component. Sizes are percents, can be kept per browser (`autoSaveId`).
 *
 *   const Workspace = useResizable({ label: 'Editor', panels });
 *   return <Workspace />;
 *
 * Precedence: this config, then `defaults.resizable`, then the provider (size, tone), then the library default.
 */
export function useResizable(input: ResizableConfig): ResizableComponent {
  const ctx = usePinfold();
  const config = ctx.defaults.resizable ? mergeConfig<ResizableConfig>(ctx.defaults.resizable, input) : input;
  const base = useId();
  const panels = config.panels ?? [];
  const defaults = initialSizes(panels.map((p) => p.defaultSize));
  // Saved sizes load after mount: the server and the first paint agree on the defaults.
  const [sizes, setSizesState] = useControllableState<readonly number[]>({ value: config.sizes, defaultValue: defaults });
  const group = React.useRef<HTMLDivElement | null>(null);
  const orientation = config.orientation ?? 'horizontal';
  const mins = panels.map((p) => p.min ?? 10);
  const maxs = panels.map((p) => p.max ?? 90);

  if (process.env.NODE_ENV !== 'production') {
    void import('@pinfold/core/meta').then(({ resizableMeta, validateConfig }) => {
      for (const problem of validateConfig(resizableMeta, input)) warnOnce(true, problem.message);
      const inactive = inactiveResizableOptions(config);
      for (const key in inactive) warnOnce((input as unknown as Record<string, unknown>)[key] !== undefined, `Resizable: \`${key}\` has no visible effect here. ${inactive[key]}`);
    });
  }

  React.useEffect(() => {
    const saved = read(config.autoSaveId, panels.length);
    if (saved && config.sizes === undefined) setSizesState(saved);
  }, [config.autoSaveId, panels.length]); // eslint-disable-line react-hooks/exhaustive-deps

  const state: ResizableState = { orientation, size: config.size ?? ctx.size, tone: config.tone ?? ctx.tone, sizes };
  const commit = (next: number[]) => {
    setSizesState(next);
    config.onResize?.(next);
    if (config.autoSaveId && typeof localStorage !== 'undefined') {
      try {
        localStorage.setItem(`pinfold-resizable:${config.autoSaveId}`, JSON.stringify(next));
      } catch {
        // Storage full or blocked: the sizes still work for this visit.
      }
    }
  };
  const move = (at: number, delta: number) => commit(resizePanels(sizes, at, delta, mins, maxs));

  const drag = (at: number) => (event: React.PointerEvent<HTMLElement>) => {
    const box = group.current?.getBoundingClientRect();
    if (!box || event.button !== 0) return;
    event.preventDefault();
    const handle = event.currentTarget;
    handle.setPointerCapture?.(event.pointerId);
    const total = orientation === 'horizontal' ? box.width : box.height;
    const rtl = orientation === 'horizontal' && getComputedStyle(handle).direction === 'rtl';
    const start = orientation === 'horizontal' ? event.clientX : event.clientY;
    const from = [...sizes];
    const onMove = (e: PointerEvent) => {
      const now = orientation === 'horizontal' ? e.clientX : e.clientY;
      const delta = (((now - start) * (rtl ? -1 : 1)) / total) * 100;
      commit(resizePanels(from, at, delta, mins, maxs));
    };
    const stop = () => {
      handle.removeEventListener('pointermove', onMove);
      handle.removeEventListener('pointerup', stop);
      handle.removeEventListener('pointercancel', stop);
      handle.removeAttribute('data-dragging');
    };
    handle.setAttribute('data-dragging', '');
    handle.addEventListener('pointermove', onMove);
    handle.addEventListener('pointerup', stop);
    handle.addEventListener('pointercancel', stop);
  };

  const getRootProps = (props?: PropsBag): PropsBag =>
    mergeProps(
      {
        ...radiusProps(config.radius),
        role: 'group',
        'aria-label': config.label,
        'data-orientation': orientation,
        'data-handle': config.handle ?? 'line',
        'data-size': state.size,
        'data-tone': state.tone,
        'data-animate': dataAttr(!ctx.disableAnimation),
        'data-unstyled': dataAttr(config.unstyled),
      },
      props,
    );

  const render = (rootProps?: ResizableRootProps): React.ReactElement => {
    const cls = (name: string) => (config.unstyled ? undefined : name);
    const slot = (name: ResizableSlot, content: React.ReactNode, tag: string, own: PropsBag = {}) =>
      renderSlot(config, name, slotProps(config, name, { className: cls(`pinfold-resizable__${name}`), ...own }), state, content, (p, c) => React.createElement(tag, p, c));
    const root = slotProps(config, 'root', getRootProps(mergeProps({ ref: group, className: config.unstyled ? config.className : cn('pinfold pinfold-resizable', config.className), style: config.style }, rootProps)));
    const stepSize = config.step ?? 5;
    const content = panels.map((p, i) => {
      const id = `${base}-panel-${i}`;
      const handleName = `Resize ${p.label ?? `panel ${i + 1}`}`;
      return (
        <React.Fragment key={p.id}>
          {slot('panel', p.content, 'div', { id, 'aria-label': p.label ? `${config.label}: ${p.label}` : undefined, role: p.label ? 'region' : undefined, style: { flexBasis: `${sizes[i] ?? 0}%` } })}
          {i < panels.length - 1
            ? slot(
                'handle',
                config.handle === 'grip' ? slot('grip', null, 'span', { 'aria-hidden': true }) : null,
                'div',
                {
                  role: 'separator',
                  tabIndex: 0,
                  'aria-label': handleName,
                  'aria-controls': id,
                  // A separator between side-by-side panels is vertical.
                  'aria-orientation': orientation === 'horizontal' ? 'vertical' : 'horizontal',
                  'aria-valuenow': Math.round(sizes[i] ?? 0),
                  'aria-valuemin': mins[i],
                  'aria-valuemax': maxs[i],
                  onPointerDown: drag(i),
                  onDoubleClick: () => commit(resizePanels(sizes, i, defaults[i] - sizes[i], mins, maxs)),
                  onKeyDown: (event: React.KeyboardEvent) => {
                    const rtl = ctx.dir === 'rtl' && orientation === 'horizontal';
                    const grow = orientation === 'horizontal' ? (rtl ? 'ArrowLeft' : 'ArrowRight') : 'ArrowDown';
                    const shrink = orientation === 'horizontal' ? (rtl ? 'ArrowRight' : 'ArrowLeft') : 'ArrowUp';
                    const delta = event.key === grow ? stepSize : event.key === shrink ? -stepSize : event.key === 'Home' ? -100 : event.key === 'End' ? 100 : 0;
                    if (!delta) return;
                    event.preventDefault();
                    move(i, delta);
                  },
                },
              )
            : null}
        </React.Fragment>
      );
    });
    return renderSlot(config, 'root', root, state, content, (p, c) => <div {...p}>{c}</div>) as React.ReactElement;
  };

  const api: ResizableApi = { sizes, setSizes: (s) => commit([...s]), reset: () => commit(defaults), getRootProps, render };
  return usePinfoldComponent<ResizableApi, ResizableRootProps>('Resizable', api, (props) => render(props));
}
