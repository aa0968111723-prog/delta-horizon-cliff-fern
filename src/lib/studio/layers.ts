import { uid } from "./ids.ts";
import type {
  Align,
  Artboard,
  BrandKit,
  ImageCrop,
  ImageFilter,
  ImageLayer,
  Layer,
  LayerShadow,
  LineLayer,
  LogoLayer,
  ShapeKind,
  ShapeLayer,
  TextLayer,
  TextRole,
} from "./types";

export const DEFAULT_FILTER: ImageFilter = {
  brightness: 1,
  contrast: 1,
  saturate: 1,
  blur: 0,
  grayscale: 0,
};

export const DEFAULT_CROP: ImageCrop = { x: 50, y: 50, zoom: 1 };

export const DEFAULT_SHADOW: LayerShadow = {
  enabled: false,
  x: 0,
  y: 12,
  blur: 28,
  color: "rgba(26,24,20,0.28)",
};

export const GRID_SIZE = 54;
export const MAX_SLIDES = 10;
export const MAX_SNAPSHOTS = 16;

export function brandColor(brand: BrandKit, role: BrandKit["colors"][number]["role"], fallback: string) {
  return brand.colors.find((c) => c.role === role)?.hex ?? fallback;
}

function base(
  partial: Pick<Layer, "name" | "type"> &
    Partial<Pick<Layer, "id" | "x" | "y" | "w" | "h" | "rotation" | "opacity" | "locked" | "hidden" | "fromLayout" | "radius" | "shadow">>,
) {
  return {
    id: partial.id ?? uid("ly"),
    name: partial.name,
    type: partial.type,
    x: partial.x ?? 80,
    y: partial.y ?? 80,
    w: partial.w ?? 400,
    h: partial.h ?? 240,
    rotation: partial.rotation ?? 0,
    opacity: partial.opacity ?? 1,
    locked: partial.locked ?? false,
    hidden: partial.hidden ?? false,
    fromLayout: partial.fromLayout ?? false,
    radius: partial.radius ?? 0,
    shadow: partial.shadow ?? { ...DEFAULT_SHADOW },
  };
}

export function createTextLayer(
  brand: BrandKit,
  opts: {
    text?: string;
    role?: TextRole;
    x?: number;
    y?: number;
    w?: number;
    h?: number;
    fontSize?: number;
    align?: Align;
    color?: string;
    name?: string;
    fontFamily?: string;
  } = {},
): TextLayer {
  return {
    ...base({
      name: opts.name ?? "文字",
      type: "text",
      x: opts.x ?? 120,
      y: opts.y ?? 200,
      w: opts.w ?? 800,
      h: opts.h ?? 120,
    }),
    type: "text",
    text: opts.text ?? "新文字",
    role: opts.role ?? "custom",
    fontFamily: opts.fontFamily ?? brand.fontDisplay,
    fontWeight: 600,
    fontSize: opts.fontSize ?? 48,
    lineHeight: 1.2,
    letterSpacing: 0,
    color: opts.color ?? brandColor(brand, "ink", "#1A1814"),
    align: opts.align ?? "left",
  };
}

export function createShapeLayer(
  brand: BrandKit,
  kind: ShapeKind,
  opts: { x?: number; y?: number; w?: number; h?: number; fill?: string; name?: string } = {},
): ShapeLayer {
  const pill = kind === "pill";
  return {
    ...base({
      name: opts.name ?? (pill ? "膠囊" : kind === "ellipse" ? "圓形" : "矩形"),
      type: "shape",
      x: opts.x ?? 200,
      y: opts.y ?? 400,
      w: opts.w ?? (pill ? 280 : 400),
      h: opts.h ?? (pill ? 72 : 240),
      radius: kind === "rect" ? 0 : 24,
    }),
    type: "shape",
    shape: kind,
    fill: opts.fill ?? brandColor(brand, "accent", "#1E4A45"),
    radius: kind === "rect" ? 0 : kind === "pill" ? 999 : 9999,
    stroke: undefined,
    strokeWidth: 0,
  };
}

export function createLineLayer(
  brand: BrandKit,
  opts: { x?: number; y?: number; w?: number; h?: number; stroke?: string } = {},
): LineLayer {
  return {
    ...base({
      name: "線條",
      type: "line",
      x: opts.x ?? 120,
      y: opts.y ?? 400,
      w: opts.w ?? 480,
      h: opts.h ?? 40,
    }),
    type: "line",
    stroke: opts.stroke ?? brandColor(brand, "accent", "#1E4A45"),
    strokeWidth: 4,
  };
}

export function createImageLayer(
  assetId: string,
  name: string,
  opts: { x?: number; y?: number; w?: number; h?: number; objectFit?: "cover" | "contain" } = {},
): ImageLayer {
  return {
    ...base({
      name,
      type: "image",
      x: opts.x ?? 0,
      y: opts.y ?? 0,
      w: opts.w ?? 1080,
      h: opts.h ?? 720,
      radius: 0,
    }),
    type: "image",
    assetId,
    objectFit: opts.objectFit ?? "cover",
    crop: { ...DEFAULT_CROP },
    filter: { ...DEFAULT_FILTER },
    radius: 0,
  };
}

export function createLogoLayer(
  brand: BrandKit,
  opts: { x?: number; y?: number; size?: number; assetId?: string } = {},
): LogoLayer | null {
  const assetId = opts.assetId ?? brand.logoAssetId;
  if (!assetId) return null;
  const size = opts.size ?? 96;
  return {
    ...base({
      name: "Logo",
      type: "logo",
      x: opts.x ?? 80,
      y: opts.y ?? 80,
      w: size,
      h: size,
    }),
    type: "logo",
    assetId,
    radius: 0,
  };
}

