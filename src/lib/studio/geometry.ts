import { GRID_SIZE } from "./layers";
import type { AlignMode, Artboard, GuideLine, HandleId, Layer, LayerBox } from "./types";
import type { IgFormat } from "./formats";

export type Box = { x: number; y: number; w: number; h: number };

export function rotatePoint(
  px: number,
  py: number,
  cx: number,
  cy: number,
  deg: number,
): { x: number; y: number } {
  if (!deg) return { x: px, y: py };
  const r = (deg * Math.PI) / 180;
  const dx = px - cx;
  const dy = py - cy;
  return {
    x: cx + dx * Math.cos(r) - dy * Math.sin(r),
    y: cy + dx * Math.sin(r) + dy * Math.cos(r),
  };
}

export function centerOf(box: Box): { x: number; y: number } {
  return { x: box.x + box.w / 2, y: box.y + box.h / 2 };
}

export function localPoint(box: LayerBox, worldX: number, worldY: number) {
  const c = centerOf(box);
  return rotatePoint(worldX, worldY, c.x, c.y, -box.rotation);
}

function worldFromLocal(box: LayerBox, lx: number, ly: number) {
  const c = centerOf(box);
  return rotatePoint(lx, ly, c.x, c.y, box.rotation);
}

function fixedLocal(orig: Box, handle: HandleId): { x: number; y: number } {
  switch (handle) {
    case "se":
      return { x: orig.x, y: orig.y };
    case "nw":
      return { x: orig.x + orig.w, y: orig.y + orig.h };
    case "ne":
      return { x: orig.x, y: orig.y + orig.h };
    case "sw":
      return { x: orig.x + orig.w, y: orig.y };
    case "e":
      return { x: orig.x, y: orig.y + orig.h / 2 };
    case "w":
      return { x: orig.x + orig.w, y: orig.y + orig.h / 2 };
    case "s":
      return { x: orig.x + orig.w / 2, y: orig.y };
    case "n":
      return { x: orig.x + orig.w / 2, y: orig.y + orig.h };
  }
}

export function resizeBox(
  orig: LayerBox,
  handle: HandleId,
  worldPointer: { x: number; y: number },
  opts: { min?: number; keepAspect?: boolean } = {},
): Box {
  const min = opts.min ?? 16;
  const local = localPoint(orig, worldPointer.x, worldPointer.y);
  let left = orig.x;
  let right = orig.x + orig.w;
  let top = orig.y;
  let bottom = orig.y + orig.h;

  if (handle === "e" || handle === "ne" || handle === "se") right = local.x;
  if (handle === "w" || handle === "nw" || handle === "sw") left = local.x;
  if (handle === "s" || handle === "se" || handle === "sw") bottom = local.y;
  if (handle === "n" || handle === "ne" || handle === "nw") top = local.y;

  if (right < left) {
    const t = left;
    left = right;
    right = t;
  }
  if (bottom < top) {
    const t = top;
    top = bottom;
    bottom = t;
  }

  let w = Math.max(min, right - left);
  let h = Math.max(min, bottom - top);

  if (opts.keepAspect && orig.h > 0) {
    const ratio = orig.w / orig.h;
    const fromCorner = handle.length === 2;
    if (fromCorner) {
      if (w / h > ratio) w = h * ratio;
      else h = w / ratio;
      if (handle.includes("w")) left = right - w;
      else right = left + w;
      if (handle.includes("n")) top = bottom - h;
      else bottom = top + h;
    } else if (handle === "e" || handle === "w") {
      h = w / ratio;
      const cy = orig.y + orig.h / 2;
      top = cy - h / 2;
      bottom = cy + h / 2;
    } else {
      w = h * ratio;
      const cx = orig.x + orig.w / 2;
      left = cx - w / 2;
      right = cx + w / 2;
    }
    w = Math.max(min, right - left);
    h = Math.max(min, bottom - top);
  }

  const next: LayerBox = { x: left, y: top, w, h, rotation: orig.rotation };
  const anchor = fixedLocal(orig, handle);
  const before = worldFromLocal(orig, anchor.x, anchor.y);
  const afterAnchor = fixedLocal({ x: left, y: top, w, h }, handle);
  const after = worldFromLocal(next, afterAnchor.x, afterAnchor.y);
  return {
    x: Math.round(left + (before.x - after.x)),
    y: Math.round(top + (before.y - after.y)),
    w: Math.round(w),
    h: Math.round(h),
  };
}

