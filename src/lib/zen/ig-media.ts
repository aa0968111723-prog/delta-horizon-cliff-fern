import { isPublicHttpsUrl, isRasterImageMime } from "./ingest.ts";

export const IG_MEDIA_TTL_MS = 2 * 60 * 60 * 1000;
export const IG_MEDIA_MAX_BYTES = 2 * 1024 * 1024;
export const IG_MEDIA_B64_MAX = 4_000_000;
export const IG_MEDIA_ID_RE = /^[A-Za-z0-9_-]{8,64}$/;

export function igMediaPublicUrl(origin: string, id: string) {
  return `${origin.replace(/\/$/, "")}/api/ig-media/${encodeURIComponent(id)}`;
}

export function isIgMediaId(id: string) {
  return IG_MEDIA_ID_RE.test(id);
}

export function instagramCanFetchUrl(url: string) {
  return isPublicHttpsUrl(url);
}

export function publishHostMessage(input: { hosted: boolean; canFetch: boolean }) {
  if (input.hosted && !input.canFetch) {
    return "目前畫面已備好。本機預覽 Instagram 讀不到公開網址，文案已複製；上線後同一顆按鈕會用官方 API 發。";
  }
  if (!input.hosted) {
    return "官方發布需要畫面。請先生成主視覺，或貼一張公開 https 圖片。文案可先複製。";
  }
  return "官方發布需要可被 Instagram 讀到的公開圖片。文案可先複製。";
}

const JPEG_MAGIC = [0xff, 0xd8, 0xff];
const PNG_MAGIC = [0x89, 0x50, 0x4e, 0x47];

export function looksLikePublishImage(bytes: Uint8Array) {
  if (bytes.length < 8 || bytes.length > IG_MEDIA_MAX_BYTES) return false;
  if (JPEG_MAGIC.every((b, i) => bytes[i] === b)) return true;
  return PNG_MAGIC.every((b, i) => bytes[i] === b);
}

export function mimeForPublishImage(bytes: Uint8Array) {
  if (JPEG_MAGIC.every((b, i) => bytes[i] === b)) return "image/jpeg";
  if (PNG_MAGIC.every((b, i) => bytes[i] === b)) return "image/png";
  return null;
}

export function decodePublishImageB64(
  b64: string,
  mime?: string,
): { mime: "image/jpeg" | "image/png"; bytes: Uint8Array } | null {
  const compact = b64.replace(/\s+/g, "");
  if (compact.length < 24 || compact.length > IG_MEDIA_B64_MAX) return null;
  if (mime && !isRasterImageMime(mime)) return null;
  let bytes: Uint8Array;
  try {
    if (typeof Buffer !== "undefined") {
      bytes = new Uint8Array(Buffer.from(compact, "base64"));
    } else {
      const bin = atob(compact);
      bytes = new Uint8Array(bin.length);
      for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
    }
  } catch {
    return null;
  }
  const detected = mimeForPublishImage(bytes);
  if (!detected) return null;
  if (mime && isRasterImageMime(mime) && mime.split(";")[0]?.trim() !== detected) {
    /* trust magic bytes */
  }
  return { mime: detected, bytes };
}
