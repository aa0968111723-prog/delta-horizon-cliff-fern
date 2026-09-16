import { getAssetStorage } from "./asset-storage";
import { createGeneratedAsset } from "./assets";
import { uid } from "./ids";
import type { AssetMeta } from "./types";

/** AI 生成的圖片存進素材庫，之後可以直接拖到畫布、也能被搜尋到。 */
export async function saveGeneratedImage(input: {
  dataUrl: string;
  name: string;
  prompt: string;
  tags?: string[];
}): Promise<AssetMeta> {
  const res = await fetch(input.dataUrl);
  const blob = await res.blob();
  const size = await measure(input.dataUrl);
  const id = uid("asset");
  await getAssetStorage().put(id, blob);
  return createGeneratedAsset({
    id,
    name: input.name,
    mime: blob.type || "image/png",
    width: size.width,
    height: size.height,
    category: "illustration",
    tags: ["AI 生成", ...(input.tags ?? [])],
    licenseNotes: `由 AI 依 prompt 生成：${input.prompt.slice(0, 180)}`,
    licenseOwner: "AI 生成",
  });
}

function measure(src: string): Promise<{ width: number; height: number }> {
  return new Promise((resolve) => {
    const img = new Image();
    img.onload = () => resolve({ width: img.naturalWidth || 1080, height: img.naturalHeight || 1350 });
    img.onerror = () => resolve({ width: 1080, height: 1350 });
    img.src = src;
  });
}
