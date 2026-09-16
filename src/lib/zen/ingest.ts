import type { CitedSource } from "../studio/types.ts";

export const MEMORY_NOTES_MAX = 4000;
export const INGEST_MAX_BYTES = 6 * 1024 * 1024;

const ALLOWED_HOST_EXACT = new Set([
  "drive.google.com",
  "docs.google.com",
  "cdninstagram.com",
  "fbcdn.net",
  "instagram.com",
  "canva.com",
]);

const ALLOWED_HOST_SUFFIX = [
  ".googleusercontent.com",
  ".cdninstagram.com",
  ".fbcdn.net",
  ".instagram.com",
  ".canva.com",
  ".canva-apps.com",
];

export function isPrivateHostname(host: string) {
  const h = host.toLowerCase().replace(/\.$/, "");
  if (!h) return true;
  if (h === "localhost" || h.endsWith(".localhost") || h === "localhost.localdomain") return true;
  if (h === "metadata.google.internal" || h.endsWith(".internal")) return true;
  if (h === "::1" || h.startsWith("[") || h.includes(":")) return true;
  const ipv4 = h.match(/^(\d{1,3})\.(\d{1,3})\.(\d{1,3})\.(\d{1,3})$/);
  if (ipv4) {
    const a = Number(ipv4[1]);
    const b = Number(ipv4[2]);
    if (a === 0 || a === 10 || a === 127) return true;
    if (a === 169 && b === 254) return true;
    if (a === 192 && b === 168) return true;
    if (a === 172 && b >= 16 && b <= 31) return true;
  }
  return false;
}

export function isAllowedIngestHost(host: string) {
  const h = host.toLowerCase().replace(/\.$/, "");
  if (isPrivateHostname(h)) return false;
  if (ALLOWED_HOST_EXACT.has(h)) return true;
  return ALLOWED_HOST_SUFFIX.some((suffix) => h.endsWith(suffix));
}

export function isPublicHttpsUrl(value: string) {
  try {
    const url = new URL(value);
    if (url.protocol !== "https:") return false;
    if (url.username || url.password) return false;
    return !isPrivateHostname(url.hostname);
  } catch {
    return false;
  }
}

export function isAllowedIngestUrl(value: string) {
  try {
    const url = new URL(value);
    if (url.protocol !== "https:") return false;
    if (url.username || url.password) return false;
    return isAllowedIngestHost(url.hostname);
  } catch {
    return false;
  }
}

export function isRasterImageMime(mime?: string) {
  if (!mime) return false;
  const type = mime.split(";")[0]?.trim().toLowerCase() ?? "";
  if (!type.startsWith("image/")) return false;
  if (type.includes("svg") || type.includes("xml")) return false;
  return true;
}

export function parseDataUrl(value: string): { mime: string; b64: string } | null {
  const match = value.trim().match(/^data:(image\/[a-zA-Z0-9.+-]+);base64,([A-Za-z0-9+/=\s]+)$/);
  if (!match?.[1] || !match[2]) return null;
  if (!isRasterImageMime(match[1])) return null;
  return { mime: match[1], b64: match[2].replace(/\s+/g, "") };
}

const CANVA_B64_MAX = 4_000_000;

export function bytesToBase64(bytes: Uint8Array) {
  if (typeof Buffer !== "undefined" && typeof Buffer.from === "function") {
    return Buffer.from(bytes).toString("base64");
  }
  let binary = "";
  const chunk = 0x8000;
  for (let i = 0; i < bytes.length; i += chunk) {
    binary += String.fromCharCode(...bytes.subarray(i, i + chunk));
  }
  return btoa(binary);
}

export async function rasterB64FromSrc(src?: string | null): Promise<{ mime: string; b64: string } | null> {
  if (!src?.trim()) return null;
  const parsed = parseDataUrl(src);
  if (parsed) return parsed.b64.length > CANVA_B64_MAX ? null : parsed;
  if (!src.startsWith("blob:") && !src.startsWith("http://") && !src.startsWith("https://")) return null;
  try {
    const res = await fetch(src);
    if (!res.ok) return null;
    const blob = await res.blob();
    const mime = (blob.type || "").split(";")[0]?.trim() ?? "";
    if (!isRasterImageMime(mime) || blob.size > INGEST_MAX_BYTES) return null;
    const bytes = new Uint8Array(await blob.arrayBuffer());
    const b64 = bytesToBase64(bytes);
    if (b64.length > CANVA_B64_MAX) return null;
    return { mime, b64 };
  } catch {
    return null;
  }
}

