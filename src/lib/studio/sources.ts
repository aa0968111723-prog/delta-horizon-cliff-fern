import { categoryLabel } from "./assets.ts";
import type { AssetMeta, CreativeSourceKind, CreativeSourceRef } from "./types.ts";

export const SOURCE_KIND_LABEL: Record<CreativeSourceKind, string> = {
  drive: "Google Drive",
  canva: "Canva",
  instagram: "Instagram",
  generated: "AI 生成",
  local: "本機",
};

export function sourceFromAsset(asset: AssetMeta, detail?: string): CreativeSourceRef {
  return {
    kind: asset.source === "generated" ? "generated" : "local",
    label: `素材庫 / ${asset.name}`,
    detail: detail ?? categoryLabel(asset.category),
    assetId: asset.id,
  };
}
