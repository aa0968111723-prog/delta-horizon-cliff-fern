import { formatById } from "./formats";
import { cssFilter, normalizeCrop, normalizeFilter } from "./layers";
import type { Artboard, BrandKit, ImageLayer, Layer, LineLayer, TextLayer } from "./types";

function roundRect(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  r: number,
) {
  const radius = Math.max(0, Math.min(r, w / 2, h / 2));
  ctx.beginPath();
  ctx.moveTo(x + radius, y);
  ctx.arcTo(x + w, y, x + w, y + h, radius);
  ctx.arcTo(x + w, y + h, x, y + h, radius);
  ctx.arcTo(x, y + h, x, y, radius);
  ctx.arcTo(x, y, x, y, radius);
  ctx.closePath();
}

function wrapText(ctx: CanvasRenderingContext2D, text: string, maxWidth: number): string[] {
  const paragraphs = text.split("\n");
  const lines: string[] = [];
  for (const p of paragraphs) {
    if (!p) {
      lines.push("");
      continue;
    }
    let line = "";
    for (const ch of [...p]) {
      const next = line + ch;
      if (ctx.measureText(next).width > maxWidth && line) {
        lines.push(line);
        line = ch;
      } else {
        line = next;
      }
    }
    if (line) lines.push(line);
  }
  return lines.length ? lines : [""];
}

function applyShadow(ctx: CanvasRenderingContext2D, layer: Layer) {
  const s = layer.shadow;
  if (!s?.enabled) return;
  ctx.shadowOffsetX = s.x;
  ctx.shadowOffsetY = s.y;
  ctx.shadowBlur = s.blur;
  ctx.shadowColor = s.color;
}

function drawImageFitted(
  ctx: CanvasRenderingContext2D,
  img: HTMLImageElement,
  x: number,
  y: number,
  w: number,
  h: number,
  layer: ImageLayer | Extract<Layer, { type: "logo" }>,
) {
  const fit = layer.type === "logo" ? "contain" : layer.objectFit;
  const crop = layer.type === "image" ? normalizeCrop(layer.crop) : { x: 50, y: 50, zoom: 1 };
  const radius = layer.radius ?? 0;
  ctx.save();
  if (radius > 0) {
    roundRect(ctx, x, y, w, h, radius);
    ctx.clip();
  } else {
    ctx.beginPath();
    ctx.rect(x, y, w, h);
    ctx.clip();
  }
  if (layer.type === "image") {
    const filter = cssFilter(normalizeFilter(layer.filter));
    if (filter) ctx.filter = filter;
  }
  const z = Math.max(1, crop.zoom);
  const ir = img.width / Math.max(1, img.height);
  const br = w / Math.max(1, h);
  let dw: number;
  let dh: number;
  if (fit === "contain") {
    if (ir > br) {
      dw = w * z;
      dh = dw / ir;
    } else {
      dh = h * z;
      dw = dh * ir;
    }
  } else if (ir > br) {
    dh = h * z;
    dw = dh * ir;
  } else {
    dw = w * z;
    dh = dw / ir;
  }
  const dx = x + (w - dw) * (crop.x / 100);
  const dy = y + (h - dh) * (crop.y / 100);
  ctx.drawImage(img, dx, dy, dw, dh);
  ctx.restore();
}

export type ImageMap = Record<string, HTMLImageElement>;

function paintLayer(
  ctx: CanvasRenderingContext2D,
  layer: Layer,
  images: ImageMap,
  brand: BrandKit,
) {
  if (layer.hidden || layer.opacity <= 0) return;
  ctx.save();
  ctx.globalAlpha = layer.opacity;
  const cx = layer.x + layer.w / 2;
  const cy = layer.y + layer.h / 2;
  if (layer.rotation) {
    ctx.translate(cx, cy);
    ctx.rotate((layer.rotation * Math.PI) / 180);
    ctx.translate(-cx, -cy);
  }
  applyShadow(ctx, layer);

  if (layer.type === "shape") {
    const r = layer.shape === "pill" ? layer.h / 2 : layer.shape === "ellipse" ? Math.max(layer.w, layer.h) : layer.radius;
    if (layer.shape === "ellipse") {
      ctx.beginPath();
      ctx.ellipse(cx, cy, layer.w / 2, layer.h / 2, 0, 0, Math.PI * 2);
    } else {
      roundRect(ctx, layer.x, layer.y, layer.w, layer.h, r);
    }
    if (layer.fill && layer.fill !== "transparent") {
      ctx.fillStyle = layer.fill;
      ctx.fill();
    }
    if (layer.stroke && (layer.strokeWidth ?? 0) > 0) {
      ctx.strokeStyle = layer.stroke;
      ctx.lineWidth = layer.strokeWidth ?? 1;
      ctx.stroke();
    }
  } else if (layer.type === "line") {
    drawLine(ctx, layer);
  } else if (layer.type === "text") {
    drawText(ctx, layer);
  } else if (layer.type === "image" || layer.type === "logo") {
    const assetId = layer.type === "logo" ? (layer.assetId ?? brand.logoAssetId) : layer.assetId;
    const img = assetId ? images[assetId] : undefined;
    if (img) {
      ctx.shadowColor = "transparent";
      if (layer.shadow?.enabled) {
        ctx.save();
        applyShadow(ctx, layer);
        ctx.fillStyle = "rgba(0,0,0,0.01)";
        roundRect(ctx, layer.x, layer.y, layer.w, layer.h, layer.radius ?? 0);
        ctx.fill();
        ctx.restore();
      }
      drawImageFitted(ctx, img, layer.x, layer.y, layer.w, layer.h, layer);
    }
  }
  ctx.restore();
}

