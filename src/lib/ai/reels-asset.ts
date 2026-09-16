import { migrateAsset } from "../studio/assets.ts";
import type { AssetMeta, ScheduleItem } from "../studio/types.ts";

export function isVideoMime(mime?: string | null) {
  return (mime ?? "").startsWith("video/");
}

export function reelsVideoAsset(input: {
  id: string;
  eventName?: string;
  width: number;
  height: number;
}): AssetMeta {
  return migrateAsset({
    id: input.id,
    name: `Reels 短影音 · ${input.eventName || "禪光"}`,
    kind: "video",
    category: "reels",
    mime: "video/mp4",
    width: input.width,
    height: input.height,
    tags: ["AI 生成", "Reels", "短影音", input.eventName || "禪光"],
    source: "generated",
    licenseNotes: "來源：AI Generated",
    licenseOwner: "禪光",
    lastUsedAt: Date.now(),
  });
}

export function attachReelsVideo<T extends { kind: string; campaignId?: string | null; videoAssetId?: string }>(
  items: T[],
  videoAssetId: string,
  campaignId?: string | null,
): T[] {
  if (!campaignId) return items;
  return items.map((item) =>
    item.kind === "reels" && item.campaignId === campaignId ? { ...item, videoAssetId } : item,
  );
}

export function previewMediaId(item: {
  kind: string;
  videoAssetId?: string;
  imageAssetId?: string;
}): string | undefined {
  if (item.kind === "reels" && item.videoAssetId) return item.videoAssetId;
  return item.imageAssetId;
}

export function memoryAssetId(item: Pick<ScheduleItem, "kind" | "videoAssetId" | "imageAssetId">) {
  return previewMediaId(item);
}