export function duplicateLayer(layer: Layer, offset = 40): Layer {
  const copy = structuredClone(layer);
  copy.id = uid("ly");
  copy.name = `${layer.name} 副本`;
  copy.x = layer.x + offset;
  copy.y = layer.y + offset;
  copy.fromLayout = false;
  copy.locked = false;
  if (copy.type === "text") copy.role = "custom";
  return copy;
}

export function cloneArtboard(artboard: Artboard): Artboard {
  const next = structuredClone(artboard);
  next.layers = next.layers.map((layer) => ({
    ...layer,
    id: uid("ly"),
    fromLayout: false,
  }));
  return next;
}

export function emptyArtboard(formatId: Artboard["formatId"], color: string): Artboard {
  return {
    formatId,
    background: { type: "solid", color },
    layers: [],
  };
}

export function normalizeFilter(raw?: Partial<ImageFilter> | null): ImageFilter {
  return {
    brightness: raw?.brightness ?? 1,
    contrast: raw?.contrast ?? 1,
    saturate: raw?.saturate ?? 1,
    blur: raw?.blur ?? 0,
    grayscale: raw?.grayscale ?? 0,
  };
}

export function normalizeCrop(raw?: Partial<ImageCrop> | null): ImageCrop {
  return {
    x: raw?.x ?? 50,
    y: raw?.y ?? 50,
    zoom: raw?.zoom ?? 1,
  };
}

export function normalizeShadow(raw?: Partial<LayerShadow> | null): LayerShadow {
  return {
    enabled: raw?.enabled ?? false,
    x: raw?.x ?? DEFAULT_SHADOW.x,
    y: raw?.y ?? DEFAULT_SHADOW.y,
    blur: raw?.blur ?? DEFAULT_SHADOW.blur,
    color: raw?.color ?? DEFAULT_SHADOW.color,
  };
}

export function normalizeLayer(raw: Layer): Layer {
  const shadow = normalizeShadow(raw.shadow);
  if (raw.type === "image") {
    return {
      ...raw,
      objectFit: raw.objectFit === "contain" ? "contain" : "cover",
      crop: normalizeCrop(raw.crop),
      filter: normalizeFilter(raw.filter),
      radius: raw.radius ?? 0,
      shadow,
    };
  }
  if (raw.type === "line") {
    return {
      ...raw,
      stroke: raw.stroke || "#1A1814",
      strokeWidth: raw.strokeWidth || 4,
      shadow,
    };
  }
  if (raw.type === "logo") {
    return { ...raw, radius: raw.radius ?? 0, shadow };
  }
  if (raw.type === "shape") {
    return { ...raw, radius: raw.radius ?? 0, shadow };
  }
  return { ...raw, shadow };
}

export function normalizeArtboard(raw: Artboard): Artboard {
  return {
    ...raw,
    background: {
      type: raw.background?.type ?? "solid",
      color: raw.background?.color ?? "#F4E6D4",
      color2: raw.background?.color2,
      angle: raw.background?.angle ?? 180,
      assetId: raw.background?.assetId,
    },
    layers: (raw.layers ?? []).map((layer) => normalizeLayer(layer)),
    role: raw.role,
    templateId: raw.templateId,
  };
}

export function cssFilter(filter?: ImageFilter | null): string | undefined {
  const f = normalizeFilter(filter);
  const parts: string[] = [];
  if (f.brightness !== 1) parts.push(`brightness(${f.brightness})`);
  if (f.contrast !== 1) parts.push(`contrast(${f.contrast})`);
  if (f.saturate !== 1) parts.push(`saturate(${f.saturate})`);
  if (f.blur > 0) parts.push(`blur(${f.blur}px)`);
  if (f.grayscale > 0) parts.push(`grayscale(${f.grayscale})`);
  return parts.length ? parts.join(" ") : undefined;
}

export function cssShadow(layer: Layer): string | undefined {
  const s = layer.shadow;
  if (!s?.enabled) return undefined;
  const value = `${s.x}px ${s.y}px ${s.blur}px ${s.color}`;
  return layer.type === "text" ? undefined : value;
}

export function cssTextShadow(layer: Layer): string | undefined {
  const s = layer.shadow;
  if (!s?.enabled || layer.type !== "text") return undefined;
  return `${s.x}px ${s.y}px ${s.blur}px ${s.color}`;
}

export function textOverflows(layer: TextLayer): boolean {
  const charsPerLine = Math.max(1, Math.floor(layer.w / (layer.fontSize * 0.92)));
  let lines = 0;
  for (const paragraph of layer.text.split("\n")) {
    lines += Math.max(1, Math.ceil([...paragraph].length / charsPerLine));
  }
  return lines * layer.fontSize * layer.lineHeight > layer.h + 4;
}

export function pagesOf(
  project: { slides?: Partial<Record<string, Artboard[]>>; artboards: Partial<Record<string, Artboard>>; activeFormatId: string },
  formatId?: string,
): Artboard[] {
  const id = formatId ?? project.activeFormatId;
  const slides = project.slides?.[id as keyof typeof project.slides];
  if (slides && slides.length) return slides;
  const one = project.artboards[id as keyof typeof project.artboards];
  return one ? [one] : [];
}
