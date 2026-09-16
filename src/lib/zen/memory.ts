import type { ContentKind, IgMemoryPost, ScheduleItem } from "../studio/types.ts";

export function igKindFromContent(kind: ContentKind): IgMemoryPost["kind"] {
  if (kind === "carousel") return "carousel";
  if (kind === "reels") return "reels";
  if (kind === "story" || kind === "countdown") return "story";
  return "post";
}

export function igMemoryFromSchedule(item: ScheduleItem, now = Date.now()): IgMemoryPost {
  const published = item.publishedAt ?? now;
  const date = new Date(published).toISOString().slice(0, 10);
  const caption = (item.caption || item.body || item.title).trim();
  return {
    id: item.permalink ? `ig:${item.id}` : `local:${item.id}`,
    caption,
    date,
    kind: igKindFromContent(item.kind),
    permalink: item.permalink,
    mediaUrl: item.mediaUrl,
    source: item.permalink ? "instagram" : "local",
    projectId: item.projectId ?? undefined,
    assetId: item.imageAssetId,
    analysis: "這則已發布，下次生成會當成自己的 IG 記憶。",
  };
}

export function canGraphPublish(kind: ContentKind) {
  return kind === "ig-post" || kind === "carousel";
}
