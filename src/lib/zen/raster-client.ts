import { parseDataUrl } from "./ingest";

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    if (src.startsWith("http://") || src.startsWith("https://")) {
      img.crossOrigin = "anonymous";
    }
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error("image-load"));
    img.src = src;
  });
}

function fit(width: number, height: number, maxEdge: number) {
  const w = Math.max(1, width || 1);
  const h = Math.max(1, height || 1);
  const scale = Math.min(1, maxEdge / Math.max(w, h));
  return { w: Math.max(1, Math.round(w * scale)), h: Math.max(1, Math.round(h * scale)) };
}

/** Draw the current preview (SVG seed, blob, or raster) into a JPEG Instagram can accept. */
export async function rasterJpegFromSrc(src?: string | null): Promise<{ mime: "image/jpeg"; b64: string } | null> {
  if (!src?.trim() || typeof document === "undefined") return null;
  try {
    const img = await loadImage(src);
    const { w, h } = fit(img.naturalWidth || img.width, img.naturalHeight || img.height, 1080);
    const canvas = document.createElement("canvas");
    canvas.width = w;
    canvas.height = h;
    const ctx = canvas.getContext("2d");
    if (!ctx) return null;
    ctx.fillStyle = "#24302c";
    ctx.fillRect(0, 0, w, h);
    ctx.drawImage(img, 0, 0, w, h);
    const dataUrl = canvas.toDataURL("image/jpeg", 0.82);
    const parsed = parseDataUrl(dataUrl);
    if (!parsed || parsed.mime !== "image/jpeg") return null;
    return { mime: "image/jpeg", b64: parsed.b64 };
  } catch {
    return null;
  }
}