export function composeMemoryNotes(parts: Array<string | undefined | null>) {
  const seen = new Set<string>();
  const lines: string[] = [];
  for (const part of parts) {
    for (const raw of (part ?? "").split("\n")) {
      const line = raw.trim();
      if (!line || seen.has(line)) continue;
      seen.add(line);
      lines.push(line);
    }
  }
  return lines.join("\n").slice(0, MEMORY_NOTES_MAX);
}

export function clientMemoryLines(items: { title: string; subtitle: string }[]) {
  return items.map((item) => `${item.subtitle} / ${item.title}`).join("\n");
}

export function sourcesFromMemoryNotes(notes?: string): CitedSource[] {
  if (!notes?.trim()) return [];
  return notes
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean)
    .slice(0, 8)
    .map((line) => {
      const source: CitedSource["source"] = line.includes("Canva")
        ? "canva"
        : /Instagram|\bIG\b/.test(line)
          ? "instagram"
          : /Drive|Docs|PDF|企劃/.test(line)
            ? "drive"
            : line.includes("AI")
              ? "generated"
              : "brand";
      return { source, label: line.slice(0, 40), detail: line };
    });
}

export function excerptFromDriveRead(raw: unknown): {
  name?: string;
  mime?: string;
  excerpt?: string;
  imageB64?: string;
  imageMime?: string;
  imageUrl?: string;
} {
  if (raw == null) return {};
  if (typeof raw === "string") {
    const data = parseDataUrl(raw);
    if (data) return { mime: data.mime, imageMime: data.mime, imageB64: data.b64 };
    return { excerpt: raw.slice(0, 600) };
  }
  if (typeof raw !== "object") return {};
  const root = raw as Record<string, unknown>;
  const nested =
    isRecord(root.file) ? root.file
    : isRecord(root.data) ? root.data
    : isRecord(root.result) ? root.result
    : root;
  const name = pickString(nested, ["name", "title", "filename"]);
  const mime = pickString(nested, ["mimeType", "mime", "contentType"]);
  const imageUrl = pickHttp(nested, [
    "thumbnailLink",
    "thumbnail",
    "webContentLink",
    "downloadUrl",
    "url",
  ]);
  const text = pickString(nested, ["text", "content", "markdown", "body", "excerpt", "snippet"]);
  if (text) {
    const data = parseDataUrl(text);
    if (data) {
      return { name, mime: data.mime, imageMime: data.mime, imageB64: data.b64, imageUrl };
    }
  }
  const b64 = pickString(nested, ["base64", "b64", "dataBase64"]);
  if (b64 && isRasterImageMime(mime)) {
    return {
      name,
      mime,
      imageMime: mime,
      imageB64: b64.replace(/^data:[^;]+;base64,/, ""),
      imageUrl,
      excerpt: pickString(nested, ["description"]),
    };
  }
  return {
    name,
    mime,
    excerpt: (text ?? pickString(nested, ["description"]))?.slice(0, 600),
    imageUrl,
  };
}

export function mergeCitedSources(...lists: CitedSource[][]) {
  const seen = new Set<string>();
  const out: CitedSource[] = [];
  for (const list of lists) {
    for (const item of list) {
      const key = `${item.source}:${item.label}`;
      if (seen.has(key)) continue;
      seen.add(key);
      out.push(item);
    }
  }
  return out.slice(0, 16);
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

function pickString(row: Record<string, unknown>, keys: string[]) {
  for (const key of keys) {
    const value = row[key];
    if (typeof value === "string" && value.trim()) return value;
  }
  return undefined;
}

function pickHttp(row: Record<string, unknown>, keys: string[]) {
  for (const key of keys) {
    const value = row[key];
    if (typeof value === "string" && value.startsWith("https://")) return value;
  }
  return undefined;
}
