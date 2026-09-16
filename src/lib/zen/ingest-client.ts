import { fetchAllowlistedImage } from "@/lib/ai/ingest";
import { getAssetStorage } from "@/lib/studio/asset-storage";
import type { AssetCategory, AssetMeta, AssetSourceKind } from "@/lib/studio/types";
import { isAllowedIngestUrl, isRasterImageMime } from "./ingest.ts";
import type { SearchHit } from "./search.ts";

function b64ToBlob(b64: string, mime: string) {
  const binary = atob(b64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
  return new Blob([bytes], { type: mime });
}

function categoryFor(source: AssetSourceKind): AssetCategory {
  if (source === "instagram") return "ig";
  if (source === "generated") return "generated";
  if (source === "canva") return "poster";
  return "archive";
}

export async function ingestBytesToLibrary(input: {
  id: string;
  name: string;
  source: AssetSourceKind;
  b64: string;
  mime: string;
  tags?: string[];
  addAsset: (meta: AssetMeta) => void;
}) {
  if (!isRasterImageMime(input.mime)) return false;
  const blob = b64ToBlob(input.b64, input.mime);
  await getAssetStorage().put(input.id, blob);
  const now = Date.now();
  input.addAsset({
    id: input.id,
    name: input.name.slice(0, 40) || "素材",
    kind: "image",
    category: categoryFor(input.source),
    mime: input.mime,
    width: 1080,
    height: 1350,
    tags: input.tags?.length ? input.tags : [input.source],
    createdAt: now,
    updatedAt: now,
    source: input.source,
    licenseNotes: sourceLicense(input.source),
    licenseOwner: "淡江大學禪學社",
    favorite: false,
    lastUsedAt: now,
    useCount: 1,
  });
  return true;
}

export async function ingestUrlToLibrary(input: {
  id: string;
  name: string;
  source: AssetSourceKind;
  url?: string;
  tags?: string[];
  addAsset: (meta: AssetMeta) => void;
}) {
  if (!input.url || !isAllowedIngestUrl(input.url)) return false;
  const result = await fetchAllowlistedImage({ data: { url: input.url } });
  if (!result.ok) return false;
  return ingestBytesToLibrary({
    id: input.id,
    name: input.name,
    source: input.source,
    b64: result.b64,
    mime: result.mime,
    tags: input.tags,
    addAsset: input.addAsset,
  });
}

function sourceLicense(source: AssetSourceKind) {
  if (source === "drive") return "來自 Google Drive，僅供禪學社網宣使用。";
  if (source === "canva") return "來自 Canva 設計縮圖，作為風格參考。";
  if (source === "instagram") return "來自官方 IG API，作為歷史內容記憶。";
  return "本機素材。";
}

export async function ingestHitPixels(
  hit: SearchHit,
  addAsset: (meta: AssetMeta) => void,
): Promise<string | undefined> {
  if (hit.source !== "drive" && hit.source !== "canva" && hit.source !== "instagram" && hit.source !== "generated") {
    return undefined;
  }
  const source = hit.source;
  const url = hit.thumbUrl || hit.url;
  if (!url || !isAllowedIngestUrl(url)) return undefined;
  const id = `asset_${hit.id}`.replace(/[^a-zA-Z0-9_]/g, "_").slice(0, 60);
  const ok = await ingestUrlToLibrary({
    id,
    name: hit.title,
    source,
    url,
    tags: hit.tags,
    addAsset,
  });
  return ok ? id : undefined;
}
