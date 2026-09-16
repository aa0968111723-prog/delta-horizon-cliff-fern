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
  const graph = Boolean(item.permalink || item.igMediaId);
  return {
    id: item.igMediaId ? `ig:${item.igMediaId}` : graph ? `ig:${item.id}` : `local:${item.id}`,
    caption,
    date,
    kind: igKindFromContent(item.kind),
    permalink: item.permalink,
    mediaUrl: item.mediaUrl,
    source: graph ? "instagram" : "local",
    projectId: item.projectId ?? undefined,
    assetId: item.kind === "reels" ? item.videoAssetId ?? item.imageAssetId : item.imageAssetId,
    analysis: graph
      ? "官方發布後寫進過去 IG，下次生成會學這則的 Hook 與畫面。"
      : "這則已發布，下次生成會當成自己的 IG 記憶。",
  };
}

export function isFeedGraphKind(kind: ContentKind) {
  return kind === "ig-post" || kind === "carousel";
}

export function isStoryGraphKind(kind: ContentKind) {
  return kind === "story" || kind === "countdown";
}

export function isReelsGraphKind(kind: ContentKind) {
  return kind === "reels";
}

export function canGraphPublish(kind: ContentKind) {
  return isFeedGraphKind(kind) || isStoryGraphKind(kind) || isReelsGraphKind(kind);
}

export function graphPublishFormat(kind: ContentKind): "story" | "feed-portrait" | "reels" | null {
  if (isStoryGraphKind(kind)) return "story";
  if (isReelsGraphKind(kind)) return "reels";
  if (isFeedGraphKind(kind)) return "feed-portrait";
  return null;
}
