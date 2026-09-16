import type { ExternalMemoryItem } from "./types.ts";
import { asObject, asText, findRows, unixToIso } from "./json.ts";

export function firstCaptionLine(caption: string) {
  const line = caption.split(/\n/)[0]?.trim() ?? "";
  return line.slice(0, 80) || "IG 貼文";
}

export function normalizeInstagramMedia(value: unknown): ExternalMemoryItem[] {
  return findRows(value).flatMap((value) => {
    const row = asObject(value);
    if (!row) return [];
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
