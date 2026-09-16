import { schedulePreviewAssetId } from "./schedule.ts";
import { CONTENT_KIND_LABEL, type ClubCampaign, type IgMemoryPost, type MemoryItem, type ScheduleItem } from "./types.ts";

export function mediaTypeForKind(kind: ScheduleItem["contentKind"]): IgMemoryPost["mediaType"] {
  if (kind === "carousel") return "carousel";
  if (kind === "reels") return "reels";
  return "image";
}

export function publishedToMemory(input: {
  item: ScheduleItem;
  campaigns: ClubCampaign[];
  now?: number;
}): { post: IgMemoryPost; memory: MemoryItem } {
  const now = input.now ?? Date.now();
  const assetId =
    input.item.sequence?.assetIds[0] ??
    schedulePreviewAssetId(input.item, input.campaigns) ??
    "asset_tamsui";
  const firstLine = (input.item.captionPreview.split("\n")[0] || input.item.title).trim();
  const hook = firstLine.split(" → ")[0].split(" / ")[0].slice(0, 40);
  const postedAt = input.item.publishedAt ?? now;
  const kind = input.item.contentKind;
  const post: IgMemoryPost = {
    id: `ig_studio_${input.item.id}`,
    mediaType: mediaTypeForKind(kind),
    caption: input.item.captionPreview || input.item.title,
    postedAt,
    assetId,
    likes: 0,
    comments: 0,
    saves: 0,
    reach: 0,
    hook,
    contentKind: kind,
    analysis: `剛從禪光發布（${CONTENT_KIND_LABEL[kind]}），還沒有官方 Insights。下一則改生活、互動或社員故事，不要連續招生。`,
  };
  const memory: MemoryItem = {
    id: `mem_ig_${input.item.id}`,
    source: "instagram",
    title: hook,
    subtitle: `Instagram / ${new Date(postedAt).toISOString().slice(0, 10)}`,
    thumbAssetId: assetId,
    tags: [input.item.contentKind, "已發布"],
    kind: "IG",
  };
  return { post, memory };
}
