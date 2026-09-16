import { formatById } from "./formats.ts";
import { uid } from "./ids.ts";
import { brandAccent, brandInk, brandPaper, pickReadable, bgBehindText } from "./quality.ts";
import type { Artboard, BrandKit, Layer, QaFix, ShapeLayer, TextLayer } from "./types.ts";

const SHADOW = { enabled: false, x: 0, y: 12, blur: 28, color: "rgba(26,24,20,0.28)" };

function clampLayer(layer: Layer, formatId: Artboard["formatId"]): Layer {
  const format = formatById(formatId);
  const x = Math.min(Math.max(format.safe.left, layer.x), format.width - format.safe.right - layer.w);
  const y = Math.min(Math.max(format.safe.top, layer.y), format.height - format.safe.bottom - layer.h);
  return { ...layer, x: Math.max(0, x), y: Math.max(0, y) };
}

function mapPage(pages: Artboard[], index: number, fn: (page: Artboard) => Artboard): Artboard[] {
  return pages.map((page, i) => (i === index ? fn(page) : page));
}

function patchLayer(page: Artboard, layerId: string, fn: (layer: Layer) => Layer): Artboard {
  return {
    ...page,
    layers: page.layers.map((layer) => (layer.id === layerId ? fn(layer) : layer)),
  };
}

function backingFor(text: TextLayer, fill: string): ShapeLayer {
  return {
    id: uid("ly"),
    name: `${text.name}底板`,
    type: "shape",
    x: Math.max(0, text.x - 20),
    y: Math.max(0, text.y - 12),
    w: text.w + 40,
    h: text.h + 24,
    rotation: 0,
    opacity: 0.88,
    locked: false,
    hidden: false,
    fromLayout: false,
    shape: "rect",
    fill,
    radius: 20,
    shadow: { ...SHADOW },
  };
}

