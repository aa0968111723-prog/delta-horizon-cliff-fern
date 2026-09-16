import { getAssetStorage } from "../studio/asset-storage.ts";

export async function blobToDataUrl(blob: Blob): Promise<string> {
  if (typeof FileReader === "undefined") {
    const buf = Buffer.from(await blob.arrayBuffer());
    const mime = blob.type || "application/octet-stream";
    return `data:${mime};base64,${buf.toString("base64")}`;
  }
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result));
    reader.onerror = () => reject(reader.error);
    reader.readAsDataURL(blob);
  });
}

export async function urlToDataUrl(url: string): Promise<string | null> {
  try {
    const res = await fetch(url);
    if (!res.ok) return null;
    return blobToDataUrl(await res.blob());
  } catch {
    return null;
  }
}

export async function loadAssetDataUrl(input: {
  id: string;
  seedSrc?: string;
  previewUrl?: string;
}): Promise<string | null> {
  if (input.previewUrl?.startsWith("data:")) return input.previewUrl;
  if (input.previewUrl) {
    const fromPreview = await urlToDataUrl(input.previewUrl);
    if (fromPreview) return fromPreview;
  }
  try {
    const blob = await getAssetStorage().get(input.id);
    if (blob) return blobToDataUrl(blob);
  } catch {
    /* IndexedDB may be unavailable in tests */
  }
  if (input.seedSrc) return urlToDataUrl(input.seedSrc);
  return null;
}

export function compactDataUrl(dataUrl: string, max = 400_000) {
  if (dataUrl.length <= max) return dataUrl;
  return null;
}

export async function editUrlFromSrc(src?: string | null) {
  if (!src) return null;
  if (src.startsWith("data:")) return compactDataUrl(src);
  const data = await urlToDataUrl(src);
  return data ? compactDataUrl(data) : null;
}
