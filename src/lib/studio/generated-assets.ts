import { putAssetBlob } from "./assets-idb";
import { decodeAssetImage } from "./asset-upload";
import { uid } from "./ids";
import type { AssetCategory, AssetInsight, AssetMeta, AssetSourceKind } from "./types";

async function dataUrlToBlob(dataUrl: string): Promise<Blob> {
  const res = await fetch(dataUrl);
  return res.blob();
}

function imageSize(blob: Blob): Promise<{ width: number; height: number }> {
  return new Promise((resolve) => {
    const url = URL.createObjectURL(blob);
    const img = new Image();
    img.onload = () => {
      URL.revokeObjectURL(url);
      resolve({ width: img.naturalWidth || 1024, height: img.naturalHeight || 1280 });
    };
    img.onerror = () => {
      URL.revokeObjectURL(url);
      resolve({ width: 1024, height: 1280 });
    };
    img.src = url;
  });
}

/** 把 AI 生成的圖（data URL 或 http URL）存進素材庫，分類為「AI 生成」。 */
export async function saveGeneratedImage(input: {
  src: string;
  name: string;
  prompt: string;
  tags?: string[];
  category?: AssetCategory;
  source?: AssetSourceKind;
  insight?: AssetInsight | null;
}): Promise<AssetMeta> {
  const blob = await dataUrlToBlob(input.src);
  const { width, height } = await imageSize(blob);
  const id = uid("asset");
  await putAssetBlob(id, blob);
  const now = Date.now();
  return {
    id,
    name: input.name,
    kind: "image",
    category: input.category ?? "generated",
    mime: blob.type || "image/jpeg",
    width,
    height,
    tags: [...new Set(["AI 生成", ...(input.tags ?? [])])],
    createdAt: now,
    updatedAt: now,
    source: input.source ?? "generated",
    licenseNotes: `AI 生成。Prompt：${input.prompt.slice(0, 200)}`,
    licenseOwner: "淡江大學禪學社",
    favorite: false,
    lastUsedAt: null,
    useCount: 0,
    insight: input.insight ?? null,
    externalRef: null,
  };
}

/** 使用者丟進來的照片：壓縮、存 blob、回傳素材 meta 與 data URL（給 Vision AI）。 */
export async function importUserImage(
  file: File,
  opts?: { category?: AssetCategory; tags?: string[] },
): Promise<{ meta: AssetMeta; dataUrl: string }> {
  const decoded = await decodeAssetImage(file);
  const id = uid("asset");
  await putAssetBlob(id, decoded.blob);
  const dataUrl = await blobToDataUrl(decoded.blob);
  const now = Date.now();
  return {
    dataUrl,
    meta: {
      id,
      name: file.name.replace(/\.[a-z0-9]+$/i, ""),
      kind: "image",
      category: opts?.category ?? "photo",
      mime: decoded.mime,
      width: decoded.width,
      height: decoded.height,
      tags: opts?.tags ?? [],
      createdAt: now,
      updatedAt: now,
      source: "upload",
      licenseNotes: "",
      licenseOwner: "淡江大學禪學社",
      favorite: false,
      lastUsedAt: null,
      useCount: 0,
      insight: null,
      externalRef: null,
    },
  };
}

export function blobToDataUrl(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result));
    reader.onerror = () => reject(reader.error);
    reader.readAsDataURL(blob);
  });
}
