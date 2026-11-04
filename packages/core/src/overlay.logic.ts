/** Overlay rules, framework-free: positioning, the dismiss stack, typeahead, inactive options. */

export type OverlayPlacement =
  | 'top' | 'top-start' | 'top-end'
  | 'bottom' | 'bottom-start' | 'bottom-end'
  | 'start' | 'start-top' | 'start-bottom'
  | 'end' | 'end-top' | 'end-bottom';

export type OverlaySide = 'top' | 'bottom' | 'left' | 'right';

export interface OverlayRect {
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface OverlayPositionInput {
  anchor: OverlayRect;
  floating: { width: number; height: number };
  viewport: { width: number; height: number };
  placement?: OverlayPlacement;
  /** Gap between anchor and floating element. */
  offset?: number;
  /** Minimum distance from the viewport edge. */
  padding?: number;
  rtl?: boolean;
}

export interface OverlayPosition {
  x: number;
  y: number;
  /** The physical side it ended up on, after flipping. */
  side: OverlaySide;
  /** Where the arrow's centre sits along the floating element's edge. */
  arrow: number;
}

const OPPOSITE: Record<OverlaySide, OverlaySide> = { top: 'bottom', bottom: 'top', left: 'right', right: 'left' };
const clamp = (v: number, min: number, max: number) => Math.max(min, Math.min(v, Math.max(min, max)));

/**
 * Where to put a floating element: on the preferred side, flipped when only the other side has
 * room, then shifted to stay inside the viewport. `start` and `end` are logical (they swap in RTL).
 */
export function computePosition({ anchor, floating, viewport, placement = 'bottom', offset = 8, padding = 8, rtl = false }: OverlayPositionInput): OverlayPosition {
  const [logical, align = 'center'] = placement.split('-');
  let side = (logical === 'start' ? (rtl ? 'right' : 'left') : logical === 'end' ? (rtl ? 'left' : 'right') : logical) as OverlaySide;
  const vertical = side === 'top' || side === 'bottom';
  const room: Record<OverlaySide, number> = {
    top: anchor.y,
    bottom: viewport.height - anchor.y - anchor.height,
    left: anchor.x,
    right: viewport.width - anchor.x - anchor.width,
  };
  const need = (vertical ? floating.height : floating.width) + offset + padding;
  if (room[side] < need && room[OPPOSITE[side]] > room[side]) side = OPPOSITE[side];

  let x: number;
  let y: number;
  if (vertical) {
    y = side === 'top' ? anchor.y - floating.height - offset : anchor.y + anchor.height + offset;
    // Along a horizontal edge `start` follows the reading direction.
    const toStart = align === 'start' ? !rtl : align === 'end' ? rtl : null;
    x = toStart === null ? anchor.x + (anchor.width - floating.width) / 2 : toStart ? anchor.x : anchor.x + anchor.width - floating.width;
    x = clamp(x, padding, viewport.width - floating.width - padding);
  } else {
    x = side === 'left' ? anchor.x - floating.width - offset : anchor.x + anchor.width + offset;
    y = align === 'top' ? anchor.y : align === 'bottom' ? anchor.y + anchor.height - floating.height : anchor.y + (anchor.height - floating.height) / 2;
    y = clamp(y, padding, viewport.height - floating.height - padding);
  }
  const arrow = vertical ? anchor.x + anchor.width / 2 - x : anchor.y + anchor.height / 2 - y;
  return { x, y, side, arrow: clamp(arrow, 10, (vertical ? floating.width : floating.height) - 10) };
}

export interface OverlayLayer {
  /** Is this node part of the layer (its panel or its trigger)? */
  contains: (node: Node) => boolean;
  onEscape?: () => void;
  onOutside?: () => void;
}

const layers: OverlayLayer[] = [];

function onKeyDown(event: KeyboardEvent) {
  if (event.key !== 'Escape' || event.defaultPrevented) return;
  for (let i = layers.length - 1; i >= 0; i--) {
    const handler = layers[i].onEscape;
    if (handler) {
      // Only the top layer closes; the default would also close a native dialog beneath it.
      event.preventDefault();
      handler();
      return;
    }
  }
}

function onPointerDown(event: Event) {
  const target = event.target as Node | null;
  if (!target) return;
  // A press outside closes every layer it is outside of, from the top, up to the first it is inside.
  for (const layer of layers.slice().reverse()) {
    if (layer.contains(target)) return;
    layer.onOutside?.();
  }
}

/**
 * Join the dismiss stack; returns the function that leaves it. One pair of document listeners
 * serves every overlay, so Escape and outside presses always reach the topmost first.
 */
export function pushOverlayLayer(layer: OverlayLayer): () => void {
  if (layers.length === 0) {
    document.addEventListener('keydown', onKeyDown);
    document.addEventListener('pointerdown', onPointerDown, true);
  }
  layers.push(layer);
  return () => {
    const i = layers.indexOf(layer);
    if (i !== -1) layers.splice(i, 1);
    if (layers.length === 0) {
      document.removeEventListener('keydown', onKeyDown);
      document.removeEventListener('pointerdown', onPointerDown, true);
    }
  };
}

/**
 * The next item whose label starts with what was typed. One repeated letter cycles through the
 * matches; a longer query keeps the current item while it still matches. `-1` when nothing does.
 */
export function typeaheadIndex(labels: readonly string[], query: string, from: number): number {
  const q = query.toLocaleLowerCase();
  if (!q) return -1;
  const single = Array.from(q).every((c) => c === q[0]);
  const needle = single ? q[0] : q;
  const start = single ? from + 1 : Math.max(from, 0);
  for (let i = 0; i < labels.length; i++) {
    const at = (start + i) % labels.length;
    if (labels[at].toLocaleLowerCase().startsWith(needle)) return at;
  }
  return -1;
}

/** Options with no visible effect in the current config. */
export function inactivePopoverOptions(config: { openOn?: string }): Record<string, string> {
  const out: Record<string, string> = {};
  if (config.openOn !== 'hover') {
    out.delay = 'only used with `openOn: "hover"`.';
    out.closeDelay = 'only used with `openOn: "hover"`.';
  }
  return out;
}

export function inactiveDialogOptions(config: { placement?: string; closeButton?: boolean; modal?: boolean }): Record<string, string> {
  const out: Record<string, string> = {};
  if (config.placement && config.placement !== 'center') out.size = 'a sheet takes its size from `dimensions`.';
  if (config.closeButton === false) out.closeLabel = 'only used with the close button.';
  if (config.modal === false) out.closeOnOutside = 'a non-modal dialog leaves the page usable: outside presses are ordinary clicks.';
  return out;
}

export function inactiveMenuOptions(config: { mode?: string }): Record<string, string> {
  const out: Record<string, string> = {};
  if (config.mode === 'context') {
    out.placement = 'a context menu opens at the pointer.';
    out.offset = 'a context menu opens at the pointer.';
  }
  return out;
}
