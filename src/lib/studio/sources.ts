import { categoryLabel } from "./assets.ts";
import type { AssetMeta, CreativeSourceKind, CreativeSourceRef } from "./types.ts";

export const SOURCE_KIND_LABEL: Record<CreativeSourceKind, string> = {
  drive: "Google Drive",
  canva: "Canva",
  instagram: "Instagram",
  generated: "AI 生成",
  local: "本機",
};

export function sourceKindFromAsset(asset: AssetMeta): CreativeSourceKind {
  if (asset.source === "generated") return "generated";
  if (asset.source === "drive") return "drive";
  if (asset.source === "canva") return "canva";
  if (asset.source === "instagram") return "instagram";
  if (asset.tags.includes("Google Drive") || asset.licenseOwner === "Google Drive") return "drive";
  if (asset.tags.includes("Canva") || asset.licenseOwner === "Canva") return "canva";
  if (asset.tags.includes("Instagram") || asset.licenseOwner === "Instagram") return "instagram";
  return "local";
}

export function sourceFromAsset(asset: AssetMeta, detail?: string): CreativeSourceRef {
  return {
    kind: sourceKindFromAsset(asset),
    label: `素材庫 / ${asset.name}`,
    detail: detail ?? categoryLabel(asset.category),
    assetId: asset.id,
  };
}

export function sourceFromRemote(
  item: { provider: CreativeSourceKind; title: string; href?: string },
  assetId?: string,
): CreativeSourceRef {
  return {
    kind: item.provider,
    label: `${SOURCE_KIND_LABEL[item.provider]} / ${item.title}`,
    detail: "從搜尋帶進創作",
    href: item.href,
    assetId,
  };
}

export function clipSeed(text: string, max = 280): string {
  return text.replace(/\s+/g, " ").trim().slice(0, max);
}

export function sourceFromExtend(input: {
  title: string;
  kind?: CreativeSourceKind;
  href?: string;
}): CreativeSourceRef {
  return {
    kind: input.kind ?? "local",
    label: `延續 / ${clipSeed(input.title, 28)}`,
    detail: "從過去內容延續",
    href: input.href,
  };
}
