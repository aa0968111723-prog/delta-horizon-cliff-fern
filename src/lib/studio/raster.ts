import { blobFromBase64, bytesToBase64 } from "./bytes.ts";

export function isIgPublishMime(mime?: string | null) {
  return mime === "image/png" || mime === "image/jpeg";
}

export function needsRaster(mime?: string | null) {
  return mime !== "image/png";
}

export async function rasterizeToPng(blob: Blob, width: number, height: number): Promise<Blob> {
  if (blob.type === "image/png") return blob;
  const url = URL.createObjectURL(blob);
  try {
    const img = await new Promise<HTMLImageElement>((resolve, reject) => {
      const image = new Image();
      image.onload = () => resolve(image);
      image.onerror = () => reject(new Error("無法讀取主視覺"));
      image.src = url;
    });
    const canvas = document.createElement("canvas");
    canvas.width = Math.max(1, Math.round(width));
    canvas.height = Math.max(1, Math.round(height));
    const ctx = canvas.getContext("2d");
    if (!ctx) throw new Error("無法轉成 PNG");
    ctx.fillStyle = "#fffaf4";
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
    const out = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, "image/png"));
    if (!out) throw new Error("無法轉成 PNG");
    return out;
  } finally {
    URL.revokeObjectURL(url);
  }
}

export async function persistGeneratedImage(input: {
  base64: string;
  mime: string;
  width: number;
  height: number;
}): Promise<{ blob: Blob; mime: string; base64: string; width: number; height: number }> {
  let blob = blobFromBase64(input.base64, input.mime);
  let mime = input.mime;
  if (needsRaster(mime)) {
    try {
      blob = await rasterizeToPng(blob, input.width, input.height);
      mime = "image/png";
    } catch {
      /* keep SVG so the kit still has a 主視覺 */
    }
  }
  const base64 = bytesToBase64(new Uint8Array(await blob.arrayBuffer()));
  return { blob, mime, base64, width: input.width, height: input.height };
}