export function rotateByPointer(
  orig: LayerBox,
  startPointer: { x: number; y: number },
  pointer: { x: number; y: number },
  snap: boolean,
): number {
  const c = centerOf(orig);
  const a0 = Math.atan2(startPointer.y - c.y, startPointer.x - c.x);
  const a1 = Math.atan2(pointer.y - c.y, pointer.x - c.x);
  let deg = orig.rotation + ((a1 - a0) * 180) / Math.PI;
  while (deg > 180) deg -= 360;
  while (deg < -180) deg += 360;
  if (snap) deg = Math.round(deg / 15) * 15;
  return Math.round(deg * 10) / 10;
}

export function alignBox(layer: Box, format: IgFormat, mode: AlignMode): Partial<Box> {
  const { width: W, height: H, safe: S } = format;
  switch (mode) {
    case "left":
      return { x: 0 };
    case "center":
      return { x: Math.round((W - layer.w) / 2) };
    case "right":
      return { x: Math.round(W - layer.w) };
    case "top":
      return { y: 0 };
    case "middle":
      return { y: Math.round((H - layer.h) / 2) };
    case "bottom":
      return { y: Math.round(H - layer.h) };
    case "safe-left":
      return { x: S.left };
    case "safe-center":
      return { x: Math.round((W - layer.w) / 2) };
    case "safe-right":
      return { x: Math.round(W - S.right - layer.w) };
    case "safe-top":
      return { y: S.top };
    case "safe-middle":
      return { y: Math.round((H - layer.h) / 2) };
    case "safe-bottom":
      return { y: Math.round(H - S.bottom - layer.h) };
  }
}

const SNAP_EDGES = (box: Box) => [box.x, box.x + box.w / 2, box.x + box.w];
const SNAP_MIDS = (box: Box) => [box.y, box.y + box.h / 2, box.y + box.h];

export function snapMove(
  box: Box,
  artboard: Artboard,
  format: IgFormat,
  excludeId: string,
  threshold: number,
  grid: boolean,
): { box: Box; guides: GuideLine[] } {
  const xs: number[] = [0, format.width / 2, format.width, format.safe.left, format.width - format.safe.right];
  const ys: number[] = [0, format.height / 2, format.height, format.safe.top, format.height - format.safe.bottom];
  if (grid) {
    for (let g = 0; g <= format.width; g += GRID_SIZE) xs.push(g);
    for (let g = 0; g <= format.height; g += GRID_SIZE) ys.push(g);
  }
  for (const layer of artboard.layers) {
    if (layer.id === excludeId || layer.hidden) continue;
    xs.push(...SNAP_EDGES(layer));
    ys.push(...SNAP_MIDS(layer));
  }

  let dx = 0;
  let dy = 0;
  let bestX = threshold + 1;
  let bestY = threshold + 1;
  const guides: GuideLine[] = [];
  let guideV: number | null = null;
  let guideH: number | null = null;

  for (const edge of SNAP_EDGES(box)) {
    for (const t of xs) {
      const d = t - edge;
      const ad = Math.abs(d);
      if (ad < bestX) {
        bestX = ad;
        dx = d;
        guideV = t;
      }
    }
  }
  for (const edge of SNAP_MIDS(box)) {
    for (const t of ys) {
      const d = t - edge;
      const ad = Math.abs(d);
      if (ad < bestY) {
        bestY = ad;
        dy = d;
        guideH = t;
      }
    }
  }

  const next = { ...box };
  if (bestX <= threshold) {
    next.x = Math.round(box.x + dx);
    if (guideV !== null) guides.push({ axis: "v", pos: guideV });
  }
  if (bestY <= threshold) {
    next.y = Math.round(box.y + dy);
    if (guideH !== null) guides.push({ axis: "h", pos: guideH });
  }
  return { box: next, guides };
}

export function handleCursor(handle: HandleId, rotation: number): string {
  const map: Record<HandleId, number> = {
    e: 0,
    se: 45,
    s: 90,
    sw: 135,
    w: 180,
    nw: 225,
    n: 270,
    ne: 315,
  };
  const deg = ((map[handle] + rotation) % 180 + 180) % 180;
  if (deg < 22.5 || deg >= 157.5) return "ew-resize";
  if (deg < 67.5) return "nwse-resize";
  if (deg < 112.5) return "ns-resize";
  return "nesw-resize";
}

export function layerAtPoint(layers: Layer[], x: number, y: number): Layer | undefined {
  for (let i = layers.length - 1; i >= 0; i -= 1) {
    const layer = layers[i];
    if (layer.hidden || layer.locked) continue;
    const local = localPoint(layer, x, y);
    if (local.x >= layer.x && local.x <= layer.x + layer.w && local.y >= layer.y && local.y <= layer.y + layer.h) {
      return layer;
    }
  }
  return undefined;
}