function drawLine(ctx: CanvasRenderingContext2D, layer: LineLayer) {
  ctx.beginPath();
  ctx.moveTo(layer.x, layer.y + layer.h / 2);
  ctx.lineTo(layer.x + layer.w, layer.y + layer.h / 2);
  ctx.strokeStyle = layer.stroke;
  ctx.lineWidth = layer.strokeWidth;
  ctx.lineCap = "round";
  ctx.stroke();
}

function drawText(ctx: CanvasRenderingContext2D, layer: TextLayer) {
  ctx.save();
  ctx.beginPath();
  ctx.rect(layer.x, layer.y, layer.w, layer.h);
  ctx.clip();
  ctx.fillStyle = layer.color;
  ctx.font = `${layer.fontWeight} ${layer.fontSize}px "${layer.fontFamily}"`;
  ctx.textAlign = layer.align;
  ctx.textBaseline = "top";
  const lines = wrapText(ctx, layer.text, layer.w);
  const lh = layer.fontSize * layer.lineHeight;
  const extra = (layer.letterSpacing ?? 0) !== 0;
  if (extra) ctx.letterSpacing = `${layer.letterSpacing}px`;
  let x = layer.x;
  if (layer.align === "center") x = layer.x + layer.w / 2;
  if (layer.align === "right") x = layer.x + layer.w;
  lines.forEach((line, i) => {
    const y = layer.y + i * lh;
    if (y > layer.y + layer.h) return;
    ctx.fillText(line, x, y, layer.w);
  });
  ctx.restore();
}

export async function renderArtboardToCanvas(
  artboard: Artboard,
  brand: BrandKit,
  images: ImageMap,
  scale = 1,
): Promise<HTMLCanvasElement> {
  const format = formatById(artboard.formatId);
  const canvas = document.createElement("canvas");
  canvas.width = Math.round(format.width * scale);
  canvas.height = Math.round(format.height * scale);
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("無法建立畫布");
  ctx.scale(scale, scale);
  ctx.fillStyle = artboard.background.color;
  ctx.fillRect(0, 0, format.width, format.height);
  if (artboard.background.type === "gradient" && artboard.background.color2) {
    const angle = ((artboard.background.angle ?? 180) * Math.PI) / 180;
    const x2 = format.width / 2 + Math.cos(angle) * format.width;
    const y2 = format.height / 2 + Math.sin(angle) * format.height;
    const x1 = format.width / 2 - Math.cos(angle) * format.width;
    const y1 = format.height / 2 - Math.sin(angle) * format.height;
    const g = ctx.createLinearGradient(x1, y1, x2, y2);
    g.addColorStop(0, artboard.background.color);
    g.addColorStop(1, artboard.background.color2);
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, format.width, format.height);
  }
  if (artboard.background.type === "image" && artboard.background.assetId) {
    const img = images[artboard.background.assetId];
    if (img) {
      const ir = img.width / img.height;
      const br = format.width / format.height;
      let dw = format.width;
      let dh = format.height;
      let dx = 0;
      let dy = 0;
      if (ir > br) {
        dw = format.height * ir;
        dx = (format.width - dw) / 2;
      } else {
        dh = format.width / ir;
        dy = (format.height - dh) / 2;
      }
      ctx.drawImage(img, dx, dy, dw, dh);
    }
  }
  await document.fonts.ready.catch(() => undefined);
  for (const layer of artboard.layers) {
    paintLayer(ctx, layer, images, brand);
  }
  return canvas;
}

export function downloadBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1500);
}

export async function canvasToBlob(canvas: HTMLCanvasElement, type: "image/png" | "image/jpeg", quality = 0.95) {
  return await new Promise<Blob>((resolve, reject) => {
    canvas.toBlob(
      (blob) => {
        if (!blob) reject(new Error("匯出失敗"));
        else resolve(blob);
      },
      type,
      quality,
    );
  });
}

export function collectArtboardAssetIds(artboard: Artboard, brand: BrandKit): string[] {
  const ids: string[] = [];
  if (artboard.background.assetId) ids.push(artboard.background.assetId);
  for (const layer of artboard.layers) {
    if (layer.type === "image") ids.push(layer.assetId);
    if (layer.type === "logo") ids.push(layer.assetId ?? brand.logoAssetId ?? "");
  }
  return ids.filter(Boolean);
}
