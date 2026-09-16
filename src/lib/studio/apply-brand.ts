import { formatById } from "./formats.ts";
import { uid } from "./ids.ts";
import type {
  Artboard,
  BrandKit,
  ColorRole,
  Layer,
  LogoLayer,
  Project,
  ShapeLayer,
  TextLayer,
} from "./types.ts";

export type BrandApplyMode = "follow" | "force";

export type BrandPalette = Record<ColorRole, string>;

const ROLES: ColorRole[] = ["primary", "secondary", "background", "accent", "ink"];

const FALLBACK: BrandPalette = {
  primary: "#174D49",
  secondary: "#D8B86A",
  background: "#F4F1EA",
  accent: "#D97A5B",
  ink: "#18312F",
};

export function normalizeHex(hex: string) {
  const raw = hex.trim();
  const match = raw.match(/^#?([0-9a-fA-F]{3}|[0-9a-fA-F]{6})$/);
  if (!match) return raw.toUpperCase();
  let value = match[1].toUpperCase();
  if (value.length === 3) {
    value = value.split("").map((ch) => ch + ch).join("");
  }
  return `#${value}`;
}

export function brandPalette(brand: BrandKit): BrandPalette {
  const next = { ...FALLBACK };
  for (const color of brand.colors) {
    next[color.role] = normalizeHex(color.hex);
  }
  return next;
}

function sameHex(a: string | undefined, b: string | undefined) {
  if (!a || !b) return false;
  return normalizeHex(a) === normalizeHex(b);
}

function remapFromPalette(hex: string, from: BrandPalette, to: BrandPalette) {
  const current = normalizeHex(hex);
  for (const role of ROLES) {
    if (sameHex(current, from[role])) return to[role];
  }
  return hex;
}

function lum(hex: string) {
  const value = normalizeHex(hex).slice(1);
  if (value.length !== 6) return 0.5;
  const r = Number.parseInt(value.slice(0, 2), 16) / 255;
  const g = Number.parseInt(value.slice(2, 4), 16) / 255;
  const b = Number.parseInt(value.slice(4, 6), 16) / 255;
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

function readableOn(bg: string, palette: BrandPalette) {
  return lum(bg) > 0.55 ? palette.ink : palette.background;
}

function displayRoles(role: TextLayer["role"]) {
  return role === "headline" || role === "eyebrow";
}

function forceTextColor(layer: TextLayer, palette: BrandPalette) {
  if (layer.role === "eyebrow") return palette.accent;
  if (layer.role === "cta") return readableOn(palette.primary, palette);
  if (layer.role === "handle") return palette.secondary;
  return palette.ink;
}

function forceShapeFill(layer: ShapeLayer, palette: BrandPalette) {
  const name = layer.name;
  if (/CTA/.test(name)) return palette.primary;
  if (/底板|資訊/.test(name)) return palette.background;
  if (/主視覺|色塊/.test(name)) return palette.primary;
  if (layer.shape === "pill") return palette.primary;
  if (layer.shape === "ellipse") return palette.accent;
  return palette.primary;
}

function applyLayer(
  layer: Layer,
  next: BrandKit,
  previous: BrandKit | undefined,
  mode: BrandApplyMode,
): Layer {
  const to = brandPalette(next);
  const from = previous ? brandPalette(previous) : to;

  if (layer.type === "text") {
    let color = layer.color;
    let fontFamily = layer.fontFamily;
    if (mode === "force") {
      color = forceTextColor(layer, to);
      fontFamily = displayRoles(layer.role) ? next.fontDisplay : next.fontBody;
    } else {
      color = remapFromPalette(layer.color, from, to);
      if (previous && layer.fontFamily === previous.fontDisplay) fontFamily = next.fontDisplay;
      else if (previous && layer.fontFamily === previous.fontBody) fontFamily = next.fontBody;
    }
    return { ...layer, color, fontFamily };
  }

  if (layer.type === "shape") {
    const fill =
      mode === "force" && layer.fromLayout
        ? forceShapeFill(layer, to)
        : remapFromPalette(layer.fill, from, to);
    return { ...layer, fill };
  }

  if (layer.type === "line") {
    const stroke =
      mode === "force" && layer.fromLayout
        ? to.accent
        : remapFromPalette(layer.stroke, from, to);
    return { ...layer, stroke };
  }

  if (layer.type === "logo") {
    const followLogo =
      !previous
      || !layer.assetId
      || layer.assetId === previous.logoAssetId;
    if ((mode === "force" || followLogo) && next.logoAssetId) {
      return { ...layer, assetId: next.logoAssetId };
    }
  }

  return layer;
}

function ensureLogo(artboard: Artboard, brand: BrandKit): Artboard {
  if (!brand.logoAssetId) return artboard;
  if (artboard.layers.some((layer) => layer.type === "logo")) return artboard;
  const format = formatById(artboard.formatId);
  const size = Math.round(Math.min(format.width, format.height) * 0.08);
  const logo: LogoLayer = {
    id: uid("ly"),
    name: "Logo",
    type: "logo",
    x: format.width - format.safe.right - size,
    y: format.safe.top,
    w: size,
    h: size,
    rotation: 0,
    opacity: 1,
    locked: false,
    hidden: false,
    fromLayout: true,
    assetId: brand.logoAssetId,
    radius: 0,
    shadow: { enabled: false, x: 0, y: 12, blur: 28, color: "rgba(26,24,20,0.28)" },
  };
  return { ...artboard, layers: [...artboard.layers, logo] };
}

export function applyBrandToArtboard(
  artboard: Artboard,
  next: BrandKit,
  previous?: BrandKit,
  mode: BrandApplyMode = "follow",
): Artboard {
  const to = brandPalette(next);
  const from = previous ? brandPalette(previous) : to;
  const backgroundColor =
    mode === "force"
      ? to.background
      : remapFromPalette(artboard.background.color, from, to);
  const backgroundColor2 = artboard.background.color2
    ? mode === "force"
      ? to.secondary
      : remapFromPalette(artboard.background.color2, from, to)
    : artboard.background.color2;
  const layers = artboard.layers.map((layer) => applyLayer(layer, next, previous, mode));
  const mapped: Artboard = {
    ...artboard,
    background: {
      ...artboard.background,
      color: backgroundColor,
      color2: backgroundColor2,
    },
    layers,
  };
  return mode === "force" ? ensureLogo(mapped, next) : mapped;
}

export function applyBrandToPages(
  pages: Artboard[] | undefined,
  next: BrandKit,
  previous?: BrandKit,
  mode: BrandApplyMode = "follow",
) {
  return (pages ?? []).map((page) => applyBrandToArtboard(page, next, previous, mode));
}

export function applyBrandToProject(
  project: Project,
  next: BrandKit,
  previous?: BrandKit,
  mode: BrandApplyMode = "follow",
): Project {
  const slides: Project["slides"] = {};
  for (const [key, pages] of Object.entries(project.slides ?? {})) {
    slides[key as keyof Project["slides"]] = applyBrandToPages(pages, next, previous, mode);
  }
  const artboards: Project["artboards"] = {};
  for (const [key, board] of Object.entries(project.artboards ?? {})) {
    if (!board) continue;
    const formatId = key as keyof Project["artboards"];
    const fromSlides = slides[formatId];
    artboards[formatId] = fromSlides?.[project.slideIndex ?? 0] ?? applyBrandToArtboard(board, next, previous, mode);
  }
  return {
    ...project,
    slides,
    artboards,
    updatedAt: Date.now(),
  };
}

export function projectUsesBrandColors(project: Project, brand: BrandKit) {
  const palette = brandPalette(brand);
  const pages = [
    ...Object.values(project.slides ?? {}).flat(),
    ...Object.values(project.artboards ?? {}).filter((item): item is Artboard => Boolean(item)),
  ];
  return pages.some((page) => {
    if (sameHex(page.background.color, palette.background)) return true;
    return page.layers.some((layer) => {
      if (layer.type === "text" && ROLES.some((role) => sameHex(layer.color, palette[role]))) return true;
      if (layer.type === "shape" && ROLES.some((role) => sameHex(layer.fill, palette[role]))) return true;
      if (layer.type === "logo" && layer.assetId === brand.logoAssetId) return true;
      return false;
    });
  });
}

export function logoLayerOf(artboard: Artboard): LogoLayer | undefined {
  return artboard.layers.find((layer): layer is LogoLayer => layer.type === "logo");
}
