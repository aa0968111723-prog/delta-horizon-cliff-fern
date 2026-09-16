import { convertCopy } from "./convert-copy.ts";
import type { ContentKind, CopyDeck } from "./types.ts";

/** IG Caption 上限。超過貼不上，生成時就要看得見。 */
export const IG_CAPTION_LIMIT = 2200;
/** 貼文展開前看得見的字數。Hook 要落在這一段。 */
export const IG_PREVIEW_CHARS = 125;
/** Threads 單則上限。 */
export const THREADS_LIMIT = 500;

export type PackChannel = "ig" | "threads" | "line";

export function packChannelForKind(kind: ContentKind): PackChannel {
  if (kind === "threads") return "threads";
  if (kind === "line") return "line";
  return "ig";
}

export function packLimit(channel: PackChannel): number {
  return channel === "threads" ? THREADS_LIMIT : IG_CAPTION_LIMIT;
}

/** Caption + hashtags，標籤已經在正文裡就不再加一次。 */
export function igPostText(copy: Pick<CopyDeck, "caption" | "hashtags">): string {
  const caption = copy.caption.trim();
  const tags = copy.hashtags.map((tag) => tag.trim()).filter(Boolean).join(" ");
  if (!tags) return caption;
  if (caption.includes(tags) || tags.split(/\s+/).every((tag) => caption.includes(tag))) {
    return caption;
  }
  return `${caption}\n\n${tags}`.trim();
}

export function threadsPostText(copy: CopyDeck): string {
  return convertCopy(copy, "threads").caption.trim();
}

export function linePostText(copy: CopyDeck): string {
  return convertCopy(copy, "line").caption.trim();
}

export function packText(copy: CopyDeck, channel: PackChannel): string {
  if (channel === "threads") return threadsPostText(copy);
  if (channel === "line") return linePostText(copy);
  return igPostText(copy);
}

export type PackStats = {
  length: number;
  limit: number;
  remaining: number;
  over: boolean;
  preview: string;
  hasMore: boolean;
};

export function packStats(text: string, limit: number, previewChars = IG_PREVIEW_CHARS): PackStats {
  const length = [...text].length;
  return {
    length,
    limit,
    remaining: limit - length,
    over: length > limit,
    preview: [...text].slice(0, previewChars).join(""),
    hasMore: length > previewChars,
  };
}

export function packChannelLabel(channel: PackChannel): string {
  if (channel === "threads") return "Threads";
  if (channel === "line") return "LINE";
  return "IG 貼文";
}
