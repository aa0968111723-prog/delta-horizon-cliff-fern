import { getAssetStorage } from "./asset-storage";
import { createGeneratedAsset, migrateAsset } from "./assets";
import { uid } from "./ids";
import type { AssetMeta, AssetSourceKind } from "./types";

/** blob: 預覽網址不能送到伺服器，改版／讀圖前先轉成 data URL。 */
export async function urlToDataUrl(url: string): Promise<string> {
  if (url.startsWith("data:")) return url;
  const res = await fetch(url);
  if (!res.ok) throw new Error("讀不到這張圖");
  const blob = await res.blob();
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result));
    reader.onerror = () => reject(new Error("讀不到這張圖"));
    reader.readAsDataURL(blob);
  });
}

/** 把 data URL 存進素材庫。上傳與 AI 生成共用。 */
export async function saveDataUrlAsAsset(input: {
  dataUrl: string;
  name: string;
  tags?: string[];
  source: Exclude<AssetSourceKind, "seed">;
  notes?: string;
  licenseOwner?: string;
}): Promise<AssetMeta> {
  const res = await fetch(input.dataUrl);
  const blob = await res.blob();
  const size = await measureBlob(blob);
  const id = uid("asset");
  await getAssetStorage().put(id, blob);
  const now = Date.now();
  if (input.source === "generated") {
    return createGeneratedAsset({
      id,
      name: input.name,
      mime: blob.type || "image/png",
      width: size.width,
      height: size.height,
      category: "illustration",
      tags: ["AI 生成", ...(input.tags ?? [])],
      licenseNotes: input.notes ?? "在本機產生，僅供畫面使用。",
      licenseOwner: input.licenseOwner ?? "AI 生成",
    });
  }
  return migrateAsset({
    id,
    name: input.name,
    mime: blob.type || "image/png",
    width: size.width,
    height: size.height,
    tags: input.tags ?? [],
    createdAt: now,
    updatedAt: now,
    source: input.source,
    category: "photo",
    licenseNotes: input.notes ?? "本機上傳，供創作使用。",
    licenseOwner: input.licenseOwner ?? "本機上傳",
  });
}

/** AI 生成的圖片存進素材庫，之後可以直接拖到畫布、也能被搜尋到。 */
export async function saveGeneratedImage(input: {
  dataUrl: string;
  name: string;
  prompt: string;
  tags?: string[];
}): Promise<AssetMeta> {
  return saveDataUrlAsAsset({
    dataUrl: input.dataUrl,
    name: input.name,
    tags: input.tags,
    source: "generated",
    notes: `由 AI 依 prompt 生成：${input.prompt.slice(0, 180)}`,
  });
}

function measureBlob(blob: Blob): Promise<{ width: number; height: number }> {
  const fallback = { width: 1080, height: 1350 };
  return Promise.race([
    createImageBitmap(blob).then((bitmap) => {
      const size = { width: bitmap.width || fallback.width, height: bitmap.height || fallback.height };
      bitmap.close();
      return size;
    }),
    new Promise<{ width: number; height: number }>((resolve) => {
      setTimeout(() => resolve(fallback), 1500);
    }),
  ]).catch(() => fallback);
}