export function applyQaFixToPages(pages: Artboard[], fix: QaFix, brand: BrandKit): Artboard[] {
  if (fix.kind === "unify-carousel") {
    const origin = pages[0];
    if (!origin) return pages;
    const logo0 = origin.layers.find((l) => l.type === "logo" && !l.hidden);
    const head0 = origin.layers.find((l): l is TextLayer => l.type === "text" && l.role === "headline");
    const bg = origin.background.color;
    const originH = formatById(origin.formatId).height;
    return pages.map((page) => {
      const h = formatById(page.formatId).height;
      return {
        ...page,
        background: { ...page.background, color: bg },
        layers: page.layers.map((layer) => {
          if (layer.type === "logo" && logo0) {
            const fromTop = logo0.y < originH / 2;
            const y = fromTop ? logo0.y : h - (originH - logo0.y - logo0.h) - logo0.h;
            return { ...layer, w: logo0.w, h: logo0.h, x: logo0.x, y: Math.max(0, y) };
          }
          if (layer.type === "text" && head0 && layer.role === "headline") {
            return { ...layer, fontFamily: head0.fontFamily, color: head0.color };
          }
          return layer;
        }),
      };
    });
  }

  const pageIndex = "pageIndex" in fix ? fix.pageIndex : 0;
  const page = pages[pageIndex];
  if (!page) return pages;

  if (fix.kind === "grow-type") {
    return mapPage(pages, pageIndex, (p) =>
      patchLayer(p, fix.layerId, (layer) =>
        layer.type === "text"
          ? { ...layer, fontSize: fix.fontSize, h: Math.max(layer.h, Math.round(fix.fontSize * 1.4)) }
          : layer,
      ),
    );
  }

  if (fix.kind === "set-text-color") {
    return mapPage(pages, pageIndex, (p) =>
      patchLayer(p, fix.layerId, (layer) => (layer.type === "text" ? { ...layer, color: fix.color } : layer)),
    );
  }

  if (fix.kind === "add-text-backing") {
    return mapPage(pages, pageIndex, (p) => {
      const text = p.layers.find((l): l is TextLayer => l.id === fix.layerId && l.type === "text");
      if (!text) return p;
      const board = backingFor(text, fix.fill);
      const idx = p.layers.findIndex((l) => l.id === text.id);
      const layers = [...p.layers];
      layers.splice(Math.max(0, idx), 0, board);
      const readable = pickReadable(fix.fill, brand);
      layers[idx + 1] = { ...text, color: readable };
      return { ...p, layers };
    });
  }

  if (fix.kind === "move-safe") {
    return mapPage(pages, pageIndex, (p) => patchLayer(p, fix.layerId, (layer) => clampLayer(layer, p.formatId)));
  }

  if (fix.kind === "expand-textbox") {
    return mapPage(pages, pageIndex, (p) =>
      patchLayer(p, fix.layerId, (layer) => {
        if (layer.type !== "text") return layer;
        const nextH = Math.round(layer.fontSize * layer.lineHeight * 3.2);
        const format = formatById(p.formatId);
        const h = Math.min(nextH, format.height - format.safe.bottom - layer.y);
        return { ...layer, h: Math.max(layer.h, h) };
      }),
    );
  }

  if (fix.kind === "align-column") {
    return mapPage(pages, pageIndex, (p) => {
      const x = formatById(p.formatId).safe.left;
      return {
        ...p,
        layers: p.layers.map((layer) =>
          layer.type === "text" && layer.align !== "center" ? { ...layer, x, align: "left" as const } : layer,
        ),
      };
    });
  }

  if (fix.kind === "fit-image") {
    return mapPage(pages, pageIndex, (p) => {
      const format = formatById(p.formatId);
      return patchLayer(p, fix.layerId, (layer) => {
        if (layer.type !== "image") return layer;
        const w = format.width;
        const h = Math.round(Math.min(format.height * 0.56, Math.max(layer.h, w * 0.7)));
        return { ...layer, objectFit: "cover" as const, x: 0, y: 0, w, h };
      });
    });
  }

  if (fix.kind === "resize-logo") {
    return mapPage(pages, pageIndex, (p) =>
      patchLayer(p, fix.layerId, (layer) => {
        if (layer.type !== "logo") return layer;
        const format = formatById(p.formatId);
        const size = fix.size;
        const x = Math.min(layer.x, format.width - format.safe.right - size);
        const y = Math.min(layer.y, format.height - format.safe.bottom - size);
        return { ...layer, w: size, h: size, x: Math.max(format.safe.left, x), y: Math.max(format.safe.top, y) };
      }),
    );
  }

  if (fix.kind === "nudge-whitespace") {
    return mapPage(pages, pageIndex, (p) => {
      const format = formatById(p.formatId);
      const inset = 28;
      return {
        ...p,
        layers: p.layers.map((layer) => {
          if (layer.type === "image" && layer.x === 0 && layer.y === 0) return layer;
          const x = Math.max(format.safe.left, layer.x + (layer.x < format.safe.left + 12 ? inset : 0));
          const y = Math.max(format.safe.top, layer.y + (layer.y < format.safe.top + 12 ? inset : 0));
          const maxX = format.width - format.safe.right;
          const maxY = format.height - format.safe.bottom;
          const w = Math.min(layer.w, maxX - x);
          const h = Math.min(layer.h, maxY - y);
          return { ...layer, x, y, w: Math.max(24, w), h: Math.max(24, h) };
        }),
      };
    });
  }

  if (fix.kind === "emphasize-headline") {
    return mapPage(pages, pageIndex, (p) => {
      const target = p.layers.find((l) => l.id === fix.layerId) ?? p.layers.find((l) => l.type === "text" && l.role === "headline");
      if (!target || target.type !== "text") return p;
      const format = formatById(p.formatId);
      const next: TextLayer = {
        ...target,
        fontSize: fix.fontSize,
        fontWeight: 600,
        h: Math.max(target.h, Math.round(fix.fontSize * 2.2)),
        y: Math.min(target.y, format.safe.top + 48),
      };
      return { ...p, layers: p.layers.map((l) => (l.id === target.id ? next : l)) };
    });
  }

  if (fix.kind === "boost-cta") {
    return mapPage(pages, pageIndex, (p) => {
      const format = formatById(p.formatId);
      const ink = brandPaper(brand);
      const fill = brandAccent(brand) || brandInk(brand);
      const existing = fix.layerId
        ? p.layers.find((l): l is TextLayer => l.id === fix.layerId && l.type === "text")
        : p.layers.find((l): l is TextLayer => l.type === "text" && l.role === "cta");
      const y = format.height - format.safe.bottom - 64;
      const x = format.safe.left;
      const cta: TextLayer = existing
        ? {
            ...existing,
            fontSize: Math.max(existing.fontSize, 22),
            fontWeight: 600,
            color: pickReadable(bgBehindText({ ...p, layers: p.layers }, existing) === p.background.color ? fill : bgBehindText(p, existing), brand) || ink,
            x,
            y,
            w: Math.max(existing.w, 240),
            h: 64,
            align: "center",
          }
        : {
            id: uid("ly"),
            name: "CTA",
            type: "text",
            role: "cta",
            text: brand.boilerplate.cta || "了解更多",
            x,
            y,
            w: 240,
            h: 64,
            rotation: 0,
            opacity: 1,
            locked: false,
            hidden: false,
            fromLayout: false,
            fontFamily: brand.fontBody,
            fontWeight: 600,
            fontSize: 22,
            lineHeight: 2.8,
            letterSpacing: 0,
            color: ink,
            align: "center",
            shadow: { ...SHADOW },
          };
      const board: ShapeLayer = {
        id: uid("ly"),
        name: "CTA 底",
        type: "shape",
        shape: "pill",
        fill,
        x: cta.x,
        y: cta.y,
        w: cta.w,
        h: cta.h,
        rotation: 0,
        opacity: 1,
        locked: false,
        hidden: false,
        fromLayout: false,
        radius: 999,
        shadow: { ...SHADOW },
      };
      const without = p.layers.filter((l) => l.id !== cta.id && l.name !== "CTA 底");
      const readable = pickReadable(fill, brand);
      return { ...p, layers: [...without, board, { ...cta, color: readable }] };
    });
  }

  return pages;
}
