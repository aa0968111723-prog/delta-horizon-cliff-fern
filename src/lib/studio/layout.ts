import { formatById } from "./formats";
import { uid } from "./ids";
import { DEFAULT_CROP, DEFAULT_FILTER, DEFAULT_SHADOW } from "./layers";
import type {
  Artboard,
  BrandKit,
  CopyDeck,
  FormatId,
  ImageLayer,
  Layer,
  LogoLayer,
  ShapeLayer,
  TemplateId,
  TextLayer,
} from "./types";

function color(brand: BrandKit, role: BrandKit["colors"][number]["role"], fallback: string) {
  return brand.colors.find((c) => c.role === role)?.hex ?? fallback;
}

function textLayer(
  partial: Omit<TextLayer, "type" | "rotation" | "opacity" | "locked" | "hidden" | "fromLayout" | "id" | "lineHeight" | "letterSpacing" | "shadow"> &
    Partial<Pick<TextLayer, "lineHeight" | "letterSpacing" | "id" | "shadow">>,
): TextLayer {
  return {
    id: partial.id ?? uid("ly"),
    type: "text",
    rotation: 0,
    opacity: 1,
    locked: false,
    hidden: false,
    fromLayout: true,
    lineHeight: partial.lineHeight ?? 1.2,
    letterSpacing: partial.letterSpacing ?? 0,
    shadow: partial.shadow ?? { ...DEFAULT_SHADOW },
    ...partial,
  };
}

function shapeLayer(
  partial: Omit<ShapeLayer, "type" | "rotation" | "opacity" | "locked" | "hidden" | "fromLayout" | "id" | "shadow"> &
    Partial<Pick<ShapeLayer, "id" | "shadow">>,
): ShapeLayer {
  return {
    id: partial.id ?? uid("ly"),
    type: "shape",
    rotation: 0,
    opacity: 1,
    locked: false,
    hidden: false,
    fromLayout: true,
    shadow: partial.shadow ?? { ...DEFAULT_SHADOW },
    ...partial,
  };
}

function imageLayer(
  partial: Omit<ImageLayer, "type" | "rotation" | "opacity" | "locked" | "hidden" | "fromLayout" | "id" | "objectFit" | "crop" | "filter" | "radius" | "shadow"> &
    Partial<Pick<ImageLayer, "id" | "objectFit" | "crop" | "filter" | "radius" | "shadow">>,
): ImageLayer {
  return {
    id: partial.id ?? uid("ly"),
    type: "image",
    rotation: 0,
    opacity: 1,
    locked: false,
    hidden: false,
    fromLayout: true,
    objectFit: partial.objectFit ?? "cover",
    crop: partial.crop ?? { ...DEFAULT_CROP },
    filter: partial.filter ?? { ...DEFAULT_FILTER },
    radius: partial.radius ?? 0,
    shadow: partial.shadow ?? { ...DEFAULT_SHADOW },
    ...partial,
  };
}

function logoLayer(
  brand: BrandKit,
  x: number,
  y: number,
  size: number,
): LogoLayer | null {
  if (!brand.logoAssetId) return null;
  return {
    id: uid("ly"),
    name: "Logo",
    type: "logo",
    x,
    y,
    w: size,
    h: size,
    rotation: 0,
    opacity: 1,
    locked: false,
    hidden: false,
    fromLayout: true,
    assetId: brand.logoAssetId,
    radius: 0,
    shadow: { ...DEFAULT_SHADOW },
  };
}

function findImageAsset(layersHint?: Layer[]): string | null {
  if (!layersHint) return null;
  const img = layersHint.find((l) => l.type === "image") as ImageLayer | undefined;
  return img?.assetId ?? null;
}

export type LayoutHints = {
  imageAssetId?: string | null;
};

