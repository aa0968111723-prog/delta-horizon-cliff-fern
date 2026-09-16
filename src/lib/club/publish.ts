import type { LastPack } from "./last-pack.ts";
import type { ContentKind } from "../studio/types.ts";

export function graphImageUrl(src: string, origin = "") {
  const raw = src.trim();
  if (!raw || raw.startsWith("data:") || raw.startsWith("blob:")) return "";
  if (/\.svg(\?|$)/i.test(raw)) return "";
  const absolute = /^https?:\/\//i.test(raw)
    ? raw
    : raw.startsWith("/") && origin
      ? `${origin.replace(/\/$/, "")}${raw}`
      : "";
  if (!absolute.startsWith("https://")) return "";
  if (/\.(jpe?g|png|webp)(\?|$)/i.test(absolute)) return absolute;
  if (/fbcdn|cdninstagram|scontent|instagram\.com|googleusercontent|canva/i.test(absolute)) return absolute;
  return "";
}

export function publishCaption(pack: Pick<LastPack, "caption" | "hashtags" | "hook">) {
  const hook = pack.hook.trim();
  const rest = (pack.caption || "").trim();
  const body = !rest || rest.startsWith(hook) ? rest || hook : `${hook}\n${rest}`;
  const tags = (pack.hashtags ?? []).filter(Boolean).join(" ");
  if (!tags || body.includes("#")) return body.slice(0, 2200);
  return `${body}\n\n${tags}`.slice(0, 2200);
}

export function publishMediaType(kind: ContentKind): "image" | "carousel" | "reels" {
  if (kind === "carousel") return "carousel";
  if (kind === "reels") return "reels";
  return "image";
}

export function memoryThumb(src: string, fallback: string) {
  if (!src || src.startsWith("data:") || src.startsWith("blob:")) return fallback;
  return src;
}

export function memoryPostFromPublish(input: {
  pack: LastPack;
  thumb: string;
  live: boolean;
  mediaId?: string;
  permalink?: string;
}) {
  const { pack } = input;
  return {
    id: input.mediaId || `ig_pub_${pack.projectId}_${pack.kind}`,
    mediaType: publishMediaType(pack.kind),
    caption: publishCaption(pack),
    takenAt: Date.now(),
    thumb: memoryThumb(input.thumb, pack.heroThumb || "/seed/tea.svg"),
    permalink: input.permalink,
    metricsSource: input.live ? ("live" as const) : ("memory" as const),
    analysis: `剛發布 · ${pack.kind} · ${pack.eventName}。Hook：${pack.hook}`,
  };
}

export function publishNeedsVideo(kind: ContentKind) {
  return kind === "reels";
}
