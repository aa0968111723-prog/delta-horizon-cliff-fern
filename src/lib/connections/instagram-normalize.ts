import type { ExternalMemoryItem, InstagramInsightRow } from "./types.ts";
import { asObject, asText, findRows, unixToIso } from "./json.ts";

export function firstCaptionLine(caption: string) {
  const line = caption.split(/\n/)[0]?.trim() ?? "";
  return line.slice(0, 80) || "IG 貼文";
}

export function normalizeInstagramMedia(value: unknown): ExternalMemoryItem[] {
  return findRows(value).flatMap((value) => {
    const row = asObject(value);
    if (!row) return [];
    if (asText(row.access_token) || asText(row.accessToken) || asText(row.client_secret)) return [];
    const id = asText(row.id) || asText(row.ig_id) || asText(row.media_id);
    const caption = asText(row.caption) || asText(row.snippet);
    const mediaType = asText(row.media_type) || asText(row.mediaType) || "IMAGE";
    if (!id) return [];
    const title = firstCaptionLine(caption);
    const sourceDate = unixToIso(row.timestamp ?? row.created_time ?? row.createdAt);
    return [{
      id,
      provider: "instagram" as const,
      title,
      mimeType: mediaType,
      isFolder: false,
      modifiedAt: sourceDate,
      webUrl: asText(row.permalink) || asText(row.permalink_url) || asText(row.webUrl),
      thumbnailUrl: asText(row.thumbnail_url) || asText(row.thumbnailUrl) || (mediaType === "VIDEO" ? "" : asText(row.media_url) || asText(row.mediaUrl)),
      parentId: "instagram",
      snippet: caption.slice(0, 400),
      syncedAt: Date.now(),
      collection: "IG 內容記憶",
      sourceDate,
    }];
  });
}

export function normalizeInstagramProfile(value: unknown) {
  const row = asObject(value);
  if (!row) return { id: "", username: "" };
  return {
    id: asText(row.id) || asText(row.user_id),
    username: asText(row.username) || asText(row.name),
  };
}

export function extractHashtags(caption: string) {
  return [...new Set(
    (caption.match(/#[\p{L}\p{N}_]+/gu) ?? [])
      .map((tag) => tag.trim())
      .filter((tag) => tag.length > 1 && tag.length <= 40),
  )].slice(0, 20);
}

export function hashtagsFromInstagramMemory(items: ExternalMemoryItem[]) {
  const counts = new Map<string, number>();
  for (const item of items) {
    if (item.provider !== "instagram") continue;
    for (const tag of extractHashtags(item.snippet || item.title)) {
      counts.set(tag, (counts.get(tag) ?? 0) + 1);
    }
  }
  return [...counts.entries()]
    .sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0], "zh-TW"))
    .map(([tag]) => tag)
    .slice(0, 12);
}

const INSIGHT_LABELS: Record<string, string> = {
  views: "觀看",
  reach: "觸及",
  profile_views: "個人檔案瀏覽",
  accounts_engaged: "互動帳號",
  total_interactions: "總互動",
  likes: "讚",
  comments: "留言",
  shares: "分享",
  saved: "收藏",
  follower_count: "追蹤人數",
};

export function insightLabel(metric: string) {
  return INSIGHT_LABELS[metric] || metric;
}

export function lastNumericInsightValue(row: Record<string, unknown>) {
  const values = Array.isArray(row.values) ? row.values : Array.isArray(row.data) ? row.data : [];
  for (let index = values.length - 1; index >= 0; index -= 1) {
    const entry = asObject(values[index]) ?? {};
    const raw = entry.value ?? row.value;
    const nested = asObject(raw)?.value;
    const number = typeof raw === "number" ? raw : typeof nested === "number" ? nested : Number(asText(raw));
    if (Number.isFinite(number)) return number;
  }
  const total = asObject(row.total_value)?.value;
  if (typeof total === "number" && Number.isFinite(total)) return total;
  return typeof row.value === "number" && Number.isFinite(row.value) ? row.value : null;
}

export function normalizeInstagramInsights(value: unknown): InstagramInsightRow[] {
  return findRows(value).flatMap((value) => {
    const row = asObject(value);
    if (!row) return [];
    if (asText(row.access_token) || asText(row.accessToken)) return [];
    const metric = asText(row.name) || asText(row.metric) || asText(row.metric_name);
    if (!metric) return [];
    const number = lastNumericInsightValue(row);
    if (number === null) return [];
    return [{
      metric,
      label: asText(row.title) || insightLabel(metric),
      value: number,
      period: asText(row.period) || "day",
    }];
  });
}