export function buildLayout(
  formatId: FormatId,
  copy: CopyDeck,
  brand: BrandKit,
  templateId: TemplateId,
  hints: LayoutHints = {},
): Artboard {
  const format = formatById(formatId);
  const W = format.width;
  const H = format.height;
  const S = format.safe;
  const primary = color(brand, "primary", "#1A1814");
  const accent = color(brand, "accent", "#B85C38");
  const bg = color(brand, "background", "#F4E6D4");
  const ink = color(brand, "ink", "#2C1810");
  const imageId = hints.imageAssetId ?? null;
  const display = brand.fontDisplay;
  const body = brand.fontBody;
  const handle = copy.handle || brand.handle;

  const layers: Layer[] = [];

  const push = (layer: Layer | null | undefined) => {
    if (layer) layers.push(layer);
  };

  const isStory = formatId === "story" || formatId === "reels-cover";
  const isLand = formatId === "feed-landscape";

  if (templateId === "product") {
    const imgH = isLand ? H : isStory ? Math.round(H * 0.42) : Math.round(H * 0.56);
    push(
      imageId
        ? imageLayer({
            name: "主視覺",
            x: 0,
            y: 0,
            w: W,
            h: imgH,
            assetId: imageId,
          })
        : shapeLayer({
            name: "主視覺色塊",
            x: 0,
            y: 0,
            w: W,
            h: imgH,
            shape: "rect",
            fill: primary,
            radius: 0,
          }),
    );
    push(
      shapeLayer({
        name: "資訊底板",
        x: 0,
        y: imgH - (isLand ? 0 : 28),
        w: W,
        h: H - imgH + (isLand ? 0 : 28),
        shape: "rect",
        fill: bg,
        radius: isLand ? 0 : 36,
      }),
    );
    const tx = S.left;
    let ty = imgH + (isLand ? 16 : 48);
    const tw = W - S.left - S.right;
    if (copy.eyebrow) {
      push(
        textLayer({
          name: "眉題",
          role: "eyebrow",
          x: tx,
          y: ty,
          w: tw,
          h: 36,
          text: copy.eyebrow,
          fontFamily: body,
          fontWeight: 500,
          fontSize: isLand ? 18 : isStory ? 24 : 22,
          letterSpacing: 4,
          color: accent,
          align: "left",
        }),
      );
      ty += isLand ? 28 : 44;
    }
    push(
      textLayer({
        name: "標題",
        role: "headline",
        x: tx,
        y: ty,
        w: tw,
        h: isStory ? 240 : isLand ? 80 : 200,
        text: copy.headline,
        fontFamily: display,
        fontWeight: 600,
        fontSize: isStory ? 72 : isLand ? 36 : 64,
        lineHeight: 1.15,
        letterSpacing: -1,
        color: ink,
        align: "left",
      }),
    );
    ty += isStory ? 200 : isLand ? 64 : 150;
    if (copy.subhead && !isLand) {
      push(
        textLayer({
          name: "副標",
          role: "subhead",
          x: tx,
          y: ty,
          w: tw,
          h: 80,
          text: copy.subhead,
          fontFamily: body,
          fontWeight: 400,
          fontSize: 28,
          lineHeight: 1.4,
          color: ink,
          align: "left",
        }),
      );
      ty += 90;
    }
    push(
      shapeLayer({
        name: "CTA 底",
        x: tx,
        y: H - S.bottom - (isLand ? 44 : isStory ? 88 : 64),
        w: isLand ? 200 : 240,
        h: isLand ? 44 : 64,
        shape: "pill",
        fill: primary,
        radius: 999,
      }),
    );
    push(
      textLayer({
        name: "CTA",
        role: "cta",
        x: tx,
        y: H - S.bottom - (isLand ? 44 : isStory ? 88 : 64),
        w: isLand ? 200 : 240,
        h: isLand ? 44 : 64,
        text: copy.cta,
        fontFamily: body,
        fontWeight: 600,
        fontSize: isLand ? 16 : isStory ? 24 : 22,
        color: bg,
        align: "center",
        lineHeight: isLand ? 2.6 : 2.8,
      }),
    );
    push(logoLayer(brand, W - S.right - 80, H - S.bottom - (isStory ? 96 : 80), 72));
  } else if (templateId === "offer") {
    push(
      shapeLayer({
        name: "外框",
        x: 36,
        y: S.top - 20 < 36 ? 36 : S.top - 20,
        w: W - 72,
        h: H - (S.top - 20 < 36 ? 72 : S.top + S.bottom - 40),
        shape: "rect",
        fill: "transparent",
        radius: 0,
        stroke: accent,
        strokeWidth: 2,
      }),
    );
    const frameTop = S.top + 24;
    push(
      textLayer({
        name: "眉題",
        role: "eyebrow",
        x: S.left,
        y: frameTop,
        w: W - S.left - S.right,
        h: 40,
        text: copy.eyebrow || "LIMITED",
        fontFamily: body,
        fontWeight: 500,
        fontSize: 20,
        letterSpacing: 6,
        color: accent,
        align: "center",
      }),
    );
    push(
      textLayer({
        name: "標題",
        role: "headline",
        x: S.left,
        y: frameTop + (isLand ? 40 : 80),
        w: W - S.left - S.right,
        h: isStory ? 280 : isLand ? 90 : 220,
        text: copy.headline,
        fontFamily: display,
        fontWeight: 600,
        fontSize: isStory ? 88 : isLand ? 42 : 72,
        lineHeight: 1.1,
        letterSpacing: -1.5,
        color: ink,
        align: "center",
      }),
    );
    push(
      textLayer({
        name: "內文",
        role: "body",
        x: S.left + 20,
        y: isLand ? H / 2 + 10 : H * 0.52,
        w: W - S.left - S.right - 40,
        h: isLand ? 60 : 140,
        text: copy.body || copy.subhead,
        fontFamily: body,
        fontWeight: 400,
        fontSize: isLand ? 18 : 26,
        lineHeight: 1.45,
        color: ink,
        align: "center",
      }),
    );
    const ctaW = 280;
    push(
      shapeLayer({
        name: "CTA 底",
        x: (W - ctaW) / 2,
        y: H - S.bottom - 70,
        w: ctaW,
        h: 64,
        shape: "pill",
        fill: accent,
        radius: 999,
      }),
    );
    push(
      textLayer({
        name: "CTA",
        role: "cta",
        x: (W - ctaW) / 2,
        y: H - S.bottom - 70,
        w: ctaW,
        h: 64,
        text: copy.cta,
        fontFamily: body,
        fontWeight: 600,
        fontSize: 22,
        color: bg,
        align: "center",
        lineHeight: 2.8,
      }),
    );
    push(logoLayer(brand, (W - 64) / 2, S.top + (isLand ? 4 : 16), 64));
  } else if (templateId === "quote") {
    push(
      textLayer({
        name: "引號",
        role: "custom",
        x: S.left,
        y: S.top + (isLand ? 0 : 40),
        w: W - S.left - S.right,
        h: isLand ? 60 : 120,
        text: "「",
        fontFamily: display,
        fontWeight: 500,
        fontSize: isLand ? 64 : 120,
        color: accent,
        align: "left",
        lineHeight: 1,
      }),
    );
    push(
      textLayer({
        name: "標題",
        role: "headline",
        x: S.left,
        y: S.top + (isLand ? 50 : 140),
        w: W - S.left - S.right,
        h: isStory ? 520 : isLand ? 180 : 360,
        text: copy.headline,
        fontFamily: display,
        fontWeight: 600,
        fontSize: isStory ? 64 : isLand ? 32 : 52,
        lineHeight: 1.3,
        letterSpacing: -0.5,
        color: ink,
        align: "left",
      }),
    );
    push(
      textLayer({
        name: "出處",
        role: "handle",
        x: S.left,
        y: H - S.bottom - 80,
        w: W - S.left - S.right,
        h: 40,
        text: handle,
        fontFamily: body,
        fontWeight: 500,
        fontSize: 22,
        color: accent,
        align: "left",
      }),
    );
    push(logoLayer(brand, W - S.right - 72, H - S.bottom - 72, 72));
  } else {
    if (imageId && !isLand) {
      push(
        imageLayer({
          name: "主視覺",
          x: isStory ? 0 : W * 0.42,
          y: 0,
          w: isStory ? W : W * 0.58,
          h: isStory ? Math.round(H * 0.38) : H,
          assetId: imageId,
        }),
      );
    }
    const colX = S.left;
    const colW = imageId && !isStory && !isLand ? W * 0.38 - S.left : W - S.left - S.right;
    push(
      textLayer({
        name: "眉題",
        role: "eyebrow",
        x: colX,
        y: S.top,
        w: colW,
        h: 36,
        text: copy.eyebrow,
        fontFamily: body,
        fontWeight: 500,
        fontSize: 20,
        letterSpacing: 5,
        color: accent,
        align: "left",
      }),
    );
    push(
      textLayer({
        name: "標題",
        role: "headline",
        x: colX,
        y: S.top + 56,
        w: colW,
        h: isStory ? 280 : isLand ? 120 : 280,
        text: copy.headline,
        fontFamily: display,
        fontWeight: 600,
        fontSize: isStory ? 78 : isLand ? 40 : imageId ? 56 : 72,
        lineHeight: 1.12,
        letterSpacing: -1.2,
        color: ink,
        align: "left",
      }),
    );
    push(
      textLayer({
        name: "副標",
        role: "subhead",
        x: colX,
        y: S.top + (isLand ? 150 : 360),
        w: colW,
        h: isLand ? 48 : 120,
        text: copy.subhead,
        fontFamily: body,
        fontWeight: 400,
        fontSize: isLand ? 18 : 26,
        lineHeight: 1.45,
        color: ink,
        align: "left",
      }),
    );
    if (copy.body && !isLand) {
      push(
        textLayer({
          name: "內文",
          role: "body",
          x: colX,
          y: H * 0.62,
          w: colW,
          h: 140,
          text: copy.body,
          fontFamily: body,
          fontWeight: 400,
          fontSize: 22,
          lineHeight: 1.5,
          color: ink,
          align: "left",
        }),
      );
    }
    push(
      shapeLayer({
        name: "CTA 底",
        x: colX,
        y: H - S.bottom - 64,
        w: 228,
        h: 56,
        shape: "pill",
        fill: primary,
        radius: 999,
      }),
    );
    push(
      textLayer({
        name: "CTA",
        role: "cta",
        x: colX,
        y: H - S.bottom - 64,
        w: 228,
        h: 56,
        text: copy.cta,
        fontFamily: body,
        fontWeight: 600,
        fontSize: 20,
        color: bg,
        align: "center",
        lineHeight: 2.7,
      }),
    );
    push(
      textLayer({
        name: "帳號",
        role: "handle",
        x: colX + 244,
        y: H - S.bottom - 56,
        w: colW - 244,
        h: 40,
        text: handle,
        fontFamily: body,
        fontWeight: 500,
        fontSize: 18,
        color: ink,
        align: "left",
        lineHeight: 2.2,
      }),
    );
    push(logoLayer(brand, W - S.right - 80, S.top, 80));
  }

  const cleaned = layers
    .filter((l) => l.opacity > 0)
    .filter((l) => l.type !== "text" || (l as TextLayer).text.trim().length > 0);

  return {
    formatId,
    background: {
      type: "solid",
      color: bg,
    },
    layers: cleaned,
    templateId,
  };
}

export function extractImageAssetId(artboard: Artboard | undefined): string | null {
  return findImageAsset(artboard?.layers);
}

export function applyCopyToArtboard(artboard: Artboard, copy: CopyDeck): Artboard {
  const map: Record<string, string> = {
    eyebrow: copy.eyebrow,
    headline: copy.headline,
    subhead: copy.subhead,
    body: copy.body,
    cta: copy.cta,
    handle: copy.handle,
  };
  return {
    ...artboard,
    layers: artboard.layers.map((layer) => {
      if (layer.type !== "text") return layer;
      const next = map[layer.role];
      if (next === undefined) return layer;
      return { ...layer, text: next };
    }),
  };
}

export const TEMPLATE_META: {
  id: TemplateId;
  name: string;
  description: string;
}[] = [
  { id: "editorial", name: "活動主視覺", description: "大標＋主畫面，適合茶會、迎新、講座封面" },
  { id: "product", name: "現場照片", description: "上圖下文，適合活動紀實與社員日常" },
  { id: "offer", name: "時間地點", description: "置中大標，適合倒數與報到資訊" },
  { id: "quote", name: "一句 Hook", description: "語句為主，適合限動、金句、轉發" },
];
